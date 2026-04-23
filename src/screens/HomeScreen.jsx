import { useState } from "react";
import { SHARED_CSS, openTab, navigate } from "../constants.js";

/* ═══════════════════════════════════════════════════
   HOME SCREEN  ( "/" )
═══════════════════════════════════════════════════ */
export default function HomeScreen() {
  return (
    <div style={{
      width:"100vw",height:"100vh",background:"#06062a",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      gap:28,position:"relative",overflow:"hidden",fontFamily:"'Teko',sans-serif",
    }}>
      <style>{SHARED_CSS}</style>
      <div style={{position:"absolute",inset:"6px",borderRadius:20,border:"3px solid #7c3aed",
        boxShadow:"inset 0 0 0 2px #06062a,0 0 80px #8b5cf650",pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,opacity:0.05,
        backgroundImage:"radial-gradient(circle,#93c5fd 1px,transparent 1px)",
        backgroundSize:"22px 22px",pointerEvents:"none"}}/>

      <div style={{textAlign:"center",zIndex:1,animation:"logo-pulse 3s ease-in-out infinite"}}>
        <div style={{fontSize:"clamp(88px,17vw,176px)",color:"#ffd200",lineHeight:.85,fontWeight:700,
          textShadow:"5px 5px 0 #7f1d1d,0 0 60px #ffd20080",letterSpacing:-4}}>100</div>
        <div style={{fontSize:"clamp(24px,5vw,54px)",color:"#fff",
          textShadow:"3px 3px 0 #7f1d1d",letterSpacing:3,marginTop:-6,fontWeight:600}}>MEXICANOS DIJERON</div>
        <div style={{fontSize:"clamp(12px,2vw,21px)",color:"#f97316",letterSpacing:7,marginTop:6,fontWeight:500}}>
          el juego de familia
        </div>
      </div>

      <div style={{width:"70%",maxWidth:460,height:2,zIndex:1,
        background:"linear-gradient(90deg,transparent,#ffd200,#dc2626,#ffd200,transparent)"}}/>

      <div style={{display:"flex",flexDirection:"column",gap:12,alignItems:"center",zIndex:1}}>
        <HomeBtn label="🎮  ABRIR PANEL ADMIN"
          bg="linear-gradient(180deg,#ef4444 0%,#b91c1c 100%)"
          shadow="#450a0a" glow="#ef444470"
          onClick={()=>openTab("/admin")} large/>
        <HomeBtn label="📺  SOLO PROYECTOR"
          bg="linear-gradient(180deg,#2563eb 0%,#1e3a8a 100%)"
          shadow="#0f2060" glow="#3b82f640"
          onClick={()=>openTab("/game")}/>
      </div>

      <p style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,color:"#ffffff28",letterSpacing:2,zIndex:1}}>
        Abre Admin en una pestaña · Proyector en otra
      </p>
    </div>
  );
}

function HomeBtn({ label, bg, shadow, glow, onClick, large }) {
  const [hov,setHov]=useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      fontFamily:"'Teko',sans-serif",fontSize:large?26:19,fontWeight:700,letterSpacing:2,
      border:"none",cursor:"pointer",padding:large?"14px 60px":"10px 38px",borderRadius:8,
      background:bg,color:"#fff",
      boxShadow:`0 6px 0 ${shadow}, 0 0 ${hov?"46px":"24px"} ${glow}`,
      transform:hov?"translateY(-2px)":"translateY(0)",transition:"all .15s",
      minWidth:300,textAlign:"center",
    }}>{label}</button>
  );
}