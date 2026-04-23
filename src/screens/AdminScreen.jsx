import { useState, useCallback, useEffect } from "react";
import { SHARED_CSS, A, openTab, navigate,
         loadTournament, saveTournament, BLANK_TOURNAMENT,
         loadConfig, saveConfig, DEFAULT_CONFIG } from "../constants.js";
import { Card, Row, Btn, SmBtn } from "../components/SharedComponents.jsx";

/* ═══════════════════════════════════════════════════
   COLLAPSIBLE SECTION
═══════════════════════════════════════════════════ */
function Section({ title, defaultOpen=false, accent=false, badge=null, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{background:A.surface, border:`1px solid ${accent?A.accent:A.border}`, borderRadius:8, overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"11px 14px", background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit",
      }}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <span style={{fontWeight:600, fontSize:13, color:accent?A.accent:A.text}}>{title}</span>
          {badge && <span style={{fontSize:10, background:A.accent, color:"#111", borderRadius:10, padding:"1px 8px", fontWeight:700}}>{badge}</span>}
        </div>
        <span style={{color:A.muted, fontSize:11}}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{padding:"0 14px 14px", borderTop:`1px solid ${A.border}`}}>
          <div style={{marginTop:12}}>{children}</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SETUP WIZARD
═══════════════════════════════════════════════════ */
function SetupWizard({ onDone }) {
  const [step, setStep]   = useState(1);
  const [cfg, setCfg]     = useState({ teamCount:8, questionsPerMatch:5, playRapidas:false });
  const [names, setNames] = useState(() => Array.from({length:8}, (_,i)=>`Familia ${i+1}`));

  const updateTeamCount = (n) => {
    setCfg(c=>({...c, teamCount:n}));
    setNames(Array.from({length:n}, (_,i)=>`Familia ${i+1}`));
  };

  const isPow2 = (n) => n>1 && (n&(n-1))===0;
  const canNext1 = isPow2(cfg.teamCount) && cfg.teamCount >= 4;
  const canNext2 = cfg.questionsPerMatch >= 1;
  const allNamed = names.every(n=>n.trim().length>0);

  const handleDone = () => {
    const finalCfg = {...cfg, configured:true};
    saveConfig(finalCfg);
    onDone(finalCfg, names.map(n=>n.trim()));
  };

  const TEAM_PRESETS = [4, 8, 16];

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(0,0,0,.85)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}>
      <div style={{
        background:"#161b22", border:`2px solid ${A.accent}`,
        borderRadius:16, width:"100%", maxWidth:560,
        boxShadow:`0 0 60px rgba(252,211,77,.2)`,
        animation:"wizard-in .3s ease",
        maxHeight:"90vh", overflowY:"auto",
      }}>

        {/* Header */}
        <div style={{padding:"22px 28px 18px", borderBottom:`1px solid ${A.border}`}}>
          <div style={{fontSize:11, letterSpacing:3, color:A.accent, marginBottom:4}}>CONFIGURACIÓN INICIAL</div>
          <div style={{fontFamily:"'Teko',sans-serif", fontSize:28, color:"#fff", lineHeight:1}}>
            100 Mexicanos Dijeron
          </div>
          {/* Step indicator */}
          <div style={{display:"flex", gap:6, marginTop:14}}>
            {[1,2,3].map(s=>(
              <div key={s} style={{
                flex:1, height:4, borderRadius:2,
                background: s<=step ? A.accent : A.border,
                transition:"background .3s",
              }}/>
            ))}
          </div>
          <div style={{fontSize:12, color:A.muted, marginTop:6}}>
            Paso {step} de 3 — {["Equipos","Reglas","Nombres"][step-1]}
          </div>
        </div>

        <div style={{padding:"22px 28px"}}>

          {/* ── PASO 1: Cantidad de equipos ── */}
          {step===1 && (
            <div>
              <div style={{fontSize:16, fontWeight:600, color:A.text, marginBottom:6}}>
                ¿Cuántos equipos participan?
              </div>
              <div style={{fontSize:13, color:A.muted, marginBottom:18}}>
                El número debe ser potencia de 2 (4, 8, 16…) para el bracket de eliminación directa.
              </div>

              {/* Presets */}
              <div style={{display:"flex", gap:8, marginBottom:14}}>
                {TEAM_PRESETS.map(n=>(
                  <button key={n} onClick={()=>updateTeamCount(n)} style={{
                    flex:1, padding:"14px 0", borderRadius:8, cursor:"pointer",
                    border:`2px solid ${cfg.teamCount===n?A.accent:A.border}`,
                    background: cfg.teamCount===n ? "rgba(252,211,77,.1)" : "transparent",
                    color: cfg.teamCount===n ? A.accent : A.text,
                    fontFamily:"'Teko',sans-serif", fontSize:32, fontWeight:700,
                    transition:"all .2s",
                  }}>{n}</button>
                ))}
              </div>

              {/* Custom */}
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <span style={{fontSize:13, color:A.muted, flexShrink:0}}>Número personalizado:</span>
                <input type="number" min={4} max={32} value={cfg.teamCount}
                  onChange={e=>updateTeamCount(parseInt(e.target.value)||4)}
                  style={{width:80, textAlign:"center", fontSize:18, fontWeight:700, color:A.accent}}/>
                {!isPow2(cfg.teamCount) && (
                  <span style={{fontSize:12, color:"#f87171"}}>⚠ Debe ser 4, 8, 16 o 32</span>
                )}
              </div>

              <div style={{marginTop:24, fontSize:13, color:A.muted, background:"#0d1117",
                borderRadius:8, padding:"12px 14px", border:`1px solid ${A.border}`}}>
                📋 Se generará un bracket de <strong style={{color:A.text}}>{Math.log2(cfg.teamCount)} rondas</strong> con <strong style={{color:A.text}}>{cfg.teamCount/2} partidas</strong> en primera ronda.
              </div>
            </div>
          )}

          {/* ── PASO 2: Reglas de partida ── */}
          {step===2 && (
            <div>
              <div style={{fontSize:16, fontWeight:600, color:A.text, marginBottom:18}}>
                Reglas de cada partida
              </div>

              {/* Preguntas por partida */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:14, fontWeight:600, color:A.text, marginBottom:4}}>
                  Preguntas por partida (Ronda Familiar)
                </div>
                <div style={{fontSize:12, color:A.muted, marginBottom:10}}>
                  Cuántas preguntas se jugarán como máximo por cada enfrentamiento.
                </div>
                <div style={{display:"flex", gap:8, marginBottom:8}}>
                  {[3,5,7,10].map(n=>(
                    <button key={n} onClick={()=>setCfg(c=>({...c,questionsPerMatch:n}))} style={{
                      flex:1, padding:"10px 0", borderRadius:7, cursor:"pointer",
                      border:`2px solid ${cfg.questionsPerMatch===n?A.accent:A.border}`,
                      background: cfg.questionsPerMatch===n?"rgba(252,211,77,.1)":"transparent",
                      color: cfg.questionsPerMatch===n?A.accent:A.text,
                      fontFamily:"'Teko',sans-serif", fontSize:26, fontWeight:700,
                      transition:"all .2s",
                    }}>{n}</button>
                  ))}
                </div>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:13, color:A.muted}}>Personalizado:</span>
                  <input type="number" min={1} max={30} value={cfg.questionsPerMatch}
                    onChange={e=>setCfg(c=>({...c,questionsPerMatch:parseInt(e.target.value)||1}))}
                    style={{width:70, textAlign:"center", fontSize:18, fontWeight:700, color:A.accent}}/>
                </div>
              </div>

              {/* Multiplicadores por pregunta */}
              {cfg.questionsPerMatch > 1 && (
                <div style={{marginBottom:20, borderTop:`1px solid ${A.border}`, paddingTop:18}}>
                  <div style={{fontSize:14, fontWeight:600, color:A.text, marginBottom:4}}>
                    Preguntas Dobles y Triples
                  </div>
                  <div style={{fontSize:12, color:A.muted, marginBottom:14}}>
                    Asigna un multiplicador a cada pregunta. Las preguntas dobles valen el doble de puntos, las triples el triple.
                  </div>
                  <div style={{display:"flex", flexDirection:"column", gap:8}}>
                    {Array.from({length:cfg.questionsPerMatch},(_,i)=>{
                      const qNum = i+1;
                      const mult = cfg.multipliers?.[i] ?? 1;
                      return (
                        <div key={i} style={{display:"flex", alignItems:"center", gap:10}}>
                          <div style={{
                            width:28, height:28, borderRadius:"50%", flexShrink:0,
                            background: mult===3?"#7c3aed":mult===2?"#ea580c":"#374151",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:13, fontWeight:700, color:"#fff",
                          }}>{qNum}</div>
                          <div style={{flex:1, display:"flex", gap:6}}>
                            {[
                              [1,"×1 Normal","#374151","#d1d5db"],
                              [2,"×2 Doble","#ea580c","#fff"],
                              [3,"×3 Triple","#7c3aed","#fff"],
                            ].map(([m,label,bg,tx])=>(
                              <button key={m} onClick={()=>{
                                const mults = [...(cfg.multipliers ?? Array(cfg.questionsPerMatch).fill(1))];
                                mults[i] = m;
                                setCfg(c=>({...c, multipliers:mults}));
                              }} style={{
                                flex:1, padding:"6px 0", borderRadius:6, cursor:"pointer",
                                border:`2px solid ${mult===m?bg:A.border}`,
                                background: mult===m ? `${bg}33` : "transparent",
                                color: mult===m ? (m===1?A.text:bg) : A.muted,
                                fontFamily:"inherit", fontSize:12, fontWeight:700,
                                transition:"all .15s",
                              }}>{label}</button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rápidas */}
              <div style={{borderTop:`1px solid ${A.border}`, paddingTop:20}}>
                <div style={{fontSize:14, fontWeight:600, color:A.text, marginBottom:4}}>
                  ¿Se juegan Preguntas Rápidas?
                </div>
                <div style={{fontSize:12, color:A.muted, marginBottom:12}}>
                  Fase adicional opcional donde ambos equipos compiten por responder primero.
                  Los puntos se suman al marcador de la ronda familiar.
                </div>
                <div style={{display:"flex", gap:8}}>
                  <button onClick={()=>setCfg(c=>({...c,playRapidas:true}))} style={{
                    flex:1, padding:"12px", borderRadius:8, cursor:"pointer",
                    border:`2px solid ${cfg.playRapidas?A.accent:A.border}`,
                    background:cfg.playRapidas?"rgba(252,211,77,.1)":"transparent",
                    color:cfg.playRapidas?A.accent:A.muted,
                    fontWeight:600, fontSize:14, fontFamily:"inherit", transition:"all .2s",
                  }}>
                    ⚡ Sí, incluir Rápidas
                  </button>
                  <button onClick={()=>setCfg(c=>({...c,playRapidas:false}))} style={{
                    flex:1, padding:"12px", borderRadius:8, cursor:"pointer",
                    border:`2px solid ${!cfg.playRapidas?A.accent:A.border}`,
                    background:!cfg.playRapidas?"rgba(252,211,77,.1)":"transparent",
                    color:!cfg.playRapidas?A.accent:A.muted,
                    fontWeight:600, fontSize:14, fontFamily:"inherit", transition:"all .2s",
                  }}>
                    👨‍👩‍👧 Solo Ronda Familiar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 3: Nombres ── */}
          {step===3 && (
            <div>
              <div style={{fontSize:16, fontWeight:600, color:A.text, marginBottom:4}}>
                Nombres de los {cfg.teamCount} equipos
              </div>
              <div style={{fontSize:12, color:A.muted, marginBottom:16}}>
                Escribe el nombre de cada familia participante.
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, maxHeight:320, overflowY:"auto"}}>
                {names.map((name,i)=>(
                  <div key={i} style={{display:"flex", alignItems:"center", gap:8}}>
                    <div style={{
                      width:26, height:26, borderRadius:"50%", flexShrink:0,
                      background: i%2===0?"#dc2626":"#2563eb",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:12, fontWeight:700, color:"#fff",
                    }}>{i+1}</div>
                    <input value={name} style={{flex:1}}
                      placeholder={`Familia ${i+1}`}
                      onChange={e=>{ const n=[...names]; n[i]=e.target.value; setNames(n); }}/>
                  </div>
                ))}
              </div>
              {!allNamed && (
                <div style={{marginTop:10, fontSize:12, color:"#f87171"}}>
                  ⚠ Todos los equipos deben tener un nombre.
                </div>
              )}

              {/* Resumen */}
              <div style={{marginTop:18, background:"#0d1117", borderRadius:8, padding:"14px",
                border:`1px solid ${A.border}`, fontSize:13}}>
                <div style={{color:A.accent, fontWeight:600, marginBottom:8}}>Resumen del torneo</div>
                <div style={{color:A.muted, display:"flex", flexDirection:"column", gap:4}}>
                  <span>🏆 <strong style={{color:A.text}}>{cfg.teamCount} equipos</strong> — {Math.log2(cfg.teamCount)} rondas de eliminación</span>
                  <span>❓ <strong style={{color:A.text}}>{cfg.questionsPerMatch} preguntas</strong> por partida</span>
                  {cfg.multipliers?.some(m=>m>1) && (
                    <span style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                      {cfg.multipliers.map((m,i)=>m>1
                        ? <span key={i} style={{background:m===3?"#7c3aed33":"#ea580c33",
                            border:`1px solid ${m===3?"#7c3aed":"#ea580c"}`,
                            borderRadius:4, padding:"1px 8px", fontSize:11,
                            color:m===3?"#a855f7":"#f97316", fontWeight:700}}>
                            P{i+1} ×{m}
                          </span>
                        : null
                      )}
                    </span>
                  )}
                  <span>{cfg.playRapidas?"⚡ Con Preguntas Rápidas":"👨‍👩‍👧 Solo Ronda Familiar"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer navigation */}
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:24}}>
            <button onClick={()=>setStep(s=>s-1)} disabled={step===1} style={{
              background:"transparent", border:`1px solid ${A.border}`, borderRadius:7,
              padding:"8px 18px", color:step===1?A.border:A.muted, cursor:step===1?"default":"pointer",
              fontFamily:"inherit", fontSize:13,
            }}>← Atrás</button>

            {step < 3 ? (
              <button onClick={()=>setStep(s=>s+1)}
                disabled={step===1?!canNext1:!canNext2}
                style={{
                  background: (step===1?canNext1:canNext2) ? A.accent : A.border,
                  border:"none", borderRadius:7, padding:"10px 28px",
                  color:(step===1?canNext1:canNext2)?"#111":"#6b7280",
                  cursor:(step===1?canNext1:canNext2)?"pointer":"default",
                  fontFamily:"inherit", fontSize:14, fontWeight:700, transition:"all .2s",
                }}>Siguiente →</button>
            ) : (
              <button onClick={handleDone} disabled={!allNamed} style={{
                background: allNamed ? A.accent : A.border,
                border:"none", borderRadius:7, padding:"12px 32px",
                color: allNamed ? "#111" : "#6b7280",
                cursor: allNamed ? "pointer" : "default",
                fontFamily:"inherit", fontSize:15, fontWeight:700, transition:"all .2s",
              }}>🚀 ¡Comenzar torneo!</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN SCREEN
═══════════════════════════════════════════════════ */
export default function AdminScreen({ G, dispatch }) {
  const [tab, setTab]     = useState("game");
  const [T, setT]         = useState(loadTournament);
  const [cfg, setCfg]     = useState(loadConfig);
  const [showWizard, setShowWizard] = useState(() => !loadConfig().configured);
  const q                 = G.questions[G.currentQ];

  const saveT = useCallback(t => { setT(saveTournament(t)); }, []);

  /* ── Wizard completion ── */
  const handleWizardDone = useCallback((finalCfg, teamNames) => {
    setCfg(finalCfg);
    const newT = BLANK_TOURNAMENT(teamNames);
    saveT(newT);
    setShowWizard(false);
    const firstMatch = newT.rounds[0][0];
    dispatch({type:"SETUP_MATCH", cfg:finalCfg, teamA:firstMatch.teamA, teamB:firstMatch.teamB});
  }, [dispatch, saveT]);

  /* ── Find active match ── */
  const findActiveMatch = useCallback((tournament=T) => {
    for (let ri=0; ri<tournament.rounds.length; ri++) {
      for (let mi=0; mi<tournament.rounds[ri].length; mi++) {
        const m = tournament.rounds[ri][mi];
        if (m.status!=="done" && m.teamA!=="?" && m.teamB!=="?" &&
            ((m.teamA===G.teamA.name && m.teamB===G.teamB.name) ||
             (m.teamB===G.teamA.name && m.teamA===G.teamB.name))) {
          return {ri, mi};
        }
      }
    }
    return null;
  }, [G.teamA.name, G.teamB.name, T]);

  /* ── Auto-sync scores to tournament whenever either team's score changes ── */
  useEffect(()=>{
    const pos = findActiveMatch();
    if (!pos) return;
    const {ri, mi} = pos;
    const current = T.rounds[ri][mi];
    const newScoreA = G.teamA.score;
    const newScoreB = G.teamB.score;
    // Only write if something actually changed to avoid infinite loop
    if (current.scoreA === newScoreA && current.scoreB === newScoreB) return;
    const newT = JSON.parse(JSON.stringify(T));
    newT.rounds[ri][mi].scoreA = newScoreA;
    newT.rounds[ri][mi].scoreB = newScoreB;
    saveT(newT);
  }, [G.teamA.score, G.teamB.score]);

  /* ── setWinner ── */
  const setWinner = useCallback((roundIdx, matchIdx, winner) => {
    const newT = JSON.parse(JSON.stringify(T));
    const match = newT.rounds[roundIdx][matchIdx];
    match.winner = winner;
    match.status = "done";
    match.scoreA = G.teamA.score;
    match.scoreB = G.teamB.score;

    const nextRound = roundIdx+1;
    if (nextRound < newT.rounds.length) {
      const nextMatchIdx = Math.floor(matchIdx/2);
      const slot = matchIdx%2===0 ? "teamA" : "teamB";
      newT.rounds[nextRound][nextMatchIdx][slot] = winner;
      newT.rounds[nextRound][nextMatchIdx].status = "pending";
    } else {
      newT.champion = winner;
    }
    saveT(newT);

    // Auto-load next pending match in same round
    const nextInRound = newT.rounds[roundIdx].find(
      (m,i) => i!==matchIdx && m.status==="pending" && m.teamA!=="?" && m.teamB!=="?"
    );
    // Or first match in next round if all done in this round
    const nextInNextRound = nextRound < newT.rounds.length
      ? newT.rounds[nextRound].find(m => m.status==="pending" && m.teamA!=="?" && m.teamB!=="?")
      : null;

    const next = nextInRound || nextInNextRound;
    if (next) dispatch({type:"SETUP_MATCH", cfg, teamA:next.teamA, teamB:next.teamB});
  }, [T, G]);

  const loadMatch = useCallback((ri, mi) => {
    const m = T.rounds[ri][mi];
    dispatch({type:"SETUP_MATCH", cfg, teamA:m.teamA, teamB:m.teamB});
  }, [T, cfg]);

  const syncScore = useCallback((ri,mi) => {
    const newT = JSON.parse(JSON.stringify(T));
    const m = newT.rounds[ri][mi];
    if (m.teamA===G.teamA.name) { m.scoreA=G.teamA.score; m.scoreB=G.teamB.score; }
    else if (m.teamA===G.teamB.name) { m.scoreA=G.teamB.score; m.scoreB=G.teamA.score; }
    else { m.scoreA=G.teamA.score; m.scoreB=G.teamB.score; }
    saveT(newT);
  }, [T, G]);

  const renameTeam = (idx, name) => {
    const newT = JSON.parse(JSON.stringify(T));
    const old = newT.teams[idx];
    newT.teams[idx] = name;
    newT.rounds = newT.rounds.map(r=>r.map(m=>({
      ...m,
      teamA: m.teamA===old?name:m.teamA,
      teamB: m.teamB===old?name:m.teamB,
      winner:m.winner===old?name:m.winner,
    })));
    saveT(newT);
    if (G.teamA.name===old) dispatch({type:"SET_TEAM",t:"A",f:"name",v:name});
    if (G.teamB.name===old) dispatch({type:"SET_TEAM",t:"B",f:"name",v:name});
  };

  const setScore = (ri,mi,team,val) => {
    const newT = JSON.parse(JSON.stringify(T));
    newT.rounds[ri][mi][team==="A"?"scoreA":"scoreB"] = val;
    saveT(newT);
  };

  const resetAll = () => {
    if (!confirm("¿Reiniciar TODO? Esto borrará el torneo, equipos y puntos. Se mostrará el wizard de configuración.")) return;
    localStorage.clear();
    setCfg(DEFAULT_CONFIG);
    setShowWizard(true);
  };

  const ROUND_NAMES = ["Cuartos de Final","Semifinales","Final","Ronda 4","Ronda 5"];
  const activePos = findActiveMatch();

  return (
    <div style={{minHeight:"100vh", background:A.bg, color:A.text,
      fontFamily:"'Inter',system-ui,sans-serif", fontSize:14, display:"flex", flexDirection:"column"}}>
      <style>{`
        ${SHARED_CSS}
        input,select,textarea{font-family:inherit;background:#111827;color:#f3f4f6;
          border:1px solid #374151;border-radius:6px;padding:6px 10px;outline:none;}
        input:focus,select:focus{border-color:#fcd34d}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#374151;border-radius:2px}
      `}</style>

      {/* ── WIZARD ── */}
      {showWizard && <SetupWizard onDone={handleWizardDone}/>}

      {/* ── TOP BAR ── */}
      <div style={{background:A.surface, borderBottom:`1px solid ${A.border}`,
        padding:"10px 16px", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap",
        position:"sticky", top:0, zIndex:10}}>
        <span style={{fontFamily:"'Teko',sans-serif", fontWeight:700, fontSize:18,
          color:A.accent, letterSpacing:.5, flexShrink:0}}>100 Mexicanos</span>
        <div style={{display:"flex", gap:5, flex:1, flexWrap:"wrap"}}>
          {[["game","🎯 Juego"],["torneo","🏆 Torneo"],["editor","✏️ Preguntas"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              border:"none", cursor:"pointer", borderRadius:6, padding:"5px 14px",
              fontSize:13, fontWeight:500, transition:"all .15s",
              background:tab===t?A.accent:"#374151",
              color:tab===t?"#111":"#d1d5db",
            }}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex", gap:6, flexShrink:0}}>
          <SmBtn onClick={()=>openTab("/game")} color="blue">📺 Proyector</SmBtn>
          <SmBtn onClick={()=>setShowWizard(true)} color="ghost">⚙ Config</SmBtn>
          <SmBtn onClick={resetAll} color="ghost">🔄 Reset total</SmBtn>
          <SmBtn onClick={()=>navigate("/")} color="ghost">← Menú</SmBtn>
        </div>
      </div>

      {/* ── CONFIG BADGE ── */}
      {cfg.configured && (
        <div style={{background:"#0d1117", borderBottom:`1px solid ${A.border}`,
          padding:"5px 16px", display:"flex", gap:16, fontSize:11, color:A.muted}}>
          <span>👥 {T.teams.length} equipos</span>
          <span>❓ {cfg.questionsPerMatch} preguntas/partida</span>
          <span>{cfg.playRapidas?"⚡ Con Rápidas":"👨‍👩‍👧 Solo Familiar"}</span>
          <button onClick={()=>setShowWizard(true)}
            style={{background:"none", border:"none", color:A.accent, cursor:"pointer",
              fontSize:11, fontFamily:"inherit", padding:0, marginLeft:"auto"}}>
            ✏ Editar configuración
          </button>
        </div>
      )}

      <div style={{flex:1, overflowY:"auto", padding:"14px 16px", maxWidth:860,
        width:"100%", alignSelf:"center", display:"flex", flexDirection:"column", gap:10}}>
        {tab==="game" && (
          <GameTab G={G} dispatch={dispatch} q={q} T={T} cfg={cfg}
            activePos={activePos} onWinner={setWinner} onSyncScore={syncScore}/>
        )}
        {tab==="torneo" && (
          <TorneoTab G={G} T={T} dispatch={dispatch}
            onWinner={setWinner} onSync={syncScore} onLoad={loadMatch}
            onRename={renameTeam} onSetScore={setScore} onReset={resetAll}
            ROUND_NAMES={ROUND_NAMES}/>
        )}
        {tab==="editor" && <EditorTab G={G} dispatch={dispatch}/>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   GAME TAB
═══════════════════════════════════════════════════ */
function GameTab({ G, dispatch, q, T, cfg, activePos, onWinner, onSyncScore }) {
  const matchBanner = activePos ? T.rounds[activePos.ri][activePos.mi] : null;

  const finalizarPartida = (winnerTeam) => {
    const winnerName = winnerTeam==="A" ? G.teamA.name : G.teamB.name;
    if (!confirm(`¿Cerrar partida?\nGanador: ${winnerName}\n\nSe cargará la siguiente partida automáticamente.`)) return;
    if (activePos) onWinner(activePos.ri, activePos.mi, winnerName);
    dispatch({type:"END"});
  };

  // Auto-winner by score — used in banner
  const autoWinnerTeam = G.teamA.score > G.teamB.score ? "A"
    : G.teamB.score > G.teamA.score ? "B" : null;

  return (
    <>
      {/* PARTIDA EN CURSO */}
      {matchBanner && !G.phase==="gameover" && (
        <div style={{background:"rgba(252,211,77,.07)", border:`1px solid ${A.accent}`,
          borderRadius:8, padding:"10px 14px"}}>
          <div style={{fontSize:10, letterSpacing:2, color:A.accent, marginBottom:3}}>PARTIDA EN CURSO</div>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8}}>
            <div style={{fontSize:14, color:A.text, fontWeight:600}}>
              {matchBanner.teamA} vs {matchBanner.teamB}
            </div>
            <div style={{display:"flex", gap:6}}>
              <SmBtn color="red"  onClick={()=>finalizarPartida("A")}>
                🏆 Ganó {G.teamA.name} ({G.teamA.score}p)
              </SmBtn>
              <SmBtn color="blue" onClick={()=>finalizarPartida("B")}>
                🏆 Ganó {G.teamB.name} ({G.teamB.score}p)
              </SmBtn>
            </div>
          </div>
          {autoWinnerTeam && (
            <div style={{marginTop:6, fontSize:11, color:"#4ade80"}}>
              💡 Por puntaje actual gana: <strong>{autoWinnerTeam==="A"?G.teamA.name:G.teamB.name}</strong>
            </div>
          )}
        </div>
      )}

      {G.phase==="gameover" && !activePos && (
        <div style={{background:"rgba(22,163,74,.1)", border:"1px solid #16a34a",
          borderRadius:8, padding:"10px 14px", fontSize:13, color:"#4ade80"}}>
          ✓ Partida finalizada — ve al tab <strong>🏆 Torneo</strong> para ver el bracket.
        </div>
      )}

      {/* MODO */}
      <div style={{display:"flex", gap:8}}>
        {[["familiar","👨‍👩‍👧 Ronda Familiar"],
          ...(cfg.playRapidas?[["rapidas","⚡ Rápidas"]]:[])
        ].map(([v,l])=>(
          <button key={v} onClick={()=>dispatch({type:"SET_MODE",v})} style={{
            flex:1, border:`2px solid ${G.gameMode===v?A.accent:A.border}`,
            borderRadius:8, background:G.gameMode===v?"rgba(252,211,77,.1)":"transparent",
            cursor:"pointer", padding:"10px 14px", transition:"all .2s",
          }}>
            <div style={{fontWeight:700, fontSize:15, color:G.gameMode===v?A.accent:A.text}}>{l}</div>
          </button>
        ))}
      </div>

      {/* MARCADOR — click para cambiar turno */}
      <div style={{display:"flex", gap:0, borderRadius:8, overflow:"hidden",
        border:`1px solid ${A.border}`, background:A.surface}}>
        {[["A","#dc2626"],["B","#2563eb"]].map(([t,c])=>{
          const tm=t==="A"?G.teamA:G.teamB;
          const active=G.activeTeam===t&&!G.stealMode;
          const steal=G.stealMode&&G.activeTeam===t;
          return (
            <div key={t}
              onClick={()=>dispatch({type:"SET_ACTIVE",v:t})}
              title="Clic para dar el turno a este equipo"
              style={{flex:1, padding:"10px 14px", cursor:"pointer",
                background:active?`${c}22`:steal?"rgba(245,158,11,.1)":"transparent",
                borderLeft:t==="B"?`1px solid ${A.border}`:"none",
                outline:active?`2px solid ${c}`:steal?"2px solid #f59e0b":"none",
                outlineOffset:-2, transition:"background .15s",
                userSelect:"none",
              }}>
              <div style={{fontSize:11, color:A.muted, marginBottom:2}}>
                {tm.name}
                {active && <span style={{color:c, marginLeft:5}}>▶ TURNO</span>}
                {steal  && <span style={{color:"#f59e0b", marginLeft:5}}>⚡ ROBO</span>}
              </div>
              <div style={{fontSize:38, fontWeight:700,
                color:t==="A"?"#fca5a5":"#93c5fd",
                fontFamily:"'Teko',sans-serif", lineHeight:1}}>{tm.score}</div>
            </div>
          );
        })}
        <div style={{flexShrink:0, width:80, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", borderLeft:`1px solid ${A.border}`, padding:"6px 0"}}>
          <div style={{fontSize:10, letterSpacing:3, color:A.muted}}>RONDA</div>
          <div style={{fontSize:28, color:A.accent, fontFamily:"'Teko',sans-serif", lineHeight:1}}>{G.currentQ+1}</div>
          <div style={{display:"flex", gap:4}}>
            {[0,1,2].map(i=>(
              <span key={i} style={{fontSize:13, color:i<G.strikes?"#ef4444":"#ffffff18"}}>✕</span>
            ))}
          </div>
        </div>
      </div>

      {/* PREGUNTA */}
      <div style={{background:A.surface, borderRadius:8, padding:"10px 14px",
        border:`1px solid ${A.border}`, fontSize:13, color:A.muted, fontStyle:"italic"}}>
        {q?.question || "—"}
      </div>

      {G.gameMode==="familiar" && <FamiliarControls G={G} dispatch={dispatch} q={q}/>}
      {G.gameMode==="rapidas"  && <RapidasControls  G={G} dispatch={dispatch}/>}

      {/* AVANZADO */}
      <Section title="⚙️ Controles avanzados">
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11, color:A.muted, marginBottom:6, letterSpacing:1}}>TURNO ACTIVO</div>
          <Row>
            {[["A","red"],["B","blue"]].map(([t,c])=>(
              <Btn key={t} color={G.activeTeam===t?c:"ghost"} onClick={()=>dispatch({type:"SET_ACTIVE",v:t})}>
                {t==="A"?G.teamA.name:G.teamB.name}{G.activeTeam===t?" ◀":""}
              </Btn>
            ))}
          </Row>
        </div>
        <Row style={{marginBottom:12}}>
          <Btn color={G.stealMode?"yellow":"ghost"} onClick={()=>dispatch({type:"TOGGLE_STEAL"})}>
            {G.stealMode?"✓ Quitar robo":"⚡ Activar robo"}
          </Btn>
          <Btn color="ghost" onClick={()=>dispatch({type:"RST_STRIKES"})}>↺ Reset fallos</Btn>
        </Row>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11, color:A.muted, marginBottom:6, letterSpacing:1}}>NAVEGAR PREGUNTAS</div>
          <Row>
            <Btn onClick={()=>dispatch({type:"PREV_Q"})} disabled={G.currentQ===0} color="ghost">◀ Ant</Btn>
            <Btn onClick={()=>dispatch({type:"NEXT_Q"})} disabled={G.currentQ>=G.questions.length-1||G.phase==="gameover"} color="ghost">Sig ▶</Btn>
            <Btn onClick={()=>dispatch({type:"RST_ROUND"})} color="ghost">↺ Reset ronda</Btn>
          </Row>
        </div>
        <Row>
          <Btn color="red" onClick={()=>{if(confirm("¿Reiniciar esta partida?"))dispatch({type:"SETUP_MATCH",cfg,teamA:G.teamA.name,teamB:G.teamB.name})}}>🔄 Reiniciar partida</Btn>
        </Row>
      </Section>

      <Section title="🔢 Ajuste manual de puntos">
        <div style={{display:"flex", gap:16, flexWrap:"wrap"}}>
          <ScoreAdj label={`🔴 ${G.teamA.name}`} val={G.teamA.score} onChange={v=>dispatch({type:"SET_SCORE",t:"A",v})}/>
          <ScoreAdj label={`🔵 ${G.teamB.name}`} val={G.teamB.score} onChange={v=>dispatch({type:"SET_SCORE",t:"B",v})}/>
        </div>
      </Section>
    </>
  );
}

/* ── FAMILIAR CONTROLS ── */
function FamiliarControls({ G, dispatch, q }) {
  return (
    <>
      <div style={{background:A.surface, borderRadius:8, border:`1px solid ${A.border}`, overflow:"hidden"}}>
        <div style={{padding:"10px 14px", borderBottom:`1px solid ${A.border}`,
          fontSize:11, fontWeight:600, letterSpacing:2, color:A.muted, textTransform:"uppercase"}}>
          Respuestas
        </div>
        {q ? (
          <div style={{padding:"8px 14px", display:"flex", flexDirection:"column", gap:5}}>
            {q.answers.map((a,i)=>{
              const rev=G.revealed.includes(i);
              return (
                <div key={i} style={{display:"flex", alignItems:"center", gap:8,
                  background:rev?"#14532d18":"transparent", borderRadius:5, padding:"5px 8px",
                  border:`1px solid ${rev?"#16a34a40":"transparent"}`}}>
                  <span style={{fontWeight:700, color:rev?A.accent:A.muted, minWidth:18, fontSize:13}}>{i+1}</span>
                  <span style={{flex:1, color:rev?A.text:A.muted, fontSize:13, fontWeight:rev?600:400}}>{a.text}</span>
                  <span style={{color:A.muted, fontSize:12, minWidth:32, textAlign:"right"}}>{a.pts}p</span>
                  <SmBtn color={rev?"ghost":"green"} onClick={()=>dispatch({type:rev?"HIDE":"REVEAL",i})}>
                    {rev?"Ocultar":"▶"}
                  </SmBtn>
                </div>
              );
            })}
            <Row style={{marginTop:4}}>
              <Btn color="green" onClick={()=>dispatch({type:"REVEAL_ALL"})}>▶▶ Todas</Btn>
              <Btn color="ghost" onClick={()=>dispatch({type:"HIDE_ALL"})}>Ocultar</Btn>
              <Btn color="blue"
                disabled={G.currentQ>=G.questions.length-1||G.phase==="gameover"}
                onClick={()=>dispatch({type:"NEXT_Q"})}>
                Siguiente pregunta ▶
              </Btn>
            </Row>
          </div>
        ) : <div style={{padding:"12px 14px", color:A.muted}}>Sin pregunta activa</div>}
      </div>

      <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
        <div style={{flex:1, minWidth:160, background:A.surface, borderRadius:8,
          border:`1px solid ${A.border}`, padding:"10px 14px"}}>
          <div style={{fontSize:11, color:A.muted, letterSpacing:1, marginBottom:8}}>FALLOS</div>
          <Btn color="red" onClick={()=>dispatch({type:"STRIKE"})} disabled={G.strikes>=3||G.stealMode}>
            ✕ Fallo ({G.strikes}/3)
          </Btn>
        </div>
        <div style={{flex:1, minWidth:160, background:A.surface, borderRadius:8,
          border:`1px solid ${A.border}`, padding:"10px 14px"}}>
          <div style={{fontSize:11, color:A.muted, letterSpacing:1, marginBottom:4}}>PUNTOS EN JUEGO</div>
          <div style={{fontSize:36, fontWeight:700, color:A.accent, fontFamily:"'Teko',sans-serif",
            lineHeight:1, marginBottom:8}}>{G.roundPts}</div>
          <Row>
            <Btn color="red"  onClick={()=>dispatch({type:"AWARD",t:"A"})}>
              💰 {G.teamA.name.split(" ").pop()}
            </Btn>
            <Btn color="blue" onClick={()=>dispatch({type:"AWARD",t:"B"})}>
              💰 {G.teamB.name.split(" ").pop()}
            </Btn>
            <SmBtn color="ghost" onClick={()=>dispatch({type:"RST_PTS"})}>↺</SmBtn>
          </Row>
        </div>
      </div>
    </>
  );
}

/* ── RAPIDAS CONTROLS ── */
function RapidasControls({ G, dispatch }) {
  return (
    <div style={{background:A.surface, borderRadius:8, border:`1px solid ${A.border}`, padding:"12px 14px"}}>
      <Row style={{marginBottom:G.qrMode?10:0}}>
        {!G.qrMode ? (
          <Btn color="green" onClick={()=>dispatch({type:"QR_START",v:G.currentQ})}>▶ Iniciar desde pregunta actual</Btn>
        ) : (
          <>
            <Btn color="green" onClick={()=>dispatch({type:"QR_FINALIZE"})}>💰 Finalizar y sumar</Btn>
            <Btn color="red" onClick={()=>dispatch({type:"QR_END"})}>⏹ Cancelar</Btn>
          </>
        )}
      </Row>
      {G.qrMode && (
        <>
          <div style={{display:"flex", gap:0, borderRadius:6, overflow:"hidden",
            border:`1px solid ${A.border}`, marginBottom:10}}>
            <div style={{flex:1, textAlign:"center", background:"rgba(220,38,38,.1)", padding:"6px 0"}}>
              <div style={{fontSize:10, color:A.muted}}>{G.teamA.name}</div>
              <div style={{fontSize:26, fontWeight:700, color:"#fca5a5",
                fontFamily:"'Teko',sans-serif", lineHeight:1}}>{G.qrScoreA}</div>
            </div>
            <div style={{width:1, background:A.border}}/>
            <div style={{flex:1, textAlign:"center", background:"rgba(37,99,235,.1)", padding:"6px 0"}}>
              <div style={{fontSize:10, color:A.muted}}>{G.teamB.name}</div>
              <div style={{fontSize:26, fontWeight:700, color:"#93c5fd",
                fontFamily:"'Teko',sans-serif", lineHeight:1}}>{G.qrScoreB}</div>
            </div>
          </div>
          <Row style={{marginBottom:10}}>
            {Array.from({length:Math.min(5,G.questions.length-G.qrStartIdx)},(_,i)=>{
              const qi=G.qrStartIdx+i, cur=G.qrCurrentQ===qi;
              return (
                <button key={i} onClick={()=>dispatch({type:"QR_GOTO",v:qi})} style={{
                  border:`2px solid ${cur?A.accent:A.border}`,
                  background:cur?"rgba(252,211,77,.1)":"transparent",
                  color:cur?A.accent:A.muted, borderRadius:5, padding:"4px 10px",
                  cursor:"pointer", fontWeight:cur?700:400, fontSize:12, fontFamily:"inherit",
                }}>P{i+1}</button>
              );
            })}
            <Btn color="blue" onClick={()=>dispatch({type:"QR_NEXT"})}>Sig →</Btn>
          </Row>
          {G.questions[G.qrCurrentQ] && (
            <div style={{display:"flex", flexDirection:"column", gap:4}}>
              <div style={{fontSize:11, color:A.accent, marginBottom:2, fontStyle:"italic"}}>
                {G.questions[G.qrCurrentQ].question}
              </div>
              {G.questions[G.qrCurrentQ].answers.map((a,i)=>{
                const rev=G.qrRevealed.includes(i);
                return (
                  <div key={i} style={{display:"flex", alignItems:"center", gap:6,
                    background:rev?"#14532d18":"transparent", borderRadius:5, padding:"4px 8px",
                    border:`1px solid ${rev?"#16a34a40":A.border}`}}>
                    <span style={{fontWeight:700, color:rev?A.accent:A.muted, minWidth:16, fontSize:12}}>{i+1}</span>
                    <span style={{flex:1, fontSize:12, color:rev?A.text:A.muted, fontWeight:rev?600:400}}>{a.text}</span>
                    <span style={{fontSize:11, color:A.muted, minWidth:32, textAlign:"right"}}>{a.pts}p</span>
                    <SmBtn color="red"   disabled={rev} onClick={()=>dispatch({type:"QR_AWARD",i,t:"A"})}>+A</SmBtn>
                    <SmBtn color="blue"  disabled={rev} onClick={()=>dispatch({type:"QR_AWARD",i,t:"B"})}>+B</SmBtn>
                    <SmBtn color="ghost" onClick={()=>dispatch({type:rev?"QR_HIDE":"QR_REVEAL",i})}>{rev?"↩":"👁"}</SmBtn>
                    <SmBtn color="ghost" onClick={()=>dispatch({type:"QR_WRONG"})}>✕</SmBtn>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ScoreAdj({ label, val, onChange }) {
  return (
    <div style={{flex:1, minWidth:200}}>
      <div style={{fontSize:12, color:A.muted, marginBottom:5}}>{label}</div>
      <Row>
        {[[-10,"ghost"],[-1,"ghost"]].map(([d,c])=>(
          <SmBtn key={d} color={c} onClick={()=>onChange(Math.max(0,val+d))}>{d}</SmBtn>
        ))}
        <input type="number" value={val} onChange={e=>onChange(Math.max(0,parseInt(e.target.value)||0))}
          style={{width:64, textAlign:"center", fontSize:18, fontWeight:700, color:A.accent}}/>
        {[[1,"green"],[10,"green"]].map(([d,c])=>(
          <SmBtn key={d} color={c} onClick={()=>onChange(val+d)}>+{d}</SmBtn>
        ))}
      </Row>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TORNEO TAB
═══════════════════════════════════════════════════ */
function TorneoTab({ G, T, dispatch, onWinner, onSync, onLoad, onRename, onSetScore, onReset, ROUND_NAMES }) {
  return (
    <div style={{display:"flex", flexDirection:"column", gap:12}}>
      {T.champion && (
        <div style={{background:"rgba(252,211,77,.1)", border:`2px solid ${A.accent}`,
          borderRadius:10, padding:"14px", textAlign:"center"}}>
          <div style={{fontSize:10, letterSpacing:3, color:A.accent, marginBottom:2}}>🏆 CAMPEÓN</div>
          <div style={{fontSize:30, fontWeight:700, color:A.accent, fontFamily:"'Teko',sans-serif"}}>{T.champion}</div>
        </div>
      )}

      <div style={{background:A.surface, borderRadius:8, border:`1px solid ${A.border}`,
        padding:"14px", overflowX:"auto"}}>
        <div style={{fontSize:11, fontWeight:600, letterSpacing:2, color:A.muted,
          textTransform:"uppercase", marginBottom:12}}>Bracket</div>
        <BracketView T={T}/>
      </div>

      <Section title="👥 Nombres de equipos" defaultOpen>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
          {T.teams.map((name,i)=>(
            <div key={i} style={{display:"flex", alignItems:"center", gap:6}}>
              <span style={{fontSize:12, color:A.muted, minWidth:22, fontWeight:700}}>F{i+1}</span>
              <input value={name} style={{flex:1}} onChange={e=>onRename(i,e.target.value)}/>
            </div>
          ))}
        </div>
        <div style={{marginTop:10}}>
          <Btn color="red" onClick={onReset}>🔄 Reiniciar torneo completo</Btn>
        </div>
      </Section>

      {T.rounds.map((round,ri)=>(
        <Section key={ri} title={ROUND_NAMES[ri]??`Ronda ${ri+1}`}
          badge={`${round.filter(m=>m.status==="done").length}/${round.length}`}
          defaultOpen={ri===0} accent={ri===T.rounds.length-1}>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {round.map((m,mi)=>(
              <MatchCard key={mi} match={m}
                isActive={G.teamA.name===m.teamA&&G.teamB.name===m.teamB||G.teamA.name===m.teamB&&G.teamB.name===m.teamA}
                onWinner={(w)=>onWinner(ri,mi,w)}
                onScore={(t,v)=>onSetScore(ri,mi,t,v)}
                onLoad={()=>onLoad(ri,mi)}
                onSync={()=>onSync(ri,mi)}/>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}

function MatchCard({ match, isActive, onWinner, onScore, onLoad, onSync }) {
  const isDone=match.status==="done", isUnknown=match.teamA==="?"||match.teamB==="?";
  return (
    <div style={{background:"#0d1117", borderRadius:8, padding:"10px 12px", position:"relative",
      border:`1px solid ${isDone?"#16a34a":isActive?A.accent:isUnknown?A.border:"#4b5563"}`}}>
      {isActive&&!isDone&&(
        <div style={{position:"absolute",top:-1,right:10,fontSize:9,letterSpacing:2,
          color:A.accent,background:"#0d1117",padding:"0 6px"}}>EN JUEGO</div>
      )}
      <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
        <div style={{flex:1, minWidth:200}}>
          {[["A",match.teamA,match.scoreA],["B",match.teamB,match.scoreB]].map(([t,name,sc])=>(
            <div key={t} style={{display:"flex", alignItems:"center", gap:6, padding:"3px 0",
              opacity:isUnknown?.5:1}}>
              <div style={{width:14,height:14,borderRadius:"50%",flexShrink:0,
                background:t==="A"?"#dc2626":"#2563eb"}}/>
              <span style={{flex:1,fontSize:13,
                color:match.winner===name?"#fcd34d":A.text,
                fontWeight:match.winner===name?700:400}}>{name}</span>
              <input type="number" value={sc} min={0}
                onChange={e=>onScore(t,parseInt(e.target.value)||0)}
                style={{width:52,textAlign:"center",fontSize:14,fontWeight:700,color:A.accent,padding:"2px 6px"}}/>
              {!isDone&&!isUnknown&&(
                <SmBtn color={t==="A"?"red":"blue"} onClick={()=>onWinner(name)}>🏆 Ganó</SmBtn>
              )}
            </div>
          ))}
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:4, flexShrink:0}}>
          {!isUnknown&&!isDone&&<SmBtn color="ghost" onClick={onLoad}>▶ Cargar</SmBtn>}
          {!isUnknown&&<SmBtn color="ghost" onClick={onSync}>↓ Sync</SmBtn>}
          {isDone&&<SmBtn color="ghost" onClick={()=>onWinner(null)}>↺ Reabrir</SmBtn>}
        </div>
      </div>
      {isDone&&(
        <div style={{marginTop:5,fontSize:11,color:"#4ade80",letterSpacing:1}}>
          ✓ {match.winner} — {match.scoreA} vs {match.scoreB}
        </div>
      )}
    </div>
  );
}

function BracketView({ T }) {
  const RW=160, MH=52, GAP=48;
  const rounds=T.rounds, n=rounds[0].length;
  const H=n*MH+(n-1)*10+30;
  const matchY=(ri,mi)=>{ const sp=H/rounds[ri].length; return sp*mi+sp/2-MH/2; };
  return (
    <svg width={(RW+GAP)*rounds.length+RW} height={H+10}
      style={{display:"block", fontFamily:"Inter,sans-serif", minWidth:Math.max(400,(RW+GAP)*rounds.length+RW)}}>
      {rounds.map((round,ri)=>(
        <g key={ri}>
          <text x={ri*(RW+GAP)+RW/2} y={14} textAnchor="middle" fontSize={9} fill="#6b7280" letterSpacing={2}>
            {["CUARTOS","SEMIS","FINAL","R4","R5"][ri]??`R${ri+1}`}
          </text>
          {round.map((m,mi)=>{
            const x=ri*(RW+GAP), y=matchY(ri,mi)+18, isDone=m.status==="done";
            return (
              <g key={mi}>
                {ri<rounds.length-1&&(()=>{
                  const nx=x+RW, ny=matchY(ri+1,Math.floor(mi/2))+MH/2+18, cy=y+MH/2;
                  return <path d={`M${nx},${cy} H${nx+GAP/2} V${ny} H${nx+GAP}`}
                    fill="none" stroke="#374151" strokeWidth={1.5}/>;
                })()}
                <rect x={x} y={y} width={RW} height={MH} rx={5}
                  fill="#111827" stroke={isDone?"#16a34a":"#374151"} strokeWidth={isDone?1.5:1}/>
                <line x1={x} y1={y+MH/2} x2={x+RW} y2={y+MH/2} stroke="#1f2937" strokeWidth={1}/>
                {[m.teamA,m.teamB].map((name,ti)=>{
                  const dy=ti*(MH/2), isWin=m.winner===name;
                  return (
                    <g key={ti}>
                      {isWin&&<rect x={x} y={y+dy} width={RW} height={MH/2} rx={ti===0?5:0} fill="rgba(252,211,77,.06)"/>}
                      <circle cx={x+9} cy={y+dy+MH/4} r={3.5} fill={ti===0?"#dc2626":"#2563eb"}/>
                      <text x={x+18} y={y+dy+MH/4+4} fontSize={10}
                        fill={isWin?"#fcd34d":"#9ca3af"} fontWeight={isWin?700:400}>
                        {name.length>14?name.slice(0,13)+"…":name}
                      </text>
                      <text x={x+RW-6} y={y+dy+MH/4+4} fontSize={11}
                        fill="#fcd34d" textAnchor="end" fontWeight={700}>
                        {ti===0?m.scoreA:m.scoreB}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   EDITOR TAB
═══════════════════════════════════════════════════ */
function EditorTab({ G, dispatch }) {
  const [open, setOpen] = useState(G.currentQ);

  const multColor = (m) => m===3?"#7c3aed":m===2?"#ea580c":A.border;
  const multLabel = (m) => m===3?"×3 TRIPLE":m===2?"×2 DOBLE":"×1 Normal";

  return (
    <>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
        <span style={{fontWeight:600, fontSize:15}}>Preguntas ({G.questions.length})</span>
        <Row>
          <Btn color="green" onClick={()=>dispatch({type:"ADD_Q"})}>+ Agregar</Btn>
          <Btn color="ghost" onClick={()=>{if(confirm("¿Restaurar preguntas por defecto?"))dispatch({type:"RST_Q"})}}>↺ Restaurar</Btn>
        </Row>
      </div>
      {G.questions.map((q,qi)=>{
        const mult = q.multiplier ?? 1;
        return (
          <div key={q.id} style={{background:A.surface,
            border:`1px solid ${G.currentQ===qi?A.accent:mult>1?multColor(mult):A.border}`,
            borderRadius:8, overflow:"hidden"}}>
            <div onClick={()=>setOpen(open===qi?null:qi)}
              style={{display:"flex", gap:10, alignItems:"center", padding:"10px 14px",
                cursor:"pointer", userSelect:"none"}}>
              <span style={{fontWeight:700, color:G.currentQ===qi?A.accent:A.muted, minWidth:28, fontSize:13}}>P{qi+1}</span>
              <span style={{flex:1, color:A.text, fontSize:12, overflow:"hidden",
                textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{q.question}</span>
              {mult>1 && (
                <span style={{fontSize:10, color:"#fff", background:multColor(mult),
                  borderRadius:4, padding:"1px 7px", fontWeight:700, letterSpacing:1}}>
                  {multLabel(mult)}
                </span>
              )}
              {G.currentQ===qi&&(
                <span style={{fontSize:10, color:A.accent, background:"rgba(252,211,77,.1)",
                  border:"1px solid rgba(252,211,77,.3)", borderRadius:4, padding:"1px 7px", letterSpacing:1}}>ACTIVA</span>
              )}
              <span style={{color:A.muted, fontSize:11}}>{open===qi?"▲":"▼"}</span>
            </div>
            {open===qi&&(
              <div style={{padding:"0 14px 14px", borderTop:`1px solid ${A.border}`}}>
                <div style={{marginTop:10, marginBottom:10}}>
                  <label style={{display:"block", fontSize:11, color:A.muted, marginBottom:4, letterSpacing:1}}>PREGUNTA</label>
                  <input value={q.question} style={{width:"100%"}}
                    onChange={e=>dispatch({type:"EDIT_Q",i:qi,f:"question",v:e.target.value})}/>
                </div>

                {/* Multiplicador */}
                <div style={{marginBottom:12}}>
                  <label style={{display:"block", fontSize:11, color:A.muted, marginBottom:6, letterSpacing:1}}>VALOR DE LA PREGUNTA</label>
                  <div style={{display:"flex", gap:6}}>
                    {[1,2,3].map(m=>(
                      <button key={m} onClick={()=>dispatch({type:"EDIT_Q",i:qi,f:"multiplier",v:m})} style={{
                        flex:1, padding:"8px 0", borderRadius:6, cursor:"pointer",
                        border:`2px solid ${mult===m?multColor(m):A.border}`,
                        background: mult===m ? (m===1?"rgba(255,255,255,.05)":`${multColor(m)}22`) : "transparent",
                        color: mult===m ? (m===1?A.text:multColor(m)) : A.muted,
                        fontFamily:"inherit", fontSize:13, fontWeight:700, transition:"all .2s",
                      }}>
                        {m===1?"×1 Normal":m===2?"×2 Doble":"×3 Triple"}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
                  {q.answers.map((a,ai)=>(
                    <div key={ai} style={{display:"flex", gap:5, alignItems:"center"}}>
                      <span style={{fontSize:12, fontWeight:700, color:A.muted, minWidth:18}}>{ai+1}.</span>
                      <input value={a.text} style={{flex:1, minWidth:0}}
                        onChange={e=>dispatch({type:"EDIT_A",i:qi,j:ai,f:"text",v:e.target.value})}/>
                      <input type="number" value={a.pts} min={1} max={99}
                        style={{width:44, textAlign:"center", color:A.accent}}
                        onChange={e=>dispatch({type:"EDIT_A",i:qi,j:ai,f:"pts",v:parseInt(e.target.value)||1})}/>
                      {mult>1 && (
                        <span style={{fontSize:11, color:multColor(mult), minWidth:32, fontWeight:700}}>
                          ={a.pts*mult}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <Row style={{marginTop:10}}>
                  <SmBtn color="blue" onClick={()=>dispatch({type:"GOTO_Q",v:qi})}>▶ Jugar esta ronda</SmBtn>
                  <SmBtn color="red" onClick={()=>{if(confirm("¿Eliminar?"))dispatch({type:"DEL_Q",i:qi})}}
                    disabled={G.questions.length<=1}>✕ Eliminar</SmBtn>
                </Row>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}