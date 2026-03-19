// ─── LICENSE GATE FOR APP.JS ──────────────────────────────────────────────────
// Add this to the TOP of your App.js (after imports)
// This handles freemium restrictions and license verification

// ── License server URL ──
const LICENSE_API = "https://your-license-server.onrender.com"; // update after deploy

// ── Free tier feature limits ──
const FREE_FEATURES = [
  "mwm_basic",    // MWM video upload — trajectory only
  "trajectory",   // basic trajectory canvas
  "csv_export",   // CSV export
];

const FREE_LIMITS = {
  max_sessions:    3,      // max 3 videos uploaded
  watermark:       true,   // PNG exports have watermark
  ymaze:           false,  // Y-Maze locked
  oft:             false,  // OFT locked
  heatmap:         false,  // Heatmap locked
  probe_trial:     false,  // Probe trial locked
  learning_curve:  false,  // Learning curve locked
  behavioral_suite:false,  // Behavioral Suite tab locked
};

// ─────────────────────────────────────────────────────────────────────────────
// LICENSE HOOK — add this inside NeuroMatrixApp() component
// const { license, features, isLoading } = useLicense();
// ─────────────────────────────────────────────────────────────────────────────

function useLicense() {
  const [license, setLicense]   = React.useState(null);
  const [features, setFeatures] = React.useState(FREE_FEATURES);
  const [isLoading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const stored = localStorage.getItem("nmt_license");
    if (stored) {
      verifyStoredLicense(stored);
    } else {
      setLoading(false);
    }
  }, []);

  async function verifyStoredLicense(key) {
    try {
      const res  = await fetch(`${LICENSE_API}/verify`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.valid) {
        setLicense(data);
        setFeatures(data.features);
        localStorage.setItem("nmt_license",  key);
        localStorage.setItem("nmt_verified", "true");
        localStorage.setItem("nmt_plan",     data.plan);
      } else {
        localStorage.removeItem("nmt_license");
        localStorage.removeItem("nmt_verified");
      }
    } catch (e) {
      console.error("[License] Verify failed:", e);
    } finally {
      setLoading(false);
    }
  }

  function clearLicense() {
    localStorage.removeItem("nmt_license");
    localStorage.removeItem("nmt_verified");
    localStorage.removeItem("nmt_plan");
    setLicense(null);
    setFeatures(FREE_FEATURES);
  }

  return { license, features, isLoading, verifyStoredLicense, clearLicense };
}

// ─────────────────────────────────────────────────────────────────────────────
// LICENSE GATE COMPONENT — wraps locked features
// Usage: <LicenseGate feature="heatmap" license={license}>
//          <HeatmapCanvas ... />
//        </LicenseGate>
// ─────────────────────────────────────────────────────────────────────────────

function LicenseGate({ feature, license, children, inline = false }) {
  const hasFeature = license?.features?.includes(feature) ||
                     FREE_FEATURES.includes(feature);

  if (hasFeature) return children;

  if (inline) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        opacity: 0.5, cursor: "not-allowed",
      }}>
        <span style={{ fontSize: 10 }}>🔒</span>
        <span style={{ fontSize: 9, color: BRAND.muted }}>Pro</span>
      </div>
    );
  }

  return (
    <div style={{
      background: BRAND.panel,
      border: `1px solid ${BRAND.gold}33`,
      borderRadius: 12,
      padding: "32px 24px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Blurred preview background */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(135deg, ${BRAND.gold}08, transparent)`,
        filter: "blur(2px)",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 22, fontWeight: 600, color: BRAND.text,
          marginBottom: 8,
        }}>
          Pro Feature
        </div>
        <p style={{ fontSize: 11, color: BRAND.muted, marginBottom: 20, lineHeight: 1.7 }}>
          {getFeatureDescription(feature)}
        </p>
        <a
          href="https://neuromatrixbiosystems.com/pricing"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: BRAND.gold, color: BRAND.bg,
            padding: "10px 24px", borderRadius: 8,
            fontFamily: "inherit", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          Unlock NeuroTrack Pro →
        </a>
        <div style={{ marginTop: 10, fontSize: 9, color: BRAND.muted }}>
          From $29 · Lifetime license · Web + Desktop
        </div>
      </div>
    </div>
  );
}

