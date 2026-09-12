"use client";
import { useState } from "react";
import { AVATAR_OPTIONS } from "@/lib/profile/avatars";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import styles from "./AvatarSelectorWithPreview.module.css";
export function AvatarSelectorWithPreview({ defaultAvatarId }: { defaultAvatarId?: string }) {
  const [selectedId, setSelectedId] = useState(AVATAR_OPTIONS.some(a => a.id === defaultAvatarId) ? defaultAvatarId! : "fox");
  const selected = AVATAR_OPTIONS.find(a => a.id === selectedId)!;
  return <fieldset className={styles.picker}>
    <legend className={styles.legend}>Your learning companion</legend>
    <p className={styles.description}>A little personality for every step of your journey.</p>
    <div className={styles.preview}>
      <ProfileAvatar id={selectedId} size={72}/>
      <div><span className={styles.eyebrow}>YOUR COMPANION</span><p className={styles.name}>{selected.label}</p><p className={styles.hint}>Save your profile to make it yours.</p></div>
    </div>
    <div className={styles.grid}>
      {AVATAR_OPTIONS.map(avatar => <label key={avatar.id} className={styles.option}>
        <input type="radio" name="avatarId" value={avatar.id} checked={selectedId === avatar.id} onChange={() => setSelectedId(avatar.id)} required aria-label={avatar.label}/>
        <span className={styles.card}>
          <ProfileAvatar id={avatar.id} size={52}/>
          <span className={styles.label}>{avatar.label}</span>
          <span className={styles.check} aria-hidden="true">✓</span>
        </span>
      </label>)}
    </div>
  </fieldset>;
}
