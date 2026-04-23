export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');`;

export const LS_STATE      = "mxd5_state";
export const LS_Q          = "mxd5_q";
export const LS_TOURNAMENT = "mxd5_tournament";
export const LS_CONFIG     = "mxd5_config";
export const CH_NAME       = "mxd5_channel";

/* ═══════════════════════════════════════════════════
   CONFIG — saved separately from game state
═══════════════════════════════════════════════════ */
export const DEFAULT_CONFIG = {
  teamCount:        8,       // 4 | 8 | 16 | custom
  questionsPerMatch:5,       // how many questions per match
  playRapidas:      false,   // include quick-round phase
  configured:       false,   // wizard has been completed
};

export const loadConfig = () => {
  try { const c = JSON.parse(localStorage.getItem(LS_CONFIG)); return c ? {...DEFAULT_CONFIG,...c} : DEFAULT_CONFIG; }
  catch { return DEFAULT_CONFIG; }
};
export const saveConfig = (c) => {
  try { localStorage.setItem(LS_CONFIG, JSON.stringify(c)); } catch {}
  return c;
};

/* ═══════════════════════════════════════════════════
   AUDIO
═══════════════════════════════════════════════════ */
let AC = null;
export const unlockAudio = () => {
  try { if (!AC) AC = new (window.AudioContext||window.webkitAudioContext)(); if (AC.state==="suspended") AC.resume(); } catch {}
};
const getAC = () => {
  if (!AC) { try { AC = new (window.AudioContext||window.webkitAudioContext)(); } catch { return null; } }
  if (AC.state==="suspended") { try { AC.resume(); } catch {} }
  return AC;
};
const beep = (f,d,t="sine",v=0.3,dl=0) => {
  try {
    const ac=getAC(); if (!ac) return;
    const o=ac.createOscillator(), g=ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type=t; o.frequency.value=f;
    g.gain.setValueAtTime(0.001, ac.currentTime+dl);
    g.gain.linearRampToValueAtTime(v, ac.currentTime+dl+0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+dl+d);
    o.start(ac.currentTime+dl); o.stop(ac.currentTime+dl+d+0.05);
  } catch {}
};
export const SFX = {
  reveal:       ()=>{ beep(660,.08,"sine",.5); beep(880,.1,"sine",.4,.09); beep(1100,.15,"sine",.35,.2); },
  strike:       ()=>{ beep(180,.3,"sawtooth",.6); beep(130,.35,"sawtooth",.5,.08); },
  tripleStrike: ()=>{ [0,380,760].forEach(d=>setTimeout(()=>SFX.strike(),d)); setTimeout(()=>{ beep(110,.7,"sawtooth",.55); beep(80,.9,"sawtooth",.45,.12); },1150); },
  award:        ()=>[784,880,1047,1319].forEach((f,i)=>beep(f,.15,"sine",.45,i*.07)),
  win:          ()=>[523,587,659,698,784,880,988,1047].forEach((f,i)=>beep(f,.2,"sine",.42,i*.1)),
  tick:         ()=>beep(1200,.04,"square",.2),
};

/* ═══════════════════════════════════════════════════
   TOURNAMENT — supports variable team count
   Builds single-elimination bracket for N teams (must be power of 2: 4,8,16)
═══════════════════════════════════════════════════ */
export const buildBracket = (teams) => {
  const n = teams.length;
  // Round 1: pair teams sequentially
  const round1 = [];
  for (let i=0; i<n; i+=2) {
    round1.push({ teamA:teams[i], teamB:teams[i+1], scoreA:0, scoreB:0, winner:null, status:"pending" });
  }
  const rounds = [round1];
  // Build subsequent rounds with placeholders
  let size = n/2;
  while (size > 1) {
    size = size/2;
    const r = [];
    for (let i=0; i<size; i++) r.push({ teamA:"?", teamB:"?", scoreA:0, scoreB:0, winner:null, status:"pending" });
    rounds.push(r);
  }
  return rounds;
};

export const BLANK_TOURNAMENT = (teams) => {
  const t = teams ?? ["Familia 1","Familia 2","Familia 3","Familia 4","Familia 5","Familia 6","Familia 7","Familia 8"];
  return { teams:t, rounds:buildBracket(t), champion:null };
};

export const loadTournament = () => {
  try { const t=JSON.parse(localStorage.getItem(LS_TOURNAMENT)); return t ?? BLANK_TOURNAMENT(); }
  catch { return BLANK_TOURNAMENT(); }
};
export const saveTournament = (t) => {
  try { localStorage.setItem(LS_TOURNAMENT, JSON.stringify(t)); } catch {}
  return t;
};

