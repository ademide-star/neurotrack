/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useEffect } from "react";
import BehavioralSuite from "./BehavioralSuite";

// ─── BRAND ────────────────────────────────────────────────────────────────────
const BRAND = {
  gold:      "#c9a84c",
  goldLight: "#e8c96a",
  goldDim:   "#c9a84c44",
  bg:        "#070b16",
  surface:   "#0a0e1a",
  panel:     "#0d1428",
  border:    "#1e2a4a",
  text:      "#e2e8f0",
  muted:     "#4a5568",
  dim:       "#2d3748",
  red:       "#ff6b6b",
  green:     "#00f5c4",
};

const API = window.electronAPI
  ? window.electronAPI.getApiUrl()
  : (window.location.hostname === "localhost" ||
     window.location.hostname === "127.0.0.1" ||
     window.location.protocol === "file:")
    ? "http://127.0.0.1:5000"
    : process.env.REACT_APP_API_URL;

const SESSION_COLORS = ["#c9a84c","#6c63ff","#00f5c4","#ff6b6b","#63b3ed","#fc8181","#68d391","#f687b3"];

// ─── LICENSE CONFIG ───────────────────────────────────────────────────────────
const LICENSE_API = "https://your-license-server.onrender.com"; // update after deploy

const FREE_FEATURES = [
  "mwm_basic",
  "trajectory",
  "csv_export",
];

const FREE_LIMITS = {
  max_sessions:     3,
  watermark:        true,
  ymaze:            false,
  oft:              false,
  heatmap:          false,
  probe_trial:      false,
  learning_curve:   false,
  behavioral_suite: false,
};

// Demo key for testing before license server is live
const DEMO_KEY     = ""; // disabled
const DEMO_LICENSE = null;

// ─── LICENSE HOOK ─────────────────────────────────────────────────────────────
function useLicense() {
  const [license,  setLicense]  = useState(null);
  const [features, setFeatures] = useState(FREE_FEATURES);
  const [isLoading,setLoading]  = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("nmt_license");
    if (stored) verifyKey(stored);
    else setLoading(false);
  }, []);

  async function verifyKey(key) {
    // Demo mode
    if (key === DEMO_KEY) {
      setLicense(DEMO_LICENSE);
      setFeatures(DEMO_LICENSE.features);
      setLoading(false);
      return;
    }
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
        localStorage.setItem("nmt_plan",     data.plan);
      } else {
        localStorage.removeItem("nmt_license");
      }
    } catch (e) {
      console.error("[License] Verify error:", e);
    } finally {
      setLoading(false);
    }
  }

  function activateLicense(key, data) {
    localStorage.setItem("nmt_license", key);
    setLicense(data);
    setFeatures(data.features || FREE_FEATURES);
  }

  function clearLicense() {
    localStorage.removeItem("nmt_license");
    localStorage.removeItem("nmt_plan");
    setLicense(null);
    setFeatures(FREE_FEATURES);
  }

  return { license, features, isLoading, verifyKey, activateLicense, clearLicense };
}

// ─── LICENSE GATE ─────────────────────────────────────────────────────────────
function LicenseGate({ feature, license, children, inline = false }) {
  const has = license?.features?.includes(feature) || FREE_FEATURES.includes(feature);
  if (has) return children;

  const descriptions = {
    heatmap:          "Spatial heatmap shows where your animal spent most time — essential for zone analysis.",
    ymaze:            "Y-Maze spontaneous alternation with arm time distribution and alternation %.",
    oft:              "Open Field Test with center/periphery time, rearing, freezing and velocity.",
    probe_trial:      "Probe trial analysis — time in target quadrant and memory index.",
    learning_curve:   "Learning curve chart — escape latency across training days.",
    behavioral_suite: "Full behavioral suite including Y-Maze and Open Field Test.",
    png_export:       "Download high-quality PNG images without watermark.",
    mwm_full:         "Full MWM analysis including probe trial, learning curve and quadrant data.",
  };

  if (inline) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:6, opacity:0.5, cursor:"not-allowed" }}>
        <span style={{ fontSize:10 }}>🔒</span>
        <span style={{ fontSize:9, color:BRAND.muted }}>Pro</span>
      </div>
    );
  }

  return (
    <div style={{
      background: BRAND.panel, border:`1px solid ${BRAND.gold}33`,
      borderRadius:12, padding:"40px 24px", textAlign:"center",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{
        position:"absolute", inset:0,
        background:`linear-gradient(135deg, ${BRAND.gold}08, transparent)`,
      }} />
      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🔒</div>
        <div style={{
          fontSize:20, fontWeight:700, color:BRAND.text, marginBottom:8,
        }}>Pro Feature</div>
        <p style={{ fontSize:11, color:BRAND.muted, marginBottom:20, lineHeight:1.7, maxWidth:320, margin:"0 auto 20px" }}>
          {descriptions[feature] || "Upgrade to NeuroTrack Pro to unlock this feature."}
        </p>
        <a
          href="https://neuromatrixbiosystems.com/pricing"
          target="_blank" rel="noreferrer"
          style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:BRAND.gold, color:BRAND.bg,
            padding:"10px 24px", borderRadius:8,
            fontFamily:"inherit", fontSize:11, fontWeight:700,
            letterSpacing:"0.08em", textDecoration:"none",
          }}
        >Unlock NeuroTrack Pro →</a>
        <div style={{ marginTop:10, fontSize:9, color:BRAND.muted }}>
          From $29 · Lifetime license · Web + Desktop
        </div>
      </div>
    </div>
  );
}