function getFeatureDescription(feature) {
  const descriptions = {
    heatmap:         "Spatial heatmap shows where your animal spent the most time — essential for zone analysis.",
    ymaze:           "Y-Maze spontaneous alternation analysis with arm time distribution and alternation %.",
    oft:             "Open Field Test with center/periphery time, rearing events, freezing and velocity.",
    probe_trial:     "Probe trial analysis — time in target quadrant and memory index calculation.",
    learning_curve:  "Learning curve chart showing escape latency across training days.",
    behavioral_suite:"Full behavioral analysis suite including Y-Maze and Open Field Test.",
    png_export:      "Download high-quality PNG images of trajectory and heatmap without watermark.",
    multi_seat:      "Allow multiple lab members to use the same license simultaneously.",
  };
  return descriptions[feature] || "Upgrade to NeuroTrack Pro to unlock this feature.";
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION LIMIT GATE — limits free users to 3 sessions
// ─────────────────────────────────────────────────────────────────────────────

function SessionLimitGate({ sessions, license, children }) {
  const isProUser  = license && license.valid;
  const overLimit  = !isProUser && sessions.length >= FREE_LIMITS.max_sessions;

  if (!overLimit) return children;

  return (
    <div style={{
      background: BRAND.panel,
      border: `1px solid ${BRAND.gold}33`,
      borderRadius: 12, padding: "20px 16px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.gold, marginBottom: 6 }}>
        Free tier limit reached
      </div>
      <p style={{ fontSize: 10, color: BRAND.muted, marginBottom: 16, lineHeight: 1.7 }}>
        Free accounts are limited to {FREE_LIMITS.max_sessions} sessions.
        Upgrade to upload unlimited videos.
      </p>
      <a
        href="https://neuromatrixbiosystems.com/pricing"
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: BRAND.gold, color: BRAND.bg,
          padding: "8px 20px", borderRadius: 7,
          fontFamily: "inherit", fontSize: 10, fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Upgrade to Pro →
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LICENSE STATUS BADGE — shows in header
// Usage: <LicenseBadge license={license} onActivate={handleActivate} />
// ─────────────────────────────────────────────────────────────────────────────

function LicenseBadge({ license, onActivate }) {
  const [showInput, setShowInput] = React.useState(false);
  const [keyInput,  setKeyInput]  = React.useState("");
  const [error,     setError]     = React.useState(null);
  const [loading,   setLoading]   = React.useState(false);

  const PLAN_COLORS = {
    student:     "#63b3ed",
    researcher:  "#c9a84c",
    institution: "#00f5c4",
  };

  if (license?.valid) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: PLAN_COLORS[license.plan] + "22",
        border: `1px solid ${PLAN_COLORS[license.plan]}44`,
        borderRadius: 20, padding: "3px 12px",
        fontSize: 9, letterSpacing: "0.08em",
        color: PLAN_COLORS[license.plan],
      }}>
        ✓ {license.plan?.toUpperCase()} LICENSE
      </div>
    );
  }

  async function activate() {
    if (!keyInput.trim()) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${LICENSE_API}/verify`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key: keyInput.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.valid) {
        localStorage.setItem("nmt_license", keyInput.trim().toUpperCase());
        onActivate(data);
        setShowInput(false);
        setKeyInput("");
      } else {
        setError(data.error || "Invalid license key");
      }
    } catch {
      setError("Cannot reach license server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowInput(s => !s)}
        style={{
          background: BRAND.gold + "15",
          border: `1px solid ${BRAND.gold}44`,
          color: BRAND.gold, borderRadius: 20,
          padding: "3px 12px", fontSize: 9,
          letterSpacing: "0.08em", cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        🔑 ACTIVATE LICENSE
      </button>

      {showInput && (
        <div style={{
          position: "absolute", top: 36, right: 0, zIndex: 200,
          background: BRAND.panel, border: `1px solid ${BRAND.border}`,
          borderRadius: 10, padding: 16, width: 300,
          boxShadow: "0 8px 32px #00000088",
        }}>
          <div style={{ fontSize: 11, color: BRAND.text, marginBottom: 10, fontWeight: 600 }}>
            Enter License Key
          </div>
          <input
            value={keyInput}
            onChange={e => setKeyInput(e.target.value.toUpperCase())}
            placeholder="NMBT-XXXX-XXXX-XXXX"
            maxLength={19}
            style={{
              width: "100%", background: BRAND.surface,
              border: `1px solid ${error ? BRAND.red : BRAND.border}`,
              borderRadius: 6, padding: "8px 12px",
              color: BRAND.text, fontFamily: "inherit",
              fontSize: 12, outline: "none",
              letterSpacing: "0.08em", marginBottom: 8,
            }}
          />
          {error && <div style={{ fontSize: 10, color: BRAND.red, marginBottom: 8 }}>⚠ {error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={activate}
              disabled={loading}
              style={{
                flex: 1, background: BRAND.gold, color: BRAND.bg,
                border: "none", borderRadius: 6, padding: "8px",
                fontSize: 10, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {loading ? "Checking..." : "Activate →"}
            </button>
            <button
              onClick={() => { setShowInput(false); setError(null); }}
              style={{
                background: "none", border: `1px solid ${BRAND.border}`,
                color: BRAND.muted, borderRadius: 6, padding: "8px 12px",
                fontSize: 10, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
          <div style={{ marginTop: 10, textAlign: "center" }}>
            <a
              href="https://neuromatrixbiosystems.com/pricing"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 9, color: BRAND.gold, textDecoration: "none" }}
            >
              Don't have a license? Get one →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WATERMARK CANVAS — adds watermark to free PNG exports
// ─────────────────────────────────────────────────────────────────────────────

function downloadCanvasWithLicense(canvasRef, filename, license) {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const isPro = license?.features?.includes("png_export");

  if (isPro) {
    // Clean export — no watermark
    const a = document.createElement("a");
    a.download = filename;
    a.href = canvas.toDataURL("image/png");
    a.click();
    return;
  }

  // Add watermark for free tier
  const offscreen = document.createElement("canvas");
  offscreen.width  = canvas.width;
  offscreen.height = canvas.height;
  const ctx = offscreen.getContext("2d");

  // Draw original
  ctx.drawImage(canvas, 0, 0);

  // Watermark
  ctx.fillStyle = "rgba(201, 168, 76, 0.35)";
  ctx.font      = "bold 18px monospace";
  ctx.textAlign = "center";

  // Diagonal watermarks
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 6);
  for (let i = -3; i <= 3; i++) {
    ctx.fillText("NeuroTrack Pro — Free Tier", i * 200, i * 80);
  }
  ctx.restore();

  // Bottom badge
  ctx.fillStyle = "rgba(7, 11, 22, 0.85)";
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
  ctx.fillStyle = "#c9a84c";
  ctx.font      = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    "NeuroTrack Pro FREE — Upgrade at neuromatrixbiosystems.com",
    canvas.width / 2,
    canvas.height - 10
  );

  const a = document.createElement("a");
  a.download = filename;
  a.href = offscreen.toDataURL("image/png");
  a.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// FREE TIER BANNER — shows at top of app for free users
// ─────────────────────────────────────────────────────────────────────────────

function FreeTierBanner({ license }) {
  const [dismissed, setDismissed] = React.useState(
    localStorage.getItem("nmt_banner_dismissed") === "true"
  );

  if (license?.valid || dismissed) return null;

  return (
    <div style={{
      background: `linear-gradient(90deg, #c9a84c11, #c9a84c08)`,
      border:     "none",
      borderBottom: `1px solid ${BRAND.gold}33`,
      padding:    "10px 24px",
      display:    "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14 }}>🔬</span>
        <span style={{ fontSize: 10, color: BRAND.muted, lineHeight: 1.6 }}>
          <strong style={{ color: BRAND.gold }}>Free Tier</strong> — 3 sessions · Trajectory only · Watermarked exports.
          Upgrade for heatmap, Y-Maze, OFT, probe trial and unlimited sessions.
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <a
          href="https://neuromatrixbiosystems.com/pricing"
          target="_blank"
          rel="noreferrer"
          style={{
            background: BRAND.gold, color: BRAND.bg,
            padding: "5px 14px", borderRadius: 6,
            fontSize: 9, fontWeight: 700, textDecoration: "none",
            letterSpacing: "0.08em", whiteSpace: "nowrap",
          }}
        >
          Upgrade from $29 →
        </a>
        <button
          onClick={() => {
            setDismissed(true);
            localStorage.setItem("nmt_banner_dismissed", "true");
          }}
          style={{
            background: "none", border: "none",
            color: BRAND.muted, cursor: "pointer", fontSize: 14,
          }}
        >✕</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT ALL — import these in App.js
// ─────────────────────────────────────────────────────────────────────────────
export {
  useLicense,
  LicenseGate,
  SessionLimitGate,
  LicenseBadge,
  FreeTierBanner,
  downloadCanvasWithLicense,
  FREE_FEATURES,
  FREE_LIMITS,
  LICENSE_API,
};
