import { BLANK, DEFAULT_Q, LS_Q, LS_STATE, SFX, qKey } from "./constants.js";

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
      const q    = S.questions[S.currentQ];
      const mult = q.multiplier ?? 1;
      const pts  = q.answers[action.i].pts * mult;
      const revealed = [...S.revealed, action.i];
      // ¿Se acertaron todas las respuestas del tablero (máx. 5 barras)? → ganó la ronda
      const slots   = Math.min(5, q.answers.length);
      const cleared = Array.from({length:slots}, (_,k)=>k).every(k=>revealed.includes(k));
      if (cleared) SFX.triunfo(); else SFX.reveal();
      next = {...S, revealed, roundPts:S.roundPts+pts, wonQ: cleared ? S.currentQ : null,
        shown:(S.shown??[]).filter(x=>x!==action.i)};
      break;
    }
    case "HIDE": {
      if (!S.revealed.includes(action.i)) return S;
      const revealed = S.revealed.filter(x=>x!==action.i);
      if ((S.shown??[]).includes(action.i)) {            // se mostró "sin puntos": no hay puntos que quitar
        next = {...S, revealed, shown:S.shown.filter(x=>x!==action.i), wonQ:null};
        break;
      }
      const mult = S.questions[S.currentQ].multiplier ?? 1;
      const pts  = S.questions[S.currentQ].answers[action.i].pts * mult;
      next = {...S, revealed, roundPts:Math.max(0,S.roundPts-pts), wonQ:null};
      break;
    }
    /* Mostrar una respuesta SIN puntos (el presentador pide revelar las que quedaron
       sin descubrir cuando la ronda ya se decidió): no suma, no gana, no hay triunfo ni GIF */
    case "SHOW": {
      if (S.revealed.includes(action.i)) return S;
      SFX.reveal();
      next = {...S, revealed:[...S.revealed, action.i], shown:[...(S.shown??[]), action.i]};
      break;
    }
    case "SHOW_ALL": {
      const q = S.questions[S.currentQ];
      const missing = q.answers.map((_,i)=>i).filter(i=>!S.revealed.includes(i));
      if (!missing.length) return S;
      SFX.reveal();
      next = {...S, revealed:q.answers.map((_,i)=>i),
        shown:[...(S.shown??[]).filter(i=>S.revealed.includes(i)), ...missing]};
      break;
    }
    case "REVEAL_ALL": {
      const q = S.questions[S.currentQ];
      const mult = q.multiplier ?? 1;
      const missing = q.answers.map((_,i)=>i).filter(i=>!S.revealed.includes(i));
      if (!missing.length) return S;
      SFX.reveal();
      next = {...S, revealed:q.answers.map((_,i)=>i),
        roundPts:S.roundPts+missing.reduce((s,i)=>s+q.answers[i].pts*mult,0), wonQ:null,
        shown:(S.shown??[]).filter(i=>S.revealed.includes(i))};
      break;
    }
    case "HIDE_ALL":   next = {...S, revealed:[], roundPts:0, wonQ:null, shown:[]}; break;
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
    /* "Jugar esta ronda" del editor: la pregunta viene del BANCO (su posición no sirve en la partida).
       Si ya está en la partida, salta a ella; si no, ocupa el lugar de la pregunta actual
       (conservando el ×1/×2/×3 de ese turno, salvo que la pregunta tenga uno propio mayor). */
    case "PLAY_Q": {
      if (S.phase==="gameover" || S.qrMode || !S.questions?.length) return S;
      const bank = S.questionBank ?? S.questions;
      const bq = bank[action.i];
      if (!bq) return S;
      const key   = qKey(bq);
      const reset = {revealed:[], roundPts:0, strikes:0, stealMode:false, overlayType:null, shown:[], wonQ:null};
      const idx   = S.questions.findIndex(q=>qKey(q)===key);
      if (idx >= 0) { next = {...S, ...reset, currentQ:idx}; break; }
      const slotMult = S.questions[S.currentQ]?.multiplier ?? 1;
      const mult     = bq.multiplier > 1 ? bq.multiplier : slotMult;
      const questions = S.questions.map((q,k)=> k===S.currentQ ? {...bq, multiplier:mult} : q);
      next = {...S, ...reset, questions, usedQ:[...new Set([...(S.usedQ??[]), key])]};
      break;
    }
    case "GOTO_Q":
      next = {...S, currentQ:action.v, revealed:[], roundPts:0, strikes:0, stealMode:false, overlayType:null};
      break;
    case "PREV_Q":
      next = {...S, currentQ:Math.max(0,S.currentQ-1), revealed:[], roundPts:0, strikes:0, stealMode:false, overlayType:null};
      break;
    case "NEXT_Q": {
      const qi = S.currentQ+1;
      const limit = S.questionsPerMatch ?? S.questions.length;
      if (qi >= limit || qi >= S.questions.length) { SFX.win(); next = {...S, phase:"gameover"}; break; }
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
      next = {...BLANK(S.questions, S.questionsPerMatch), phase:"playing",
        questionBank:S.questionBank, usedQ:S.usedQ, qRecycled:S.qRecycled};
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

      /* ── Preguntas ya usadas en el torneo: no se repiten hasta agotar el banco ──
         (se lee SOLO de S.usedQ para que el reducer siga siendo puro, aunque React lo llame dos veces) */
      const used = new Set(S.usedQ ?? []);
      // Si se vuelve a cargar una partida que ni siquiera empezó, sus preguntas se liberan (no se "queman")
      const prev = S.questions ?? [];
      const unplayed = S.phase==="playing" && !S.qrMode && S.revealed.length===0 && S.currentQ===0 &&
        S.teamA.score===0 && S.teamB.score===0 && S.strikes===0 && S.roundPts===0;
      if (unplayed && prev.length && prev.every(q=>used.has(qKey(q)))) prev.forEach(q=>used.delete(qKey(q)));

      const shuffle = arr => { const r=[...arr]; for (let i=r.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [r[i],r[j]]=[r[j],r[i]]; } return r; };
      let picked = shuffle(bank.filter(q=>!used.has(qKey(q)))).slice(0, n);
      let recycled = false;
      if (picked.length < n) {
        // Ya no quedan suficientes preguntas nuevas: completar con repetidas y empezar un ciclo nuevo
        recycled = true;
        picked = [...picked, ...shuffle(bank.filter(q=>!picked.includes(q))).slice(0, n - picked.length)];
        used.clear();
      }
      picked.forEach(q=>used.add(qKey(q)));
      const shuffled = picked;

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
        usedQ:         [...used],    // preguntas ya usadas en el torneo
        qRecycled:     recycled,     // true si en esta partida hubo que repetir preguntas
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
      // El editor trabaja sobre el BANCO (questionBank); si no existe, sobre questions
      const bank = S.questionBank ?? S.questions;
      const nid  = bank.reduce((m,q)=>Math.max(m, Number(q.id)||0), 0) + 1;
      const nq = {id:nid, question:"Nueva pregunta…", answers:[
        {text:"Respuesta 1",pts:35},{text:"Respuesta 2",pts:25},{text:"Respuesta 3",pts:20},
        {text:"Respuesta 4",pts:12},{text:"Respuesta 5",pts:8}]};
      const nb = [...bank, nq];
      next = S.questionBank ? {...S, questionBank:nb} : {...S, questions:nb};
      break;
    }
    case "DEL_Q": {
      const bank = S.questionBank ?? S.questions;
      if (bank.length<=1) return S;
      const nb = bank.filter((_,i)=>i!==action.i);
      const usedQ = (S.usedQ??[]).filter(k=>k!==qKey(bank[action.i]));
      next = S.questionBank
        ? {...S, questionBank:nb, usedQ}
        : {...S, questions:nb, currentQ:Math.min(S.currentQ,nb.length-1)};
      break;
    }
    /* Importar varias preguntas de golpe: action.qs = [{question, answers:[{text,pts}]}], action.mode = "append"|"replace" */
    case "IMPORT_Q": {
      if (!action.qs?.length) return S;
      const bank  = action.mode==="replace" ? [] : (S.questionBank ?? S.questions);
      const start = bank.reduce((m,q)=>Math.max(m, Number(q.id)||0), 0) + 1;
      const added = action.qs.map((q,i)=>({id:start+i, question:q.question, answers:q.answers}));
      const nb    = [...bank, ...added];
      // Si todavía no hay preguntas de juego cargadas, usar las importadas para que el admin no quede vacío
      next = {...S, questionBank:nb, questions: S.questions?.length ? S.questions : nb,
        usedQ: action.mode==="replace" ? [] : S.usedQ};
      break;
    }
    case "RESET_USED": next = {...S, usedQ:[], qRecycled:false}; break;
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