// ─── SESSION LIMIT GATE ───────────────────────────────────────────────────────
function SessionLimitGate({ sessions, license, children }) {
  const over = !license?.valid && sessions.length >= FREE_LIMITS.max_sessions;
  if (!over) return children;
  return (
    <div style={{
      background:BRAND.panel, border:`1px solid ${BRAND.gold}33`,
      borderRadius:12, padding:"20px 16px", textAlign:"center",
    }}>
      <div style={{ fontSize:24, marginBottom:8 }}>📁</div>
      <div style={{ fontSize:13, fontWeight:700, color:BRAND.gold, marginBottom:6 }}>
        Free tier limit reached
      </div>
      <p style={{ fontSize:10, color:BRAND.muted, marginBottom:16, lineHeight:1.7 }}>
        Free accounts are limited to {FREE_LIMITS.max_sessions} sessions.<br />
        Upgrade to upload unlimited videos.
      </p>
      <a href="https://neuromatrixbiosystems.com/pricing" target="_blank" rel="noreferrer"
        style={{
          display:"inline-flex", alignItems:"center", gap:6,
          background:BRAND.gold, color:BRAND.bg,
          padding:"8px 20px", borderRadius:7,
          fontFamily:"inherit", fontSize:10, fontWeight:700, textDecoration:"none",
        }}>Upgrade to Pro →</a>
    </div>
  );
}

