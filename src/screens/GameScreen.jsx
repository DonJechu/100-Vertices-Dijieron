import ShowBoard from "../components/ShowBoard.jsx";

/* ═══════════════════════════════════════════════════
   GAME SCREEN  "/game"  — Pantalla pública (la pantallota)
   Solo muestra el tablero. La pregunta NO se muestra aquí:
   se lee en voz alta y el panel Admin es quien la ve.
   Al terminar el juego no hay pantalla de ganador, solo suena
   la música de victoria (se dispara desde el reducer).
═══════════════════════════════════════════════════ */

// Cuántas X mostrar: viene en overlayData.count (1-3); si no, 1
const strikeCount = G =>
  G.overlayType === "strike" ? Math.min(3, Math.max(1, G.overlayData?.count ?? 1)) : 0;

export default function GameScreen({ G }) {
  /* ── Preguntas Rápidas: mismo tablero, con los puntajes de la ronda rápida ── */
  if (G.qrMode && G.phase !== "gameover") {
    const q     = G.questions[G.qrCurrentQ];
    const qNum  = G.qrCurrentQ - G.qrStartIdx + 1;
    return (
      <ShowBoard
        rows={q?.answers ?? []}
        revealed={G.qrRevealed}
        top={qNum}
        left={G.qrScoreA}
        right={G.qrScoreB}
        nameA={G.teamA.name}
        nameB={G.teamB.name}
        strikes={strikeCount(G)}
        badge={{ label: "RÁPIDAS", kind: "qr" }}
      />
    );
  }

  /* ── Ronda normal ── */
  const q    = G.questions?.[G.currentQ];
  const mult = q?.multiplier ?? 1;
  const rows = (q?.answers ?? []).map(a => ({ text: a.text, pts: a.pts * mult }));

  // En modo robo, activeTeam es el equipo que está robando (así lo deja el reducer tras 3 X)
  return (
    <ShowBoard
      rows={rows}
      revealed={G.revealed}
      top={G.roundPts}
      left={G.teamA.score}
      right={G.teamB.score}
      nameA={G.teamA.name}
      nameB={G.teamB.name}
      turn={G.phase === "gameover" ? null : G.activeTeam}
      steal={G.stealMode}
      strikes={strikeCount(G)}
      badge={mult === 2 ? { label: "×2 DOBLE", kind: "x2" }
           : mult === 3 ? { label: "×3 TRIPLE", kind: "x3" } : null}
    />
  );
}
