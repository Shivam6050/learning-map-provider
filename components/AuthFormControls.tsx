"use client";
import {useState} from "react";
import {useFormStatus} from "react-dom";
import styles from "./AuthLayout.module.css";
export function PasswordField({signup=false}:{signup?:boolean}) {
 const [visible,setVisible]=useState(false);
 return <div className={styles.password}><input id="password" name="password" type={visible ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : undefined} maxLength={128} placeholder={signup ? "Create a password" : "Enter your password"} aria-describedby={signup ? "password-help" : undefined}/><button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible ? "Hide" : "Show"}</button></div>;
}
export function AuthSubmit({signup=false}:{signup?:boolean}) {
 const {pending}=useFormStatus();
 return <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>{pending ? (signup ? "Creating your account…" : "Signing you in…") : (signup ? "Create my account" : "Sign in")}<span aria-hidden="true">{pending ? "…" : "→"}</span></button>;
}