// ─── LICENSE BADGE ────────────────────────────────────────────────────────────
function LicenseBadge({ license, onActivate }) {
  const [open,    setOpen]    = useState(false);
  const [keyVal,  setKeyVal]  = useState("");
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const PLAN_COLORS = {
    student:     "#63b3ed",
    researcher:  "#c9a84c",
    institution: "#00f5c4",
  };

  if (license?.valid) {
    return (
      <div style={{
        display:"flex", alignItems:"center", gap:6,
        background: PLAN_COLORS[license.plan]+"22",
        border:`1px solid ${PLAN_COLORS[license.plan]}44`,
        borderRadius:20, padding:"3px 12px",
        fontSize:9, letterSpacing:"0.08em",
        color: PLAN_COLORS[license.plan],
      }}>
        ✓ {license.plan?.toUpperCase()} LICENSE
      </div>
    );
  }

  async function activate() {
    const key = keyVal.trim().toUpperCase();
    if (!key) return;
    setLoading(true); setError(null);

    // Demo key
    if (key === DEMO_KEY) {
      localStorage.setItem("nmt_license", key);
      onActivate(key, DEMO_LICENSE);
      setOpen(false); setKeyVal("");
      setLoading(false); return;
    }

    try {
      const res  = await fetch(`${LICENSE_API}/verify`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.valid) {
        localStorage.setItem("nmt_license", key);
        onActivate(key, data);
        setOpen(false); setKeyVal("");
      } else {
        setError(data.error || "Invalid license key");
      }
    } catch {
      setError("Cannot reach license server — check connection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: BRAND.gold+"15", border:`1px solid ${BRAND.gold}44`,
        color:BRAND.gold, borderRadius:20, padding:"3px 12px",
        fontSize:9, letterSpacing:"0.08em", cursor:"pointer", fontFamily:"inherit",
      }}>🔑 ACTIVATE LICENSE</button>

      {open && (
        <div style={{
          position:"absolute", top:36, right:0, zIndex:200,
          background:BRAND.panel, border:`1px solid ${BRAND.border}`,
          borderRadius:10, padding:16, width:300,
          boxShadow:"0 8px 32px #00000088",
        }}>
          <div style={{ fontSize:11, color:BRAND.text, marginBottom:10, fontWeight:600 }}>
            Enter License Key
          </div>
          <input
            value={keyVal}
            onChange={e => setKeyVal(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && activate()}
            placeholder="NMBT-XXXX-XXXX-XXXX"
            maxLength={19}
            style={{
              width:"100%", background:BRAND.surface,
              border:`1px solid ${error ? BRAND.red : BRAND.border}`,
              borderRadius:6, padding:"8px 12px",
              color:BRAND.text, fontFamily:"inherit",
              fontSize:12, outline:"none",
              letterSpacing:"0.08em", marginBottom:8,
            }}
          />
          {error && (
            <div style={{ fontSize:10, color:BRAND.red, marginBottom:8 }}>⚠ {error}</div>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={activate} disabled={loading} style={{
              flex:1, background:BRAND.gold, color:BRAND.bg,
              border:"none", borderRadius:6, padding:"8px",
              fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            }}>
              {loading ? "Checking..." : "Activate →"}
            </button>
            <button onClick={() => { setOpen(false); setError(null); }} style={{
              background:"none", border:`1px solid ${BRAND.border}`,
              color:BRAND.muted, borderRadius:6, padding:"8px 12px",
              fontSize:10, cursor:"pointer", fontFamily:"inherit",
            }}>Cancel</button>
          </div>
          <div style={{ marginTop:10, textAlign:"center" }}>
            <a href="https://neuromatrixbiosystems.com/pricing"
              target="_blank" rel="noreferrer"
              style={{ fontSize:9, color:BRAND.gold, textDecoration:"none" }}>
              Don't have a license? Get one →
            </a>
          </div>
          <div style={{ marginTop:8, textAlign:"center", fontSize:8, color:BRAND.dim }}>
            Test key: NMBT-DEMO-TEST-2026
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FREE TIER BANNER ─────────────────────────────────────────────────────────
function FreeTierBanner({ license }) {
  const [dismissed, setDismissed] = useState(
    localStorage.getItem("nmt_banner_dismissed") === "true"
  );
  if (license?.valid || dismissed) return null;
  return (
    <div style={{
      background:`linear-gradient(90deg, #c9a84c11, #c9a84c08)`,
      borderBottom:`1px solid ${BRAND.gold}33`,
      padding:"10px 24px", display:"flex",
      alignItems:"center", justifyContent:"space-between", gap:16,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:14 }}>🔬</span>
        <span style={{ fontSize:10, color:BRAND.muted, lineHeight:1.6 }}>
          <strong style={{ color:BRAND.gold }}>Free Tier</strong> — {FREE_LIMITS.max_sessions} sessions max · Trajectory only · Watermarked PNG exports.{" "}
          Upgrade for heatmap, Y-Maze, OFT, probe trial and unlimited sessions.
        </span>
      </div>
      <div style={{ display:"flex", gap:8, flexShrink:0 }}>
        <a href="https://neuromatrixbiosystems.com/pricing"
          target="_blank" rel="noreferrer"
          style={{
            background:BRAND.gold, color:BRAND.bg,
            padding:"5px 14px", borderRadius:6,
            fontSize:9, fontWeight:700, textDecoration:"none",
            letterSpacing:"0.08em", whiteSpace:"nowrap",
          }}>Upgrade from $29 →</a>
        <button onClick={() => {
          setDismissed(true);
          localStorage.setItem("nmt_banner_dismissed","true");
        }} style={{
          background:"none", border:"none",
          color:BRAND.muted, cursor:"pointer", fontSize:14,
        }}>✕</button>
      </div>
    </div>
  );
}

// ─── WATERMARK DOWNLOAD ───────────────────────────────────────────────────────
function downloadCanvasWithLicense(canvasRef, filename, license) {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const isPro = license?.features?.includes("png_export");
  if (isPro) {
    const a = document.createElement("a");
    a.download = filename; a.href = canvas.toDataURL("image/png"); a.click();
    return;
  }

  // Free tier — add watermark
  const off = document.createElement("canvas");
  off.width = canvas.width; off.height = canvas.height;
  const ctx = off.getContext("2d");
  ctx.drawImage(canvas, 0, 0);
  ctx.fillStyle = "rgba(201,168,76,0.3)";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(-Math.PI/6);
  for (let i = -3; i <= 3; i++) {
    ctx.fillText("NeuroTrack Pro — Free Tier", i*200, i*80);
  }
  ctx.restore();
  ctx.fillStyle = "rgba(7,11,22,0.88)";
  ctx.fillRect(0, canvas.height-28, canvas.width, 28);
  ctx.fillStyle = "#c9a84c";
  ctx.font = "10px monospace"; ctx.textAlign = "center";
  ctx.fillText("Free Tier — Upgrade at neuromatrixbiosystems.com", canvas.width/2, canvas.height-10);

  const a = document.createElement("a");
  a.download = filename; a.href = off.toDataURL("image/png"); a.click();
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function computeStats(positions) {
  if (!positions || positions.length < 2)
    return { distance:0, avgSpeed:0, centerPct:0, peripheryPct:0, platformPct:0, frames:0, maxSpeed:0, durationSec:0 };
  let distance = 0, centerCount = 0, platformCount = 0;
  const speeds = [];
  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i-1].x;
    const dy = positions[i].y - positions[i-1].y;
    const d  = Math.sqrt(dx*dx + dy*dy);
    distance += d; speeds.push(d * 0.042 * 30);
  }
  positions.forEach(p => {
    if (Math.sqrt((p.x-300)**2+(p.y-300)**2) < 80)  centerCount++;
    if (Math.sqrt((p.x-420)**2+(p.y-200)**2) < 22)  platformCount++;
  });
  const total = positions.length;
  const distM = (distance*0.042).toFixed(2);
  const durationSec = (total/30).toFixed(1);
  return {
    distance:distM, avgSpeed:(distM/durationSec).toFixed(2),
    maxSpeed:Math.max(...speeds).toFixed(2),
    centerPct:   Math.round((centerCount/total)*100),
    peripheryPct:Math.round((Math.max(0,total-centerCount-platformCount)/total)*100),
    platformPct: Math.round((platformCount/total)*100),
    frames:total, durationSec,
  };
}

// ─── CANVAS ───────────────────────────────────────────────────────────────────
function drawPool(ctx, W=600, H=600) {
  ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,W,H);
  ctx.beginPath(); ctx.arc(W/2,H/2,240,0,Math.PI*2); ctx.strokeStyle="#c9a84c33"; ctx.lineWidth=2; ctx.stroke();
  ctx.beginPath(); ctx.arc(W/2,H/2,80,0,Math.PI*2); ctx.strokeStyle="rgba(201,168,76,0.12)"; ctx.lineWidth=1; ctx.stroke();
  ctx.beginPath(); ctx.arc(420,200,22,0,Math.PI*2); ctx.strokeStyle="rgba(201,168,76,0.4)"; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle="rgba(201,168,76,0.08)"; ctx.fill();
}

function TrajectoryCanvas({ sessions, activeIds, animate, canvasRef:extRef }) {
  const intRef=useRef(null); const canvasRef=extRef||intRef; const rafRef=useRef(null);
  useEffect(() => {
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); let drawn=0;
    const allData=sessions.filter(s=>activeIds.includes(s.id)&&s.positions?.length>0);
    const maxLen=allData.length>0?Math.max(...allData.map(s=>s.positions.length)):0;
    function draw() {
      ctx.clearRect(0,0,600,600); drawPool(ctx);
      if(!allData.length){
        ctx.fillStyle=BRAND.dim; ctx.font="13px monospace"; ctx.textAlign="center";
        ctx.fillText("Upload videos to begin analysis",300,295);
        ctx.fillStyle=BRAND.muted; ctx.font="10px monospace"; ctx.fillText("NeuroMatrix Biosystems",300,318);
        return;
      }
      const limit=animate?Math.min(drawn,maxLen):maxLen;
      allData.forEach((s,si)=>{
        const color=SESSION_COLORS[si%SESSION_COLORS.length];
        const pts=s.positions.slice(0,Math.min(limit,s.positions.length));
        if(pts.length<2) return;
        ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
        for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
        ctx.strokeStyle=color+"cc"; ctx.lineWidth=1.8; ctx.stroke();
        const last=pts[pts.length-1];
        ctx.beginPath(); ctx.arc(last.x,last.y,7,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
        ctx.beginPath(); ctx.arc(last.x,last.y,13,0,Math.PI*2); ctx.strokeStyle=color+"55"; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle=color; ctx.font="9px monospace"; ctx.textAlign="left";
        ctx.fillText(s.name.slice(0,10),last.x+14,last.y+4);
      });
      if(animate&&drawn<maxLen){drawn+=4;rafRef.current=requestAnimationFrame(draw);}
    }
    draw();
    return ()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[sessions,activeIds,animate]);
  return <canvas ref={canvasRef} width={600} height={600} style={{width:"100%",height:"100%",borderRadius:10}}/>;
}

function HeatmapCanvas({ positions, canvasRef:extRef }) {
  const intRef=useRef(null); const canvasRef=extRef||intRef;
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,600,600); drawPool(ctx);
    if(!positions||!positions.length){
      ctx.fillStyle=BRAND.dim; ctx.font="13px monospace"; ctx.textAlign="center"; ctx.fillText("No data yet",300,300); return;
    }
    const BINS=40; const grid=new Array(BINS).fill(0).map(()=>new Array(BINS).fill(0));
    positions.forEach(({x,y})=>{
      const gx=Math.min(BINS-1,Math.floor((x/600)*BINS));
      const gy=Math.min(BINS-1,Math.floor((y/600)*BINS));
      if(gx>=0&&gy>=0) grid[gy][gx]++;
    });
    const max=Math.max(1,...grid.flat()); const cW=600/BINS,cH=600/BINS;
    grid.forEach((row,gy)=>row.forEach((val,gx)=>{
      if(!val) return;
      const t=val/max;
      const r=Math.round(50+t*205);
      const g=Math.round(t<0.5?t*2*168:168+(t-0.5)*2*87);
      const b=Math.round(t<0.5?t*2*76:Math.max(0,76-(t-0.5)*2*76));
      ctx.fillStyle=`rgba(${r},${g},${b},${0.25+t*0.75})`; ctx.fillRect(gx*cW,gy*cH,cW,cH);
    }));
    ctx.beginPath(); ctx.arc(300,300,240,0,Math.PI*2); ctx.strokeStyle="#c9a84c33"; ctx.lineWidth=2; ctx.stroke();
  },[positions]);
  return <canvas ref={canvasRef} width={600} height={600} style={{width:"100%",height:"100%",borderRadius:10}}/>;
}

function SpeedGraph({ sessions, activeIds }) {
  const canvasRef=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H); ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,W,H);
    const active=sessions.filter(s=>activeIds.includes(s.id)&&s.positions?.length>1);
    if(!active.length){ctx.fillStyle=BRAND.dim;ctx.font="11px monospace";ctx.textAlign="center";ctx.fillText("No data",W/2,H/2);return;}
    for(let i=0;i<=4;i++){const y=20+(i/4)*(H-40);ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(W-10,y);ctx.strokeStyle=BRAND.border;ctx.lineWidth=1;ctx.stroke();}
    active.forEach((s,si)=>{
      const color=SESSION_COLORS[si%SESSION_COLORS.length];
      const speeds=[];
      for(let i=1;i<s.positions.length;i++){const dx=s.positions[i].x-s.positions[i-1].x;const dy=s.positions[i].y-s.positions[i-1].y;speeds.push(Math.sqrt(dx*dx+dy*dy)*0.042*30);}
      const smooth=speeds.map((_,i)=>{const w=speeds.slice(Math.max(0,i-5),i+6);return w.reduce((a,b)=>a+b,0)/w.length;});
      const maxS=Math.max(...smooth,1);
      ctx.beginPath();
      smooth.forEach((v,i)=>{const x=40+(i/smooth.length)*(W-50);const y=20+(1-v/maxS)*(H-40);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
      ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();
    });
    ctx.fillStyle=BRAND.muted;ctx.font="9px monospace";ctx.textAlign="left";ctx.fillText("Speed (m/s)",4,14);
    ctx.textAlign="center";ctx.fillText("Frames",W/2,H-2);
  },[sessions,activeIds]);
  return <canvas ref={canvasRef} width={540} height={160} style={{width:"100%",borderRadius:8}}/>;
}

function DistanceBar({ sessions, activeIds }) {
  const canvasRef=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H); ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,W,H);
    const data=sessions.filter(s=>s.positions?.length>1).map((s,i)=>({name:s.name,dist:parseFloat(computeStats(s.positions).distance),id:s.id,color:SESSION_COLORS[i%SESSION_COLORS.length]}));
    if(!data.length){ctx.fillStyle=BRAND.dim;ctx.font="11px monospace";ctx.textAlign="center";ctx.fillText("No sessions",W/2,H/2);return;}
    const maxD=Math.max(...data.map(d=>d.dist),1); const bW=Math.min(55,(W-60)/data.length-8);
    data.forEach((d,i)=>{
      const isActive=activeIds.includes(d.id);
      const bH=(d.dist/maxD)*(H-55); const x=30+i*((W-40)/data.length)+((W-40)/data.length-bW)/2; const y=H-30-bH;
      ctx.fillStyle=isActive?d.color+"cc":d.color+"33"; ctx.fillRect(x,y,bW,bH);
      ctx.fillStyle=isActive?d.color:d.color+"77"; ctx.font="9px monospace"; ctx.textAlign="center";
      ctx.fillText(d.dist+"m",x+bW/2,y-4); ctx.fillStyle=BRAND.muted; ctx.fillText(d.name.slice(0,8),x+bW/2,H-10);
    });
    ctx.fillStyle=BRAND.muted;ctx.font="9px monospace";ctx.textAlign="left";ctx.fillText("Distance (m)",2,12);
  },[sessions,activeIds]);
  return <canvas ref={canvasRef} width={540} height={160} style={{width:"100%",borderRadius:8}}/>;
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, color }) {
  return (
    <div style={{background:`linear-gradient(135deg,${BRAND.panel},#111827)`,border:`1px solid ${color}22`,borderLeft:`3px solid ${color}`,borderRadius:10,padding:"13px 16px",display:"flex",flexDirection:"column",gap:3}}>
      <span style={{color:BRAND.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1.5}}>{label}</span>
      <div style={{display:"flex",alignItems:"baseline",gap:4}}>
        <span style={{color,fontSize:22,fontWeight:700}}>{value??"—"}</span>
        {unit&&<span style={{color:BRAND.muted,fontSize:11}}>{unit}</span>}
      </div>
    </div>
  );
}

