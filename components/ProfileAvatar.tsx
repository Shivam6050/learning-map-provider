import type { ReactNode } from "react";
import { AVATAR_OPTIONS } from "@/lib/profile/avatars";

const ink = "#253b35", paper = "#f4ecda";
const eyes = <><circle cx="25" cy="33" r="2" fill={ink}/><circle cx="39" cy="33" r="2" fill={ink}/></>;
const art: Record<string, { bg: string; drawing: ReactNode }> = {
  fox: { bg: "#ead4b5", drawing: <><path d="m14 15 15 9h6l15-9-3 26-15 12-15-12z" fill="#b56d46"/><path d="m18 34 14 8 14-8-5 12-9 7-9-7z" fill={paper}/><path d="m18 20 7 5-7 3m28-8-7 5 7 3" fill={ink}/>{eyes}<path d="m28 41 4 4 4-4" fill={ink}/></> },
  owl: { bg: "#cdd9c6", drawing: <><path d="m15 16 11 6h12l11-6v25c0 17-34 17-34 0z" fill="#687b62"/><path d="M17 30c0-11 15-11 15 0 0-11 15-11 15 0v5c0 12-15 13-15 4-1 9-15 8-15-4z" fill={paper}/><circle cx="24" cy="32" r="3" fill={ink}/><circle cx="40" cy="32" r="3" fill={ink}/><path d="m28 38 4 7 4-7" fill="#c29051"/><path d="m25 49 7 3 7-3" stroke={paper} strokeWidth="2" fill="none"/></> },
  robot: { bg: "#c9d9d9", drawing: <><path d="M32 12v8" stroke={ink} strokeWidth="2"/><circle cx="32" cy="11" r="3" fill="#b67a4c"/><rect x="13" y="20" width="38" height="33" rx="10" fill="#65868a"/><rect x="18" y="26" width="28" height="16" rx="6" fill={paper}/>{eyes}<path d="M26 47h12" stroke={paper} strokeWidth="3" strokeLinecap="round"/><path d="M9 31v9m46-9v9" stroke={ink} strokeWidth="3" strokeLinecap="round"/></> },
  astronaut: { bg: "#d5d6e2", drawing: <><path d="M14 54v-9h36v9" fill="#9298b0"/><rect x="10" y="25" width="44" height="17" rx="5" fill="#9298b0"/><rect x="15" y="12" width="34" height="39" rx="17" fill={paper}/><rect x="20" y="21" width="24" height="22" rx="10" fill={ink}/><path d="M25 30c1-4 3-5 6-5" stroke="#e0ba78" strokeWidth="3" strokeLinecap="round" fill="none"/><circle cx="39" cy="38" r="2" fill="#8aa89a"/></> },
  wizard: { bg: "#d9cee0", drawing: <><path d="M17 53v-17h30v17" fill="#766385"/><ellipse cx="32" cy="37" rx="12" ry="13" fill="#dab99a"/><path d="M21 40h22L32 57z" fill={paper}/>{eyes}<path d="m19 27 10-21 15 23" fill="#766385"/><path d="M13 29h38" stroke="#584767" strokeWidth="5" strokeLinecap="round"/><path d="m30 15 3 4-5-1" fill="#e0ba78"/></> },
  ninja: { bg: "#d2d5c8", drawing: <><path d="m42 35 14 8-12 3 8 8-13-7" fill="#ac7955"/><path d="M14 50V30a18 18 0 0 1 36 0v20z" fill={ink}/><path d="M16 28h32v10H16z" fill={paper}/>{eyes}<path d="M16 23h32" stroke="#ac7955" strokeWidth="5"/><path d="m25 44 7 4 7-4" stroke="#658376" strokeWidth="2" fill="none"/></> },
  cat: { bg: "#e7cdc3", drawing: <><path d="m15 14 14 9h6l14-9-1 26c0 15-32 15-32 0z" fill="#a87767"/><path d="m19 20 6 6-6 2m26-8-6 6 6 2" fill="#e7b7a5"/>{eyes}<ellipse cx="32" cy="43" rx="10" ry="8" fill={paper}/><path d="m29 39 3 3 3-3" fill={ink}/><path d="M32 42v3m-13-5-9-2m9 7-9 1m35-6 9-2m-9 7 9 1" stroke={ink} strokeWidth="1.6" strokeLinecap="round"/></> },
  dragon: { bg: "#d6dfbf", drawing: <><path d="m17 22-3-12 12 8m14 0 9-8-1 15" fill="#a9874e"/><path d="M16 52V30c0-20 32-20 32 0v13l-9 11z" fill="#6b8563"/><path d="M20 36h28v10c0 12-28 12-28 0z" fill="#b8c99a"/><circle cx="25" cy="29" r="2" fill={ink}/><circle cx="40" cy="29" r="2" fill={ink}/><circle cx="27" cy="42" r="1.5" fill={ink}/><circle cx="41" cy="42" r="1.5" fill={ink}/><path d="m26 14 6-7 6 7" fill="#a9874e"/></> },
};
export function ProfileAvatar({ id, size = 48 }: { id?: string | null; size?: number }) {
  const key = id && art[id] ? id : "fox";
  const avatar = art[key];
  return <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={AVATAR_OPTIONS.find(a => a.id === key)?.label ?? "Fox"} style={{ display: "block", flexShrink: 0, borderRadius: "50%", maxWidth: "100%" }}>
    <circle cx="32" cy="32" r="32" fill={avatar.bg}/>
    <circle cx="32" cy="32" r="28" fill="none" stroke={paper} strokeOpacity=".45"/>
    {avatar.drawing}
  </svg>;
}
