import { hasW3SchoolsOffer, W3SCHOOLS_REFERRAL_CODE, W3SCHOOLS_STORE_URL } from "@/lib/affiliates/links";
import styles from "./W3SchoolsOffer.module.css";

export function W3SchoolsOffer({ url }: { url: string }) {
  if (!hasW3SchoolsOffer(url)) return null;
  return <details className={styles.offer}>
    <summary>W3Schools partner offer <span>20% off eligible products</span></summary>
    <div>
      <p>Use code <code>{W3SCHOOLS_REFERRAL_CODE}</code> at checkout for eligible Certification Exams, Certification Courses and Servers collections.</p>
      <p>W3Schools confirms eligibility and the final price at checkout. This offer is not deducted from your roadmap estimate. LearningMap may earn a commission.</p>
      <a href={W3SCHOOLS_STORE_URL} target="_blank" rel="sponsored noopener noreferrer">Visit our W3Schools partner store <span aria-hidden="true">↗</span></a>
    </div>
  </details>;
}
