import { ImageResponse } from "next/og";

export const alt = "LearningMap — a clear learning roadmap for your next chapter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:64, background:"#f5f3eb", color:"#20382b" }}>
    <div style={{ display:"flex", fontSize:32, fontWeight:700 }}>LearningMap</div>
    <div style={{ display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", fontSize:70, fontWeight:700, letterSpacing:-3 }}>A clear path to</div>
      <div style={{ display:"flex", fontSize:70, fontWeight:700, letterSpacing:-3, color:"#526348" }}>your next chapter.</div>
    </div>
    <div style={{ display:"flex", alignItems:"center", fontSize:23, gap:22 }}>
      {["Learn", "Practise", "Build"].map((label, index) => <div key={label} style={{ display:"flex", alignItems:"center", gap:14 }}><div style={{ display:"flex", width:46, height:46, alignItems:"center", justifyContent:"center", borderRadius:23, background:"#264b36", color:"#fff", fontSize:20 }}>{index+1}</div>{label}{index<2 && <div style={{ display:"flex", width:90, height:2, background:"#9fac91", marginLeft:12 }} />}</div>)}
    </div>
    <div style={{ display:"flex", fontSize:20, color:"#4d6254" }}>Personalized learning roadmaps · Your level, time and budget</div>
  </div>, size);
}
