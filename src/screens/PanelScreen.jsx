import { SHARED_CSS, A, SFX, openTab, navigate } from "../constants.js";

/* ═══════════════════════════════════════════════════
   PANEL  "/panel"  — Control simple para backstage
   Solo lo necesario para operar una ronda en vivo:
   marcador, respuestas, fallos, premiar, sonidos y siguiente pregunta.
   NO maneja el torneo: para cerrar la partida y cargar la siguiente
   se usa el panel Admin (pestaña Torneo).
═══════════════════════════════════════════════════ */

const TEAM = {
  A: { color: "#dc2626", shadow: "#7f1d1d", soft: "rgba(220,38,38,.16)" },
  B: { color: "#2563eb", shadow: "#1e3a8a", soft: "rgba(37,99,235,.16)" },
};
const BOARD_SLOTS = 5;   // el tablero del show tiene 5 barras

function Big({ children, onClick, disabled, bg = "#374151", shadow = "#1f2937", color = "#fff", style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border: "none", borderRadius: 10, minHeight: 52, padding: "10px 18px",
      fontFamily: "inherit", fontSize: 16, fontWeight: 700, letterSpacing: .5,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .4 : 1,
      background: bg, color, boxShadow: `0 4px 0 ${shadow}`, transition: "transform .08s",
      ...style,
    }}>{children}</button>
  );
}

const Label = ({ children }) => (
  <div style={{ fontSize: 11, letterSpacing: 2, color: A.muted, marginBottom: 8 }}>{children}</div>
);
const Box = ({ children, style = {} }) => (
  <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 12, padding: 14, ...style }}>{children}</div>
);

