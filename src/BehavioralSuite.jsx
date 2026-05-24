/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useEffect } from "react";

const BRAND = {
  gold: "#c9a84c", goldLight: "#e8c96a", goldDim: "#c9a84c33",
  bg: "#070b16", surface: "#0a0e1a", panel: "#0d1428",
  border: "#1e2a4a", text: "#e2e8f0", muted: "#4a5568", dim: "#2d3748",
  green: "#00f5c4", purple: "#6c63ff", red: "#ff6b6b", blue: "#63b3ed", orange: "#f6ad55",
};

const API = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
  ? "http://127.0.0.1:5000" : "";  // empty = same origin on Render

const S = {
  app: { background: BRAND.bg, color: BRAND.text, fontFamily: "'IBM Plex Mono', monospace", minHeight: "100vh" },
  header: { background: `linear-gradient(180deg, #0d1428 0%, ${BRAND.bg} 100%)`, borderBottom: `1px solid ${BRAND.border}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logoText: { fontSize: "17px", fontWeight: "700", color: BRAND.gold, letterSpacing: "0.05em" },
  logoSub: { fontSize: "10px", color: BRAND.muted, letterSpacing: "0.15em", textTransform: "uppercase" },
  tabs: { display: "flex", gap: "3px", background: BRAND.surface, padding: "4px", borderRadius: "10px", border: `1px solid ${BRAND.border}`, flexWrap: "wrap" },
  tab: (a, c=BRAND.gold) => ({ padding: "7px 16px", borderRadius: "7px", border: "none", cursor: "pointer", fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: "600", transition: "all 0.2s", background: a ? c : "transparent", color: a ? BRAND.bg : BRAND.muted }),
  body: { padding: "20px 32px", maxWidth: "1400px", margin: "0 auto" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" },
  grid4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" },
  card: { background: BRAND.panel, border: `1px solid ${BRAND.border}`, borderRadius: "12px", padding: "18px" },
  cardTitle: { fontSize: "10px", fontWeight: "700", color: BRAND.gold, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" },
  label: { fontSize: "10px", color: BRAND.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "5px", display: "block" },
  input: { width: "100%", background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: "6px", padding: "8px 12px", color: BRAND.text, fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", outline: "none", boxSizing: "border-box" },
  btn: (c=BRAND.gold) => ({ background: c, color: c === BRAND.gold ? BRAND.bg : "#fff", border: "none", borderRadius: "7px", padding: "9px 18px", fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }),
  btnO: (c=BRAND.gold) => ({ background: "transparent", color: c, border: `1px solid ${c}`, borderRadius: "7px", padding: "6px 14px", fontSize: "10px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: "600", cursor: "pointer" }),
  metric: { background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: "8px", padding: "12px", textAlign: "center" },
  mVal: (c=BRAND.gold) => ({ fontSize: "24px", fontWeight: "700", color: c, lineHeight: 1, marginBottom: "4px" }),
  mLab: { fontSize: "9px", color: BRAND.muted, letterSpacing: "0.1em", textTransform: "uppercase" },
  badge: (c) => ({ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: "700", background: c+"22", color: c, letterSpacing: "0.08em", textTransform: "uppercase" }),
  table: { width: "100%", borderCollapse: "collapse", fontSize: "11px" },
  th: { padding: "8px 12px", textAlign: "left", fontSize: "9px", color: BRAND.muted, letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `1px solid ${BRAND.border}` },
  td: { padding: "8px 12px", borderBottom: `1px solid ${BRAND.dim}22`, color: BRAND.text },
  divider: { border: "none", borderTop: `1px solid ${BRAND.border}`, margin: "18px 0" },
};

function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename; a.click();
}

function downloadCanvas(ref, filename) {
  const c = ref?.current; if (!c) return;
  const a = document.createElement("a"); a.download = filename; a.href = c.toDataURL("image/png"); a.click();
}

function StatCard({ label, value, unit="", color=BRAND.gold, sub }) {
  return (
    <div style={S.metric}>
      <div style={S.mVal(color)}>{value??'—'}<span style={{fontSize:"13px",marginLeft:"3px"}}>{unit}</span></div>
      <div style={S.mLab}>{label}</div>
      {sub && <div style={{fontSize:"9px",color:BRAND.muted,marginTop:"2px"}}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, color=BRAND.gold, height=80 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:"5px",height}}>
      {data.map((d,i) => (
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
          <div style={{fontSize:"9px",color:BRAND.muted}}>{Number(d.value).toFixed(1)}</div>
          <div style={{width:"100%",height:`${(d.value/max)*(height-22)}px`,background:`linear-gradient(180deg,${color} 0%,${color}66 100%)`,borderRadius:"3px 3px 0 0",minHeight:"2px"}}/>
          <div style={{fontSize:"8px",color:BRAND.muted,textAlign:"center",lineHeight:1.2}}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function VideoUpload({ onResult, endpoint, processing, setProcessing, color=BRAND.gold }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const process = async (file) => {
    setProcessing(true); setError(null);
    for (let i = 1; i <= 3; i++) {
      setAttempt(i);
      try {
        const fd = new FormData(); fd.append("video", file);
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 90000); // 90s
        const res = await fetch(`${API}${endpoint}`, { method:"POST", body:fd, signal:controller.signal });
        clearTimeout(t);
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        onResult(data, file.name.replace(/\.[^/.]+$/, ""));
        setProcessing(false); setAttempt(0); return;
      } catch(e) {
        const isNet = e.name === "AbortError" || e.message.includes("fetch") || e.message.includes("Failed");
        if (isNet && i < 3) {
          setError(`⏱ Server waking up... retry ${i}/3 — please wait 10 seconds`);
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }
        setError(
          e.name === "AbortError"
            ? "⏱ Request timed out. Server may be waking up — wait 30s and try again."
            : isNet
            ? "⚠ Cannot reach server. Open neurotrack.neuromatrixbiosystems.com/health to wake it up, then retry."
            : e.message
        );
        break;
      }
    }
    setProcessing(false); setAttempt(0);
  };

  const handle = files => { const v=Array.from(files).filter(f=>f.type.startsWith("video/")||f.name.match(/\.(mp4|avi|mov|mkv)$/i)); if(v.length) process(v[0]); };
  return (
    <div>
      <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files);}} onClick={()=>!processing&&inputRef.current.click()} style={{border:`2px dashed ${drag?color:BRAND.border}`,borderRadius:"10px",padding:"18px",textAlign:"center",cursor:processing?"wait":"pointer",background:drag?color+"08":"transparent"}}>
        <input ref={inputRef} type="file" accept="video/*,.mp4,.avi,.mov,.mkv" style={{display:"none"}} onChange={e=>handle(e.target.files)}/>
        <div style={{fontSize:"22px",marginBottom:"5px"}}>{processing?"⏳":"🎥"}</div>
        <div style={{fontSize:"12px",color,fontWeight:"700",marginBottom:"3px"}}>
          {processing ? (attempt > 1 ? `Waking server... attempt ${attempt}/3` : "Analysing video...") : "Drop video or click to upload"}
        </div>
        <div style={{fontSize:"9px",color:BRAND.muted}}>MP4 · AVI · MOV · MKV · Max 500MB</div>
      </div>
      {error && (
        <div style={{marginTop:"8px",background:BRAND.red+"11",border:`1px solid ${BRAND.red}33`,borderRadius:"6px",padding:"10px 12px",fontSize:"10px",color:BRAND.red,lineHeight:"1.7"}}>
          {error}
          <div style={{marginTop:"8px",display:"flex",gap:"8px"}}>
            <button onClick={()=>setError(null)} style={{background:BRAND.red,color:"#fff",border:"none",borderRadius:"4px",padding:"4px 10px",fontSize:"9px",cursor:"pointer",fontFamily:"inherit"}}>Dismiss</button>
            <a href="https://neurotrack.neuromatrixbiosystems.com/health" target="_blank" rel="noreferrer" style={{background:"transparent",color:BRAND.red,border:`1px solid ${BRAND.red}44`,borderRadius:"4px",padding:"4px 10px",fontSize:"9px",textDecoration:"none"}}>Wake Server →</a>
          </div>
        </div>
      )}
    </div>
  );
}

function TrajectoryCanvas({ positions, color=BRAND.gold, canvasRef:extRef, shape="circle" }) {
  const intRef=useRef(null); const ref=extRef||intRef;
  useEffect(()=>{
    const canvas=ref.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); ctx.clearRect(0,0,600,600); ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,600,600);
    if(shape==="circle"){
      ctx.beginPath(); ctx.arc(300,300,240,0,Math.PI*2); ctx.strokeStyle=BRAND.gold+"33"; ctx.lineWidth=2; ctx.stroke();
      ctx.setLineDash([4,4]); ctx.strokeStyle=BRAND.dim; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(60,300); ctx.lineTo(540,300); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(300,60); ctx.lineTo(300,540); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(420,180,18,0,Math.PI*2); ctx.fillStyle=BRAND.gold+"22"; ctx.fill(); ctx.strokeStyle=BRAND.gold+"88"; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle=BRAND.gold; ctx.font="9px monospace"; ctx.textAlign="center"; ctx.fillText("P",420,184);
    } else if(shape==="ymaze"){
      [{angle:-90,label:"A",c:BRAND.gold},{angle:30,label:"B",c:BRAND.green},{angle:150,label:"C",c:BRAND.purple}].forEach(({angle,label,c})=>{
        const r=(angle*Math.PI)/180;
        ctx.beginPath(); ctx.moveTo(300,300); ctx.lineTo(300+Math.cos(r)*220,300+Math.sin(r)*220); ctx.strokeStyle=c+"44"; ctx.lineWidth=30; ctx.lineCap="round"; ctx.stroke();
        ctx.fillStyle=c; ctx.font="bold 14px monospace"; ctx.textAlign="center"; ctx.fillText(label,300+Math.cos(r)*240,300+Math.sin(r)*240+4);
      });
    } else if(shape==="nor"){
      ctx.strokeStyle=BRAND.border; ctx.lineWidth=2; ctx.strokeRect(40,40,520,520);
      ctx.fillStyle=BRAND.blue+"33"; ctx.strokeStyle=BRAND.blue; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(150,300,45,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle=BRAND.blue; ctx.font="bold 11px monospace"; ctx.textAlign="center"; ctx.fillText("OBJ A",150,304); ctx.fillStyle=BRAND.muted; ctx.font="9px monospace"; ctx.fillText("Familiar",150,320);
      ctx.fillStyle=BRAND.orange+"33"; ctx.strokeStyle=BRAND.orange; ctx.lineWidth=2;
      ctx.beginPath(); ctx.rect(405,255,90,90); ctx.fill(); ctx.stroke();
      ctx.fillStyle=BRAND.orange; ctx.font="bold 11px monospace"; ctx.textAlign="center"; ctx.fillText("OBJ B",450,304); ctx.fillStyle=BRAND.muted; ctx.font="9px monospace"; ctx.fillText("Novel",450,320);
    } else {
      ctx.strokeStyle=BRAND.gold+"33"; ctx.lineWidth=2; ctx.strokeRect(40,40,520,520);
      ctx.strokeStyle=BRAND.gold+"55"; ctx.setLineDash([4,4]); ctx.strokeRect(160,160,280,280); ctx.setLineDash([]);
      ctx.fillStyle=BRAND.gold+"11"; ctx.fillRect(160,160,280,280);
      ctx.fillStyle=BRAND.gold; ctx.font="9px monospace"; ctx.textAlign="center"; ctx.fillText("CENTER",300,298);
    }
    if(!positions||positions.length<2){ ctx.fillStyle=BRAND.dim; ctx.font="13px monospace"; ctx.textAlign="center"; ctx.fillText("Upload video to see trajectory",300,570); return; }
    ctx.beginPath(); ctx.moveTo(positions[0].x,positions[0].y);
    for(let i=1;i<positions.length;i++) ctx.lineTo(positions[i].x,positions[i].y);
    ctx.strokeStyle=color+"cc"; ctx.lineWidth=1.8; ctx.stroke();
    ctx.beginPath(); ctx.arc(positions[0].x,positions[0].y,6,0,Math.PI*2); ctx.fillStyle=BRAND.green; ctx.fill();
    const last=positions[positions.length-1];
    ctx.beginPath(); ctx.arc(last.x,last.y,6,0,Math.PI*2); ctx.fillStyle=BRAND.red; ctx.fill();
  },[positions,shape]);
  return <canvas ref={ref} width={600} height={600} style={{width:"100%",borderRadius:"10px"}}/>;
}

function HeatmapCanvas({ positions, canvasRef:extRef }) {
  const intRef=useRef(null); const ref=extRef||intRef;
  useEffect(()=>{
    const canvas=ref.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); ctx.clearRect(0,0,600,600); ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,600,600);
    if(!positions||!positions.length){ ctx.fillStyle=BRAND.dim; ctx.font="13px monospace"; ctx.textAlign="center"; ctx.fillText("No data yet",300,300); return; }
    const BINS=40,grid=new Array(BINS).fill(0).map(()=>new Array(BINS).fill(0));
    positions.forEach(({x,y})=>{ const gx=Math.min(BINS-1,Math.floor((x/600)*BINS)),gy=Math.min(BINS-1,Math.floor((y/600)*BINS)); if(gx>=0&&gy>=0) grid[gy][gx]++; });
    const max=Math.max(1,...grid.flat()),cW=600/BINS,cH=600/BINS;
    grid.forEach((row,gy)=>row.forEach((val,gx)=>{
      if(!val) return;
      const t=val/max,r=Math.round(50+t*205),g=Math.round(t<0.5?t*2*168:168+(t-0.5)*2*87),b=Math.round(t<0.5?t*2*76:Math.max(0,76-(t-0.5)*2*76));
      ctx.fillStyle=`rgba(${r},${g},${b},${0.25+t*0.75})`; ctx.fillRect(gx*cW,gy*cH,cW,cH);
    }));
  },[positions]);
  return <canvas ref={ref} width={600} height={600} style={{width:"100%",borderRadius:"10px"}}/>;
}

function ResultsPanel({ result, color, fields, onDownloadCSV }) {
  if (!result) return null;
  return (
    <div style={{marginTop:"12px",background:BRAND.surface,border:`1px solid ${color}33`,borderRadius:"10px",padding:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
        <span style={{fontSize:"10px",color,fontWeight:"700",letterSpacing:"0.1em"}}>✅ ANALYSIS COMPLETE — {result.name}</span>
        <button style={S.btnO(color)} onClick={onDownloadCSV}>⬇ Download Results CSV</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:"8px"}}>
        {fields.map(([label,val,c])=>(
          <div key={label} style={{background:BRAND.panel,borderRadius:"6px",padding:"8px",textAlign:"center"}}>
            <div style={{fontSize:"15px",fontWeight:"700",color:c||color}}>{val??'—'}</div>
            <div style={{fontSize:"8px",color:BRAND.muted,letterSpacing:"0.08em",marginTop:"2px"}}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MWM ─────────────────────────────────────────────────────────────────────
function MWMTab() {
  const [sessions,setSessions]=useState([]); const [activeViz,setActiveViz]=useState("trajectory"); const [processing,setProcessing]=useState(false);
  const [trials,setTrials]=useState([]); const [form,setForm]=useState({trial:"",day:"",latency:"",distance:"",speed:"",quadrant:"Target",probe:false,probeTime:"",probePct:""});
  const trajRef=useRef(null),heatRef=useRef(null),poolRef=useRef(null);
  const active=sessions[sessions.length-1]; const positions=active?.positions||[];
  const onVideoResult=(data,name)=>{ setSessions(s=>[...s,{id:Date.now(),name,...data}]); setForm(f=>({...f,trial:String(trials.length+1),latency:String(data.escape_latency||""),distance:String(data.distance_m||""),speed:String(data.avg_speed||"")})); };
  const addTrial=()=>{ if(!form.latency) return; setTrials(t=>[...t,{...form,id:Date.now()}]); setForm(f=>({...f,trial:"",latency:"",distance:"",speed:"",probeTime:"",probePct:""})); };
  const latencies=trials.filter(t=>!t.probe).map(t=>parseFloat(t.latency)||0);
  const avgLatency=latencies.length?(latencies.reduce((a,b)=>a+b,0)/latencies.length).toFixed(1):(active?.escape_latency??"—");
  const probeTrials=trials.filter(t=>t.probe);
  const avgProbe=probeTrials.length?(probeTrials.reduce((a,b)=>a+(parseFloat(b.probePct)||0),0)/probeTrials.length).toFixed(1):"—";
  const byDay={}; trials.filter(t=>!t.probe).forEach(t=>{ const d=t.day||"1"; if(!byDay[d]) byDay[d]=[]; byDay[d].push(parseFloat(t.latency)||0); });
  const dayChart=Object.entries(byDay).map(([d,v])=>({label:`D${d}`,value:v.reduce((a,b)=>a+b,0)/v.length}));
  const exportCSV=()=>{ const rows=[["Trial","Day","Latency(s)","Distance(m)","Speed(m/s)","Quadrant","Type","TargetProbe%","Source","Date"]]; trials.forEach(t=>rows.push([t.trial,t.day,t.latency,t.distance,t.speed,t.quadrant,t.probe?"Probe":"Acquisition",t.probePct,"Manual",new Date().toISOString().split("T")[0]])); sessions.forEach(s=>rows.push(["Video","",s.escape_latency,s.distance_m,s.avg_speed,"","Video",s.quadrant_pct?.Target||"",s.name,new Date().toISOString().split("T")[0]])); downloadCSV(rows,"mwm_results.csv"); };
  const resultFields=active?[["Escape Latency",`${active.escape_latency}s`,BRAND.gold],["Distance",`${active.distance_m}m`,BRAND.blue],["Avg Speed",`${active.avg_speed}m/s`,BRAND.green],["Max Speed",`${active.max_speed}m/s`,BRAND.red],["Duration",`${active.duration_sec}s`,BRAND.muted],["Target Q",`${active.quadrant_pct?.Target||0}%`,BRAND.purple],["Platform",`${active.platform_pct||0}%`,BRAND.orange],["Frames",active.total_frames,BRAND.gold]]:[];
  useEffect(()=>{ const canvas=poolRef.current; if(!canvas) return; const ctx=canvas.getContext("2d"); const W=180,H=180; ctx.clearRect(0,0,W,H); ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,W,H); const cx=W/2,cy=H/2,r=70; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.strokeStyle=BRAND.border; ctx.lineWidth=2; ctx.stroke(); ctx.strokeStyle=BRAND.dim; ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(cx-r,cy); ctx.lineTo(cx+r,cy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx,cy-r); ctx.lineTo(cx,cy+r); ctx.stroke(); ctx.setLineDash([]); [["T",0.5,-0.5,BRAND.gold],["O",-0.5,0.5,BRAND.muted],["L",-0.5,-0.5,BRAND.muted],["R",0.5,0.5,BRAND.muted]].forEach(([l,ox,oy,c])=>{ ctx.fillStyle=c; ctx.font="9px monospace"; ctx.textAlign="center"; ctx.fillText(l,cx+ox*r,cy+oy*r+3); }); ctx.beginPath(); ctx.arc(cx+r*0.5,cy-r*0.5,8,0,Math.PI*2); ctx.fillStyle=BRAND.gold+"33"; ctx.fill(); ctx.strokeStyle=BRAND.gold; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle=BRAND.gold; ctx.font="8px monospace"; ctx.textAlign="center"; ctx.fillText("P",cx+r*0.5,cy-r*0.5+3); },[]);
  return (
    <div>
      <div style={S.grid4}><StatCard label="Escape Latency" value={avgLatency} unit="s" color={BRAND.gold} sub="Time to platform"/><StatCard label="Path Length" value={active?.distance_m??"—"} unit="m" color={BRAND.blue}/><StatCard label="Target Quadrant" value={avgProbe!=="—"?`${avgProbe}%`:active?.quadrant_pct?.Target?`${active.quadrant_pct.Target}%`:"—"} color={BRAND.purple} sub="Probe trial"/><StatCard label="Sessions" value={sessions.length} color={BRAND.gold}/></div>
      <hr style={S.divider}/>
      <div style={{...S.card,marginBottom:"16px",border:`1px solid ${BRAND.gold}44`}}><div style={S.cardTitle}>🎥 Video Upload — Auto Tracking</div><VideoUpload onResult={onVideoResult} endpoint="/process/mwm" processing={processing} setProcessing={setProcessing} color={BRAND.gold}/><ResultsPanel result={active} color={BRAND.gold} fields={resultFields} onDownloadCSV={exportCSV}/></div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <div style={{display:"flex",gap:"4px"}}>{["trajectory","heatmap"].map(t=><button key={t} style={S.tab(activeViz===t)} onClick={()=>setActiveViz(t)}>{t.toUpperCase()}</button>)}</div>
            <button style={S.btnO()} onClick={()=>downloadCanvas(activeViz==="trajectory"?trajRef:heatRef,`mwm_${activeViz}.png`)}>⬇ PNG</button>
          </div>
          {activeViz==="trajectory"?<TrajectoryCanvas positions={positions} color={BRAND.gold} canvasRef={trajRef} shape="circle"/>:<HeatmapCanvas positions={positions} canvasRef={heatRef}/>}
          <div style={{fontSize:"9px",color:BRAND.muted,marginTop:"6px",display:"flex",gap:"14px"}}><span>🟢 Start</span><span>🔴 End</span><span>⭕ Platform</span></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={S.card}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}><div style={S.cardTitle}>🏊 Pool Diagram</div><button style={S.btnO()} onClick={()=>downloadCanvas(poolRef,"mwm_pool.png")}>⬇ PNG</button></div><div style={{display:"flex",justifyContent:"center"}}><canvas ref={poolRef} width={180} height={180}/></div></div>
          {active?.quadrant_pct&&<div style={S.card}><div style={S.cardTitle}>🎯 Quadrant %</div><BarChart data={["Target","Opposite","Left","Right"].map(q=>({label:q.slice(0,3),value:active.quadrant_pct[q]||0}))} color={BRAND.purple} height={90}/></div>}
          {dayChart.length>1&&<div style={S.card}><div style={S.cardTitle}>📉 Learning Curve</div><BarChart data={dayChart} color={BRAND.gold} height={90}/></div>}
        </div>
      </div>
      <hr style={S.divider}/>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}><div style={S.cardTitle}>➕ Manual Trial Entry</div>{(trials.length>0||sessions.length>0)&&<button style={S.btnO()} onClick={exportCSV}>⬇ Export CSV</button>}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px"}}>
          {[["Trial #","trial","1"],["Day","day","1"],["Latency(s)","latency","60"],["Distance(m)","distance","5"],["Speed(m/s)","speed","0.3"]].map(([l,k,p])=>(
            <div key={k}><label style={S.label}>{l}</label><input style={S.input} type="number" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p}/></div>
          ))}
          <div><label style={S.label}>Quadrant</label><select style={S.input} value={form.quadrant} onChange={e=>setForm({...form,quadrant:e.target.value})}>{["Target","Opposite","Left","Right"].map(q=><option key={q}>{q}</option>)}</select></div>
        </div>
        <div style={{marginTop:"10px",padding:"10px",background:BRAND.surface,borderRadius:"8px"}}>
          <label style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",fontSize:"12px",color:BRAND.gold}}><input type="checkbox" checked={form.probe} onChange={e=>setForm({...form,probe:e.target.checked})}/>🔬 Probe Trial</label>
          {form.probe&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginTop:"10px"}}><div><label style={S.label}>Target Time (s)</label><input style={S.input} type="number" value={form.probeTime} onChange={e=>setForm({...form,probeTime:e.target.value})}/></div><div><label style={S.label}>% in Target</label><input style={S.input} type="number" value={form.probePct} onChange={e=>setForm({...form,probePct:e.target.value})}/></div></div>}
        </div>
        <button style={{...S.btn(),flex:1,width:"100%",marginTop:"12px"}} onClick={addTrial}>Add Trial</button>
      </div>
      {trials.length>0&&<div style={{...S.card,marginTop:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}><div style={S.cardTitle}>📋 Trial Log ({trials.length})</div><button style={S.btnO()} onClick={exportCSV}>⬇ Export CSV</button></div>
        <div style={{overflowX:"auto"}}><table style={S.table}><thead><tr>{["Trial","Day","Latency","Distance","Speed","Quadrant","Type","Target%",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{trials.map(t=>(
          <tr key={t.id}><td style={S.td}>{t.trial}</td><td style={S.td}>{t.day}</td><td style={{...S.td,color:BRAND.gold}}>{t.latency}s</td><td style={S.td}>{t.distance}m</td><td style={S.td}>{t.speed}m/s</td><td style={S.td}>{t.quadrant}</td><td style={S.td}><span style={S.badge(t.probe?BRAND.purple:BRAND.green)}>{t.probe?"Probe":"Acq"}</span></td><td style={{...S.td,color:BRAND.purple}}>{t.probePct?`${t.probePct}%`:"—"}</td><td style={S.td}><button style={{...S.btnO(BRAND.red),padding:"2px 8px",fontSize:"9px"}} onClick={()=>setTrials(x=>x.filter(i=>i.id!==t.id))}>✕</button></td>
          </tr>
        ))}</tbody></table></div>
      </div>}
    </div>
  );
}

// ─── Y-MAZE ───────────────────────────────────────────────────────────────────
function YMazeTab() {
  const [sessions,setSessions]=useState([]); const [processing,setProcessing]=useState(false); const [manual,setManual]=useState([]);
  const [form,setForm]=useState({session:"",entries:"",altScore:"",timeA:"",timeB:"",timeC:""}); const [viz,setViz]=useState("trajectory");
  const trajRef=useRef(null),heatRef=useRef(null),mazeRef=useRef(null);
  const active=sessions[sessions.length-1]; const positions=active?.positions||[]; const all=[...sessions,...manual];
  const getAltColor=v=>{ const n=parseFloat(v); return n>=60?BRAND.green:n>=40?BRAND.gold:BRAND.red; };
  const avgAlt=all.length?(all.reduce((a,b)=>a+(parseFloat(b.alternation_pct||b.altScore)||0),0)/all.length).toFixed(1):"—";
  const onVideoResult=(data,name)=>{ setSessions(s=>[...s,{id:Date.now(),name,...data}]); setForm(f=>({...f,session:name,entries:String(data.total_entries||""),altScore:String(data.alternation_pct||""),timeA:String(data.arm_time?.A||""),timeB:String(data.arm_time?.B||""),timeC:String(data.arm_time?.C||"")})); };
  const exportCSV=()=>{ const rows=[["Session","Entries","Alternations","Alternation%","ArmA(s)","ArmB(s)","ArmC(s)","Center(s)","Source","Date"]]; all.forEach(s=>rows.push([s.name||s.session,s.total_entries||s.entries,s.alternations||"",s.alternation_pct||s.altScore,s.arm_time?.A||s.timeA,s.arm_time?.B||s.timeB,s.arm_time?.C||s.timeC,s.arm_time?.center||"",s.positions?"Video":"Manual",new Date().toISOString().split("T")[0]])); downloadCSV(rows,"ymaze_results.csv"); };
  const resultFields=active?[["Total Entries",active.total_entries,BRAND.gold],["Alternations",active.alternations,BRAND.green],["Alternation %",`${active.alternation_pct}%`,getAltColor(active.alternation_pct)],["Arm A",`${active.arm_time?.A?.toFixed(1)}s`,BRAND.gold],["Arm B",`${active.arm_time?.B?.toFixed(1)}s`,BRAND.green],["Arm C",`${active.arm_time?.C?.toFixed(1)}s`,BRAND.purple],["Center",`${active.arm_time?.center?.toFixed(1)}s`,BRAND.muted],["Frames",active.total_frames,BRAND.blue]]:[];
  useEffect(()=>{ const canvas=mazeRef.current; if(!canvas) return; const ctx=canvas.getContext("2d"); ctx.clearRect(0,0,180,180); ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,180,180); [{angle:-90,label:"A",c:BRAND.gold},{angle:30,label:"B",c:BRAND.green},{angle:150,label:"C",c:BRAND.purple}].forEach(({angle,label,c})=>{ const r=(angle*Math.PI)/180; ctx.beginPath(); ctx.moveTo(90,90); ctx.lineTo(90+Math.cos(r)*60,90+Math.sin(r)*60); ctx.strokeStyle=c; ctx.lineWidth=18; ctx.lineCap="round"; ctx.stroke(); ctx.fillStyle=c; ctx.font="bold 12px monospace"; ctx.textAlign="center"; ctx.fillText(label,90+Math.cos(r)*76,90+Math.sin(r)*76+4); }); ctx.beginPath(); ctx.arc(90,90,12,0,Math.PI*2); ctx.fillStyle=BRAND.dim; ctx.fill(); },[]);
  return (
    <div>
      <div style={S.grid4}><StatCard label="Avg Alternation" value={avgAlt!=="—"?`${avgAlt}%`:avgAlt} color={avgAlt!=="—"?getAltColor(avgAlt):BRAND.muted} sub="≥60% intact"/><StatCard label="Sessions" value={all.length} color={BRAND.gold}/><StatCard label="Last Entries" value={active?.total_entries??"—"} color={BRAND.blue}/><StatCard label="Memory" value={avgAlt!=="—"?(parseFloat(avgAlt)>=60?"Normal":parseFloat(avgAlt)>=40?"Border":"Impaired"):"—"} color={avgAlt!=="—"?getAltColor(avgAlt):BRAND.muted}/></div>
      <hr style={S.divider}/>
      <div style={{...S.card,marginBottom:"16px",border:`1px solid ${BRAND.green}44`}}><div style={S.cardTitle}>🎥 Video Upload — Auto Arm Detection</div><VideoUpload onResult={onVideoResult} endpoint="/process/ymaze" processing={processing} setProcessing={setProcessing} color={BRAND.green}/><ResultsPanel result={active} color={BRAND.green} fields={resultFields} onDownloadCSV={exportCSV}/></div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}><div style={{display:"flex",gap:"4px"}}>{["trajectory","heatmap"].map(t=><button key={t} style={S.tab(viz===t,BRAND.green)} onClick={()=>setViz(t)}>{t.toUpperCase()}</button>)}</div><button style={S.btnO(BRAND.green)} onClick={()=>downloadCanvas(viz==="trajectory"?trajRef:heatRef,`ymaze_${viz}.png`)}>⬇ PNG</button></div>
          {viz==="trajectory"?<TrajectoryCanvas positions={positions} color={BRAND.green} canvasRef={trajRef} shape="ymaze"/>:<HeatmapCanvas positions={positions} canvasRef={heatRef}/>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={S.card}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}><div style={S.cardTitle}>🔀 Maze Diagram</div><button style={S.btnO(BRAND.green)} onClick={()=>downloadCanvas(mazeRef,"ymaze_diagram.png")}>⬇ PNG</button></div><div style={{display:"flex",justifyContent:"center"}}><canvas ref={mazeRef} width={180} height={180}/></div></div>
          {active?.arm_time&&<div style={S.card}><div style={S.cardTitle}>⏱ Arm Time</div><BarChart data={["A","B","C"].map(a=>({label:`Arm ${a}`,value:active.arm_time[a]||0}))} color={BRAND.green} height={90}/></div>}
          {all.length>1&&<div style={S.card}><div style={S.cardTitle}>📊 Alternation % Per Session</div><BarChart data={all.map((s,i)=>({label:s.name||s.session||`S${i+1}`,value:parseFloat(s.alternation_pct||s.altScore)||0}))} color={BRAND.green} height={90}/><div style={{display:"flex",gap:"6px",marginTop:"8px",flexWrap:"wrap"}}><span style={S.badge(BRAND.green)}>≥60% Normal</span><span style={S.badge(BRAND.gold)}>40–60% Border</span><span style={S.badge(BRAND.red)}>{"<"}40% Impaired</span></div></div>}
        </div>
      </div>
      <hr style={S.divider}/>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}><div style={S.cardTitle}>➕ Manual Session Entry</div>{all.length>0&&<button style={S.btnO(BRAND.green)} onClick={exportCSV}>⬇ Export CSV</button>}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px"}}>
          {[["Session ID","session","S1","text"],["Total Entries","entries","20","number"],["Alternation %","altScore","65","number"],["Arm A (s)","timeA","100","number"],["Arm B (s)","timeB","100","number"],["Arm C (s)","timeC","100","number"]].map(([l,k,p,t])=>(
            <div key={k}><label style={S.label}>{l}</label><input style={S.input} type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p}/></div>
          ))}
        </div>
        <button style={{...S.btn(BRAND.green),width:"100%",marginTop:"12px"}} onClick={()=>{ if(!form.entries) return; setManual(s=>[...s,{...form,id:Date.now()}]); setForm(f=>({...f,session:"",entries:"",altScore:"",timeA:"",timeB:"",timeC:""})); }}>Add Session</button>
      </div>
      {all.length>0&&<div style={{...S.card,marginTop:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}><div style={S.cardTitle}>📋 Session Log ({all.length})</div><button style={S.btnO(BRAND.green)} onClick={exportCSV}>⬇ Export CSV</button></div>
        <div style={{overflowX:"auto"}}><table style={S.table}><thead><tr>{["Session","Entries","Alt%","Arm A","Arm B","Arm C","Source"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{all.map((s,i)=>(<tr key={s.id||i}><td style={S.td}>{s.name||s.session}</td><td style={S.td}>{s.total_entries||s.entries}</td><td style={{...S.td,color:getAltColor(s.alternation_pct||s.altScore),fontWeight:"700"}}>{s.alternation_pct||s.altScore}%</td><td style={{...S.td,color:BRAND.gold}}>{s.arm_time?.A?.toFixed(1)||s.timeA||"—"}s</td><td style={{...S.td,color:BRAND.green}}>{s.arm_time?.B?.toFixed(1)||s.timeB||"—"}s</td><td style={{...S.td,color:BRAND.purple}}>{s.arm_time?.C?.toFixed(1)||s.timeC||"—"}s</td><td style={S.td}><span style={S.badge(s.positions?BRAND.green:BRAND.muted)}>{s.positions?"Video":"Manual"}</span></td></tr>))}</tbody></table></div>
      </div>}
    </div>
  );
}

// ─── OFT ─────────────────────────────────────────────────────────────────────
function OFTTab() {
  const [sessions,setSessions]=useState([]); const [processing,setProcessing]=useState(false); const [records,setRecords]=useState([]);
  const [form,setForm]=useState({animal:"",group:"",distance:"",centerTime:"",peripheryTime:"",rearing:"",freezing:"",avgVelocity:"",maxVelocity:""}); const [viz,setViz]=useState("trajectory");
  const trajRef=useRef(null),heatRef=useRef(null),arenaRef=useRef(null);
  const active=sessions[sessions.length-1]; const positions=active?.positions||[]; const all=[...sessions,...records];
  const getAnxiety=(cT,tot)=>{ const p=tot?(parseFloat(cT)||0)/parseFloat(tot)*100:0; return p>=30?{l:"Low",c:BRAND.green}:p>=15?{l:"Moderate",c:BRAND.gold}:{l:"High",c:BRAND.red}; };
  const avg=(k1,k2)=>all.length?(all.reduce((a,b)=>a+(parseFloat(b[k1]||b[k2])||0),0)/all.length).toFixed(1):"—";
  const onVideoResult=(data,name)=>{ setSessions(s=>[...s,{id:Date.now(),name,...data}]); setForm(f=>({...f,animal:name,distance:String(data.distance_m||""),centerTime:String(data.center_time||""),peripheryTime:String(data.periphery_time||""),rearing:String(data.rearing_events||""),freezing:String(data.freezing_time||""),avgVelocity:String(data.avg_speed||""),maxVelocity:String(data.max_speed||"")})); };
  const exportCSV=()=>{ const rows=[["Animal","Group","Distance(m)","Center(s)","Periphery(s)","Center%","Rearing","Freezing(s)","Freezing%","AvgSpeed(m/s)","MaxSpeed(m/s)","AnxietyIndex","Source","Date"]]; all.forEach(r=>{ const tot=(parseFloat(r.center_time||r.centerTime)||0)+(parseFloat(r.periphery_time||r.peripheryTime)||0); const a=getAnxiety(r.center_time||r.centerTime,tot); rows.push([r.animal||r.name,r.group||"",r.distance_m||r.distance,r.center_time||r.centerTime,r.periphery_time||r.peripheryTime,r.center_pct||"",r.rearing_events||r.rearing,r.freezing_time||r.freezing,r.freezing_pct||"",r.avg_speed||r.avgVelocity,r.max_speed||r.maxVelocity,a.l,r.positions?"Video":"Manual",new Date().toISOString().split("T")[0]]); }); downloadCSV(rows,"oft_results.csv"); };
  const resultFields=active?[["Distance",`${active.distance_m}m`,BRAND.gold],["Center",`${active.center_time}s (${active.center_pct}%)`,BRAND.green],["Periphery",`${active.periphery_time}s`,BRAND.blue],["Freezing",`${active.freezing_time}s`,BRAND.red],["Rearing",active.rearing_events,BRAND.purple],["Avg Speed",`${active.avg_speed}m/s`,BRAND.blue],["Max Speed",`${active.max_speed}m/s`,BRAND.orange],["Duration",`${active.duration_sec}s`,BRAND.muted]]:[];
  useEffect(()=>{ const canvas=arenaRef.current; if(!canvas) return; const ctx=canvas.getContext("2d"); ctx.clearRect(0,0,180,180); ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,180,180); ctx.fillStyle="#0d1428"; ctx.strokeStyle=BRAND.border; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect(10,10,160,160,4); ctx.fill(); ctx.stroke(); ctx.fillStyle=BRAND.gold+"22"; ctx.strokeStyle=BRAND.gold+"88"; ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.roundRect(46,46,88,88,3); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle=BRAND.gold; ctx.font="8px monospace"; ctx.textAlign="center"; ctx.fillText("CENTER",90,93); ctx.fillStyle=BRAND.muted; ctx.fillText("PERIPHERY",90,22); },[]);
  return (
    <div>
      <div style={S.grid4}><StatCard label="Avg Distance" value={avg("distance_m","distance")} unit="m" color={BRAND.gold} sub="Locomotion"/><StatCard label="Avg Center Time" value={avg("center_time","centerTime")} unit="s" color={BRAND.green} sub="Low = high anxiety"/><StatCard label="Avg Freezing" value={avg("freezing_time","freezing")} unit="s" color={BRAND.red} sub="Fear marker"/><StatCard label="Avg Rearing" value={avg("rearing_events","rearing")} color={BRAND.purple} sub="Exploration"/></div>
      <hr style={S.divider}/>
      <div style={{...S.card,marginBottom:"16px",border:`1px solid ${BRAND.blue}44`}}><div style={S.cardTitle}>🎥 Video Upload — Auto Zone Analysis</div><VideoUpload onResult={onVideoResult} endpoint="/process/oft" processing={processing} setProcessing={setProcessing} color={BRAND.blue}/><ResultsPanel result={active} color={BRAND.blue} fields={resultFields} onDownloadCSV={exportCSV}/></div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}><div style={{display:"flex",gap:"4px"}}>{["trajectory","heatmap"].map(t=><button key={t} style={S.tab(viz===t,BRAND.blue)} onClick={()=>setViz(t)}>{t.toUpperCase()}</button>)}</div><button style={S.btnO(BRAND.blue)} onClick={()=>downloadCanvas(viz==="trajectory"?trajRef:heatRef,`oft_${viz}.png`)}>⬇ PNG</button></div>
          {viz==="trajectory"?<TrajectoryCanvas positions={positions} color={BRAND.blue} canvasRef={trajRef} shape="square"/>:<HeatmapCanvas positions={positions} canvasRef={heatRef}/>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={S.card}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}><div style={S.cardTitle}>⬜ Arena Diagram</div><button style={S.btnO(BRAND.blue)} onClick={()=>downloadCanvas(arenaRef,"oft_arena.png")}>⬇ PNG</button></div><div style={{display:"flex",justifyContent:"center"}}><canvas ref={arenaRef} width={180} height={180}/></div></div>
          {all.length>0&&<div style={S.card}><div style={S.cardTitle}>😰 Anxiety Index</div>{all.map((r,i)=>{ const tot=(parseFloat(r.center_time||r.centerTime)||0)+(parseFloat(r.periphery_time||r.peripheryTime)||0); const a=getAnxiety(r.center_time||r.centerTime,tot); const p=tot?((parseFloat(r.center_time||r.centerTime)||0)/tot*100).toFixed(0):0; return(<div key={i} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}><span style={{fontSize:"10px",color:BRAND.text,minWidth:"70px",overflow:"hidden",textOverflow:"ellipsis"}}>{r.animal||r.name||`Rat ${i+1}`}</span><div style={{flex:1,height:"5px",background:BRAND.dim,borderRadius:"3px",overflow:"hidden"}}><div style={{width:`${p}%`,height:"100%",background:a.c,borderRadius:"3px"}}/></div><span style={S.badge(a.c)}>{a.l}</span></div>); })}</div>}
          {all.length>0&&<div style={S.card}><div style={S.cardTitle}>💨 Distance by Animal</div><BarChart data={all.map((r,i)=>({label:r.animal||r.name||`R${i+1}`,value:parseFloat(r.distance_m||r.distance)||0}))} color={BRAND.blue} height={90}/></div>}
        </div>
      </div>
      <hr style={S.divider}/>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}><div style={S.cardTitle}>➕ Manual Animal Entry</div>{all.length>0&&<button style={S.btnO(BRAND.blue)} onClick={exportCSV}>⬇ Export CSV</button>}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px"}}>
          {[["Animal ID","animal","Rat-01","text"],["Group","group","Control","text"],["Distance (m)","distance","25","number"],["Center Time (s)","centerTime","60","number"],["Periphery (s)","peripheryTime","240","number"],["Rearing","rearing","15","number"],["Freezing (s)","freezing","10","number"],["Avg Velocity","avgVelocity","0.08","number"]].map(([l,k,p,t])=>(
            <div key={k}><label style={S.label}>{l}</label><input style={S.input} type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p}/></div>
          ))}
        </div>
        <button style={{...S.btn(BRAND.blue),width:"100%",marginTop:"12px"}} onClick={()=>{ if(!form.distance) return; setRecords(r=>[...r,{...form,id:Date.now()}]); setForm(f=>({...f,animal:"",distance:"",centerTime:"",peripheryTime:"",rearing:"",freezing:"",avgVelocity:"",maxVelocity:""})); }}>Add Animal</button>
      </div>
      {all.length>0&&<div style={{...S.card,marginTop:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}><div style={S.cardTitle}>📋 Animal Log ({all.length})</div><button style={S.btnO(BRAND.blue)} onClick={exportCSV}>⬇ Export CSV</button></div>
        <div style={{overflowX:"auto"}}><table style={S.table}><thead><tr>{["Animal","Group","Distance","Center(s)","Periphery(s)","Rearing","Freezing","Speed","Anxiety","Source"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{all.map((r,i)=>{ const tot=(parseFloat(r.center_time||r.centerTime)||0)+(parseFloat(r.periphery_time||r.peripheryTime)||0); const a=getAnxiety(r.center_time||r.centerTime,tot); return(<tr key={r.id||i}><td style={S.td}>{r.animal||r.name}</td><td style={S.td}><span style={S.badge(BRAND.blue)}>{r.group||"—"}</span></td><td style={{...S.td,color:BRAND.gold}}>{r.distance_m||r.distance}m</td><td style={{...S.td,color:BRAND.green}}>{r.center_time||r.centerTime}s</td><td style={S.td}>{r.periphery_time||r.peripheryTime}s</td><td style={{...S.td,color:BRAND.purple}}>{r.rearing_events||r.rearing}</td><td style={{...S.td,color:BRAND.red}}>{r.freezing_time||r.freezing}s</td><td style={S.td}>{r.avg_speed||r.avgVelocity}m/s</td><td style={S.td}><span style={S.badge(a.c)}>{a.l}</span></td><td style={S.td}><span style={S.badge(r.positions?BRAND.green:BRAND.muted)}>{r.positions?"Video":"Manual"}</span></td></tr>); })}</tbody></table></div>
      </div>}
    </div>
  );
}

// ─── NOR ──────────────────────────────────────────────────────────────────────
function NORTab() {
  const [sessions,setSessions]=useState([]); const [processing,setProcessing]=useState(false); const [records,setRecords]=useState([]);
  const [form,setForm]=useState({animal:"",group:"",phase:"Test",timeNovel:"",timeFamiliar:"",totalExploration:"",di:""}); const [viz,setViz]=useState("trajectory");
  const trajRef=useRef(null),heatRef=useRef(null),arenaRef=useRef(null);
  const active=sessions[sessions.length-1]; const positions=active?.positions||[]; const all=[...sessions,...records];
  const calcDI=(n,f)=>{ const nv=parseFloat(n)||0,fv=parseFloat(f)||0,t=nv+fv; if(!t) return null; return ((nv-fv)/t*100).toFixed(1); };
  const getDIColor=di=>{ const v=parseFloat(di); return v>=20?BRAND.green:v>=0?BRAND.gold:BRAND.red; };
  const avgDI=all.length?(all.reduce((a,b)=>a+(parseFloat(b.di||calcDI(b.novel_time||b.timeNovel,b.familiar_time||b.timeFamiliar))||0),0)/all.length).toFixed(1):"—";
  const onVideoResult=(data,name)=>{ const di=calcDI(data.novel_time,data.familiar_time); setSessions(s=>[...s,{id:Date.now(),name,...data,di}]); setForm(f=>({...f,animal:name,timeNovel:String(data.novel_time||""),timeFamiliar:String(data.familiar_time||""),totalExploration:String(data.total_exploration||""),di:String(di||"")})); };
  const exportCSV=()=>{ const rows=[["Animal","Group","Phase","Novel(s)","Familiar(s)","TotalExploration(s)","DI%","RecognitionIndex%","MemoryStatus","Source","Date"]]; all.forEach(r=>{ const di=r.di||calcDI(r.novel_time||r.timeNovel,r.familiar_time||r.timeFamiliar)||""; const n=parseFloat(r.novel_time||r.timeNovel)||0,f=parseFloat(r.familiar_time||r.timeFamiliar)||0; const ri=(n+f)?((n/(n+f))*100).toFixed(1):""; const status=parseFloat(di)>=20?"Intact":parseFloat(di)>=0?"Borderline":"Impaired"; rows.push([r.animal||r.name,r.group||"",r.phase||"Test",n,f,r.total_exploration||r.totalExploration||"",di,ri,status,r.positions?"Video":"Manual",new Date().toISOString().split("T")[0]]); }); downloadCSV(rows,"nor_results.csv"); };
  const resultFields=active?[["Novel Time",`${active.novel_time}s`,BRAND.orange],["Familiar Time",`${active.familiar_time}s`,BRAND.blue],["Total Exploration",`${active.total_exploration}s`,BRAND.gold],["DI%",`${active.di}%`,getDIColor(active.di)],["Novel %",`${((active.novel_time/(active.novel_time+active.familiar_time||1))*100).toFixed(1)}%`,BRAND.orange],["Memory",parseFloat(active.di)>=20?"Intact":parseFloat(active.di)>=0?"Border":"Impaired",getDIColor(active.di)],["Frames",active.total_frames,BRAND.blue],["Duration",`${active.duration_sec}s`,BRAND.muted]]:[];
  useEffect(()=>{ const canvas=arenaRef.current; if(!canvas) return; const ctx=canvas.getContext("2d"); ctx.clearRect(0,0,180,180); ctx.fillStyle=BRAND.bg; ctx.fillRect(0,0,180,180); ctx.strokeStyle=BRAND.border; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect(10,10,160,160,4); ctx.stroke(); ctx.fillStyle=BRAND.blue+"33"; ctx.strokeStyle=BRAND.blue; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(50,90,22,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle=BRAND.blue; ctx.font="8px monospace"; ctx.textAlign="center"; ctx.fillText("OBJ A",50,93); ctx.fillText("Familiar",50,107); ctx.fillStyle=BRAND.orange+"33"; ctx.strokeStyle=BRAND.orange; ctx.lineWidth=2; ctx.beginPath(); ctx.rect(118,68,44,44); ctx.fill(); ctx.stroke(); ctx.fillStyle=BRAND.orange; ctx.fillText("OBJ B",140,92); ctx.fillText("Novel",140,106); },[]);
  return (
    <div>
      <div style={S.grid4}><StatCard label="Avg DI" value={avgDI!=="—"?`${avgDI}%`:avgDI} color={avgDI!=="—"?getDIColor(avgDI):BRAND.muted} sub="Discrimination Index"/><StatCard label="Novel Time" value={active?.novel_time??"—"} unit="s" color={BRAND.orange} sub="Time at novel object"/><StatCard label="Familiar Time" value={active?.familiar_time??"—"} unit="s" color={BRAND.blue}/><StatCard label="Animals" value={all.length} color={BRAND.gold}/></div>
      <hr style={S.divider}/>
      <div style={{background:BRAND.surface,border:`1px solid ${BRAND.border}`,borderRadius:"10px",padding:"14px",marginBottom:"16px"}}>
        <div style={{fontSize:"10px",color:BRAND.gold,fontWeight:"700",letterSpacing:"0.1em",marginBottom:"10px"}}>📖 NOR KEY METRICS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",fontSize:"10px",color:BRAND.muted,lineHeight:"1.8"}}>
          <div><strong style={{color:BRAND.text}}>Discrimination Index (DI)</strong><br/>(Novel−Familiar)/(Novel+Familiar)×100<br/><span style={{color:BRAND.green}}>≥20% = Intact memory</span></div>
          <div><strong style={{color:BRAND.text}}>Recognition Index (RI)</strong><br/>Novel/(Novel+Familiar)×100<br/><span style={{color:BRAND.gold}}>{">"} 50% = Novel preference</span></div>
          <div><strong style={{color:BRAND.text}}>Total Exploration</strong><br/>Novel + Familiar time combined<br/><span style={{color:BRAND.muted}}>Motivation/activity index</span></div>
        </div>
      </div>
      <div style={{...S.card,marginBottom:"16px",border:`1px solid ${BRAND.orange}44`}}><div style={S.cardTitle}>🎥 Video Upload — Auto Object Detection</div><VideoUpload onResult={onVideoResult} endpoint="/process/nor" processing={processing} setProcessing={setProcessing} color={BRAND.orange}/><ResultsPanel result={active} color={BRAND.orange} fields={resultFields} onDownloadCSV={exportCSV}/></div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}><div style={{display:"flex",gap:"4px"}}>{["trajectory","heatmap"].map(t=><button key={t} style={S.tab(viz===t,BRAND.orange)} onClick={()=>setViz(t)}>{t.toUpperCase()}</button>)}</div><button style={S.btnO(BRAND.orange)} onClick={()=>downloadCanvas(viz==="trajectory"?trajRef:heatRef,`nor_${viz}.png`)}>⬇ PNG</button></div>
          {viz==="trajectory"?<TrajectoryCanvas positions={positions} color={BRAND.orange} canvasRef={trajRef} shape="nor"/>:<HeatmapCanvas positions={positions} canvasRef={heatRef}/>}
          <div style={{fontSize:"9px",color:BRAND.muted,marginTop:"6px",display:"flex",gap:"14px"}}><span style={{color:BRAND.blue}}>■ Obj A (Familiar)</span><span style={{color:BRAND.orange}}>■ Obj B (Novel)</span></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={S.card}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}><div style={S.cardTitle}>🔬 Arena Diagram</div><button style={S.btnO(BRAND.orange)} onClick={()=>downloadCanvas(arenaRef,"nor_arena.png")}>⬇ PNG</button></div><div style={{display:"flex",justifyContent:"center"}}><canvas ref={arenaRef} width={180} height={180}/></div></div>
          {all.length>0&&<div style={S.card}><div style={S.cardTitle}>📊 DI% Per Animal</div><BarChart data={all.map((r,i)=>({label:r.animal||r.name||`R${i+1}`,value:parseFloat(r.di||calcDI(r.novel_time||r.timeNovel,r.familiar_time||r.timeFamiliar))||0}))} color={BRAND.orange} height={90}/><div style={{display:"flex",gap:"6px",marginTop:"8px",flexWrap:"wrap"}}><span style={S.badge(BRAND.green)}>≥20% Intact</span><span style={S.badge(BRAND.gold)}>0–20% Border</span><span style={S.badge(BRAND.red)}>{"<"}0% Impaired</span></div></div>}
          {all.length>0&&<div style={S.card}><div style={S.cardTitle}>⏱ Novel vs Familiar</div><BarChart data={[{label:"Novel(B)",value:all.reduce((a,b)=>a+(parseFloat(b.novel_time||b.timeNovel)||0),0)/all.length},{label:"Familiar(A)",value:all.reduce((a,b)=>a+(parseFloat(b.familiar_time||b.timeFamiliar)||0),0)/all.length}]} color={BRAND.orange} height={90}/></div>}
        </div>
      </div>
      <hr style={S.divider}/>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}><div style={S.cardTitle}>➕ Manual Animal Entry</div>{all.length>0&&<button style={S.btnO(BRAND.orange)} onClick={exportCSV}>⬇ Export CSV</button>}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px"}}>
          {[["Animal ID","animal","Rat-01","text"],["Group","group","Control","text"],["Novel Time (s)","timeNovel","40","number"],["Familiar Time (s)","timeFamiliar","20","number"],["Total Exploration (s)","totalExploration","60","number"]].map(([l,k,p,t])=>(
            <div key={k}><label style={S.label}>{l}</label><input style={S.input} type={t} value={form[k]} onChange={e=>{ const nf={...form,[k]:e.target.value}; if(k==="timeNovel"||k==="timeFamiliar"){ const di=calcDI(nf.timeNovel,nf.timeFamiliar); if(di!==null) nf.di=di; } setForm(nf); }} placeholder={p}/></div>
          ))}
          <div><label style={S.label}>Phase</label><select style={S.input} value={form.phase} onChange={e=>setForm({...form,phase:e.target.value})}>{["Habituation","Familiarization","Test"].map(p=><option key={p}>{p}</option>)}</select></div>
          <div><label style={S.label}>DI% (auto-calc)</label><input style={{...S.input,color:getDIColor(form.di)}} type="number" value={form.di} onChange={e=>setForm({...form,di:e.target.value})} placeholder="auto"/></div>
        </div>
        <button style={{...S.btn(BRAND.orange),width:"100%",marginTop:"12px"}} onClick={()=>{ if(!form.timeNovel) return; setRecords(r=>[...r,{...form,id:Date.now()}]); setForm(f=>({...f,animal:"",timeNovel:"",timeFamiliar:"",totalExploration:"",di:""})); }}>Add Animal</button>
      </div>
      {all.length>0&&<div style={{...S.card,marginTop:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}><div style={S.cardTitle}>📋 NOR Results ({all.length})</div><button style={S.btnO(BRAND.orange)} onClick={exportCSV}>⬇ Export CSV</button></div>
        <div style={{overflowX:"auto"}}><table style={S.table}><thead><tr>{["Animal","Group","Phase","Novel(s)","Familiar(s)","Total(s)","DI%","Memory","Source"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{all.map((r,i)=>{ const di=r.di||calcDI(r.novel_time||r.timeNovel,r.familiar_time||r.timeFamiliar)||"—"; const st=parseFloat(di)>=20?"Intact":parseFloat(di)>=0?"Border":"Impaired"; return(<tr key={r.id||i}><td style={S.td}>{r.animal||r.name}</td><td style={S.td}><span style={S.badge(BRAND.orange)}>{r.group||"—"}</span></td><td style={S.td}>{r.phase||"Test"}</td><td style={{...S.td,color:BRAND.orange,fontWeight:"700"}}>{r.novel_time||r.timeNovel}s</td><td style={{...S.td,color:BRAND.blue}}>{r.familiar_time||r.timeFamiliar}s</td><td style={S.td}>{r.total_exploration||r.totalExploration||"—"}s</td><td style={{...S.td,color:getDIColor(di),fontWeight:"700"}}>{di}%</td><td style={S.td}><span style={S.badge(getDIColor(di))}>{st}</span></td><td style={S.td}><span style={S.badge(r.positions?BRAND.green:BRAND.muted)}>{r.positions?"Video":"Manual"}</span></td></tr>); })}</tbody></table></div>
      </div>}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const TABS=[{id:"mwm",label:"🏊 MWM",color:BRAND.gold},{id:"ymaze",label:"🔀 Y-Maze",color:BRAND.green},{id:"oft",label:"⬜ OFT",color:BRAND.blue},{id:"nor",label:"🔬 NOR",color:BRAND.orange}];
const DESCS={mwm:"Morris Water Maze — spatial memory, escape latency, probe trial, quadrant analysis",ymaze:"Y-Maze — spontaneous alternation, working memory, arm time distribution",oft:"Open Field Test — anxiety index, locomotion, center/periphery, rearing, freezing",nor:"Novel Object Recognition — discrimination index, recognition index, object preference"};

export default function BehavioralSuite() {
  const [tab,setTab]=useState("mwm"); const cur=TABS.find(t=>t.id===tab);
  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"8px",background:BRAND.goldDim,border:`1px solid ${BRAND.gold}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>🧠</div>
          <div><div style={S.logoText}>NeuroTrack Pro</div><div style={S.logoSub}>Behavioral Analysis Suite</div></div>
        </div>
        <div style={S.tabs}>{TABS.map(t=><button key={t.id} style={S.tab(tab===t.id,t.color)} onClick={()=>setTab(t.id)}>{t.label}</button>)}</div>
        <div style={{fontSize:"9px",color:BRAND.dim,textAlign:"right",lineHeight:"1.5"}}>NeuroMatrix Biosystems<br/>Ethics: UERC/ASN/2024/2687</div>
      </div>
      <div style={S.body}>
        <div style={{marginBottom:"16px",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div><div style={{fontSize:"18px",fontWeight:"700",color:cur?.color}}>{cur?.label.split(" ").slice(1).join(" ")}</div><div style={{fontSize:"10px",color:BRAND.muted,marginTop:"4px"}}>{DESCS[tab]}</div></div>
          <div style={{fontSize:"9px",color:BRAND.dim,textAlign:"right",lineHeight:"1.8"}}>GRASP / NIH / DSI Program<br/>University of Ilorin, Nigeria</div>
        </div>
        {tab==="mwm"&&<MWMTab/>}{tab==="ymaze"&&<YMazeTab/>}{tab==="oft"&&<OFTTab/>}{tab==="nor"&&<NORTab/>}
      </div>
    </div>
  );
}
