import { countryOptions } from "@/lib/profile/residence";
export function ResidenceFields({phoneRequired=false, defaultCountry="", defaultPhone="", showPhone=true}:{phoneRequired?:boolean;defaultCountry?:string;defaultPhone?:string;showPhone?:boolean}) {
 const input="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white";
 return <fieldset className="space-y-4"><legend className="text-sm font-semibold">Your learning region</legend>
 <div><label htmlFor="country">Country of residence</label><select className={input} id="country" name="country" autoComplete="country" required defaultValue={defaultCountry}><option value="" disabled>Select your country</option>{countryOptions().map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
 {showPhone && <div><label htmlFor="phone">Mobile number {phoneRequired ? "" : "(optional until SMS verification is enabled)"}</label><input className={input} id="phone" name="phone" defaultValue={defaultPhone} type="tel" autoComplete="tel" placeholder="+91 98765 43210" maxLength={40} required={phoneRequired}/><p className="mt-2 text-xs text-slate-400">Include your country calling code. Your phone country can differ from where you live.</p></div>}
 <p className="text-xs text-slate-400">Residence helps match regional offers. Prices use INR in India, EUR in euro-area countries, and USD elsewhere for now. You can change the display currency.</p></fieldset>;
}