function DropZone({ onFiles, processing }) {
  const inputRef=useRef(null); const [dragging,setDragging]=useState(false);
  const handle=files=>{const valid=Array.from(files).filter(f=>f.type.startsWith("video/")||f.name.endsWith(".csv")||f.name.endsWith(".mp4"));if(valid.length)onFiles(valid);};
  return (
    <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
      onDrop={e=>{e.preventDefault();setDragging(false);handle(e.dataTransfer.files);}}
      onClick={()=>!processing&&inputRef.current.click()}
      style={{border:`2px dashed ${dragging?BRAND.gold:BRAND.border}`,borderRadius:12,padding:"22px 16px",textAlign:"center",cursor:processing?"wait":"pointer",transition:"all 0.25s",background:dragging?"#c9a84c08":"transparent"}}>
      <input ref={inputRef} type="file" accept="video/*,.csv,.mp4" multiple style={{display:"none"}} onChange={e=>handle(e.target.files)}/>
      <div style={{fontSize:26,marginBottom:6}}>{processing?"⏳":"📂"}</div>
      <div style={{fontSize:11,color:BRAND.gold,marginBottom:3}}>{processing?"Processing…":"Drop videos or CSVs here"}</div>
      <div style={{fontSize:9,color:BRAND.dim}}>MP4 · AVI · CSV · Multiple files OK</div>
    </div>
  );
}

