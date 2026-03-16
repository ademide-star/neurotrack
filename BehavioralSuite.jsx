/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useEffect } from "react";

const BRAND = {
  gold: "#c9a84c", goldLight: "#e8c96a", goldDim: "#c9a84c33",
  bg: "#070b16", surface: "#0a0e1a", panel: "#0d1428",
  border: "#1e2a4a", text: "#e2e8f0", muted: "#4a5568", dim: "#2d3748",
  green: "#00f5c4", purple: "#6c63ff", red: "#ff6b6b", blue: "#63b3ed",
};

const API = (window.location.hostname === "localhost" ||
             window.location.hostname === "127.0.0.1" ||
             window.location.protocol === "file:")
  ? "http://127.0.0.1:5000"
  : process.env.REACT_APP_API_URL;

const S = {
  app:       { background: BRAND.bg, color: BRAND.text, fontFamily: "'IBM Plex Mono', monospace", minHeight: "100vh" },
  header:    { background: `linear-gradient(180deg, #0d1428 0%, ${BRAND.bg} 100%)`, borderBottom: `1px solid ${BRAND.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logoText:  { fontSize: "18px", fontWeight: "700", color: BRAND.gold, letterSpacing: "0.05em" },
  logoSub:   { fontSize: "11px", color: BRAND.muted, letterSpacing: "0.15em", textTransform: "uppercase" },
  tabs:      { display: "flex", gap: "4px", background: BRAND.surface, padding: "4px", borderRadius: "10px", border: `1px solid ${BRAND.border}` },
  tab:       (a) => ({ padding: "8px 20px", borderRadius: "7px", border: "none", cursor: "pointer", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: "600", letterSpacing: "0.05em", transition: "all 0.2s", background: a ? BRAND.gold : "transparent", color: a ? BRAND.bg : BRAND.muted }),
  body:      { padding: "24px 32px", maxWidth: "1400px", margin: "0 auto" },
  grid2:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  grid3:     { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" },
  card:      { background: BRAND.panel, border: `1px solid ${BRAND.border}`, borderRadius: "12px", padding: "20px" },
  cardTitle: { fontSize: "11px", fontWeight: "700", color: BRAND.gold, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" },
  label:     { fontSize: "11px", color: BRAND.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px", display: "block" },
  input:     { width: "100%", background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: "6px", padding: "8px 12px", color: BRAND.text, fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", outline: "none", boxSizing: "border-box" },
  btn:       (c = BRAND.gold) => ({ background: c, color: c === BRAND.gold ? BRAND.bg : "#fff", border: "none", borderRadius: "7px", padding: "10px 20px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: "700", letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.2s" }),
  btnOutline:{ background: "transparent", color: BRAND.gold, border: `1px solid ${BRAND.gold}`, borderRadius: "7px", padding: "8px 16px", fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: "600", cursor: "pointer" },
  metric:    { background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: "8px", padding: "14px", textAlign: "center" },
  metricVal: (c = BRAND.gold) => ({ fontSize: "28px", fontWeight: "700", color: c, lineHeight: 1, marginBottom: "4px" }),
  metricLabel: { fontSize: "10px", color: BRAND.muted, letterSpacing: "0.1em", textTransform: "uppercase" },
  badge:     (c) => ({ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", background: c + "22", color: c, letterSpacing: "0.08em", textTransform: "uppercase" }),
  table:     { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
  th:        { padding: "8px 12px", textAlign: "left", fontSize: "10px", color: BRAND.muted, letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `1px solid ${BRAND.border}` },
  td:        { padding: "8px 12px", borderBottom: `1px solid ${BRAND.dim}22`, color: BRAND.text },
  divider:   { border: "none", borderTop: `1px solid ${BRAND.border}`, margin: "20px 0" },
};

// ─── UTILS ───────────────────────────────────────────────────────────────────

function downloadCanvas(ref, filename) {
  const c = ref.current; if (!c) return;
  const a = document.createElement("a"); a.download = filename; a.href = c.toDataURL("image/png"); a.click();
}

function downloadDivChart(ref, filename) {
  const el = ref.current; if (!el) return;
  const W = el.offsetWidth || 400, H = el.offsetHeight || 120;
  const canvas = document.createElement("canvas");
  canvas.width = W * 2; canvas.height = H * 2;
  const ctx = canvas.getContext("2d"); ctx.scale(2, 2);
  ctx.fillStyle = BRAND.panel; ctx.fillRect(0, 0, W, H);
  ctx.font = "10px monospace"; ctx.fillStyle = BRAND.muted;
  ctx.fillText("NeuroMatrix — " + filename.replace(".png", ""), 8, 14);
  ctx.fillStyle = BRAND.gold; ctx.font = "9px monospace";
  ctx.fillText("Export CSV for full data", 8, H - 6);
  const a = document.createElement("a"); a.download = filename; a.href = canvas.toDataURL("image/png"); a.click();
}

function DownloadBtn({ onClick, label = "⬇ PNG" }) {
  return <button style={{ ...S.btnOutline, fontSize: "10px", padding: "4px 10px" }} onClick={onClick}>{label}</button>;
}

function StatCard({ label, value, unit = "", color = BRAND.gold, sub }) {
  return (
    <div style={S.metric}>
      <div style={S.metricVal(color)}>{value}<span style={{ fontSize: "14px", marginLeft: "3px" }}>{unit}</span></div>
      <div style={S.metricLabel}>{label}</div>
      {sub && <div style={{ fontSize: "10px", color: BRAND.muted, marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, color = BRAND.gold, height = 80, chartRef }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div ref={chartRef} style={{ display: "flex", alignItems: "flex-end", gap: "6px", height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div style={{ fontSize: "9px", color: BRAND.muted }}>{d.value.toFixed(1)}</div>
          <div style={{ width: "100%", height: `${(d.value / max) * (height - 24)}px`, background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`, borderRadius: "3px 3px 0 0", transition: "height 0.5s ease", minHeight: "2px" }} />
          <div style={{ fontSize: "9px", color: BRAND.muted, textAlign: "center" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── VIDEO UPLOAD ────────────────────────────────────────────────────────────

function VideoUpload({ onResult, endpoint, processing, setProcessing, color = BRAND.gold }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const processFile = async (file) => {
    setProcessing(true); setError(null);
    try {
      const fd = new FormData(); fd.append("video", file);
      const res = await fetch(`${API}${endpoint}`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onResult(data, file.name.replace(/\.[^/.]+$/, ""));
    } catch (e) {
      setError(e.message.includes("fetch") ? "⚠ Cannot reach server — is server running on :5000?" : e.message);
    } finally { setProcessing(false); }
  };

  const handle = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("video/") || f.name.match(/\.(mp4|avi|mov|mkv)$/i));
    if (valid.length) processFile(valid[0]);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
        onClick={() => !processing && inputRef.current.click()}
        style={{ border: `2px dashed ${dragging ? color : BRAND.border}`, borderRadius: "10px", padding: "20px 16px", textAlign: "center", cursor: processing ? "wait" : "pointer", transition: "all 0.25s", background: dragging ? color + "08" : "transparent" }}
      >
        <input ref={inputRef} type="file" accept="video/*,.mp4,.avi,.mov,.mkv" style={{ display: "none" }} onChange={(e) => handle(e.target.files)} />
        <div style={{ fontSize: "24px", marginBottom: "6px" }}>{processing ? "⏳" : "🎥"}</div>
        <div style={{ fontSize: "12px", color, marginBottom: "4px", fontWeight: "700" }}>{processing ? "Processing video..." : "Drop video or click to upload"}</div>
        <div style={{ fontSize: "10px", color: BRAND.muted }}>MP4 · AVI · MOV · MKV</div>
      </div>
      {error && (
        <div style={{ marginTop: "8px", background: BRAND.red + "11", border: `1px solid ${BRAND.red}33`, borderRadius: "6px", padding: "8px 12px", fontSize: "10px", color: BRAND.red }}>
          {error}<button onClick={() => setError(null)} style={{ float: "right", background: "none", border: "none", color: BRAND.red, cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── TRAJECTORY CANVAS ───────────────────────────────────────────────────────

function TrajectoryCanvas({ positions, color = BRAND.gold, canvasRef: extRef, shape = "circle" }) {
  const intRef = useRef(null);
  const ref = extRef || intRef;
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 600, 600);
    ctx.fillStyle = BRAND.bg; ctx.fillRect(0, 0, 600, 600);
    if (shape === "circle") {
      ctx.beginPath(); ctx.arc(300, 300, 240, 0, Math.PI * 2);
      ctx.strokeStyle = BRAND.gold + "33"; ctx.lineWidth = 2; ctx.stroke();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = BRAND.dim; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(60, 300); ctx.lineTo(540, 300); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(300, 60); ctx.lineTo(300, 540); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(420, 180, 18, 0, Math.PI * 2);
      ctx.fillStyle = BRAND.gold + "22"; ctx.fill(); ctx.strokeStyle = BRAND.gold + "88"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = BRAND.gold; ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillText("P", 420, 184);
    } else if (shape === "ymaze") {
      const arms = [{ angle: -90 }, { angle: 30 }, { angle: 150 }];
      const labels = ["A", "B", "C"];
      const colors = [BRAND.gold, BRAND.green, BRAND.purple];
      arms.forEach(({ angle }, i) => {
        const rad = (angle * Math.PI) / 180;
        ctx.beginPath(); ctx.moveTo(300, 300); ctx.lineTo(300 + Math.cos(rad) * 220, 300 + Math.sin(rad) * 220);
        ctx.strokeStyle = colors[i] + "44"; ctx.lineWidth = 30; ctx.lineCap = "round"; ctx.stroke();
        ctx.fillStyle = colors[i]; ctx.font = "bold 14px monospace"; ctx.textAlign = "center";
        ctx.fillText(labels[i], 300 + Math.cos(rad) * 240, 300 + Math.sin(rad) * 240 + 4);
      });
    } else {
      ctx.strokeStyle = BRAND.gold + "33"; ctx.lineWidth = 2; ctx.strokeRect(40, 40, 520, 520);
      ctx.strokeStyle = BRAND.gold + "55"; ctx.setLineDash([4, 4]); ctx.strokeRect(160, 160, 280, 280); ctx.setLineDash([]);
      ctx.fillStyle = BRAND.gold + "11"; ctx.fillRect(160, 160, 280, 280);
      ctx.fillStyle = BRAND.gold; ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillText("CENTER", 300, 298);
    }
    if (!positions || positions.length < 2) {
      ctx.fillStyle = BRAND.dim; ctx.font = "13px monospace"; ctx.textAlign = "center";
      ctx.fillText("Upload video to see trajectory", 300, 570); return;
    }
    ctx.beginPath(); ctx.moveTo(positions[0].x, positions[0].y);
    for (let i = 1; i < positions.length; i++) ctx.lineTo(positions[i].x, positions[i].y);
    ctx.strokeStyle = color + "cc"; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath(); ctx.arc(positions[0].x, positions[0].y, 6, 0, Math.PI * 2); ctx.fillStyle = BRAND.green; ctx.fill();
    const last = positions[positions.length - 1];
    ctx.beginPath(); ctx.arc(last.x, last.y, 6, 0, Math.PI * 2); ctx.fillStyle = BRAND.red; ctx.fill();
  }, [positions, shape]);
  return <canvas ref={ref} width={600} height={600} style={{ width: "100%", borderRadius: "10px" }} />;
}

// ─── HEATMAP CANVAS ──────────────────────────────────────────────────────────

function HeatmapCanvas({ positions, canvasRef: extRef }) {
  const intRef = useRef(null);
  const ref = extRef || intRef;
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 600, 600); ctx.fillStyle = BRAND.bg; ctx.fillRect(0, 0, 600, 600);
    if (!positions || positions.length === 0) {
      ctx.fillStyle = BRAND.dim; ctx.font = "13px monospace"; ctx.textAlign = "center"; ctx.fillText("No data yet", 300, 300); return;
    }
    const BINS = 40, grid = new Array(BINS).fill(0).map(() => new Array(BINS).fill(0));
    positions.forEach(({ x, y }) => {
      const gx = Math.min(BINS - 1, Math.floor((x / 600) * BINS));
      const gy = Math.min(BINS - 1, Math.floor((y / 600) * BINS));
      if (gx >= 0 && gy >= 0) grid[gy][gx]++;
    });
    const max = Math.max(1, ...grid.flat());
    const cW = 600 / BINS, cH = 600 / BINS;
    grid.forEach((row, gy) => row.forEach((val, gx) => {
      if (!val) return;
      const t = val / max;
      const r = Math.round(50 + t * 205);
      const g = Math.round(t < 0.5 ? t * 2 * 168 : 168 + (t - 0.5) * 2 * 87);
      const b = Math.round(t < 0.5 ? t * 2 * 76 : Math.max(0, 76 - (t - 0.5) * 2 * 76));
      ctx.fillStyle = `rgba(${r},${g},${b},${0.25 + t * 0.75})`;
      ctx.fillRect(gx * cW, gy * cH, cW, cH);
    }));
  }, [positions]);
  return <canvas ref={ref} width={600} height={600} style={{ width: "100%", borderRadius: "10px" }} />;
}

// ─── MWM TAB ─────────────────────────────────────────────────────────────────

function MWMTab() {
  const [sessions, setSessions]     = useState([]);
  const [activeTab, setActiveTab]   = useState("trajectory");
  const [processing, setProcessing] = useState(false);
  const [trials, setTrials]         = useState([]);
  const [form, setForm]             = useState({ trial: "", day: "", latency: "", distance: "", speed: "", quadrant: "Target", probe: false, probeTime: "", probePct: "" });
  const trajRef  = useRef(null); const heatRef = useRef(null);
  const poolRef  = useRef(null); const curveRef = useRef(null); const probeRef = useRef(null);

  const activeSession = sessions[sessions.length - 1];
  const positions     = activeSession?.positions || [];

  const onVideoResult = (data, name) => {
    setSessions(s => [...s, { id: Date.now(), name, ...data }]);
    setForm(f => ({ ...f, trial: String(trials.length + 1), latency: String(data.escape_latency || ""), distance: String(data.distance_m || ""), speed: String(data.avg_speed || "") }));
  };

  const addTrial    = () => { if (!form.latency) return; setTrials(t => [...t, { ...form, id: Date.now() }]); setForm(f => ({ ...f, trial: "", latency: "", distance: "", speed: "", probeTime: "", probePct: "" })); };
  const removeTrial = (id) => setTrials(t => t.filter(x => x.id !== id));

  const latencies  = trials.filter(t => !t.probe).map(t => parseFloat(t.latency) || 0);
  const avgLatency = latencies.length ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1) : (activeSession?.escape_latency ?? "—");
  const probeTrials = trials.filter(t => t.probe);
  const avgProbe    = probeTrials.length ? (probeTrials.reduce((a, b) => a + (parseFloat(b.probePct) || 0), 0) / probeTrials.length).toFixed(1) : "—";
  const byDay = {};
  trials.filter(t => !t.probe).forEach(t => { const d = t.day || "1"; if (!byDay[d]) byDay[d] = []; byDay[d].push(parseFloat(t.latency) || 0); });
  const dayChartData = Object.entries(byDay).map(([d, vals]) => ({ label: `D${d}`, value: vals.reduce((a, b) => a + b, 0) / vals.length }));
  const quadrantTimes = ["Target","Opposite","Left","Right"].map(q => ({ label: q, value: activeSession?.quadrant_pct?.[q] || 0 }));

  const exportCSV = () => { const rows=[["Trial","Day","Latency(s)","Distance(m)","Speed(m/s)","Quadrant","Type","ProbeTime","Target%"]]; trials.forEach(t=>rows.push([t.trial,t.day,t.latency,t.distance,t.speed,t.quadrant,t.probe?"Probe":"Acq",t.probeTime,t.probePct])); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"})); a.download="mwm_data.csv"; a.click(); };

  useEffect(() => {
    const canvas = poolRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); const W=180,H=180;
    ctx.clearRect(0,0,W,H); ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,W,H);
    const cx=W/2,cy=H/2,r=70;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.strokeStyle=BRAND.border; ctx.lineWidth=2; ctx.stroke();
    ctx.strokeStyle=BRAND.dim; ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(cx-r,cy); ctx.lineTo(cx+r,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy-r); ctx.lineTo(cx,cy+r); ctx.stroke(); ctx.setLineDash([]);
    [["Target",0.5,-0.5],["Opp",-0.5,0.5],["Left",-0.5,-0.5],["Right",0.5,0.5]].forEach(([l,ox,oy])=>{
      ctx.fillStyle=BRAND.muted; ctx.font="8px monospace"; ctx.textAlign="center"; ctx.fillText(l,cx+ox*r,cy+oy*r+3);
    });
    ctx.beginPath(); ctx.arc(cx+r*0.5,cy-r*0.5,8,0,Math.PI*2); ctx.fillStyle=BRAND.gold+"33"; ctx.fill(); ctx.strokeStyle=BRAND.gold; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=BRAND.gold; ctx.font="8px monospace"; ctx.textAlign="center"; ctx.fillText("P",cx+r*0.5,cy-r*0.5+3);
  }, []);

  return (
    <div>
      <div style={S.grid3}>
        <StatCard label="Escape Latency" value={avgLatency} unit="s"   color={BRAND.gold}  sub="Time to find platform" />
        <StatCard label="Path Length"    value={activeSession?.distance_m ?? "—"} unit="m" color={BRAND.blue}  sub="Total distance swum" />
        <StatCard label="Swimming Speed" value={activeSession?.avg_speed  ?? "—"} unit="m/s" color={BRAND.green} sub="Average velocity" />
      </div>
      <div style={{ ...S.grid2, marginTop: "16px" }}>
        <StatCard label="Target Quadrant (Probe)" value={avgProbe} unit="%" color={BRAND.purple} sub={`${probeTrials.length} probe trials`} />
        <StatCard label="Sessions Processed" value={sessions.length} color={BRAND.gold} sub="Videos uploaded" />
      </div>
      <hr style={S.divider} />

      {/* Video Upload */}
      <div style={{ ...S.card, marginBottom: "20px", border: `1px solid ${BRAND.gold}44` }}>
        <div style={S.cardTitle}>🎥 Video Upload — Auto Analysis</div>
        <VideoUpload onResult={onVideoResult} endpoint="/process/mwm" processing={processing} setProcessing={setProcessing} color={BRAND.gold} />
        {activeSession && (
          <div style={{ marginTop: "12px", padding: "10px", background: BRAND.surface, borderRadius: "8px", fontSize: "11px" }}>
            <span style={{ color: BRAND.green }}>✅ <strong>{activeSession.name}</strong> — {activeSession.positions?.length} positions tracked</span>
            <span style={{ color: BRAND.muted, marginLeft: "12px" }}>Latency: {activeSession.escape_latency}s · Distance: {activeSession.distance_m}m · Speed: {activeSession.avg_speed}m/s</span>
          </div>
        )}
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {["trajectory","heatmap"].map(t => <button key={t} style={S.tab(activeTab===t)} onClick={()=>setActiveTab(t)}>{t.toUpperCase()}</button>)}
            </div>
            <DownloadBtn onClick={() => downloadCanvas(activeTab==="trajectory"?trajRef:heatRef, `mwm_${activeTab}.png`)} />
          </div>
          {activeTab==="trajectory" ? <TrajectoryCanvas positions={positions} color={BRAND.gold} canvasRef={trajRef} shape="circle" /> : <HeatmapCanvas positions={positions} canvasRef={heatRef} />}
          <div style={{ fontSize: "9px", color: BRAND.muted, marginTop: "6px", display: "flex", gap: "16px" }}><span>🟢 Start</span><span>🔴 End</span><span>⭕ Platform (P)</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={S.cardTitle}>🏊 Pool Diagram</div>
              <DownloadBtn onClick={() => downloadCanvas(poolRef, "mwm_pool.png")} />
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}><canvas ref={poolRef} width={180} height={180} /></div>
          </div>
          {activeSession?.quadrant_pct && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={S.cardTitle}>🎯 Quadrant Time %</div>
                <DownloadBtn onClick={() => downloadDivChart(probeRef, "mwm_quadrant.png")} />
              </div>
              <BarChart data={quadrantTimes} color={BRAND.purple} height={100} chartRef={probeRef} />
            </div>
          )}
        </div>
      </div>

      {dayChartData.length > 1 && (
        <div style={{ ...S.card, marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={S.cardTitle}>📉 Learning Curve</div>
            <DownloadBtn onClick={() => downloadDivChart(curveRef, "mwm_learning_curve.png")} />
          </div>
          <BarChart data={dayChartData} color={BRAND.gold} height={120} chartRef={curveRef} />
        </div>
      )}

      <hr style={S.divider} />
      <div style={S.card}>
        <div style={S.cardTitle}>➕ Manual Trial Entry <span style={{ ...S.badge(BRAND.muted), marginLeft: "8px" }}>Optional</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
          {[["Trial #","trial","1"],["Day","day","1"],["Latency(s)","latency","60"],["Distance(m)","distance","5"],["Speed(m/s)","speed","0.3"]].map(([l,k,p])=>(
            <div key={k}><label style={S.label}>{l}</label><input style={S.input} type="number" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p} /></div>
          ))}
          <div><label style={S.label}>Quadrant</label><select style={S.input} value={form.quadrant} onChange={e=>setForm({...form,quadrant:e.target.value})}>{["Target","Opposite","Left","Right"].map(q=><option key={q}>{q}</option>)}</select></div>
        </div>
        <div style={{ marginTop: "12px", padding: "12px", background: BRAND.surface, borderRadius: "8px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={form.probe} onChange={e=>setForm({...form,probe:e.target.checked})} />
            <span style={{ fontSize: "12px", color: BRAND.gold }}>🔬 Probe Trial</span>
          </label>
          {form.probe && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
              <div><label style={S.label}>Time in Target (s)</label><input style={S.input} type="number" value={form.probeTime} onChange={e=>setForm({...form,probeTime:e.target.value})} /></div>
              <div><label style={S.label}>% Time in Target</label><input style={S.input} type="number" value={form.probePct} onChange={e=>setForm({...form,probePct:e.target.value})} /></div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button style={{ ...S.btn(), flex: 1 }} onClick={addTrial}>Add Trial</button>
          {trials.length > 0 && <button style={S.btnOutline} onClick={exportCSV}>⬇ Export CSV</button>}
        </div>
      </div>
      {trials.length > 0 && (
        <div style={{ ...S.card, marginTop: "16px" }}>
          <div style={S.cardTitle}>📋 Trial Log</div>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead><tr>{["Trial","Day","Latency","Distance","Speed","Quadrant","Type","Probe%",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{trials.map(t=>(
                <tr key={t.id}>
                  <td style={S.td}>{t.trial}</td><td style={S.td}>{t.day}</td>
                  <td style={{...S.td,color:BRAND.gold}}>{t.latency}s</td><td style={S.td}>{t.distance}m</td><td style={S.td}>{t.speed}m/s</td>
                  <td style={S.td}>{t.quadrant}</td>
                  <td style={S.td}><span style={S.badge(t.probe?BRAND.purple:BRAND.green)}>{t.probe?"Probe":"Acq"}</span></td>
                  <td style={{...S.td,color:BRAND.purple}}>{t.probePct?`${t.probePct}%`:"—"}</td>
                  <td style={S.td}><button style={{...S.btnOutline,color:BRAND.red,borderColor:BRAND.red,padding:"2px 8px",fontSize:"10px"}} onClick={()=>removeTrial(t.id)}>✕</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Y-MAZE TAB ──────────────────────────────────────────────────────────────

function YMazeTab() {
  const [sessions, setSessions]     = useState([]);
  const [processing, setProcessing] = useState(false);
  const [manualSessions, setManualSessions] = useState([]);
  const [form, setForm] = useState({ session: "", entries: "", altScore: "", timeA: "", timeB: "", timeC: "" });
  const trajRef  = useRef(null); const heatRef = useRef(null);
  const mazeRef  = useRef(null); const altRef  = useRef(null);
  const [activeTab, setActiveTab] = useState("trajectory");

  const activeSession = sessions[sessions.length - 1];
  const positions     = activeSession?.positions || [];
  const allSessions   = [...sessions, ...manualSessions];
  const getAltColor   = (v) => { const n=parseFloat(v); return n>=60?BRAND.green:n>=40?BRAND.gold:BRAND.red; };
  const avgAlt        = allSessions.length ? (allSessions.reduce((a,b)=>a+(parseFloat(b.alternation_pct||b.altScore)||0),0)/allSessions.length).toFixed(1) : "—";
  const avgEntries    = allSessions.length ? (allSessions.reduce((a,b)=>a+(parseInt(b.total_entries||b.entries)||0),0)/allSessions.length).toFixed(1) : "—";

  const onVideoResult = (data, name) => {
    setSessions(s => [...s, { id: Date.now(), name, ...data }]);
    setForm(f => ({ ...f, session: name, entries: String(data.total_entries||""), altScore: String(data.alternation_pct||""), timeA: String(data.arm_time?.A||""), timeB: String(data.arm_time?.B||""), timeC: String(data.arm_time?.C||"") }));
  };

  const addSession = () => { if (!form.entries) return; setManualSessions(s=>[...s,{...form,id:Date.now()}]); setForm(f=>({...f,session:"",entries:"",altScore:"",timeA:"",timeB:"",timeC:""})); };
  const exportCSV  = () => { const rows=[["Session","Entries","Alternation%","ArmA(s)","ArmB(s)","ArmC(s)"]]; allSessions.forEach(s=>rows.push([s.name||s.session,s.total_entries||s.entries,s.alternation_pct||s.altScore,s.arm_time?.A||s.timeA,s.arm_time?.B||s.timeB,s.arm_time?.C||s.timeC])); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"})); a.download="ymaze_data.csv"; a.click(); };

  useEffect(() => {
    const canvas=mazeRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); ctx.clearRect(0,0,180,180); ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,180,180);
    [{angle:-90,label:"A",color:BRAND.gold},{angle:30,label:"B",color:BRAND.green},{angle:150,label:"C",color:BRAND.purple}].forEach(({angle,label,color})=>{
      const rad=(angle*Math.PI)/180;
      ctx.beginPath(); ctx.moveTo(90,90); ctx.lineTo(90+Math.cos(rad)*60,90+Math.sin(rad)*60);
      ctx.strokeStyle=color; ctx.lineWidth=18; ctx.lineCap="round"; ctx.stroke();
      ctx.fillStyle=color; ctx.font="bold 12px monospace"; ctx.textAlign="center";
      ctx.fillText(label,90+Math.cos(rad)*76,90+Math.sin(rad)*76+4);
    });
    ctx.beginPath(); ctx.arc(90,90,12,0,Math.PI*2); ctx.fillStyle=BRAND.dim; ctx.fill();
  }, []);

  return (
    <div>
      <div style={S.grid3}>
        <StatCard label="Avg Alternation %" value={avgAlt} unit="%" color={avgAlt!=="—"?getAltColor(avgAlt):BRAND.muted} sub="≥60% = intact memory" />
        <StatCard label="Avg Total Entries"  value={avgEntries} color={BRAND.gold} sub="Locomotor activity" />
        <StatCard label="Sessions"           value={allSessions.length} color={BRAND.blue} />
      </div>
      <hr style={S.divider} />

      <div style={{ ...S.card, marginBottom: "20px", border: `1px solid ${BRAND.green}44` }}>
        <div style={S.cardTitle}>🎥 Video Upload — Auto Analysis</div>
        <VideoUpload onResult={onVideoResult} endpoint="/process/ymaze" processing={processing} setProcessing={setProcessing} color={BRAND.green} />
        {activeSession && (
          <div style={{ marginTop: "12px", padding: "10px", background: BRAND.surface, borderRadius: "8px", fontSize: "11px" }}>
            <span style={{ color: BRAND.green }}>✅ <strong>{activeSession.name}</strong> — {activeSession.total_entries} entries · {activeSession.alternation_pct}% alternation</span>
            <div style={{ marginTop: "6px", display: "flex", gap: "12px" }}>
              {["A","B","C"].map((arm,i)=><span key={arm} style={{color:[BRAND.gold,BRAND.green,BRAND.purple][i]}}>Arm {arm}: {activeSession.arm_time?.[arm]?.toFixed(1)}s</span>)}
            </div>
          </div>
        )}
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {["trajectory","heatmap"].map(t=><button key={t} style={S.tab(activeTab===t)} onClick={()=>setActiveTab(t)}>{t.toUpperCase()}</button>)}
            </div>
            <DownloadBtn onClick={() => downloadCanvas(activeTab==="trajectory"?trajRef:heatRef, `ymaze_${activeTab}.png`)} />
          </div>
          {activeTab==="trajectory" ? <TrajectoryCanvas positions={positions} color={BRAND.green} canvasRef={trajRef} shape="ymaze" /> : <HeatmapCanvas positions={positions} canvasRef={heatRef} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={S.cardTitle}>🔀 Y-Maze Diagram</div>
              <DownloadBtn onClick={() => downloadCanvas(mazeRef, "ymaze_diagram.png")} />
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}><canvas ref={mazeRef} width={180} height={180} /></div>
          </div>
          {activeSession?.arm_time && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={S.cardTitle}>⏱ Arm Time</div>
                <DownloadBtn onClick={() => downloadDivChart(altRef, "ymaze_armtime.png")} />
              </div>
              <BarChart data={["A","B","C"].map(arm=>({label:`Arm ${arm}`,value:activeSession.arm_time[arm]||0}))} color={BRAND.green} height={100} chartRef={altRef} />
            </div>
          )}
          {allSessions.length > 0 && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={S.cardTitle}>📊 Alternation % per Session</div>
                <DownloadBtn onClick={() => downloadDivChart(altRef, "ymaze_alternation.png")} />
              </div>
              <BarChart data={allSessions.map((s,i)=>({label:s.name||s.session||`S${i+1}`,value:parseFloat(s.alternation_pct||s.altScore)||0}))} color={BRAND.green} height={100} chartRef={altRef} />
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "center" }}>
                <span style={S.badge(BRAND.green)}>≥60% Normal</span>
                <span style={S.badge(BRAND.gold)}>40–60% Border</span>
                <span style={S.badge(BRAND.red)}>{"<"}40% Impaired</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <hr style={S.divider} />
      <div style={S.card}>
        <div style={S.cardTitle}>➕ Manual Session Entry <span style={{ ...S.badge(BRAND.muted), marginLeft: "8px" }}>Optional</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
          {[["Session ID","session","S1","text"],["Total Entries","entries","20","number"],["Alternation %","altScore","65","number"],["Time Arm A (s)","timeA","100","number"],["Time Arm B (s)","timeB","100","number"],["Time Arm C (s)","timeC","100","number"]].map(([l,k,p,t])=>(
            <div key={k}><label style={S.label}>{l}</label><input style={S.input} type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p} /></div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button style={{ ...S.btn(BRAND.green), flex: 1 }} onClick={addSession}>Add Session</button>
          {allSessions.length > 0 && <button style={S.btnOutline} onClick={exportCSV}>⬇ Export CSV</button>}
        </div>
      </div>
      {allSessions.length > 0 && (
        <div style={{ ...S.card, marginTop: "16px" }}>
          <div style={S.cardTitle}>📋 Session Log</div>
          <table style={S.table}>
            <thead><tr>{["Session","Entries","Alternation%","Arm A(s)","Arm B(s)","Arm C(s)","Source"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{allSessions.map((s,i)=>(
              <tr key={s.id||i}>
                <td style={S.td}>{s.name||s.session}</td>
                <td style={S.td}>{s.total_entries||s.entries}</td>
                <td style={{...S.td,color:getAltColor(s.alternation_pct||s.altScore),fontWeight:"700"}}>{s.alternation_pct||s.altScore}%</td>
                <td style={{...S.td,color:BRAND.gold}}>{s.arm_time?.A||s.timeA||"—"}s</td>
                <td style={{...S.td,color:BRAND.green}}>{s.arm_time?.B||s.timeB||"—"}s</td>
                <td style={{...S.td,color:BRAND.purple}}>{s.arm_time?.C||s.timeC||"—"}s</td>
                <td style={S.td}><span style={S.badge(s.positions?"#00f5c4":BRAND.muted)}>{s.positions?"Video":"Manual"}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── OFT TAB ─────────────────────────────────────────────────────────────────

function OFTTab() {
  const [sessions, setSessions]     = useState([]);
  const [processing, setProcessing] = useState(false);
  const [records, setRecords]       = useState([]);
  const [form, setForm]             = useState({ animal: "", group: "", distance: "", centerTime: "", peripheryTime: "", rearing: "", freezing: "", avgVelocity: "", maxVelocity: "" });
  const trajRef  = useRef(null); const heatRef   = useRef(null);
  const arenaRef = useRef(null); const velRef    = useRef(null);
  const [activeTab, setActiveTab] = useState("trajectory");

  const activeSession = sessions[sessions.length - 1];
  const positions     = activeSession?.positions || [];
  const allRecords    = [...sessions, ...records];

  const getAnxiety = (cT, total) => {
    const pct = total ? (parseFloat(cT)||0)/parseFloat(total)*100 : 0;
    return pct>=30?{label:"Low Anxiety",color:BRAND.green}:pct>=15?{label:"Moderate",color:BRAND.gold}:{label:"High Anxiety",color:BRAND.red};
  };

  const avg = (k1, k2) => allRecords.length ? (allRecords.reduce((a,b)=>a+(parseFloat(b[k1]||b[k2])||0),0)/allRecords.length).toFixed(1) : "—";

  const onVideoResult = (data, name) => {
    setSessions(s => [...s, { id: Date.now(), name, ...data }]);
    setForm(f => ({ ...f, animal: name, distance: String(data.distance_m||""), centerTime: String(data.center_time||""), peripheryTime: String(data.periphery_time||""), rearing: String(data.rearing_events||""), freezing: String(data.freezing_time||""), avgVelocity: String(data.avg_speed||""), maxVelocity: String(data.max_speed||"") }));
  };

  const add    = () => { if (!form.distance) return; setRecords(r=>[...r,{...form,id:Date.now()}]); setForm(f=>({...f,animal:"",distance:"",centerTime:"",peripheryTime:"",rearing:"",freezing:"",avgVelocity:"",maxVelocity:""})); };
  const remove = (id) => setRecords(r=>r.filter(x=>x.id!==id));
  const exportCSV = () => { const rows=[["Animal","Group","Distance(m)","Center(s)","Periphery(s)","Rearing","Freezing(s)","AvgSpeed","MaxSpeed"]]; allRecords.forEach(r=>rows.push([r.animal||r.name,r.group,r.distance_m||r.distance,r.center_time||r.centerTime,r.periphery_time||r.peripheryTime,r.rearing_events||r.rearing,r.freezing_time||r.freezing,r.avg_speed||r.avgVelocity,r.max_speed||r.maxVelocity])); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"})); a.download="oft_data.csv"; a.click(); };

  useEffect(() => {
    const canvas=arenaRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); ctx.clearRect(0,0,180,180); ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,180,180);
    ctx.fillStyle="#0d1428"; ctx.strokeStyle=BRAND.border; ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(10,10,160,160,4); ctx.fill(); ctx.stroke();
    ctx.fillStyle=BRAND.gold+"22"; ctx.strokeStyle=BRAND.gold+"88"; ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.roundRect(46,46,88,88,3); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=BRAND.gold; ctx.font="8px monospace"; ctx.textAlign="center"; ctx.fillText("CENTER",90,93);
    ctx.fillStyle=BRAND.muted; ctx.fillText("PERIPHERY",90,22);
  }, []);

  return (
    <div>
      <div style={S.grid3}>
        <StatCard label="Avg Distance"    value={avg("distance_m","distance")}     unit="m"   color={BRAND.gold}   sub="Locomotor activity" />
        <StatCard label="Avg Center Time" value={avg("center_time","centerTime")}   unit="s"   color={BRAND.green}  sub="Low = high anxiety" />
        <StatCard label="Avg Freezing"    value={avg("freezing_time","freezing")}   unit="s"   color={BRAND.red}    sub="Fear marker" />
      </div>
      <div style={{ ...S.grid3, marginTop: "16px" }}>
        <StatCard label="Avg Rearing"  value={avg("rearing_events","rearing")}   color={BRAND.purple} sub="Exploratory behavior" />
        <StatCard label="Avg Velocity" value={avg("avg_speed","avgVelocity")}     unit="m/s" color={BRAND.blue} />
        <StatCard label="Animals"      value={allRecords.length}                  color={BRAND.gold} />
      </div>
      <hr style={S.divider} />

      <div style={{ ...S.card, marginBottom: "20px", border: `1px solid ${BRAND.blue}44` }}>
        <div style={S.cardTitle}>🎥 Video Upload — Auto Analysis</div>
        <VideoUpload onResult={onVideoResult} endpoint="/process/oft" processing={processing} setProcessing={setProcessing} color={BRAND.blue} />
        {activeSession && (
          <div style={{ marginTop: "12px", padding: "10px", background: BRAND.surface, borderRadius: "8px", fontSize: "11px" }}>
            <span style={{ color: BRAND.green }}>✅ <strong>{activeSession.name}</strong> — {activeSession.total_frames} frames</span>
            <div style={{ marginTop: "6px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <span style={{color:BRAND.gold}}>Distance: {activeSession.distance_m}m</span>
              <span style={{color:BRAND.green}}>Center: {activeSession.center_time}s ({activeSession.center_pct}%)</span>
              <span style={{color:BRAND.blue}}>Periphery: {activeSession.periphery_time}s</span>
              <span style={{color:BRAND.red}}>Freezing: {activeSession.freezing_time}s</span>
              <span style={{color:BRAND.purple}}>Rearing: {activeSession.rearing_events}</span>
            </div>
          </div>
        )}
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {["trajectory","heatmap"].map(t=><button key={t} style={S.tab(activeTab===t)} onClick={()=>setActiveTab(t)}>{t.toUpperCase()}</button>)}
            </div>
            <DownloadBtn onClick={() => downloadCanvas(activeTab==="trajectory"?trajRef:heatRef, `oft_${activeTab}.png`)} />
          </div>
          {activeTab==="trajectory" ? <TrajectoryCanvas positions={positions} color={BRAND.blue} canvasRef={trajRef} shape="square" /> : <HeatmapCanvas positions={positions} canvasRef={heatRef} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={S.cardTitle}>⬜ Arena Diagram</div>
              <DownloadBtn onClick={() => downloadCanvas(arenaRef, "oft_arena.png")} />
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}><canvas ref={arenaRef} width={180} height={180} /></div>
          </div>
          {allRecords.length > 0 && (
            <div style={S.card}>
              <div style={S.cardTitle}>😰 Anxiety Index</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {allRecords.map((r,i)=>{
                  const total=(parseFloat(r.center_time||r.centerTime)||0)+(parseFloat(r.periphery_time||r.peripheryTime)||0);
                  const anxiety=getAnxiety(r.center_time||r.centerTime,total);
                  const pct=total?((parseFloat(r.center_time||r.centerTime)||0)/total*100).toFixed(0):0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: BRAND.text, minWidth: "70px", overflow: "hidden", textOverflow: "ellipsis" }}>{r.animal||r.name||`Animal ${i+1}`}</span>
                      <div style={{ flex: 1, height: "6px", background: BRAND.dim, borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: anxiety.color, borderRadius: "3px", transition: "width 0.5s" }} />
                      </div>
                      <span style={S.badge(anxiety.color)}>{anxiety.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {allRecords.length > 0 && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={S.cardTitle}>💨 Velocity by Animal</div>
                <DownloadBtn onClick={() => downloadDivChart(velRef, "oft_velocity.png")} />
              </div>
              <BarChart data={allRecords.map((r,i)=>({label:r.animal||r.name||`R${i+1}`,value:parseFloat(r.avg_speed||r.avgVelocity)||0}))} color={BRAND.blue} height={100} chartRef={velRef} />
            </div>
          )}
        </div>
      </div>

      <hr style={S.divider} />
      <div style={S.card}>
        <div style={S.cardTitle}>➕ Manual Animal Entry <span style={{ ...S.badge(BRAND.muted), marginLeft: "8px" }}>Optional</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
          {[["Animal ID","animal","Rat-01","text"],["Group","group","Control","text"],["Distance (m)","distance","25","number"],["Center Time (s)","centerTime","60","number"],["Periphery Time (s)","peripheryTime","240","number"],["Rearing Events","rearing","15","number"],["Freezing Time (s)","freezing","10","number"],["Avg Velocity (m/s)","avgVelocity","0.08","number"]].map(([l,k,p,t])=>(
            <div key={k}><label style={S.label}>{l}</label><input style={S.input} type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p} /></div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button style={{ ...S.btn(BRAND.blue), flex: 1 }} onClick={add}>Add Animal</button>
          {allRecords.length > 0 && <button style={S.btnOutline} onClick={exportCSV}>⬇ Export CSV</button>}
        </div>
      </div>
      {allRecords.length > 0 && (
        <div style={{ ...S.card, marginTop: "16px" }}>
          <div style={S.cardTitle}>📋 Animal Log</div>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead><tr>{["Animal","Group","Distance","Center(s)","Periphery(s)","Rearing","Freezing","Avg Vel","Anxiety","Source",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{allRecords.map((r,i)=>{
                const total=(parseFloat(r.center_time||r.centerTime)||0)+(parseFloat(r.periphery_time||r.peripheryTime)||0);
                const anxiety=getAnxiety(r.center_time||r.centerTime,total);
                return (
                  <tr key={r.id||i}>
                    <td style={S.td}>{r.animal||r.name}</td>
                    <td style={S.td}><span style={S.badge(BRAND.blue)}>{r.group||"—"}</span></td>
                    <td style={{...S.td,color:BRAND.gold}}>{r.distance_m||r.distance}m</td>
                    <td style={{...S.td,color:BRAND.green}}>{r.center_time||r.centerTime}s</td>
                    <td style={S.td}>{r.periphery_time||r.peripheryTime}s</td>
                    <td style={{...S.td,color:BRAND.purple}}>{r.rearing_events||r.rearing}</td>
                    <td style={{...S.td,color:BRAND.red}}>{r.freezing_time||r.freezing}s</td>
                    <td style={S.td}>{r.avg_speed||r.avgVelocity}m/s</td>
                    <td style={S.td}><span style={S.badge(anxiety.color)}>{anxiety.label}</span></td>
                    <td style={S.td}><span style={S.badge(r.positions?"#00f5c4":BRAND.muted)}>{r.positions?"Video":"Manual"}</span></td>
                    <td style={S.td}>{!r.positions&&<button style={{...S.btnOutline,color:BRAND.red,borderColor:BRAND.red,padding:"2px 8px",fontSize:"10px"}} onClick={()=>remove(r.id)}>✕</button>}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "mwm",   label: "🏊 Morris Water Maze" },
  { id: "ymaze", label: "🔀 Y-Maze" },
  { id: "oft",   label: "⬜ Open Field Test" },
];

export default function BehavioralSuite() {
  const [tab, setTab] = useState("mwm");
  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: BRAND.goldDim, border: `1px solid ${BRAND.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🧠</div>
          <div><div style={S.logoText}>NeuroTrack Pro</div><div style={S.logoSub}>Behavioral Analysis Suite</div></div>
        </div>
        <div style={S.tabs}>
          {TABS.map(t => <button key={t.id} style={S.tab(tab===t.id)} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
      </div>
      <div style={S.body}>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "20px", fontWeight: "700", color: BRAND.text }}>{TABS.find(t=>t.id===tab)?.label}</div>
          <div style={{ fontSize: "11px", color: BRAND.muted, marginTop: "4px" }}>
            {tab==="mwm"   && "Upload video for auto-tracking — or enter trial data manually"}
            {tab==="ymaze" && "Upload video for auto arm detection — or enter session data manually"}
            {tab==="oft"   && "Upload video for auto zone analysis — or enter animal data manually"}
          </div>
        </div>
        {tab==="mwm"   && <MWMTab />}
        {tab==="ymaze" && <YMazeTab />}
        {tab==="oft"   && <OFTTab />}
      </div>
    </div>
  );
}
