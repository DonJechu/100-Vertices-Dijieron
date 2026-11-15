import { useState } from "react";
import { SHARED_CSS, openTab } from "../constants.js";
import bgNeon from "../assets/show/bg-neon.gif";
import logo   from "../assets/show/logo.png";

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
      <img src={bgNeon} alt="" draggable="false"
        style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0}}/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,transparent 40%,#05021f99 100%)",zIndex:0}}/>

      <div style={{textAlign:"center",zIndex:1}}>
        <img src={logo} alt="100 Vértices Dijeron" draggable="false"
          style={{width:"min(70vw,640px)",maxHeight:"46vh",objectFit:"contain",
            filter:"drop-shadow(0 12px 30px #000a)"}}/>
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