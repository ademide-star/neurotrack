 // eslint-disable-next-line react-hooks/exhaustive-deps
import { useState, useRef, useEffect } from "react";

// ─── BRAND ────────────────────────────────────────────────────────────────────
const BRAND = {
  gold:    "#c9a84c",
  goldLight: "#e8c96a",
  goldDim: "#c9a84c44",
  bg:      "#070b16",
  surface: "#0a0e1a",
  panel:   "#0d1428",
  border:  "#1e2a4a",
  text:    "#e2e8f0",
  muted:   "#4a5568",
  dim:     "#2d3748",
};

const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";
const SESSION_COLORS = ["#c9a84c","#6c63ff","#00f5c4","#ff6b6b","#63b3ed","#fc8181","#68d391","#f687b3"];

// ─── UTILS ────────────────────────────────────────────────────────────────────
function computeStats(positions) {
  if (!positions || positions.length < 2)
    return { distance: 0, avgSpeed: 0, centerPct: 0, peripheryPct: 0, platformPct: 0, frames: 0, maxSpeed: 0, durationSec: 0 };
  let distance = 0, centerCount = 0, platformCount = 0;
  const speeds = [];
  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i-1].x;
    const dy = positions[i].y - positions[i-1].y;
    const d = Math.sqrt(dx*dx + dy*dy);
    distance += d;
    speeds.push(d * 0.042 * 30);
  }
  positions.forEach(p => {
    const dc = Math.sqrt((p.x-300)**2 + (p.y-300)**2);
    const dp = Math.sqrt((p.x-420)**2 + (p.y-200)**2);
    if (dc < 80) centerCount++;
    if (dp < 22) platformCount++;
  });
  const total = positions.length;
  const distM = (distance * 0.042).toFixed(2);
  const durationSec = (total / 30).toFixed(1);
  const avgSpeed = (distM / durationSec).toFixed(2);
  const maxSpeed = Math.max(...speeds).toFixed(2);
  const peripheryCount = Math.max(0, total - centerCount - platformCount);
  return {
    distance: distM, avgSpeed, maxSpeed,
    centerPct: Math.round((centerCount / total) * 100),
    peripheryPct: Math.round((peripheryCount / total) * 100),
    platformPct: Math.round((platformCount / total) * 100),
    frames: total, durationSec,
  };
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ─── CANVAS ───────────────────────────────────────────────────────────────────
function drawPool(ctx, W = 600, H = 600) {
  ctx.fillStyle = BRAND.bg;
  ctx.fillRect(0, 0, W, H);
  // Outer pool ring
  ctx.beginPath(); ctx.arc(W/2, H/2, 240, 0, Math.PI*2);
  ctx.strokeStyle = "#c9a84c33"; ctx.lineWidth = 2; ctx.stroke();
  // Center zone
  ctx.beginPath(); ctx.arc(W/2, H/2, 80, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(201,168,76,0.12)"; ctx.lineWidth = 1; ctx.stroke();
  // Platform
  ctx.beginPath(); ctx.arc(420, 200, 22, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(201,168,76,0.4)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "rgba(201,168,76,0.08)"; ctx.fill();
}

function TrajectoryCanvas({ sessions, activeIds, animate, canvasRef: extRef }) {
  const intRef = useRef(null);
  const canvasRef = extRef || intRef;
  const rafRef = useRef(null);
 // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let drawn = 0;
    const allData = sessions.filter(s => activeIds.includes(s.id) && s.positions?.length > 0);
    const maxLen = allData.length > 0 ? Math.max(...allData.map(s => s.positions.length)) : 0;

    function draw() {
      ctx.clearRect(0, 0, 600, 600);
      drawPool(ctx);
      if (allData.length === 0) {
        ctx.fillStyle = BRAND.dim; ctx.font = "13px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Upload videos to begin analysis", 300, 295);
        ctx.fillStyle = BRAND.muted; ctx.font = "10px monospace";
        ctx.fillText("NeuroMatrix Biosystems", 300, 318);
        return;
      }
      const limit = animate ? Math.min(drawn, maxLen) : maxLen;
      allData.forEach((s, si) => {
        const color = SESSION_COLORS[si % SESSION_COLORS.length];
        const pts = s.positions.slice(0, Math.min(limit, s.positions.length));
        if (pts.length < 2) return;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = color + "cc"; ctx.lineWidth = 1.8; ctx.stroke();
        const last = pts[pts.length-1];
        ctx.beginPath(); ctx.arc(last.x, last.y, 7, 0, Math.PI*2);
        ctx.fillStyle = color; ctx.fill();
        ctx.beginPath(); ctx.arc(last.x, last.y, 13, 0, Math.PI*2);
        ctx.strokeStyle = color + "55"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = color; ctx.font = "9px monospace"; ctx.textAlign = "left";
        ctx.fillText(s.name.slice(0, 10), last.x + 14, last.y + 4);
      });
      if (animate && drawn < maxLen) { drawn += 4; rafRef.current = requestAnimationFrame(draw); }
    }
    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [sessions, activeIds, animate]);

  return <canvas ref={canvasRef} width={600} height={600} style={{ width:"100%", height:"100%", borderRadius:10 }} />;
}

