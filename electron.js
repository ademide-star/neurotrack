const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const { pathToFileURL } = require("url"); // For proper file:// URLs

let mainWindow;
let pythonProcess;

// ─── PRELOAD SCRIPT (create this file separately) ────────────────────────────
// preload.js content:
/*
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  getApiUrl: () => 'http://127.0.0.1:5000'
});
*/
// ─────────────────────────────────────────────────────────────────────────────

function findPython() {
  const pythonCommands = ["python", "python3", "py"];
  return pythonCommands;
}

function startPython() {
  // Find server.py location (packaged vs. development)
  const serverScript = app.isPackaged
    ? path.join(process.resourcesPath, "server.py")
    : path.join(__dirname, "server.py");

  console.log("[Electron] Server script path:", serverScript);
  console.log("[Electron] File exists:", fs.existsSync(serverScript));

  const tryPython = (commands, index) => {
    if (index >= commands.length) {
      console.error("[Electron] No Python found!");
      dialog.showErrorBox(
        "Python Not Found",
        "Please install Python from python.org and restart the app."
      );
      return;
    }

    const cmd = commands[index];
    console.log(`[Electron] Trying: ${cmd} ${serverScript}`);

    pythonProcess = spawn(cmd, [serverScript], {
      detached: false,
      stdio: "pipe",
      env: {
        ...process.env,
        FLASK_ENV: "production",
        PORT: "5000"
      }
    });

    pythonProcess.stdout.on("data", d => {
      console.log("[Python]", d.toString().trim());
    });

    pythonProcess.stderr.on("data", d => {
      console.log("[Python]", d.toString().trim());
    });

    pythonProcess.on("error", (err) => {
      console.log(`[Electron] ${cmd} failed:`, err.message);
      tryPython(commands, index + 1);
    });

    pythonProcess.on("close", (code) => {
      console.log(`[Electron] Python exited: ${code}`);
    });
  };

  tryPython(findPython(), 0);
}

function waitForServer(retries, callback) {
  const options = {
    hostname: "127.0.0.1",
    port: 5000,
    path: "/",
    method: "GET",
    timeout: 2000
  };

  const req = http.request(options, (res) => {
    console.log("[Electron] Server responded:", res.statusCode);
    callback(true);
  });

  req.on("error", () => {
    if (retries <= 0) {
      console.log("[Electron] Server not responding — opening anyway");
      callback(false);
    } else {
      console.log(`[Electron] Waiting for server... (${retries} retries left)`);
      setTimeout(() => waitForServer(retries - 1, callback), 1000);
    }
  });

  req.on("timeout", () => {
    req.destroy();
  });

  req.end();
}

function createWindow() {
  // Construct the correct file:// URL (works on all platforms)
  const startURL = app.isPackaged
    ? pathToFileURL(path.join(__dirname, "build", "index.html")).href
    : "http://localhost:3000";

  console.log("[Electron] Loading URL:", startURL);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    icon: path.join(__dirname, "public", "logo.png"),
    backgroundColor: "#070b16",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // 👈 THIS IS CRITICAL
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.loadURL(startURL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.setTitle("NeuroMatrix Biosystems — NeuroTrack Pro");
  });

  // Uncomment for debugging in packaged app:
  // mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log("[Electron] App ready");
  console.log("[Electron] isPackaged:", app.isPackaged);
  console.log("[Electron] resourcesPath:", process.resourcesPath);

  startPython();

  console.log("[Electron] Waiting for Python server on :5000...");
  waitForServer(15, (ready) => {
    if (ready) {
      console.log("[Electron] ✓ Server ready!");
    } else {
      console.log("[Electron] Server not ready — launching anyway");
    }
    createWindow();
  });
});

app.on("window-all-closed", () => {
  if (pythonProcess) {
    console.log("[Electron] Stopping Python...");
    pythonProcess.kill();
  }
  app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});