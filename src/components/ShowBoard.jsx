import { useEffect } from "react";
import bgNeon   from "../assets/show/bg-neon.gif";
import boardImg from "../assets/show/board.png";
import boardWin from "../assets/show/board-win.gif";
import strike1  from "../assets/show/strike-1.png";
import strike2  from "../assets/show/strike-2.png";
import strike3  from "../assets/show/strike-3.png";

/* ═══════════════════════════════════════════════════════════════
   SHOW BOARD — pantalla pública, recreación del tablero del show
   ───────────────────────────────────────────────────────────────
   Todas las coordenadas están medidas sobre board.png (1672 × 941).
   El tablero se escala con la variable --u (= ancho del tablero / 1672),
   así que se ve igual de bien en un monitor chico que en una pantallota.
═══════════════════════════════════════════════════════════════ */
const BW = 1672;
const BH = 941;

// Barras de respuesta (5): posición vertical de cada una y medidas
const BAR = { x: 484, w: 704, h: 60, tops: [291, 362, 434, 505, 577] };
// Cajita azul de puntos que va al final de cada barra
const PTS = { x: 1080, w: 102, inset: 6 };
// Cajas de marcador (interior, sin el borde cian)
const BOX_TOP   = { x: 722,  y: 37,  w: 231, h: 115 };
const BOX_LEFT  = { x: 72,   y: 400, w: 248, h: 118 };
const BOX_RIGHT = { x: 1355, y: 399, w: 247, h: 118 };
// Placas con el nombre de cada equipo (debajo de las cajas laterales, fuera del aro rosa)
const PLATE = { w: 260, top: 655, cxLeft: 155, cxRight: 1517 };

// Centro del panel de respuestas (donde aparece la X)
const PANEL_CX = 836;
const PANEL_CY = 463;

// Tamaño de cada imagen de X (en px del tablero 1672 × 941)
const STRIKE = {
  1: { src: strike1, w: 510 },
  2: { src: strike2, w: 600 },
  3: { src: strike3, w: 760 },
};

const pctX = v => `${(v / BW) * 100}%`;
const pctY = v => `${(v / BH) * 100}%`;
const u    = n => `calc(var(--u) * ${n})`;

// Achica la letra cuando el texto es largo para que no se salga de la barra
const fitScale = (text, maxChars) => Math.min(1, maxChars / Math.max(1, String(text).length));

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Montserrat:wght@700;800&display=swap');

.sb-root{
  position:fixed; inset:0; overflow:hidden; background:#0a0540; cursor:none;
  --bw:min(100vw, calc(100vh * ${BW} / ${BH}));
  --u:calc(var(--bw) / ${BW});
  font-family:'Montserrat','Segoe UI',Arial,sans-serif;
}
.sb-bg{position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0;}
.sb-stage{
  position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
  width:var(--bw); height:calc(var(--bw) * ${BH} / ${BW}); z-index:1;
}
.sb-board{position:absolute; inset:0; width:100%; height:100%; z-index:1; user-select:none; -webkit-user-drag:none;}
.sb-abs{position:absolute;}

