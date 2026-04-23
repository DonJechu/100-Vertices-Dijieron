import { useRef } from "react";
import { A, BC } from "../constants.js";

/* ═══════════════════════════════════════════════════
   CONFETTI
═══════════════════════════════════════════════════ */
export function Confetti({ on }) {
  const ps = useRef([]);
  if (on && !ps.current.length) {
    const cl = ["#FFD700","#FF4444","#44FF88","#4488FF","#FF44FF","#FFF","#FF8800"];
    ps.current = Array.from({length:90}, (_,i) => ({
      id:i, cl:cl[i%cl.length], l:Math.random()*100,
      sz:5+Math.random()*12, dl:Math.random()*1.5, dr:2+Math.random()*3, rnd:Math.random()>.5
    }));
  }
  if (!on) { ps.current=[]; return null; }
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:400,overflow:"hidden"}}>
      {ps.current.map(p=>(
        <div key={p.id} style={{
          position:"absolute",left:`${p.l}%`,top:-20,
          width:p.sz,height:p.sz,background:p.cl,
          borderRadius:p.rnd?"50%":"2px",
          animation:`cf ${p.dr}s ${p.dl}s linear forwards`
        }}/>
      ))}
      <style>{`@keyframes cf{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   GAME OVERLAY  (X de fallo / +pts de premio)
═══════════════════════════════════════════════════ */
export function GameOverlay({ G }) {
  if (!G.overlayType) return null;
  const { overlayType:t, overlayData:d } = G;
  // How many strikes to show — use overlayData.count if present, else 1
  const strikeCount = d?.count ?? 1;
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",
      background:"#000000cc",backdropFilter:"blur(8px)"}}>
      <div style={{textAlign:"center",animation:"ov-pop .4s cubic-bezier(.36,.07,.19,.97)"}}>
        {t==="strike" && (
          <div style={{display:"flex",gap:"clamp(8px,2vw,28px)",alignItems:"center",justifyContent:"center"}}>
            {Array.from({length:strikeCount}).map((_,i)=>(
              <div key={i} style={{
                fontSize:`clamp(${strikeCount===1?"100px":"60px"},${strikeCount===1?"22vw":"12vw"},${strikeCount===1?"240px":"160px"})`,
                fontWeight:700, color:"#ef4444",
                textShadow:"0 0 60px #ef4444,0 0 120px #ef444460",
                transform:`rotate(${i%2===0?-8:8}deg)`, lineHeight:1,
              }}>✕</div>
            ))}
          </div>
        )}
        {t==="award" && (
          <>
            <div style={{fontSize:"clamp(70px,16vw,180px)",fontWeight:700,color:"#ffd200",
              textShadow:"4px 4px 0 #7f1d1d,0 0 60px #ffd200",lineHeight:.9}}>+{d.pts}</div>
            {d.multiplier && d.multiplier > 1 && (
              <div style={{fontSize:"clamp(22px,4vw,52px)",color:"#f97316",fontWeight:700,
                fontFamily:"'Teko',sans-serif",letterSpacing:2,marginTop:4}}>
                ×{d.multiplier} DOBLE
              </div>
            )}
            <div style={{fontSize:"clamp(18px,3.5vw,42px)",letterSpacing:3,color:"#fff",marginTop:10,
              fontFamily:"'Teko',sans-serif"}}>{d.team}</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BOARD TILE  (número naranja / texto+pts revelado)
═══════════════════════════════════════════════════ */
export function BoardTile({ idx, text, pts, revealed, height=54 }) {
  return (
    <div style={{
      height,borderRadius:7,overflow:"hidden",position:"relative",
      background:revealed
        ? "linear-gradient(180deg,#2d5be8 0%,#1a42c8 100%)"
        : "linear-gradient(180deg,#3a6eee 0%,#2550d0 100%)",
      border:"1.5px solid #5a9af8",
      boxShadow:"0 3px 12px #00000060,inset 0 1px 0 #ffffff28",
      animation:revealed?"tile-flip .5s cubic-bezier(.36,.07,.19,.97)":"none",
      transformOrigin:"top center",
    }}>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",
        backgroundImage:"linear-gradient(180deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.06) 35%,transparent 60%,rgba(0,0,0,0.15) 100%)"}}/>
      <div style={{position:"absolute",top:"33%",left:0,right:0,height:1,background:"rgba(255,255,255,0.12)"}}/>
      <div style={{position:"absolute",top:"66%",left:0,right:0,height:1,background:"rgba(255,255,255,0.08)"}}/>

      <div style={{position:"relative",height:"100%",display:"flex",alignItems:"center",padding:"0 14px",gap:12}}>
        {revealed ? (
          <>
            <span style={{flex:1,fontSize:"clamp(15px,2.1vw,25px)",fontWeight:600,color:"#fff",
              letterSpacing:1.5,textShadow:"0 1px 4px #00000080"}}>
              {text.toUpperCase()}
            </span>
            <div style={{background:"linear-gradient(135deg,#1e3a8a,#0f2060)",
              border:"2px solid #3b82f6",borderRadius:5,
              minWidth:58,padding:"2px 10px",textAlign:"center",
              boxShadow:"inset 0 1px 0 #ffffff18"}}>
              <span style={{fontSize:"clamp(18px,2.4vw,30px)",fontWeight:700,color:"#ffd200",
                textShadow:"0 0 10px #ffd20099",lineHeight:1}}>{pts}</span>
            </div>
          </>
        ) : (
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{
              width:38,height:38,borderRadius:"50%",
              background:"linear-gradient(135deg,#f97316,#c2410c)",
              border:"2.5px solid #fed7aa",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 2px 8px #c2410c80",
            }}>
              <span style={{fontSize:20,fontWeight:700,color:"#fff",lineHeight:1}}>{idx+1}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TEAM SCORE PANEL  (proyector)
═══════════════════════════════════════════════════ */
export function TeamScore({ team, side, active, steal, color }) {
  return (
    <div style={{
      flex:1,background:`linear-gradient(135deg,${color}cc,${color}88)`,
      padding:"10px 18px",textAlign:side==="right"?"right":"left",
      position:"relative",
      outline:active?"3px solid #ffd200":steal?"3px solid #f59e0b":"none",
      outlineOffset:-3,
    }}>
      {active && <div style={{position:"absolute",bottom:4,[side==="right"?"right":"left"]:12,fontSize:9,letterSpacing:3,color:"#ffd200"}}>▼ TURNO</div>}
      {steal  && <div style={{position:"absolute",bottom:4,[side==="right"?"right":"left"]:12,fontSize:9,letterSpacing:3,color:"#fcd34d"}}>⚡ ROBO</div>}
      <div style={{fontSize:"clamp(12px,1.4vw,17px)",color:"#ffffffcc",letterSpacing:2}}>{team.name}</div>
      <div style={{fontSize:"clamp(38px,5vw,66px)",color:"#fff",lineHeight:1,textShadow:`0 0 18px ${color}`,fontWeight:700}}>{team.score}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN MICRO COMPONENTS
═══════════════════════════════════════════════════ */
export function Card({ title, children }) {
  return (
    <div style={{background:A.surface,border:`1px solid ${A.border}`,borderRadius:8,padding:14}}>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:2,color:A.muted,textTransform:"uppercase",
        marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${A.border}`}}>{title}</div>
      {children}
    </div>
  );
}

export function Row({ children, style={} }) {
  return <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",...style}}>{children}</div>;
}

export function Btn({ color="ghost", onClick, children, disabled, style={} }) {
  const c = BC[color]||BC.ghost;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border:"none",cursor:disabled?"not-allowed":"pointer",
      borderRadius:6,padding:"7px 14px",fontSize:13,fontWeight:500,
      background:c.bg,color:c.tx,boxShadow:`0 3px 0 ${c.sh}`,
      transition:"all .12s",opacity:disabled?.4:1,fontFamily:"inherit",...style,
    }}>{children}</button>
  );
}

export function SmBtn({ color="ghost", onClick, children, disabled }) {
  const c = BC[color]||BC.ghost;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border:"none",cursor:disabled?"not-allowed":"pointer",
      borderRadius:5,padding:"4px 10px",fontSize:12,fontWeight:500,
      background:c.bg,color:c.tx,boxShadow:`0 2px 0 ${c.sh}`,
      transition:"all .12s",opacity:disabled?.4:1,fontFamily:"inherit",
    }}>{children}</button>
  );
}