import styles from "./settings.module.css";
import Link from "next/link";
import { ResidenceFields } from "@/components/ResidenceFields";
import { contactVerificationEnabled } from "@/lib/auth/contact-verification";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfile, updateResidence } from "@/app/settings/actions";
import { AvatarSelectorWithPreview } from "@/components/AvatarSelectorWithPreview";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";
import { SaveProfileButton } from "@/components/SaveProfileButton";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectedFrom=/settings");

  let profile: { display_name?: string; avatar_id?: string } | null = null;
  const { data: pData, error: pErr } = await supabase
    .from("profiles")
    .select("display_name, avatar_id")
    .eq("id", user.id)
    .maybeSingle();

  if (pErr && pErr.message?.includes("avatar_id")) {
    const { data: fallbackP } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    profile = fallbackP;
  } else {
    profile = pData;
  }

  const effectiveAvatarId = profile?.avatar_id ?? (user.user_metadata?.avatar_id as string | undefined);
  const effectiveDisplayName = profile?.display_name ?? (user.user_metadata?.display_name as string | undefined) ?? "";

  return <div className={styles.page}>
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link href="/dashboard" className={styles.back}>← Back to dashboard</Link>
        <p className={styles.eyebrow}>YOUR LEARNING SPACE</p>
        <h1>Make it<br/><em>your own.</em></h1>
        <p className={styles.intro}>The little details that make your learning journey feel like you.</p>
        <nav aria-label="Settings sections" className={styles.nav}>
          <a href="#profile"><span>01</span> Profile & companion</a>
          <a href="#region"><span>02</span> Learning region</a>
          <a href="#account"><span>03</span> Account management</a>
        </nav>
        <div className={styles.identity}><span>SIGNED IN AS</span><p>{user.email}</p><small>Your email is used to sign in to LearningMap.</small></div>
      </aside>
      <div className={styles.content}>
        <header className={styles.header}><p className={styles.eyebrow}>ACCOUNT SETTINGS</p><h2>A space that feels like you.</h2><p>Manage your profile and personalise your learning preferences.</p></header>
        {params.saved && <div className={styles.success} role="status">Your settings have been saved.</div>}
        {params.error && <div className={styles.error} role="alert">{params.error}</div>}
        <section id="profile" className={styles.card} aria-labelledby="profile-title">
          <div className={styles.sectionHeading}><span>01</span><div><h2 id="profile-title">Profile & companion</h2><p>How you appear throughout your learning space.</p></div></div>
          <form action={updateProfile} className={styles.form}>
            <div><label htmlFor="displayName">Display name</label><input id="displayName" name="displayName" type="text" autoComplete="nickname" required maxLength={100} defaultValue={effectiveDisplayName} aria-describedby="name-hint"/><p id="name-hint" className={styles.hint}>Use the name you’d like us to call you.</p></div>
            <AvatarSelectorWithPreview defaultAvatarId={effectiveAvatarId} key={effectiveAvatarId || "default"}/>
            <div className={styles.save}><span>Happy with your new look?</span><SaveProfileButton/></div>
          </form>
        </section>
        <section id="region" className={styles.card} aria-labelledby="region-title">
          <div className={styles.sectionHeading}><span>02</span><div><h2 id="region-title">Learn from where you are.</h2><p>Find resources and offers relevant to your region.</p></div></div>
          <form action={updateResidence} className={styles.form}>
            <ResidenceFields showPhone={false} defaultCountry={user.user_metadata?.country_of_residence || ""}/>
            <div className={styles.save}><button type="submit" className={styles.regionButton}>Save learning region <span aria-hidden="true">→</span></button></div>
          </form>
          {contactVerificationEnabled() && <Link href="/verify-contact" className={styles.verify}>Verify contact details →</Link>}
        </section>
        <section id="account" className={styles.account} aria-labelledby="account-title">
          <div className={styles.sectionHeading}><span>03</span><div><h2 id="account-title">Account management</h2><p>You’re in control of your account and your data.</p></div></div>
          <details className={styles.delete}><summary>Delete your account</summary><p>This permanently deletes your account, saved roadmaps and progress history. This action cannot be undone.</p><DeleteAccountForm/></details>
        </section>
      </div>
    </div>
  </div>;
}
