import { useState, useEffect, useCallback, useRef } from "react";
import { INIT, CH_NAME, getRoute, unlockAudio, LS_STATE } from "./constants.js";
import { reducer } from "./reducer.js";
import HomeScreen  from "./screens/HomeScreen.jsx";
import GameScreen  from "./screens/GameScreen.jsx";
import AdminScreen from "./screens/AdminScreen.jsx";

export default function App() {
  const [route, setRoute] = useState(getRoute());
  const [G, rawSet]       = useState(INIT());
  const chRef             = useRef(null);

  // Carga preguntas desde /preguntas.json si localStorage no tiene ninguna
  useEffect(()=>{
    const hasQ = G.questions?.length > 0 && G.questions[0]?.id !== undefined;
    if (hasQ) return;
    fetch("/preguntas.json")
      .then(r => r.json())
      .then(qs => {
        if (!qs?.length) return;
        rawSet(prev => {
          const next = {...prev, questions: qs};
          const { overlayType, overlayData, ...rest } = next;
          localStorage.setItem(LS_STATE, JSON.stringify(rest));
          return next;
        });
      })
      .catch(()=>{});
  }, []);

  // Unlock AudioContext on first user gesture (fixes autoplay policy)
  useEffect(()=>{
    const unlock = () => { unlockAudio(); window.removeEventListener("pointerdown", unlock); };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  },[]);

  useEffect(()=>{
    const onPop = () => setRoute(getRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  },[]);

  useEffect(()=>{
    try {
      const ch = new BroadcastChannel(CH_NAME);
      chRef.current = ch;
      ch.onmessage = e => { if (e.data.t==="S") rawSet(()=>e.data.s); };
      return () => ch.close();
    } catch {}
  },[]);

  const dispatch = useCallback(action=>{
    rawSet(prev=>{
      const next = reducer(prev, action);
      try { chRef.current?.postMessage({t:"S",s:next}); } catch {}
      return next;
    });
  },[]);

  useEffect(()=>{
    if (!G.overlayType) return;
    const ms = G.overlayType==="strike" ? 1900 : 1700;
    const t = setTimeout(()=>dispatch({type:"CLR_OVERLAY"}), ms);
    return ()=>clearTimeout(t);
  },[G.overlayType]);

  if (route==="admin") return <AdminScreen G={G} dispatch={dispatch}/>;
  if (route==="game")  return <GameScreen  G={G}/>;
  return <HomeScreen/>;
}