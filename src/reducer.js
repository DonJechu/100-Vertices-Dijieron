import { BLANK, DEFAULT_Q, LS_Q, LS_STATE, SFX } from "./constants.js";

export function reducer(S, action) {
  const saveQ = q => q;
  const persist = next => {
    const { overlayType, overlayData, ...rest } = next;
    localStorage.setItem(LS_STATE, JSON.stringify(rest));
    return next;
  };

  let next = S;

  switch (action.type) {

    /* ── General ── */
    case "SET_MODE": {
      if (action.v === "rapidas" && !S.qrMode) {
        next = {...S, gameMode:action.v, qrMode:true,
          qrStartIdx:S.currentQ, qrCurrentQ:S.currentQ,
          qrRevealed:[], qrScoreA:0, qrScoreB:0};
      } else if (action.v !== "rapidas") {
        next = {...S, gameMode:action.v, qrMode:false};
      } else {
        next = {...S, gameMode:action.v};
      }
      break;
    }
    case "SET_ACTIVE":   next = {...S, activeTeam:action.v}; break;
    case "TOGGLE_STEAL": next = {...S, stealMode:!S.stealMode}; break;
    case "SET_TEAM": {
      const k = action.t==="A" ? "teamA" : "teamB";
      next = {...S, [k]:{...S[k],[action.f]:action.v}};
      break;
    }
    case "SET_SCORE": {
      const k = action.t==="A" ? "teamA" : "teamB";
      next = {...S, [k]:{...S[k],score:action.v}};
      break;
    }

    /* ── Reveal / Strike / Points ── */
    case "REVEAL": {
      if (S.revealed.includes(action.i)) return S;
      SFX.reveal();
      const mult = S.questions[S.currentQ].multiplier ?? 1;
      const pts  = S.questions[S.currentQ].answers[action.i].pts * mult;
      next = {...S, revealed:[...S.revealed,action.i], roundPts:S.roundPts+pts};
      break;
    }
    case "HIDE": {
      if (!S.revealed.includes(action.i)) return S;
      const mult = S.questions[S.currentQ].multiplier ?? 1;
      const pts  = S.questions[S.currentQ].answers[action.i].pts * mult;
      next = {...S, revealed:S.revealed.filter(x=>x!==action.i), roundPts:Math.max(0,S.roundPts-pts)};
      break;
    }
    case "REVEAL_ALL": {
      const q = S.questions[S.currentQ];
      const mult = q.multiplier ?? 1;
      const missing = q.answers.map((_,i)=>i).filter(i=>!S.revealed.includes(i));
      if (!missing.length) return S;
      SFX.reveal();
      next = {...S, revealed:q.answers.map((_,i)=>i),
        roundPts:S.roundPts+missing.reduce((s,i)=>s+q.answers[i].pts*mult,0)};
      break;
    }
    case "HIDE_ALL":   next = {...S, revealed:[], roundPts:0}; break;
    case "STRIKE": {
      const n = S.strikes+1;
      if (n>=3) {
        SFX.tripleStrike();
        // Auto-switch turn to the other team for steal
        const stealTeam = S.activeTeam==="A" ? "B" : "A";
        next = {...S, strikes:n, overlayType:"strike", overlayData:{count:n},
          stealMode:true, activeTeam:stealTeam};
        break;
      }
      SFX.strike();
      next = {...S, strikes:n, overlayType:"strike", overlayData:{count:n}};
      break;
    }
    case "RST_STRIKES":  next = {...S, strikes:0, stealMode:false}; break;
    case "AWARD": {
      if (!S.roundPts) return S;
      SFX.award();
      const k   = action.t==="A" ? "teamA" : "teamB";
      const nm  = action.t==="A" ? S.teamA.name : S.teamB.name;
      const mul = S.questions[S.currentQ].multiplier ?? 1;
      next = {...S, [k]:{...S[k],score:S[k].score+S.roundPts},
        roundPts:0, strikes:0, stealMode:false,
        overlayType:"award", overlayData:{pts:S.roundPts, team:nm, multiplier:mul}};
      break;
    }
    case "RST_PTS":     next = {...S, roundPts:0}; break;
    case "CLR_OVERLAY": return {...S, overlayType:null};

    /* ── Navigation ── */
    case "GOTO_Q":
      next = {...S, currentQ:action.v, revealed:[], roundPts:0, strikes:0, stealMode:false, overlayType:null};
      break;
    case "PREV_Q":
      next = {...S, currentQ:Math.max(0,S.currentQ-1), revealed:[], roundPts:0, strikes:0, stealMode:false, overlayType:null};
      break;
    case "NEXT_Q": {
      const qi = S.currentQ+1;
      const limit = S.questionsPerMatch ?? S.questions.length;
      if (qi >= limit || qi >= S.questions.length) { next = {...S, phase:"gameover"}; break; }
      SFX.tick();
      next = {...S, currentQ:qi, revealed:[], roundPts:0, strikes:0, stealMode:false, overlayType:null,
        activeTeam:S.activeTeam==="A"?"B":"A"};
      break;
    }
    case "RST_ROUND":
      next = {...S, revealed:[], roundPts:0, strikes:0, stealMode:false, overlayType:null,
        facePhase:"idle", faceWinner:null};
      break;
    case "END":      SFX.win(); next = {...S, phase:"gameover"}; break;
    case "FULL_RST":
      localStorage.removeItem(LS_STATE);
      next = {...BLANK(S.questions, S.questionsPerMatch), phase:"playing"};
      break;

    /* ── Setup a new match: shuffle bank, apply multipliers, set teams ── */
    case "SETUP_MATCH": {
      const cfg   = action.cfg;
      const n     = cfg.questionsPerMatch ?? 5;
      const mults = cfg.multipliers ?? [];

      // Banco completo: preferir questionBank del estado, luego LS_STATE, luego LS_Q (legado)
      let bank = S.questionBank || S.questions;
      try {
        const saved = JSON.parse(localStorage.getItem(LS_STATE));
        if (saved?.questionBank?.length) bank = saved.questionBank;
        else if (saved?.questions?.length) bank = saved.questions;
      } catch {}
      if (!bank || bank.length === 0) bank = DEFAULT_Q;

      // Shuffle and pick n questions
      const shuffled = [...bank].sort(() => Math.random() - 0.5).slice(0, n);

      // Apply multipliers in configured order (P1→mults[0], P2→mults[1], …)
      const matchQ = shuffled.map((q, i) => ({
        ...q,
        multiplier: mults[i] ?? 1,
      }));

      localStorage.removeItem(LS_STATE);
      next = {
        ...BLANK(bank, n),
        questions:     matchQ,       // preguntas del match actual (shuffleadas)
        questionBank:  bank,         // banco completo para el editor
        questionsPerMatch: n,
        teamA: {name: action.teamA, score: 0},
        teamB: {name: action.teamB, score: 0},
        phase: "playing",
      };
      break;
    }
    
    /* ── Cara a cara (legacy — kept for state compat) ── */
    case "FACE_SET_NAME": { const f=action.t==="A"?"faceNameA":"faceNameB"; next={...S,[f]:action.v}; break; }
    case "FACE_START_A":  next = {...S, facePhase:"leaderA"}; break;
    case "FACE_START_B":  next = {...S, facePhase:"leaderB"}; break;
    case "FACE_WINNER":
      next = {...S, facePhase:"done", faceWinner:action.t, activeTeam:action.t,
        revealed:[], roundPts:0, strikes:0, stealMode:false};
      break;
    case "FACE_RESET": next = {...S, facePhase:"idle", faceNameA:"", faceNameB:"", faceWinner:null}; break;

    /* ── Preguntas Rápidas ── */
    case "QR_START":
      SFX.tick();
      next = {...S, qrMode:true, qrStartIdx:action.v, qrCurrentQ:action.v,
        qrRevealed:[], qrScoreA:0, qrScoreB:0};
      break;
    case "QR_END":   next = {...S, qrMode:false}; break;
    case "QR_GOTO":  next = {...S, qrCurrentQ:action.v, qrRevealed:[]}; break;
    case "QR_NEXT": {
      const nq = S.qrCurrentQ+1;
      const limit = S.qrStartIdx+5;
      if (nq>=limit || nq>=S.questions.length) { next=S; } else { SFX.tick(); next={...S,qrCurrentQ:nq,qrRevealed:[]}; }
      break;
    }
    case "QR_REVEAL": {
      if (S.qrRevealed.includes(action.i)) return S;
      SFX.reveal();
      next = {...S, qrRevealed:[...S.qrRevealed,action.i]};
      break;
    }
    case "QR_HIDE":  next = {...S, qrRevealed:S.qrRevealed.filter(x=>x!==action.i)}; break;
    case "QR_AWARD": {
      if (S.qrRevealed.includes(action.i)) return S;
      SFX.reveal();
      const pts = S.questions[S.qrCurrentQ].answers[action.i].pts;
      next = {...S,
        qrRevealed:[...S.qrRevealed,action.i],
        qrScoreA: action.t==="A" ? S.qrScoreA+pts : S.qrScoreA,
        qrScoreB: action.t==="B" ? S.qrScoreB+pts : S.qrScoreB,
        overlayType:"award",
        overlayData:{pts, team:action.t==="A"?S.teamA.name:S.teamB.name}};
      break;
    }
    case "QR_WRONG":
      SFX.strike();
      next = {...S, overlayType:"strike"};
      break;
    case "QR_FINALIZE": {
      SFX.award();
      next = {...S,
        teamA:{...S.teamA, score:S.teamA.score+S.qrScoreA},
        teamB:{...S.teamB, score:S.teamB.score+S.qrScoreB},
        qrMode:false,
        overlayType:"award",
        overlayData:{pts:S.qrScoreA+S.qrScoreB, team:`${S.teamA.name} ${S.qrScoreA} — ${S.teamB.name} ${S.qrScoreB}`}
      };
      break;
    }

    /* ── Editor ── */
    case "ADD_Q": {
      const nq = {id:Date.now(), question:"Nueva pregunta…", answers:[
        {text:"Respuesta 1",pts:30},{text:"Respuesta 2",pts:25},{text:"Respuesta 3",pts:20},
        {text:"Respuesta 4",pts:15},{text:"Respuesta 5",pts:7},{text:"Respuesta 6",pts:3}]};
      next = {...S, questions:saveQ([...S.questions,nq])};
      break;
    }
    case "DEL_Q": {
      if (S.questions.length<=1) return S;
      const qs = saveQ(S.questions.filter((_,i)=>i!==action.i));
      next = {...S, questions:qs, currentQ:Math.min(S.currentQ,qs.length-1)};
      break;
    }
    case "EDIT_Q": {
      const bank = S.questionBank ?? S.questions;
      const qs = bank.map((q,i)=>i===action.i?{...q,[action.f]:action.v}:q);
      saveQ(qs); next={...S, questionBank:qs}; break;
    }
    case "EDIT_A": {
      const bank = S.questionBank ?? S.questions;
      const qs = bank.map((q,i)=>i===action.i
        ?{...q,answers:q.answers.map((a,j)=>j===action.j?{...a,[action.f]:action.v}:a)}:q);
      saveQ(qs); next={...S, questionBank:qs}; break;
    }
    
    case "RST_Q": {
      const qs = saveQ(JSON.parse(JSON.stringify(DEFAULT_Q)));
      next = {...S, questions:qs, currentQ:0, revealed:[], roundPts:0};
      break;
    }

    default: return S;
  }

  return persist(next);
}