function GoldDivider() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px"}}>
      <div style={{flex:1,height:1,background:`linear-gradient(90deg,transparent,${BRAND.gold}44)`}}/>
      <span style={{fontSize:7,color:BRAND.gold+"66",letterSpacing:3}}>✦</span>
      <div style={{flex:1,height:1,background:`linear-gradient(90deg,${BRAND.gold}44,transparent)`}}/>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function NeuroMatrixApp() {
  const [sessions,       setSessions]       = useState([]);
  const [activeIds,      setActiveIds]      = useState([]);
  const [processing,     setProcessing]     = useState(false);
  const [processingName, setProcessingName] = useState("");
  const [activeTab,      setActiveTab]      = useState("Trajectory");
  const [animating,      setAnimating]      = useState(false);
  const [error,          setError]          = useState(null);
  const [queue,          setQueue]          = useState([]);
  const [page,           setPage]           = useState("mwm");

  // ── LICENSE ──
  const { license, features, activateLicense } = useLicense();

  const trajRef = useRef(null);
  const heatRef = useRef(null);

  const combinedPositions = sessions.filter(s=>activeIds.includes(s.id)).flatMap(s=>s.positions||[]);
  const activeSession     = sessions.find(s=>s.id===activeIds[activeIds.length-1]);
  const stats             = computeStats(activeSession?.positions);

  // ── Queue processor ──
  useEffect(()=>{
    if(processing||queue.length===0) return;
    const file=queue[0]; setQueue(q=>q.slice(1));
    (async()=>{
      setProcessing(true); setProcessingName(file.name); setError(null);
      try {
        let positions=[];
        if(file.name.endsWith(".csv")){
          const text=await file.text();
          positions=text.trim().split("\n").slice(1).map(l=>{const[x,y]=l.split(",");return{x:parseFloat(x),y:parseFloat(y)};}).filter(p=>!isNaN(p.x)&&!isNaN(p.y));
        } else {
          const fd=new FormData(); fd.append("video",file);
          const res=await fetch(`${API}/process`,{method:"POST",body:fd});
          if(!res.ok) throw new Error(`Server error ${res.status}`);
          positions=(await res.json()).positions;
        }
        const id=`S${Date.now()}`;
        setSessions(prev=>[...prev,{id,name:file.name.replace(/\.[^/.]+$/,""),file:file.name,date:new Date().toISOString().split("T")[0],positions,status:"complete"}]);
        setActiveIds(prev=>[...prev,id]);
      } catch(err){
        setError(err.message.includes("fetch")?"⚠ Cannot reach server — is server.py running on :5000?":err.message);
      } finally{setProcessing(false);setProcessingName("");}
    })();
  },[queue,processing]);

  const handleFiles   = files=>setQueue(q=>[...q,...files]);
  const toggleId      = id=>setActiveIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const removeSession = id=>{setSessions(prev=>prev.filter(s=>s.id!==id));setActiveIds(prev=>prev.filter(x=>x!==id));};
  const exportCSV     = ()=>{
    const active=sessions.filter(s=>activeIds.includes(s.id)); if(!active.length) return;
    const rows=["Session,Frame,X,Y"];
    active.forEach(s=>s.positions.forEach((p,i)=>rows.push(`${s.name},${i},${p.x},${p.y}`)));
    const blob=new Blob([rows.join("\n")],{type:"text/csv"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a");
    a.href=url; a.download="neuromatrix_export.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const GLOBAL_STYLE=`
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-track{background:${BRAND.bg};}
    ::-webkit-scrollbar-thumb{background:${BRAND.gold}44;border-radius:2px;}
    button{font-family:inherit;transition:all 0.2s;}
    button:hover{opacity:0.8;}
  `;

  const NAV_PAGES=[
    {id:"mwm",        label:"🏊 MWM Tracker"},
    {id:"behavioral", label:`🧪 Behavioral Suite${!features.includes("mwm_full")?" 🔒":""}`},
  ];

  // ── SHARED HEADER ──
  const sharedHeader=(
    <header style={{background:`linear-gradient(90deg,${BRAND.bg} 0%,${BRAND.surface} 50%,${BRAND.bg} 100%)`,borderBottom:`1px solid ${BRAND.gold}33`,padding:"0 24px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:`0 1px 20px ${BRAND.gold}11`}}>
      {/* Logo */}
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <img src="/logo.png" alt="NeuroMatrix" style={{height:40,width:40,objectFit:"contain",borderRadius:8}} onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}/>
        <div style={{display:"none",width:40,height:40,borderRadius:8,background:`linear-gradient(135deg,${BRAND.gold}44,${BRAND.gold}22)`,border:`1px solid ${BRAND.gold}44`,alignItems:"center",justifyContent:"center",fontSize:18}}>🧠</div>
        <div style={{display:"flex",flexDirection:"column",gap:1}}>
          <span style={{fontSize:14,fontWeight:700,letterSpacing:2,color:BRAND.gold}}>NEURO<span style={{color:BRAND.text}}>MATRIX</span></span>
          <span style={{fontSize:7,color:BRAND.muted,letterSpacing:4,textTransform:"uppercase"}}>Biosystems</span>
        </div>
        <div style={{width:1,height:28,background:BRAND.border,margin:"0 4px"}}/>
        <span style={{fontSize:9,color:BRAND.muted,letterSpacing:1}}>NeuroTrack Pro</span>
      </div>

      {/* Page nav */}
      <div style={{display:"flex",gap:"4px",background:BRAND.surface,padding:"4px",borderRadius:"10px",border:`1px solid ${BRAND.border}`}}>
        {NAV_PAGES.map(p=>(
          <button key={p.id} onClick={()=>{
            if(p.id==="behavioral"&&!features.includes("mwm_full")){
              window.open("https://neuromatrixbiosystems.com/pricing","_blank"); return;
            }
            setPage(p.id);
          }} style={{padding:"6px 18px",borderRadius:"7px",border:"none",cursor:"pointer",fontSize:"11px",fontFamily:"inherit",fontWeight:"700",letterSpacing:"0.05em",transition:"all 0.2s",background:page===p.id?BRAND.gold:"transparent",color:page===p.id?BRAND.bg:BRAND.muted}}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      {page==="mwm"?(
        <div style={{display:"flex",gap:6}}>
          {[
            ["▶ ANIMATE",    ()=>setAnimating(a=>!a),                                                                        animating?"#ff6b6b":BRAND.gold],
            ["⬇ TRAJECTORY", ()=>downloadCanvasWithLicense(trajRef,"neuromatrix_trajectory.png",license),                   "#6c63ff"],
            ["⬇ HEATMAP",    ()=>features.includes("heatmap")&&downloadCanvasWithLicense(heatRef,"neuromatrix_heatmap.png",license), "#00f5c4"],
            ["⬇ CSV",        exportCSV,                                                                                      "#68d391"],
          ].map(([label,fn,color])=>(
            <button key={label} onClick={fn} style={{background:color+"15",border:`1px solid ${color}44`,color,padding:"5px 12px",borderRadius:6,cursor:"pointer",fontSize:9,letterSpacing:1}}>{label}</button>
          ))}
        </div>
      ):<div/>}

      {/* Status + License Badge */}
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <LicenseBadge license={license} onActivate={activateLicense}/>
        {processing&&<span style={{fontSize:9,color:BRAND.gold,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>⏳ {processingName}</span>}
        {queue.length>0&&<span style={{fontSize:9,color:"#6c63ff"}}>{queue.length} queued</span>}
        <span style={{background:processing?BRAND.gold+"22":BRAND.gold+"11",border:`1px solid ${processing?BRAND.gold+"66":BRAND.gold+"33"}`,color:BRAND.gold,borderRadius:20,padding:"3px 10px",fontSize:9,letterSpacing:1}}>
          {processing?"PROCESSING":"READY"}
        </span>
      </div>
    </header>
  );

  // ── BEHAVIORAL SUITE PAGE ──
  if(page==="behavioral"){
    return(
      <div style={{minHeight:"100vh",background:BRAND.bg,fontFamily:"'Space Mono','Courier New',monospace",color:BRAND.text,display:"flex",flexDirection:"column"}}>
        <style>{GLOBAL_STYLE}</style>
        {sharedHeader}
        <FreeTierBanner license={license}/>
        <BehavioralSuite/>
      </div>
    );
  }

  // ── MWM PAGE ──
  return(
    <div style={{minHeight:"100vh",background:BRAND.bg,fontFamily:"'Space Mono','Courier New',monospace",color:BRAND.text,display:"flex",flexDirection:"column"}}>
      <style>{GLOBAL_STYLE}</style>
      {sharedHeader}
      <FreeTierBanner license={license}/>

      <div style={{display:"flex",flex:1}}>
        {/* Sidebar */}
        <aside style={{width:234,background:BRAND.surface,borderRight:`1px solid ${BRAND.gold}22`,padding:"16px 0",display:"flex",flexDirection:"column",overflowY:"auto"}}>
          <div style={{padding:"0 14px 14px"}}>
            <SessionLimitGate sessions={sessions} license={license}>
              <DropZone onFiles={handleFiles} processing={processing}/>
            </SessionLimitGate>
          </div>

          {error&&(
            <div style={{margin:"0 12px 12px",background:"#ff6b6b11",border:"1px solid #ff6b6b33",borderRadius:8,padding:"9px 12px",fontSize:9,color:"#ff6b6b",lineHeight:1.6}}>
              ⚠ {error}
              <button onClick={()=>setError(null)} style={{float:"right",background:"none",border:"none",color:"#ff6b6b",cursor:"pointer",fontSize:12}}>✕</button>
            </div>
          )}

          <GoldDivider/>
          <div style={{padding:"4px 14px 10px",fontSize:9,color:BRAND.gold+"99",letterSpacing:2,textTransform:"uppercase"}}>
            Sessions ({sessions.length}{!license?.valid?` / ${FREE_LIMITS.max_sessions}`:""})
          </div>

          {sessions.length===0&&(
            <div style={{padding:"20px 14px",fontSize:10,color:BRAND.dim,textAlign:"center",lineHeight:2}}>
              Upload a video or CSV<br/>to start analysis
            </div>
          )}

          {sessions.map((s,i)=>{
            const color=SESSION_COLORS[i%SESSION_COLORS.length]; const isActive=activeIds.includes(s.id); const st=computeStats(s.positions);
            return(
              <div key={s.id} style={{borderLeft:`2px solid ${isActive?color:"transparent"}`,background:isActive?BRAND.panel:"transparent",padding:"9px 12px",transition:"all 0.2s",borderBottom:`1px solid ${BRAND.panel}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <button onClick={()=>toggleId(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:isActive?color:BRAND.muted,fontSize:10,display:"flex",alignItems:"center",gap:6,padding:0,maxWidth:170}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:isActive?color:BRAND.dim,flexShrink:0}}/>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                  </button>
                  <button onClick={()=>removeSession(s.id)} style={{background:"none",border:"none",color:BRAND.dim,cursor:"pointer",fontSize:11,padding:"0 2px",flexShrink:0}}>✕</button>
                </div>
                <div style={{fontSize:9,color:BRAND.muted,paddingLeft:13}}>{st.frames} frames · {st.distance}m · {st.avgSpeed}m/s</div>
              </div>
            );
          })}

          <div style={{flex:1}}/><GoldDivider/>
          <div style={{padding:"12px 14px",textAlign:"center"}}>
            <img src="/logo.png" alt="" style={{height:32,objectFit:"contain",marginBottom:6,opacity:0.6}} onError={e=>e.target.style.display="none"}/>
            <div style={{fontSize:9,color:BRAND.gold+"88",letterSpacing:2,marginBottom:2}}>NEUROMATRIX</div>
            <div style={{fontSize:7,color:BRAND.muted,letterSpacing:3,marginBottom:6}}>BIOSYSTEMS</div>
            <div style={{fontSize:7,color:BRAND.dim,lineHeight:1.8}}>NeuroTrack Pro v2.1<br/>Flask · OpenCV · YOLOv8<br/>© 2026 NeuroMatrix Biosystems</div>
          </div>
        </aside>

        {/* Main */}
        <main style={{flex:1,padding:"20px 24px",overflow:"auto",display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <h1 style={{fontSize:18,fontWeight:700,letterSpacing:1,color:BRAND.text}}>Behavioral <span style={{color:BRAND.gold}}>Analysis</span></h1>
              <p style={{fontSize:9,color:BRAND.muted,marginTop:3,letterSpacing:1}}>MORRIS WATER MAZE · SPATIAL MEMORY · LOCOMOTION TRACKING</p>
            </div>
            <div style={{fontSize:9,color:BRAND.dim,textAlign:"right"}}>{new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</div>
          </div>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
            <StatCard label="Active Sessions" value={activeIds.length}                           color={BRAND.gold}/>
            <StatCard label="Distance"        value={activeSession?stats.distance:"—"}    unit="m"   color="#6c63ff"/>
            <StatCard label="Avg Speed"       value={activeSession?stats.avgSpeed:"—"}    unit="m/s" color="#00f5c4"/>
            <StatCard label="Max Speed"       value={activeSession?stats.maxSpeed:"—"}    unit="m/s" color="#fc8181"/>
            <StatCard label="Duration"        value={activeSession?stats.durationSec:"—"} unit="sec" color="#68d391"/>
          </div>

          {/* Overlay pills */}
          {sessions.length>0&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:9,color:BRAND.muted,letterSpacing:1.5}}>OVERLAY:</span>
              {sessions.map((s,i)=>{const color=SESSION_COLORS[i%SESSION_COLORS.length];const isActive=activeIds.includes(s.id);return(
                <button key={s.id} onClick={()=>toggleId(s.id)} style={{background:isActive?color+"22":"transparent",border:`1px solid ${isActive?color+"66":BRAND.border}`,color:isActive?color:BRAND.muted,borderRadius:20,padding:"4px 10px",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:isActive?color:BRAND.dim}}/>
                  {s.name.length>12?s.name.slice(0,11)+"…":s.name}
                </button>
              );})}
              <button onClick={()=>setActiveIds(sessions.map(s=>s.id))} style={{background:"none",border:`1px solid ${BRAND.border}`,color:BRAND.muted,borderRadius:20,padding:"4px 10px",fontSize:9,cursor:"pointer"}}>All</button>
              <button onClick={()=>setActiveIds([])} style={{background:"none",border:`1px solid ${BRAND.border}`,color:BRAND.muted,borderRadius:20,padding:"4px 10px",fontSize:9,cursor:"pointer"}}>None</button>
            </div>
          )}

          {/* Main grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 330px",gap:16}}>

            {/* Canvas panel */}
            <div style={{background:BRAND.surface,border:`1px solid ${BRAND.gold}22`,borderRadius:14,overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:`1px solid ${BRAND.gold}22`}}>
                {["Trajectory","Heatmap"].map(t=>(
                  <button key={t} onClick={()=>{
                    if(t==="Heatmap"&&!features.includes("heatmap")) return;
                    setActiveTab(t);
                  }} style={{
                    background:"none",border:"none",
                    borderBottom:activeTab===t?`2px solid ${BRAND.gold}`:"2px solid transparent",
                    color:activeTab===t?BRAND.gold:BRAND.muted,
                    padding:"10px 18px",cursor:t==="Heatmap"&&!features.includes("heatmap")?"not-allowed":"pointer",
                    fontSize:10,letterSpacing:1,
                    opacity:t==="Heatmap"&&!features.includes("heatmap")?0.45:1,
                  }}>
                    {t.toUpperCase()}{t==="Heatmap"&&!features.includes("heatmap")&&" 🔒"}
                  </button>
                ))}
                <div style={{flex:1}}/>
                <button
                  onClick={()=>activeTab==="Trajectory"
                    ?downloadCanvasWithLicense(trajRef,"neuromatrix_trajectory.png",license)
                    :features.includes("heatmap")&&downloadCanvasWithLicense(heatRef,"neuromatrix_heatmap.png",license)}
                  style={{background:BRAND.gold+"11",border:`1px solid ${BRAND.gold}33`,color:BRAND.gold,margin:"7px 12px",borderRadius:6,padding:"4px 10px",fontSize:9,cursor:"pointer"}}>
                  ⬇ Download PNG
                </button>
              </div>
              <div style={{padding:14,aspectRatio:"1",maxHeight:520}}>
                {activeTab==="Trajectory"
                  ?<TrajectoryCanvas sessions={sessions} activeIds={activeIds} animate={animating} canvasRef={trajRef}/>
                  :<LicenseGate feature="heatmap" license={license}>
                      <HeatmapCanvas positions={combinedPositions} canvasRef={heatRef}/>
                    </LicenseGate>
                }
              </div>
            </div>

            {/* Right column */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{background:BRAND.surface,border:`1px solid ${BRAND.gold}22`,borderRadius:14,padding:14}}>
                <div style={{fontSize:9,color:BRAND.gold+"99",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Speed Over Time</div>
                <SpeedGraph sessions={sessions} activeIds={activeIds}/>
              </div>
              <div style={{background:BRAND.surface,border:`1px solid ${BRAND.gold}22`,borderRadius:14,padding:14}}>
                <div style={{fontSize:9,color:BRAND.gold+"99",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Distance Comparison</div>
                <DistanceBar sessions={sessions} activeIds={activeIds}/>
              </div>
              <div style={{background:BRAND.surface,border:`1px solid ${BRAND.gold}22`,borderRadius:14,padding:14}}>
                <div style={{fontSize:9,color:BRAND.gold+"99",letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Zone Distribution</div>
                {[["Center",stats.centerPct,BRAND.gold],["Periphery",stats.peripheryPct,"#6c63ff"],["Platform",stats.platformPct,"#00f5c4"]].map(([zone,pct,color])=>(
                  <div key={zone} style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
                    <span style={{fontSize:9,color:BRAND.muted,width:60}}>{zone}</span>
                    <div style={{flex:1,background:"#111827",borderRadius:3,height:5,overflow:"hidden"}}>
                      <div style={{width:`${pct||0}%`,background:color,height:"100%",borderRadius:3,transition:"width 0.8s ease"}}/>
                    </div>
                    <span style={{fontSize:9,color,width:28,textAlign:"right"}}>{pct||0}%</span>
                  </div>
                ))}
              </div>
              <div style={{background:BRAND.surface,border:`1px solid ${BRAND.gold}22`,borderRadius:14,padding:14,flex:1}}>
                <div style={{fontSize:9,color:BRAND.gold+"99",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Session Summary</div>
                {sessions.length===0
                  ?<div style={{fontSize:10,color:BRAND.dim,textAlign:"center",padding:"16px 0"}}>No sessions loaded</div>
                  :sessions.map((s,i)=>{
                    const color=SESSION_COLORS[i%SESSION_COLORS.length];const isActive=activeIds.includes(s.id);const st=computeStats(s.positions);
                    return(
                      <div key={s.id} onClick={()=>toggleId(s.id)} style={{padding:"7px 0",borderBottom:`1px solid ${BRAND.panel}`,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <span style={{width:6,height:6,borderRadius:"50%",background:isActive?color:BRAND.dim,flexShrink:0}}/>
                          <span style={{fontSize:10,color:isActive?BRAND.text:BRAND.muted,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <span style={{fontSize:9,color:BRAND.muted}}>{st.durationSec}s</span>
                          <span style={{fontSize:9,color,fontFamily:"monospace"}}>{st.distance}m</span>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{borderTop:`1px solid ${BRAND.gold}22`,paddingTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:8,color:BRAND.dim}}>© 2026 NeuroMatrix Biosystems · NeuroTrack Pro v2.1</span>
            <span style={{fontSize:8,color:BRAND.dim}}>Morris Water Maze Analysis Platform</span>
            <span style={{fontSize:8,color:BRAND.dim}}>Powered by OpenCV · YOLOv8 · Flask</span>
          </div>
        </main>
      </div>
    </div>
  );
}