export default function PanelScreen({ G, dispatch }) {
  const q = G.questions?.[G.currentQ];

  /* ── Sin partida cargada ── */
  if (!q) {
    return (
      <div style={{ minHeight: "100vh", background: A.bg, color: A.text, display: "flex",
        alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter',system-ui,sans-serif" }}>
        <style>{SHARED_CSS}</style>
        <Box style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎛</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No hay una partida cargada</div>
          <div style={{ fontSize: 13, color: A.muted, marginBottom: 14 }}>
            Carga una partida desde el panel Admin (pestaña Torneo) y vuelve aquí.
          </div>
          <Big bg="#16a34a" shadow="#14532d" onClick={() => openTab("/admin")}>Abrir Admin</Big>
        </Box>
      </div>
    );
  }

  const mult      = q.multiplier ?? 1;
  const total     = Math.min(G.questions.length, G.questionsPerMatch ?? G.questions.length);
  const isLast    = G.currentQ >= total - 1;
  const over      = G.phase === "gameover";
  const rapidas   = G.qrMode;
  const stealer   = G.stealMode ? G.activeTeam : null;
  const other     = t => (t === "A" ? "B" : "A");
  const nameOf    = t => (t === "A" ? G.teamA.name : G.teamB.name);
  const scoreOf   = t => (t === "A" ? G.teamA.score : G.teamB.score);
  const rows      = q.answers.slice(0, BOARD_SLOTS);
  const strikesOn = Math.min(3, G.strikes);

  return (
    <div style={{ minHeight: "100vh", background: A.bg, color: A.text, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{SHARED_CSS}</style>

      {/* Barra superior */}
      <div style={{ background: A.surface, borderBottom: `1px solid ${A.border}`, padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 800, color: A.accent, fontSize: 18 }}>🎛 Panel</span>
        <span style={{ fontSize: 12, color: A.muted }}>backstage · 100 Vértices Dijeron</span>
        <span style={{ flex: 1 }} />
        <Big bg="#2563eb" shadow="#1e3a8a" style={{ minHeight: 36, padding: "6px 14px", fontSize: 13 }}
          onClick={() => openTab("/game")}>📺 Proyector</Big>
        <Big style={{ minHeight: 36, padding: "6px 14px", fontSize: 13 }}
          onClick={() => openTab("/admin")}>⚙ Admin</Big>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

        {rapidas && (
          <Box style={{ borderColor: "#f59e0b", color: "#fbbf24", fontSize: 13 }}>
            ⚡ Está activo el modo <b>Preguntas rápidas</b>. Esa ronda se maneja desde el panel Admin.
          </Box>
        )}
        {over && (
          <Box style={{ borderColor: A.accent, color: A.accent, fontSize: 13 }}>
            🏁 Partida terminada. Para anotar al ganador y cargar la siguiente usa el panel Admin ▸ Torneo.
          </Box>
        )}

        {/* Marcador + turno */}
        <Box>
          <Label>MARCADOR · toca un equipo para darle el turno</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {["A", "B"].map(t => {
              const active = G.activeTeam === t;
              return (
                <button key={t} onClick={() => dispatch({ type: "SET_ACTIVE", v: t })} style={{
                  textAlign: "left", cursor: "pointer", fontFamily: "inherit", padding: "12px 14px", borderRadius: 10,
                  background: active ? TEAM[t].soft : "transparent", color: A.text,
                  border: `2px solid ${active ? TEAM[t].color : A.border}`,
                }}>
                  <div style={{ fontSize: 12, color: active ? TEAM[t].color : A.muted, fontWeight: 700, minHeight: 16 }}>
                    {nameOf(t)} {active ? (G.stealMode ? "⚡ ROBA" : "◀ TURNO") : ""}
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, color: t === "A" ? "#fca5a5" : "#93c5fd" }}>{scoreOf(t)}</div>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 2, color: A.muted }}>PUNTOS EN JUEGO</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: A.accent, lineHeight: 1.1 }}>{G.roundPts}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: A.muted }}>FALLOS</div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 6, lineHeight: 1.1 }}>
                {[0, 1, 2].map(i => <span key={i} style={{ color: i < strikesOn ? A.red : "#4b5563" }}>✕</span>)}
              </div>
            </div>
          </div>

          {G.stealMode && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#fbbf24", background: "#78350f22",
              border: "1px solid #f59e0b55", borderRadius: 8, padding: "8px 12px" }}>
              ⚡ <b>{nameOf(stealer)}</b> intenta robar. Si acierta, premia a <b>{nameOf(stealer)}</b>;
              si falla, premia a <b>{nameOf(other(stealer))}</b>.
            </div>
          )}
        </Box>

        {/* Sonidos */}
        <Box>
          <Label>🔊 SONIDOS</Label>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <Big bg={A.accent} shadow="#92400e" color="#111" onClick={() => SFX.aJugar()} style={{ fontSize: 20 }}>🎬 ¡A JUGAR!</Big>
            <Big onClick={() => SFX.boton()} color="#c4b5fd">🔘 Botón</Big>
          </div>
        </Box>

        {/* Pregunta */}
        <Box>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Label>PREGUNTA {G.currentQ + 1} DE {total}</Label>
            {mult > 1 && (
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "#fff", borderRadius: 5, padding: "2px 9px",
                background: mult === 3 ? "#7c3aed" : "#ea580c", marginBottom: 8 }}>
                {mult === 3 ? "×3 TRIPLE" : "×2 DOBLE"}
              </span>
            )}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.35 }}>{q.question}</div>
        </Box>

        {/* Respuestas */}
        <Box>
          <Label>RESPUESTAS · ▶ revela y suma · 👁 solo muestra (sin puntos)</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((a, i) => {
              const rev    = G.revealed.includes(i);
              const silent = rev && (G.shown ?? []).includes(i);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10,
                  background: rev ? (silent ? "rgba(107,114,128,.15)" : "rgba(22,163,74,.12)") : "transparent",
                  border: `1px solid ${rev ? (silent ? "#6b728080" : "#16a34a66") : A.border}`,
                }}>
                  <span style={{ fontWeight: 800, fontSize: 18, minWidth: 22, color: rev ? A.accent : A.muted }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 17, fontWeight: rev ? 700 : 500, color: rev ? A.text : "#cbd5e1" }}>
                    {a.text}
                    {silent && <span style={{ marginLeft: 8, fontSize: 10, color: A.muted, border: `1px solid ${A.border}`,
                      borderRadius: 4, padding: "1px 6px", letterSpacing: 1 }}>SIN PUNTOS</span>}
                  </span>
                  <span style={{ fontSize: 15, color: A.muted, minWidth: 44, textAlign: "right",
                    textDecoration: silent ? "line-through" : "none" }}>{a.pts * mult}</span>
                  {!rev && (
                    <Big onClick={() => dispatch({ type: "SHOW", i })} style={{ minHeight: 46, padding: "6px 14px" }}>👁</Big>
                  )}
                  <Big bg={rev ? "#374151" : "#16a34a"} shadow={rev ? "#1f2937" : "#14532d"}
                    onClick={() => dispatch({ type: rev ? "HIDE" : "REVEAL", i })}
                    style={{ minHeight: 46, minWidth: 92, padding: "6px 14px", fontSize: rev ? 14 : 18 }}>
                    {rev ? "Ocultar" : "▶"}
                  </Big>
                </div>
              );
            })}
          </div>
          {q.answers.length > BOARD_SLOTS && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#fbbf24" }}>
              ⚠ Esta pregunta tiene {q.answers.length} respuestas; el tablero solo muestra {BOARD_SLOTS}.
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <Big onClick={() => dispatch({ type: "SHOW_ALL" })} style={{ width: "100%" }}>👁 Mostrar restantes (sin puntos)</Big>
          </div>
        </Box>

        {/* Acciones principales */}
        <Box>
          <Label>ACCIONES</Label>
          <Big bg="#dc2626" shadow="#7f1d1d" disabled={G.strikes >= 3 || G.stealMode || over}
            onClick={() => dispatch({ type: "STRIKE" })} style={{ width: "100%", fontSize: 22, minHeight: 64 }}>
            ✕ FALLO ({strikesOn}/3)
          </Big>

          <div style={{ fontSize: 11, letterSpacing: 2, color: A.muted, margin: "14px 0 8px" }}>
            PREMIAR PUNTOS EN JUEGO ({G.roundPts})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {["A", "B"].map(t => (
              <Big key={t} bg={TEAM[t].color} shadow={TEAM[t].shadow} disabled={!G.roundPts || over}
                onClick={() => dispatch({ type: "AWARD", t })} style={{ fontSize: 15 }}>
                💰 {nameOf(t)}
              </Big>
            ))}
          </div>

          <div style={{ fontSize: 11, letterSpacing: 2, color: A.muted, margin: "14px 0 8px" }}>PREGUNTAS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <Big disabled={G.currentQ === 0 || over} onClick={() => dispatch({ type: "PREV_Q" })}>◀ Anterior</Big>
            <Big bg="#2563eb" shadow="#1e3a8a" disabled={isLast || over}
              onClick={() => dispatch({ type: "NEXT_Q" })}>
              {isLast ? "Última pregunta" : "Siguiente pregunta ▶"}
            </Big>
          </div>
          {isLast && !over && (
            <div style={{ marginTop: 8, fontSize: 12, color: A.muted }}>
              Es la última pregunta de la partida. Al terminar, cierra la partida desde el panel Admin ▸ Torneo.
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <Big onClick={() => dispatch({ type: "RST_STRIKES" })} style={{ flex: 1, minHeight: 44, fontSize: 13 }}>↺ Reiniciar fallos</Big>
            <Big onClick={() => { if (confirm("¿Reiniciar la ronda? Se ocultan todas las respuestas y se borran los puntos en juego y los fallos.")) dispatch({ type: "RST_ROUND" }); }}
              style={{ flex: 1, minHeight: 44, fontSize: 13 }}>↺ Reiniciar ronda</Big>
          </div>
        </Box>

        <div style={{ textAlign: "center", fontSize: 11, color: "#4b5563", paddingBottom: 20 }}>
          <a href="/" onClick={e => { e.preventDefault(); navigate("/"); }} style={{ color: "#6b7280" }}>← Inicio</a>
        </div>
      </div>
    </div>
  );
}
