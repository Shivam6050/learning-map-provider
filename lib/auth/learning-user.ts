import { redirect } from "next/navigation";
import { contactVerificationEnabled, hasVerifiedContacts } from "./contact-verification";
/** Runs at each protected server entry point, including direct server-action calls. */
export async function getLearningUser(client: {auth:{getUser:()=>Promise<any>}}) {
 const result=await client.auth.getUser();
 if (result.data?.user && contactVerificationEnabled() && !hasVerifiedContacts(result.data.user)) redirect("/verify-contact");
 return result;
}
