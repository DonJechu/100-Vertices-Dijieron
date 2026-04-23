import { SHARED_CSS } from "../constants.js";
import { TeamScore, BoardTile, GameOverlay, Confetti } from "../components/SharedComponents.jsx";

/* ═══════════════════════════════════════════════════
   GAME SCREEN  "/game"  — Proyector principal
═══════════════════════════════════════════════════ */
export default function GameScreen({ G }) {
  const q    = G.questions[G.currentQ];
  const over = G.phase === "gameover";

  return (
    <div style={{
      width:"100vw",height:"100vh",overflow:"hidden",position:"relative",
      background:"#06062a",fontFamily:"'Teko',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
    }}>
      <style>{SHARED_CSS}</style>

      {/* Neon frame */}
      <div style={{position:"absolute",inset:"6px",borderRadius:20,pointerEvents:"none",zIndex:0,
        border:"4px solid #7c3aed",
        boxShadow:"inset 0 0 0 3px #06062a,inset 0 0 0 5px #c084fc30,0 0 70px #8b5cf670,0 0 130px #8b5cf630"}}/>
      {/* Dot-matrix */}
      <div style={{position:"absolute",inset:0,opacity:0.06,
        backgroundImage:"radial-gradient(circle,#93c5fd 1px,transparent 1px)",
        backgroundSize:"22px 22px",pointerEvents:"none",zIndex:0}}/>

      {/* ── SCOREBOARD ── */}
      <div style={{display:"flex",width:"90%",maxWidth:980,zIndex:2,marginBottom:14,
        borderRadius:12,overflow:"hidden",boxShadow:"0 4px 30px #0009"}}>
        <TeamScore team={G.teamA} side="left"
          active={G.activeTeam==="A"&&!G.stealMode} steal={G.stealMode&&G.activeTeam==="B"} color="#dc2626"/>
        <div style={{flexShrink:0,width:148,background:"#0e1232",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          padding:"6px 0",borderLeft:"2px solid #ffd20040",borderRight:"2px solid #ffd20040"}}>
          <div style={{fontSize:11,letterSpacing:5,color:"#ffd20099",marginBottom:2}}>RONDA</div>
          <div style={{fontSize:48,color:"#ffd200",lineHeight:1,textShadow:"0 0 16px #ffd20099"}}>{G.currentQ+1}</div>
          <div style={{display:"flex",gap:7,marginTop:3}}>
            {[0,1,2].map(i=>(
              <span key={i} style={{fontSize:20,fontWeight:700,
                color:i<G.strikes?"#ef4444":"#ffffff18",
                textShadow:i<G.strikes?"0 0 12px #ef444499":"none",
                transition:"all .25s"}}>✕</span>
            ))}
          </div>
        </div>
        <TeamScore team={G.teamB} side="right"
          active={G.activeTeam==="B"&&!G.stealMode} steal={G.stealMode&&G.activeTeam==="A"} color="#2563eb"/>
      </div>

      {/* ── MAIN BOARD ── */}
      <div style={{width:"90%",maxWidth:980,zIndex:2,
        background:"linear-gradient(170deg,#1a4fd8 0%,#1040c8 40%,#0c2fa8 100%)",
        borderRadius:16,border:"3px solid #4a90e8",padding:"14px 16px",
        boxShadow:"0 0 0 1px #1e3a8a,0 8px 40px #0009,inset 0 1px 0 #5ba8ff40"}}>

        {/* Question strip */}
        <div style={{
          background: q?.multiplier===3
            ? "linear-gradient(90deg,#6b21a8,#7c3aed,#6b21a8)"
            : q?.multiplier===2
            ? "linear-gradient(90deg,#c2410c,#ea580c,#c2410c)"
            : "linear-gradient(90deg,#0c2280,#1535a8,#0c2280)",
          borderRadius:9,padding:"9px 18px",marginBottom:12,
          textAlign:"center",border:`1px solid ${q?.multiplier===3?"#a855f780":q?.multiplier===2?"#f9731680":"#3b82f680"}`,
          boxShadow:"inset 0 1px 0 #ffffff18"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:2}}>
            <div style={{fontSize:11,letterSpacing:5,color:"#ffd20099"}}>100 VERTICES DIJIERON…</div>
            {q?.multiplier===2 && (
              <div style={{background:"#ea580c",color:"#fff",fontSize:11,fontWeight:700,
                letterSpacing:2,padding:"1px 10px",borderRadius:4}}>×2 DOBLE</div>
            )}
            {q?.multiplier===3 && (
              <div style={{background:"#7c3aed",color:"#fff",fontSize:11,fontWeight:700,
                letterSpacing:2,padding:"1px 10px",borderRadius:4}}>×3 TRIPLE</div>
            )}
          </div>
          <div style={{fontSize:"clamp(16px,2.6vw,28px)",color:"#fff",fontWeight:600,letterSpacing:1,lineHeight:1.15}}>
            {over ? "¡JUEGO TERMINADO!" : q?.question}
          </div>
        </div>

        {/* Tiles */}
        {!over && q && (
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {q.answers.map((a,i)=>(
              <BoardTile key={i} idx={i} text={a.text}
                pts={a.pts * (q.multiplier ?? 1)}
                revealed={G.revealed.includes(i)}/>
            ))}
          </div>
        )}

        {/* Game over */}
        {over && (
          <div style={{textAlign:"center",padding:"28px 0"}}>
            <div style={{fontSize:"clamp(38px,7vw,88px)",color:"#ffd200",fontWeight:700,
              animation:"glow-winner 1.5s ease-in-out infinite alternate",letterSpacing:2}}>
              🏆 {G.teamA.score>G.teamB.score?G.teamA.name:G.teamB.score>G.teamA.score?G.teamB.name:"¡EMPATE!"} 🏆
            </div>
            <div style={{display:"flex",gap:60,justifyContent:"center",marginTop:18}}>
              {[["A",G.teamA,"#fca5a5"],["B",G.teamB,"#93c5fd"]].map(([k,t,c])=>(
                <div key={k} style={{textAlign:"center"}}>
                  <div style={{fontSize:58,color:c,fontWeight:700,lineHeight:1}}>{t.score}</div>
                  <div style={{fontSize:15,color:"#ffffff80",letterSpacing:2}}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Steal banner */}
      {G.stealMode && !over && (
        <div style={{marginTop:12,width:"90%",maxWidth:980,zIndex:2,
          background:"linear-gradient(90deg,#7c2d12,#92400e,#7c2d12)",
          border:"2px solid #f59e0b",borderRadius:10,padding:"9px 22px",textAlign:"center",
          animation:"steal-pulse 1s ease infinite"}}>
          <span style={{fontSize:"clamp(14px,2vw,21px)",fontWeight:600,letterSpacing:4,color:"#fcd34d"}}>
            ⚡ OPORTUNIDAD DE ROBO — {G.activeTeam==="A"?G.teamB.name:G.teamA.name}
          </span>
        </div>
      )}

      {/* Round points */}
      <div style={{marginTop:10,zIndex:2,display:"flex",alignItems:"center",gap:12,
        background:"#0e1232cc",border:"2px solid #ffd20040",borderRadius:9,padding:"6px 22px"}}>
        <span style={{fontSize:13,letterSpacing:4,color:"#ffd20080"}}>PUNTOS EN JUEGO</span>
        <span style={{fontSize:44,color:"#ffd200",textShadow:"0 0 18px #ffd20099",fontWeight:700,lineHeight:1}}>{G.roundPts}</span>
      </div>

      {/* ── PREGUNTAS RÁPIDAS overlay ── */}
      {G.qrMode && !over && <QuickRoundProjector G={G}/>}

      <GameOverlay G={G}/>
      <Confetti on={G.phase==="gameover"}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PREGUNTAS RÁPIDAS  — overlay del proyector
═══════════════════════════════════════════════════ */
function QuickRoundProjector({ G }) {
  const q       = G.questions[G.qrCurrentQ];
  const qNum    = G.qrCurrentQ - G.qrStartIdx + 1;
  const total   = Math.min(5, G.questions.length - G.qrStartIdx);

  return (
    <div style={{position:"fixed",inset:0,zIndex:60,
      background:"#06062a",fontFamily:"'Teko',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>

      <div style={{position:"absolute",inset:"6px",borderRadius:20,pointerEvents:"none",zIndex:0,
        border:"4px solid #7c3aed",
        boxShadow:"inset 0 0 0 3px #06062a,inset 0 0 0 5px #c084fc30,0 0 80px #8b5cf680,0 0 150px #8b5cf640"}}/>
      <div style={{position:"absolute",inset:0,opacity:0.06,
        backgroundImage:"radial-gradient(circle,#93c5fd 1px,transparent 1px)",
        backgroundSize:"22px 22px",pointerEvents:"none",zIndex:0}}/>

      {/* Mini marcador QR */}
      <div style={{display:"flex",width:"min(740px,90vw)",zIndex:2,
        borderRadius:10,overflow:"hidden",boxShadow:"0 4px 20px #0009",marginBottom:4}}>
        <div style={{flex:1,background:"linear-gradient(135deg,#dc2626cc,#dc262688)",padding:"8px 16px",textAlign:"left"}}>
          <div style={{fontSize:"clamp(11px,1.3vw,15px)",color:"#ffffffcc",letterSpacing:2}}>{G.teamA.name}</div>
          <div style={{fontSize:"clamp(28px,4.5vw,52px)",color:"#fff",lineHeight:1,fontWeight:700,
            textShadow:"0 0 12px #dc2626"}}>{G.qrScoreA}</div>
        </div>
        <div style={{flexShrink:0,width:120,background:"#0e1232",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          borderLeft:"2px solid #ffd20040",borderRight:"2px solid #ffd20040",padding:"4px 0"}}>
          <div style={{fontSize:10,letterSpacing:4,color:"#ffd20099",marginBottom:2,
            animation:"qr-label-blink 1.5s ease-in-out infinite"}}>RÁPIDAS</div>
          <div style={{fontSize:40,color:"#ffd200",lineHeight:1,textShadow:"0 0 14px #ffd20099",fontWeight:700}}>{qNum}</div>
          <div style={{fontSize:10,color:"#ffffff40",letterSpacing:1}}>de {total}</div>
        </div>
        <div style={{flex:1,background:"linear-gradient(135deg,#2563ebcc,#2563eb88)",padding:"8px 16px",textAlign:"right"}}>
          <div style={{fontSize:"clamp(11px,1.3vw,15px)",color:"#ffffffcc",letterSpacing:2}}>{G.teamB.name}</div>
          <div style={{fontSize:"clamp(28px,4.5vw,52px)",color:"#fff",lineHeight:1,fontWeight:700,
            textShadow:"0 0 12px #2563eb"}}>{G.qrScoreB}</div>
        </div>
      </div>

      {/* Tablero principal */}
      <div style={{width:"min(740px,90vw)",zIndex:2,
        background:"linear-gradient(170deg,#1a4fd8 0%,#1040c8 40%,#0c2fa8 100%)",
        borderRadius:14,border:"3px solid #4a90e8",padding:"12px 14px",
        boxShadow:"0 0 0 1px #1e3a8a,0 8px 40px #0009,inset 0 1px 0 #5ba8ff40"}}>

        <div style={{background:"linear-gradient(90deg,#0c2280,#1535a8,#0c2280)",
          borderRadius:8,padding:"8px 16px",marginBottom:10,
          textAlign:"center",border:"1px solid #3b82f680",
          boxShadow:"inset 0 1px 0 #ffffff18"}}>
          <div style={{fontSize:10,letterSpacing:5,color:"#ffd20099",marginBottom:3}}>PREGUNTAS RÁPIDAS</div>
          <div style={{fontSize:"clamp(15px,2.4vw,26px)",color:"#fff",fontWeight:600,letterSpacing:1,lineHeight:1.15}}>
            {q?.question ?? "—"}
          </div>
        </div>

        {q && (
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {q.answers.map((a,i)=>(
              <BoardTile key={i} idx={i} text={a.text} pts={a.pts}
                revealed={G.qrRevealed.includes(i)} height={50}/>
            ))}
          </div>
        )}
      </div>

      <GameOverlay G={G}/>
    </div>
  );
}