function HeatmapCanvas({ positions, canvasRef: extRef }) {
  const intRef = useRef(null);
  const canvasRef = extRef || intRef;

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 600, 600);
    drawPool(ctx);
    if (!positions || positions.length === 0) {
      ctx.fillStyle = BRAND.dim; ctx.font = "13px monospace";
      ctx.textAlign = "center"; ctx.fillText("No data yet", 300, 300); return;
    }
    const BINS = 40;
    const grid = new Array(BINS).fill(0).map(() => new Array(BINS).fill(0));
    positions.forEach(({ x, y }) => {
      const gx = Math.min(BINS-1, Math.floor((x/600)*BINS));
      const gy = Math.min(BINS-1, Math.floor((y/600)*BINS));
      if (gx >= 0 && gy >= 0) grid[gy][gx]++;
    });
    const max = Math.max(1, ...grid.flat());
    const cW = 600/BINS, cH = 600/BINS;
    grid.forEach((row, gy) => row.forEach((val, gx) => {
      if (!val) return;
      const t = val / max;
      // Gold → white heat gradient
      const r = Math.round(50 + t * 205);
      const g = Math.round(t < 0.5 ? t*2*168 : 168 + (t-0.5)*2*87);
      const b = Math.round(t < 0.5 ? t*2*76 : Math.max(0, 76 - (t-0.5)*2*76));
      ctx.fillStyle = `rgba(${r},${g},${b},${0.25 + t*0.75})`;
      ctx.fillRect(gx*cW, gy*cH, cW, cH);
    }));
    ctx.beginPath(); ctx.arc(300, 300, 240, 0, Math.PI*2);
    ctx.strokeStyle = "#c9a84c33"; ctx.lineWidth = 2; ctx.stroke();
  }, [positions]);

  return <canvas ref={canvasRef} width={600} height={600} style={{ width:"100%", height:"100%", borderRadius:10 }} />;
}

function SpeedGraph({ sessions, activeIds }) {
  const canvasRef = useRef(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H); ctx.fillStyle = BRAND.bg; ctx.fillRect(0,0,W,H);
    const active = sessions.filter(s => activeIds.includes(s.id) && s.positions?.length > 1);
    if (!active.length) {
      ctx.fillStyle = BRAND.dim; ctx.font = "11px monospace";
      ctx.textAlign = "center"; ctx.fillText("No data", W/2, H/2); return;
    }
    for (let i = 0; i <= 4; i++) {
      const y = 20 + (i/4)*(H-40);
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W-10, y);
      ctx.strokeStyle = BRAND.border; ctx.lineWidth = 1; ctx.stroke();
    }
    active.forEach((s, si) => {
      const color = SESSION_COLORS[si % SESSION_COLORS.length];
      const speeds = [];
      for (let i = 1; i < s.positions.length; i++) {
        const dx = s.positions[i].x - s.positions[i-1].x;
        const dy = s.positions[i].y - s.positions[i-1].y;
        speeds.push(Math.sqrt(dx*dx + dy*dy) * 0.042 * 30);
      }
      const smooth = speeds.map((_,i) => {
        const w = speeds.slice(Math.max(0,i-5), i+6);
        return w.reduce((a,b) => a+b, 0) / w.length;
      });
      const maxS = Math.max(...smooth, 1);
      ctx.beginPath();
      smooth.forEach((v, i) => {
        const x = 40 + (i/smooth.length)*(W-50);
        const y = 20 + (1 - v/maxS)*(H-40);
        i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      });
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    });
    ctx.fillStyle = BRAND.muted; ctx.font = "9px monospace";
    ctx.textAlign = "left"; ctx.fillText("Speed (m/s)", 4, 14);
    ctx.textAlign = "center"; ctx.fillText("Frames", W/2, H-2);
  }, [sessions, activeIds]);
  return <canvas ref={canvasRef} width={540} height={160} style={{ width:"100%", borderRadius:8 }} />;
}

