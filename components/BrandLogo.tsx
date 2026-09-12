import styles from "./BrandLogo.module.css";

/** Folded map + rising route: a small, distinctive mark for a personal learning journey. */
export function BrandLogo() {
  return (
    <span className={styles.brand}>
      <svg className={styles.mark} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
        <path d="M7 12.5 18 9l12 4 11-3.5v26L30 39l-12-4-11 3.5z" fill="#243c31" />
        <path d="m7 12.5 11-3.5 12 4 11-3.5v26L30 39l-12-4-11 3.5z" stroke="#a8bea6" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M18 9v26m12-22v26" stroke="#a8bea6" strokeOpacity=".4" strokeWidth="1.5" />
        <path d="m12 30 9-9 7 4 8-10" stroke="#e0ba78" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="30" r="2.8" fill="#e0ba78" stroke="#243c31" strokeWidth="1.4" />
        <circle cx="36" cy="15" r="3.1" fill="#f4efe2" stroke="#243c31" strokeWidth="1.4" />
      </svg>
      <span className={styles.wordmark}>Learning<span className={styles.accent}>Map</span></span>
    </span>
  );
}