/* ── Respuestas ── */
.sb-row{position:absolute; z-index:2; perspective:${u(900)};}
.sb-flip{
  position:absolute; inset:0; display:flex; align-items:center;
  transform-origin:center center; animation:sb-flip .5s cubic-bezier(.36,.07,.19,.97) both;
}
.sb-text{
  flex:1; padding-left:${u(24)}; color:#fff; font-weight:800; letter-spacing:${u(1)};
  white-space:nowrap; text-transform:uppercase; line-height:1;
  text-shadow:0 ${u(2)} ${u(4)} rgba(0,20,120,.55);
}
.sb-pts{
  position:absolute; top:${u(PTS.inset)}; bottom:${u(PTS.inset)};
  background:linear-gradient(180deg,#0a2bb8 0%,#011697 55%,#010f6e 100%);
  display:flex; align-items:center; justify-content:center;
  border-radius:0 ${u(10)} ${u(10)} 0;
  box-shadow:inset 0 ${u(2)} 0 rgba(255,255,255,.18);
}

/* ── Números dorados ── */
.sb-num{position:relative; display:inline-block; font-family:'Fredoka','Montserrat',Arial,sans-serif;
  font-weight:700; line-height:1; animation:sb-pop .45s ease-out;}
.sb-num-b{position:absolute; inset:0; color:#4a3300; -webkit-text-stroke:${u(9)} #4a3300;
  text-shadow:0 ${u(5)} 0 #2c1e00, 0 0 ${u(18)} rgba(255,214,0,.55);}
.sb-num-f{position:relative; color:transparent;
  background:linear-gradient(180deg,#fffbb0 0%,#ffee00 38%,#f0c400 68%,#c98f00 100%);
  -webkit-background-clip:text; background-clip:text;}
.sb-box{position:absolute; z-index:2; display:flex; align-items:center; justify-content:center;}

/* ── Nombres de equipo ── */
.sb-plate{
  position:absolute; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:center;
  width:${u(PLATE.w)}; min-height:${u(84)}; padding:${u(8)} ${u(14)}; text-align:center; box-sizing:border-box;
  background:linear-gradient(180deg,rgba(10,20,140,.88),rgba(2,10,90,.9));
  border:${u(4)} solid #27e7ff; border-radius:${u(16)};
  box-shadow:0 0 ${u(14)} rgba(39,231,255,.55), inset 0 ${u(2)} 0 rgba(255,255,255,.2);
  color:#fff; font-weight:800; text-transform:uppercase; letter-spacing:${u(1.5)}; line-height:1.05;
  transition:box-shadow .3s, border-color .3s, transform .3s;
}
.sb-plate.turn{border-color:#ffe600; transform:scale(1.05);
  box-shadow:0 0 ${u(26)} rgba(255,230,0,.9), 0 0 ${u(60)} rgba(255,230,0,.45), inset 0 ${u(2)} 0 rgba(255,255,255,.25);}
.sb-plate.steal{border-color:#ff8a00; transform:scale(1.05); animation:sb-steal 1s ease-in-out infinite;}
.sb-tag{font-size:${u(20)}; letter-spacing:${u(5)}; color:#ffe600; margin-top:${u(4)};}
.sb-plate.steal .sb-tag{color:#ffb347;}

/* ── Etiqueta de multiplicador / modo ── */
.sb-badge{
  position:absolute; z-index:3; left:${pctX(40)}; top:${pctY(40)};
  padding:${u(8)} ${u(28)}; border-radius:${u(14)}; color:#fff; font-weight:800;
  font-size:${u(46)}; letter-spacing:${u(4)}; border:${u(4)} solid rgba(255,255,255,.85);
  box-shadow:0 0 ${u(26)} var(--g), inset 0 ${u(3)} 0 rgba(255,255,255,.35);
  text-shadow:0 ${u(3)} 0 rgba(0,0,0,.35);
}
.sb-badge.x2{background:linear-gradient(180deg,#ff9a1f,#e2570a); --g:#ff8a00;}
.sb-badge.x3{background:linear-gradient(180deg,#b86bff,#7a22d6); --g:#b86bff;}
.sb-badge.qr{background:linear-gradient(180deg,#27e7ff,#0a86c9); --g:#27e7ff; font-size:${u(38)};}

/* ── X de error ── */
.sb-strike{
  position:absolute; z-index:5; pointer-events:none; transform:translate(-50%,-50%);
  filter:drop-shadow(0 ${u(14)} ${u(24)} rgba(0,0,0,.55));
  animation:sb-xpop .28s cubic-bezier(.2,1.4,.4,1) both, sb-xfade .3s ease-in 1.6s forwards;
}

@keyframes sb-flip{0%{transform:rotateX(90deg);opacity:0}55%{transform:rotateX(-12deg);opacity:1}100%{transform:rotateX(0);opacity:1}}
@keyframes sb-pop{0%{transform:scale(1)}35%{transform:scale(1.28)}100%{transform:scale(1)}}
@keyframes sb-xpop{0%{transform:translate(-50%,-50%) scale(.2);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
@keyframes sb-xfade{to{opacity:0}}
@keyframes sb-steal{0%,100%{box-shadow:0 0 ${u(20)} rgba(255,138,0,.8),0 0 ${u(50)} rgba(255,138,0,.4)}50%{box-shadow:0 0 ${u(34)} rgba(255,60,0,.95),0 0 ${u(80)} rgba(255,60,0,.5)}}
`;

function GoldNumber({ value, size }) {
  const s = String(value);
  const k = s.length <= 2 ? 1 : s.length === 3 ? 0.86 : 0.68;
  return (
    <span key={s} className="sb-num" style={{ fontSize: u(size * k) }}>
      <span className="sb-num-b" aria-hidden="true">{s}</span>
      <span className="sb-num-f">{s}</span>
    </span>
  );
}

function ScoreBox({ rect, value, size = 100 }) {
  return (
    <div className="sb-box" style={{
      left: pctX(rect.x), top: pctY(rect.y), width: pctX(rect.w), height: pctY(rect.h),
    }}>
      <GoldNumber value={value} size={size} />
    </div>
  );
}

function NamePlate({ name, cx, state }) {
  const len = String(name).length;
  const fs  = 32 * (len <= 11 ? 1 : Math.max(0.5, 11 / len));
  return (
    <div className={`sb-plate ${state ?? ""}`} style={{
      left: pctX(cx - PLATE.w / 2), top: pctY(PLATE.top), fontSize: u(fs),
    }}>
      <span>{name}</span>
      {state === "turn"  && <span className="sb-tag">▼ TURNO</span>}
      {state === "steal" && <span className="sb-tag">⚡ ROBO</span>}
    </div>
  );
}

/**
 * Props
 *  rows      [{text, pts}]  hasta 5 respuestas (el tablero tiene 5 barras)
 *  revealed  [índices]      respuestas visibles
 *  top/left/right           números de las 3 cajas (puntos en juego / equipo A / equipo B)
 *  nameA, nameB             nombres de equipos
 *  turn      "A" | "B" | null   equipo con el turno (o que intenta robar si steal=true)
 *  steal     boolean
 *  strikes   0..3           X que se muestran como overlay (0 = ninguna)
 *  badge     {label, kind}  etiqueta opcional arriba a la izquierda (x2, x3, RÁPIDAS)
 *  winner    boolean        tablero completo: el panel cambia de colores (GIF animado)
 */
export default function ShowBoard({
  rows = [], revealed = [], top = 0, left = 0, right = 0,
  nameA = "", nameB = "", turn = null, steal = false, strikes = 0, badge = null, winner = false,
}) {
  // Precargar el GIF ganador para que no parpadee al cambiar
  useEffect(() => { const im = new Image(); im.src = boardWin; }, []);

  const strike = STRIKE[Math.min(3, Math.max(0, strikes))];
  const stateOf = side => (turn === side ? (steal ? "steal" : "turn") : null);

  return (
    <div className="sb-root">
      <style>{CSS}</style>
      <img className="sb-bg" src={bgNeon} alt="" draggable="false" />

      <div className="sb-stage">
        <img className="sb-board" src={winner ? boardWin : boardImg} alt="" draggable="false" />

        {BAR.tops.map((t, i) => {
          const r = rows[i];
          const show = r && revealed.includes(i);
          return (
            <div key={i} className="sb-row" style={{
              left: pctX(BAR.x), top: pctY(t), width: pctX(BAR.w), height: pctY(BAR.h),
            }}>
              {show && (
                <div className="sb-flip">
                  <span className="sb-text" style={{ fontSize: u(34 * fitScale(r.text, 19)) }}>{r.text}</span>
                  <div className="sb-pts" style={{ left: u(PTS.x - BAR.x), width: u(PTS.w) }}>
                    <GoldNumber value={r.pts} size={46} />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <ScoreBox rect={BOX_TOP}   value={top}   size={98} />
        <ScoreBox rect={BOX_LEFT}  value={left}  size={100} />
        <ScoreBox rect={BOX_RIGHT} value={right} size={100} />

        <NamePlate name={nameA} cx={PLATE.cxLeft}   state={stateOf("A")} />
        <NamePlate name={nameB} cx={PLATE.cxRight} state={stateOf("B")} />

        {badge && <div className={`sb-badge ${badge.kind}`}>{badge.label}</div>}

        {strike && (
          <img key={`x${strikes}`} className="sb-strike" src={strike.src} alt="" draggable="false"
            style={{ left: pctX(PANEL_CX), top: pctY(PANEL_CY), width: pctX(strike.w) }} />
        )}
      </div>
    </div>
  );
}