function DistanceBar({ sessions, activeIds }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H); ctx.fillStyle = BRAND.bg; ctx.fillRect(0,0,W,H);
    const data = sessions.filter(s => s.positions?.length > 1).map((s,i) => ({
      name: s.name, dist: parseFloat(computeStats(s.positions).distance),
      id: s.id, color: SESSION_COLORS[i % SESSION_COLORS.length]
    }));
    if (!data.length) {
      ctx.fillStyle = BRAND.dim; ctx.font = "11px monospace";
      ctx.textAlign = "center"; ctx.fillText("No sessions", W/2, H/2); return;
    }
    const maxD = Math.max(...data.map(d => d.dist), 1);
    const bW = Math.min(55, (W-60)/data.length - 8);
    data.forEach((d, i) => {
      const isActive = activeIds.includes(d.id);
      const bH = (d.dist/maxD)*(H-55);
      const x = 30 + i*((W-40)/data.length) + ((W-40)/data.length - bW)/2;
      const y = H - 30 - bH;
      ctx.fillStyle = isActive ? d.color + "cc" : d.color + "33";
      ctx.fillRect(x, y, bW, bH);
      ctx.fillStyle = isActive ? d.color : d.color + "77";
      ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillText(d.dist + "m", x+bW/2, y-4);
      ctx.fillStyle = BRAND.muted;
      ctx.fillText(d.name.slice(0,8), x+bW/2, H-10);
    });
    ctx.fillStyle = BRAND.muted; ctx.font = "9px monospace";
    ctx.textAlign = "left"; ctx.fillText("Distance (m)", 2, 12);
  }, [sessions, activeIds]);
  return <canvas ref={canvasRef} width={540} height={160} style={{ width:"100%", borderRadius:8 }} />;
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, color }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${BRAND.panel}, #111827)`,
      border: `1px solid ${color}22`, borderLeft: `3px solid ${color}`,
      borderRadius: 10, padding: "13px 16px", display: "flex", flexDirection: "column", gap: 3
    }}>
      <span style={{ color: BRAND.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ color, fontSize: 22, fontWeight: 700 }}>{value ?? "—"}</span>
        {unit && <span style={{ color: BRAND.muted, fontSize: 11 }}>{unit}</span>}
      </div>
    </div>
  );
}