/* ═══════════════════════════════════════════════════
   DEFAULT QUESTIONS
═══════════════════════════════════════════════════ */
export const DEFAULT_Q = [
  { id:1,  question:"¿Cuál es la comida mexicana más popular?",            answers:[{text:"Tacos",pts:45},{text:"Enchiladas",pts:20},{text:"Tamales",pts:15},{text:"Pozole",pts:10},{text:"Chiles en Nogada",pts:5},{text:"Mole",pts:5}]},
  { id:2,  question:"¿Qué bebida toman los mexicanos en las fiestas?",     answers:[{text:"Cerveza",pts:40},{text:"Tequila",pts:30},{text:"Mezcal",pts:12},{text:"Michelada",pts:10},{text:"Agua fresca",pts:5},{text:"Tepache",pts:3}]},
  { id:3,  question:"¿Qué animal se asocia más con México?",               answers:[{text:"Águila",pts:38},{text:"Perro Xolo",pts:22},{text:"Serpiente",pts:15},{text:"Burro",pts:12},{text:"Gallo",pts:8},{text:"Iguana",pts:5}]},
  { id:4,  question:"Nombre algo que lleves siempre en la bolsa",          answers:[{text:"Celular",pts:42},{text:"Cartera",pts:28},{text:"Llaves",pts:16},{text:"Audífonos",pts:8},{text:"Chicles",pts:4},{text:"Plumas",pts:2}]},
  { id:5,  question:"¿Cuál es el destino turístico más visitado?",         answers:[{text:"Cancún",pts:42},{text:"CDMX",pts:28},{text:"Los Cabos",pts:12},{text:"Guadalajara",pts:8},{text:"Puerto Vallarta",pts:6},{text:"Oaxaca",pts:4}]},
  { id:6,  question:"¿Qué no puede faltar en una fiesta mexicana?",        answers:[{text:"Música",pts:38},{text:"Comida",pts:28},{text:"Tequila",pts:18},{text:"Piñata",pts:10},{text:"Familia",pts:4},{text:"Bailar",pts:2}]},
  { id:7,  question:"¿Qué hace la gente en Semana Santa?",                answers:[{text:"Viaja a la playa",pts:40},{text:"Va a misa",pts:28},{text:"Descansa en casa",pts:16},{text:"Visita familia",pts:10},{text:"Come mariscos",pts:4},{text:"No hace nada",pts:2}]},
  { id:8,  question:"¿Cuál es el platillo favorito de los domingos?",      answers:[{text:"Carne asada",pts:38},{text:"Pozole",pts:24},{text:"Barbacoa",pts:18},{text:"Menudo",pts:10},{text:"Birria",pts:6},{text:"Tamales",pts:4}]},
  { id:9,  question:"Nombre una razón por la que lloran los mexicanos",    answers:[{text:"Amor",pts:36},{text:"Películas",pts:26},{text:"Familia",pts:18},{text:"Futbol",pts:12},{text:"Nostalgia",pts:5},{text:"Trabajo",pts:3}]},
  { id:10, question:"¿Cuál es el mejor mes para visitar México?",          answers:[{text:"Diciembre",pts:35},{text:"Marzo",pts:25},{text:"Julio",pts:20},{text:"Octubre",pts:12},{text:"Mayo",pts:5},{text:"Enero",pts:3}]},
  { id:11, question:"¿Cuál es el deporte más popular en México?",          answers:[{text:"Futbol",pts:50},{text:"Beisbol",pts:20},{text:"Boxeo",pts:14},{text:"Lucha libre",pts:8},{text:"Basquetbol",pts:5},{text:"Tenis",pts:3}]},
  { id:12, question:"Nombre algo que nunca falta en una cocina mexicana",  answers:[{text:"Chile",pts:40},{text:"Tortillas",pts:30},{text:"Frijoles",pts:16},{text:"Aceite",pts:8},{text:"Ajo",pts:4},{text:"Sal",pts:2}]},
  { id:13, question:"¿Qué regalo dan los mexicanos en cumpleaños?",        answers:[{text:"Dinero",pts:38},{text:"Ropa",pts:26},{text:"Pastel",pts:18},{text:"Perfume",pts:10},{text:"Juguetes",pts:5},{text:"Flores",pts:3}]},
  { id:14, question:"¿Cuál es la canción más cantada en fiestas?",         answers:[{text:"Las Mañanitas",pts:44},{text:"Cielito Lindo",pts:24},{text:"La Bamba",pts:16},{text:"Guadalajara",pts:8},{text:"México Lindo",pts:5},{text:"El Rey",pts:3}]},
  { id:15, question:"¿Qué hacen los mexicanos el 15 de septiembre?",       answers:[{text:"Van al Zócalo",pts:36},{text:"Ven el Grito en TV",pts:28},{text:"Hacen fiesta en casa",pts:20},{text:"Comen pozole",pts:10},{text:"Ponen música",pts:4},{text:"Nada especial",pts:2}]},
];

