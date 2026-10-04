/** Only navigate to Google's fixed OAuth endpoint after a same-origin POST. */
export function googleAuthorizationUrl(value: unknown): string {
 if(typeof value!=="string")throw new Error("Invalid Google Calendar connection response.");
 let url:URL;
 try{url=new URL(value);}catch{throw new Error("Invalid Google Calendar connection response.");}
 if(url.origin!=="https://accounts.google.com" || url.pathname!=="/o/oauth2/v2/auth" || url.username || url.password || url.hash)throw new Error("Invalid Google Calendar connection response.");
 return url.href;
}