function DropZone({ onFiles, processing }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const handle = files => {
    const valid = Array.from(files).filter(f =>
      f.type.startsWith("video/") || f.name.endsWith(".csv") || f.name.endsWith(".mp4")
    );
    if (valid.length) onFiles(valid);
  };
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
      onClick={() => !processing && inputRef.current.click()}
      style={{
        border: `2px dashed ${dragging ? BRAND.gold : BRAND.border}`,
        borderRadius: 12, padding: "22px 16px", textAlign: "center",
        cursor: processing ? "wait" : "pointer", transition: "all 0.25s",
        background: dragging ? "#c9a84c08" : "transparent",
      }}>
      <input ref={inputRef} type="file" accept="video/*,.csv,.mp4" multiple
        style={{ display: "none" }} onChange={e => handle(e.target.files)} />
      <div style={{ fontSize: 26, marginBottom: 6 }}>{processing ? "⏳" : "📂"}</div>
      <div style={{ fontSize: 11, color: BRAND.gold, marginBottom: 3 }}>
        {processing ? "Processing…" : "Drop videos or CSVs here"}
      </div>
      <div style={{ fontSize: 9, color: BRAND.dim }}>MP4 · AVI · CSV · Multiple files OK</div>
    </div>
  );
}

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px" }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${BRAND.gold}44)` }} />
      <span style={{ fontSize: 7, color: BRAND.gold + "66", letterSpacing: 3 }}>✦</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${BRAND.gold}44, transparent)` }} />
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function NeuroMatrixApp() {
  const [sessions, setSessions] = useState([]);
  const [activeIds, setActiveIds] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processingName, setProcessingName] = useState("");
  const [activeTab, setActiveTab] = useState("Trajectory");
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);

  const trajRef = useRef(null);
  const heatRef = useRef(null);

  const combinedPositions = sessions
    .filter(s => activeIds.includes(s.id))
    .flatMap(s => s.positions || []);
  const activeSession = sessions.find(s => s.id === activeIds[activeIds.length-1]);
  const stats = computeStats(activeSession?.positions);

  // Queue processor
  useEffect(() => {
    if (processing || queue.length === 0) return;
    const file = queue[0];
    setQueue(q => q.slice(1));
    (async () => {
      setProcessing(true); setProcessingName(file.name); setError(null);
      try {
        let positions = [];
        if (file.name.endsWith(".csv")) {
          const text = await file.text();
          positions = text.trim().split("\n").slice(1).map(l => {
            const [x, y] = l.split(",");
            return { x: parseFloat(x), y: parseFloat(y) };
          }).filter(p => !isNaN(p.x) && !isNaN(p.y));
        } else {
          const fd = new FormData(); fd.append("video", file);
          const res = await fetch(`${API}/process`, { method: "POST", body: fd });
          if (!res.ok) throw new Error(`Server error ${res.status}`);
          positions = (await res.json()).positions;
        }
        const id = `S${Date.now()}`;
        setSessions(prev => [...prev, {
          id, name: file.name.replace(/\.[^/.]+$/, ""),
          file: file.name, date: new Date().toISOString().split("T")[0],
          positions, status: "complete"
        }]);
        setActiveIds(prev => [...prev, id]);
      } catch (err) {
        setError(err.message.includes("fetch")
          ? "Cannot reach server — is server.py running on :5000?"
          : err.message);
      } finally { setProcessing(false); setProcessingName(""); }
    })();
  }, [queue, processing]);

  const handleFiles = files => setQueue(q => [...q, ...files]);
  const toggleId = id => setActiveIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const removeSession = id => {
    setSessions(prev => prev.filter(s => s.id !== id));
    setActiveIds(prev => prev.filter(x => x !== id));
  };
  const exportCSV = () => {
    const active = sessions.filter(s => activeIds.includes(s.id));
    if (!active.length) return;
    const rows = ["Session,Frame,X,Y"];
    active.forEach(s => s.positions.forEach((p, i) =>
      rows.push(`${s.name},${i},${p.x},${p.y}`)
    ));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "neuromatrix_export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", background: BRAND.bg, fontFamily: "'Space Mono','Courier New',monospace", color: BRAND.text, display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${BRAND.bg}; }
        ::-webkit-scrollbar-thumb { background: ${BRAND.gold}44; border-radius: 2px; }
        button { font-family: inherit; transition: all 0.2s; }
        button:hover { opacity: 0.8; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        background: `linear-gradient(90deg, ${BRAND.bg} 0%, ${BRAND.surface} 50%, ${BRAND.bg} 100%)`,
        borderBottom: `1px solid ${BRAND.gold}33`,
        padding: "0 24px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: `0 1px 20px ${BRAND.gold}11`
      }}>
        {/* Logo + Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/logo.png"
            alt="NeuroMatrix Biosystems"
            style={{ height: 40, width: 40, objectFit: "contain", borderRadius: 8 }}
            onError={e => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          {/* Fallback icon if logo not found */}
          <div style={{
            display: "none", width: 40, height: 40, borderRadius: 8,
            background: `linear-gradient(135deg, ${BRAND.gold}44, ${BRAND.gold}22)`,
            border: `1px solid ${BRAND.gold}44`,
            alignItems: "center", justifyContent: "center", fontSize: 18
          }}>🧠</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: BRAND.gold }}>
              NEURO<span style={{ color: BRAND.text }}>MATRIX</span>
            </span>
            <span style={{ fontSize: 7, color: BRAND.muted, letterSpacing: 4, textTransform: "uppercase" }}>
              Biosystems
            </span>
          </div>
          <div style={{ width: 1, height: 28, background: BRAND.border, margin: "0 4px" }} />
          <span style={{ fontSize: 9, color: BRAND.muted, letterSpacing: 1 }}>NeuroTrack Pro</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            ["▶ ANIMATE",    () => setAnimating(a => !a),                                          animating ? "#ff6b6b" : BRAND.gold],
            ["⬇ TRAJECTORY", () => trajRef.current && downloadCanvas(trajRef.current, "trajectory.png"), "#6c63ff"],
            ["⬇ HEATMAP",    () => heatRef.current && downloadCanvas(heatRef.current, "heatmap.png"),    "#00f5c4"],
            ["⬇ CSV",        exportCSV,                                                             "#68d391"],
          ].map(([label, fn, color]) => (
            <button key={label} onClick={fn} style={{
              background: color + "15", border: `1px solid ${color}44`,
              color, padding: "5px 12px", borderRadius: 6,
              cursor: "pointer", fontSize: 9, letterSpacing: 1
            }}>{label}</button>
          ))}
        </div>

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {processing && (
            <span style={{ fontSize: 9, color: BRAND.gold, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              ⏳ {processingName}
            </span>
          )}
          {queue.length > 0 && (
            <span style={{ fontSize: 9, color: "#6c63ff" }}>{queue.length} queued</span>
          )}
          <span style={{
            background: processing ? BRAND.gold + "22" : BRAND.gold + "11",
            border: `1px solid ${processing ? BRAND.gold + "66" : BRAND.gold + "33"}`,
            color: BRAND.gold, borderRadius: 20, padding: "3px 10px", fontSize: 9, letterSpacing: 1
          }}>
            {processing ? "PROCESSING" : "READY"}
          </span>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 234, background: BRAND.surface,
          borderRight: `1px solid ${BRAND.gold}22`,
          padding: "16px 0", display: "flex", flexDirection: "column",
          overflowY: "auto"
        }}>
          <div style={{ padding: "0 14px 14px" }}>
            <DropZone onFiles={handleFiles} processing={processing} />
          </div>

          {error && (
            <div style={{ margin: "0 12px 12px", background: "#ff6b6b11", border: "1px solid #ff6b6b33", borderRadius: 8, padding: "9px 12px", fontSize: 9, color: "#ff6b6b", lineHeight: 1.6 }}>
              ⚠ {error}
              <button onClick={() => setError(null)} style={{ float: "right", background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 12 }}>✕</button>
            </div>
          )}

          <GoldDivider />

          <div style={{ padding: "4px 14px 10px", fontSize: 9, color: BRAND.gold + "99", letterSpacing: 2, textTransform: "uppercase" }}>
            Sessions ({sessions.length})
          </div>

          {sessions.length === 0 && (
            <div style={{ padding: "20px 14px", fontSize: 10, color: BRAND.dim, textAlign: "center", lineHeight: 2 }}>
              Upload a video or CSV<br />to start analysis
            </div>
          )}

          {sessions.map((s, i) => {
            const color = SESSION_COLORS[i % SESSION_COLORS.length];
            const isActive = activeIds.includes(s.id);
            const st = computeStats(s.positions);
            return (
              <div key={s.id} style={{
                borderLeft: `2px solid ${isActive ? color : "transparent"}`,
                background: isActive ? BRAND.panel : "transparent",
                padding: "9px 12px", transition: "all 0.2s",
                borderBottom: `1px solid ${BRAND.panel}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <button onClick={() => toggleId(s.id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: isActive ? color : BRAND.muted, fontSize: 10,
                    display: "flex", alignItems: "center", gap: 6, padding: 0, maxWidth: 170
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? color : BRAND.dim, flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  </button>
                  <button onClick={() => removeSession(s.id)} style={{
                    background: "none", border: "none", color: BRAND.dim,
                    cursor: "pointer", fontSize: 11, padding: "0 2px", flexShrink: 0
                  }}>✕</button>
                </div>
                <div style={{ fontSize: 9, color: BRAND.muted, paddingLeft: 13 }}>
                  {st.frames} frames · {st.distance}m · {st.avgSpeed}m/s
                </div>
              </div>
            );
          })}

          <div style={{ flex: 1 }} />
          <GoldDivider />

          {/* Sidebar Footer */}
          <div style={{ padding: "12px 14px", textAlign: "center" }}>
            <img src="/logo.png" alt="" style={{ height: 32, objectFit: "contain", marginBottom: 6, opacity: 0.6 }}
              onError={e => e.target.style.display = "none"} />
            <div style={{ fontSize: 9, color: BRAND.gold + "88", letterSpacing: 2, marginBottom: 2 }}>NEUROMATRIX</div>
            <div style={{ fontSize: 7, color: BRAND.muted, letterSpacing: 3, marginBottom: 6 }}>BIOSYSTEMS</div>
            <div style={{ fontSize: 7, color: BRAND.dim, lineHeight: 1.8 }}>
              NeuroTrack Pro v2.1<br />
              Flask · OpenCV · YOLOv8<br />
              © 2026 NeuroMatrix Biosystems
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, padding: "20px 24px", overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Page Title */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, color: BRAND.text }}>
                Behavioral <span style={{ color: BRAND.gold }}>Analysis</span>
              </h1>
              <p style={{ fontSize: 9, color: BRAND.muted, marginTop: 3, letterSpacing: 1 }}>
                MORRIS WATER MAZE · SPATIAL MEMORY · LOCOMOTION TRACKING
              </p>
            </div>
            <div style={{ fontSize: 9, color: BRAND.dim, textAlign: "right" }}>
              {new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
            <StatCard label="Active Sessions" value={activeIds.length}                          color={BRAND.gold} />
            <StatCard label="Distance"        value={activeSession ? stats.distance   : "—"} unit="m"   color="#6c63ff" />
            <StatCard label="Avg Speed"       value={activeSession ? stats.avgSpeed   : "—"} unit="m/s" color="#00f5c4" />
            <StatCard label="Max Speed"       value={activeSession ? stats.maxSpeed   : "—"} unit="m/s" color="#fc8181" />
            <StatCard label="Duration"        value={activeSession ? stats.durationSec: "—"} unit="sec" color="#68d391" />
          </div>

          {/* Overlay Pills */}
          {sessions.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 9, color: BRAND.muted, letterSpacing: 1.5 }}>OVERLAY:</span>
              {sessions.map((s, i) => {
                const color = SESSION_COLORS[i % SESSION_COLORS.length];
                const isActive = activeIds.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggleId(s.id)} style={{
                    background: isActive ? color + "22" : "transparent",
                    border: `1px solid ${isActive ? color + "66" : BRAND.border}`,
                    color: isActive ? color : BRAND.muted,
                    borderRadius: 20, padding: "4px 10px", fontSize: 10,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? color : BRAND.dim }} />
                    {s.name.length > 12 ? s.name.slice(0, 11) + "…" : s.name}
                  </button>
                );
              })}
              <button onClick={() => setActiveIds(sessions.map(s => s.id))} style={{ background: "none", border: `1px solid ${BRAND.border}`, color: BRAND.muted, borderRadius: 20, padding: "4px 10px", fontSize: 9, cursor: "pointer" }}>All</button>
              <button onClick={() => setActiveIds([])} style={{ background: "none", border: `1px solid ${BRAND.border}`, color: BRAND.muted, borderRadius: 20, padding: "4px 10px", fontSize: 9, cursor: "pointer" }}>None</button>
            </div>
          )}

          {/* Main Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 330px", gap: 16 }}>

            {/* Canvas */}
            <div style={{ background: BRAND.surface, border: `1px solid ${BRAND.gold}22`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: `1px solid ${BRAND.gold}22` }}>
                {["Trajectory", "Heatmap"].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{
                    background: "none", border: "none",
                    borderBottom: activeTab === t ? `2px solid ${BRAND.gold}` : "2px solid transparent",
                    color: activeTab === t ? BRAND.gold : BRAND.muted,
                    padding: "10px 18px", cursor: "pointer", fontSize: 10, letterSpacing: 1
                  }}>{t.toUpperCase()}</button>
                ))}
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => activeTab === "Trajectory"
                    ? trajRef.current && downloadCanvas(trajRef.current, "neuromatrix_trajectory.png")
                    : heatRef.current && downloadCanvas(heatRef.current, "neuromatrix_heatmap.png")}
                  style={{ background: BRAND.gold + "11", border: `1px solid ${BRAND.gold}33`, color: BRAND.gold, margin: "7px 12px", borderRadius: 6, padding: "4px 10px", fontSize: 9, cursor: "pointer" }}>
                  ⬇ Download PNG
                </button>
              </div>
              <div style={{ padding: 14, aspectRatio: "1", maxHeight: 520 }}>
                {activeTab === "Trajectory"
                  ? <TrajectoryCanvas sessions={sessions} activeIds={activeIds} animate={animating} canvasRef={trajRef} />
                  : <HeatmapCanvas positions={combinedPositions} canvasRef={heatRef} />
                }
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Speed */}
              <div style={{ background: BRAND.surface, border: `1px solid ${BRAND.gold}22`, borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 9, color: BRAND.gold + "99", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Speed Over Time</div>
                <SpeedGraph sessions={sessions} activeIds={activeIds} />
              </div>

              {/* Distance */}
              <div style={{ background: BRAND.surface, border: `1px solid ${BRAND.gold}22`, borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 9, color: BRAND.gold + "99", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Distance Comparison</div>
                <DistanceBar sessions={sessions} activeIds={activeIds} />
              </div>

              {/* Zone Distribution */}
              <div style={{ background: BRAND.surface, border: `1px solid ${BRAND.gold}22`, borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 9, color: BRAND.gold + "99", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Zone Distribution</div>
                {[
                  ["Center",    stats.centerPct,    BRAND.gold],
                  ["Periphery", stats.peripheryPct, "#6c63ff"],
                  ["Platform",  stats.platformPct,  "#00f5c4"],
                ].map(([zone, pct, color]) => (
                  <div key={zone} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: BRAND.muted, width: 60 }}>{zone}</span>
                    <div style={{ flex: 1, background: "#111827", borderRadius: 3, height: 5, overflow: "hidden" }}>
                      <div style={{ width: `${pct || 0}%`, background: color, height: "100%", borderRadius: 3, transition: "width 0.8s ease" }} />
                    </div>
                    <span style={{ fontSize: 9, color, width: 28, textAlign: "right" }}>{pct || 0}%</span>
                  </div>
                ))}
              </div>

              {/* Session Summary */}
              <div style={{ background: BRAND.surface, border: `1px solid ${BRAND.gold}22`, borderRadius: 14, padding: 14, flex: 1 }}>
                <div style={{ fontSize: 9, color: BRAND.gold + "99", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Session Summary</div>
                {sessions.length === 0
                  ? <div style={{ fontSize: 10, color: BRAND.dim, textAlign: "center", padding: "16px 0" }}>No sessions loaded</div>
                  : sessions.map((s, i) => {
                    const color = SESSION_COLORS[i % SESSION_COLORS.length];
                    const isActive = activeIds.includes(s.id);
                    const st = computeStats(s.positions);
                    return (
                      <div key={s.id} onClick={() => toggleId(s.id)} style={{
                        padding: "7px 0", borderBottom: `1px solid ${BRAND.panel}`,
                        cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? color : BRAND.dim, flexShrink: 0 }} />
                          <span style={{ fontSize: 10, color: isActive ? BRAND.text : BRAND.muted, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ fontSize: 9, color: BRAND.muted }}>{st.durationSec}s</span>
                          <span style={{ fontSize: 9, color, fontFamily: "monospace" }}>{st.distance}m</span>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${BRAND.gold}22`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 8, color: BRAND.dim }}>© 2026 NeuroMatrix Biosystems · NeuroTrack Pro v2.1</span>
            <span style={{ fontSize: 8, color: BRAND.dim }}>Morris Water Maze Analysis Platform</span>
            <span style={{ fontSize: 8, color: BRAND.dim }}>Powered by OpenCV · YOLOv8 · Flask</span>
          </div>
        </main>
      </div>
    </div>
  );
}