/* ═══════════════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════════════ */
export const BLANK = (questions, questionsPerMatch) => ({
  teamA:{name:"Familia 1",score:0}, teamB:{name:"Familia 2",score:0},
  gameMode:"familiar", questions:questions??JSON.parse(JSON.stringify(DEFAULT_Q)),
  questionsPerMatch: questionsPerMatch ?? null, // null = use all questions
  currentQ:0, revealed:[], strikes:0, roundPts:0, activeTeam:"A",
  stealMode:false, phase:"playing", overlayType:null, overlayData:{},
  facePhase:"idle", faceNameA:"", faceNameB:"", faceWinner:null,
  qrMode:false, qrStartIdx:0, qrCurrentQ:0, qrRevealed:[], qrScoreA:0, qrScoreB:0,
});

export const INIT = () => {
  const saved  = (()=>{ try { return JSON.parse(localStorage.getItem(LS_STATE)); } catch { return null; } })();
  const savedQ = (()=>{ try { return JSON.parse(localStorage.getItem(LS_Q));     } catch { return null; } })();
  if (!saved) return BLANK(savedQ);
  return {
    ...BLANK(savedQ),
    teamA:      saved.teamA      ?? {name:"Familia 1",score:0},
    teamB:      saved.teamB      ?? {name:"Familia 2",score:0},
    gameMode:   saved.gameMode   ?? "familiar",
    questionsPerMatch: saved.questionsPerMatch ?? null,
    currentQ:   saved.currentQ   ?? 0,
    revealed:   saved.revealed   ?? [],
    strikes:    saved.strikes    ?? 0,
    roundPts:   saved.roundPts   ?? 0,
    activeTeam: saved.activeTeam ?? "A",
    stealMode:  saved.stealMode  ?? false,
    phase:      saved.phase      ?? "playing",
    facePhase:  saved.facePhase  ?? "idle",
    faceNameA:  saved.faceNameA  ?? "",
    faceNameB:  saved.faceNameB  ?? "",
    faceWinner: saved.faceWinner ?? null,
    qrMode:     saved.qrMode     ?? false,
    qrStartIdx: saved.qrStartIdx ?? 0,
    qrCurrentQ: saved.qrCurrentQ ?? 0,
    qrRevealed: saved.qrRevealed ?? [],
    qrScoreA:   saved.qrScoreA   ?? 0,
    qrScoreB:   saved.qrScoreB   ?? 0,
  };
};

/* ═══════════════════════════════════════════════════
   ADMIN TOKENS
═══════════════════════════════════════════════════ */
export const A = {
  bg:"#111827", surface:"#1f2937", border:"#374151",
  accent:"#fcd34d", red:"#ef4444", blue:"#3b82f6", green:"#22c55e",
  text:"#f3f4f6", muted:"#9ca3af",
};
export const BC = {
  red:   {bg:"#dc2626",sh:"#7f1d1d",tx:"#fff"},
  blue:  {bg:"#2563eb",sh:"#1e3a8a",tx:"#fff"},
  green: {bg:"#16a34a",sh:"#14532d",tx:"#fff"},
  yellow:{bg:"#ca8a04",sh:"#713f12",tx:"#fff"},
  ghost: {bg:"#374151",sh:"#1f2937",tx:"#d1d5db"},
  orange:{bg:"#ea580c",sh:"#7c2d12",tx:"#fff"},
};

export const SHARED_CSS = `
  ${FONTS}
  *{box-sizing:border-box;margin:0;padding:0;}
  @keyframes tile-flip{0%{transform:rotateX(90deg);opacity:0}60%{transform:rotateX(-8deg)}100%{transform:rotateX(0);opacity:1}}
  @keyframes ov-pop{0%{transform:scale(0.2);opacity:0}65%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
  @keyframes steal-pulse{0%,100%{box-shadow:0 0 20px #f59e0b,0 0 40px #f59e0b60}50%{box-shadow:0 0 40px #ef4444,0 0 80px #ef444460}}
  @keyframes glow-winner{from{text-shadow:0 0 30px #ffd200,0 0 60px #ffd20080,3px 3px 0 #7f1d1d}to{text-shadow:0 0 60px #ffd200,0 0 100px #f59e0b,3px 3px 0 #7f1d1d}}
  @keyframes logo-pulse{0%,100%{filter:drop-shadow(0 0 18px #ffd20060) drop-shadow(0 0 50px #ef444450)}50%{filter:drop-shadow(0 0 36px #ffd200a0) drop-shadow(0 0 80px #ef444470)}}
  @keyframes qr-label-blink{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes wizard-in{0%{opacity:0;transform:scale(.96)}100%{opacity:1;transform:scale(1)}}
`;

export const getRoute  = () => { const p=window.location.pathname; if (p.endsWith("/admin")) return "admin"; if (p.endsWith("/game")) return "game"; return "home"; };
export const navigate  = (path) => { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); };
export const openTab   = (path) => window.open(path,"_blank");