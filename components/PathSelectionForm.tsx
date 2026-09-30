"use client";
import { useState } from "react";
import { confirmSelectedPath } from "@/app/onboarding/actions";
import { ConfirmPathButton } from "./ConfirmPathButton";
import { Money } from "./CurrencyProvider";
import { courseLink } from "@/lib/affiliates/links";
import { providerName } from "@/lib/web-discovery/providers";
import type { PaidAlternative } from "@/lib/ai/build-options";

export function PathSelectionForm({setId, optionId, alternatives, unavailable, signedIn, currency, initialPurchased = []}: {setId: string; optionId: string; alternatives: PaidAlternative[]; unavailable: boolean; signedIn: boolean; currency: string; initialPurchased?: string[]}) {
  const [purchased, setPurchased] = useState<string[]>(initialPurchased.filter(id => alternatives.some(course => course.resource_id === id)));
  const hasAffiliateAlternatives = alternatives.some(course => courseLink(course.url, course.resources.affiliate === true).affiliate);
  return <form action={confirmSelectedPath} className="mt-8 space-y-4">
    <input type="hidden" name="setId" value={setId} /><input type="hidden" name="optionId" value={optionId} />
    {alternatives.length > 0 && <fieldset className="rounded-xl border border-slate-700 p-4 space-y-4">
      <legend className="px-1 text-sm font-semibold text-white">More courses for this path</legend>
      <p className="text-xs text-slate-300">Buy on the provider’s website, then confirm below to include the course in its matching stages. Purchase confirmation is provided by you; opening a link does not confirm payment.</p>
      {hasAffiliateAlternatives && <p className="text-xs text-slate-300">Some recommendations use affiliate links. LearningMap may earn a commission if you purchase through them.</p>}
      {!signedIn && <a className="block text-xs underline text-emerald-300" href={"/login?next=" + encodeURIComponent("/onboarding/select?set=" + setId)}>Sign in before marking a purchase</a>}
      {alternatives.map(course => {const link = courseLink(course.url, course.resources.affiliate === true); return <div key={course.resource_id} className="rounded-xl border border-slate-700 bg-slate-950/40 p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-slate-400">{providerName(course.url)} · {course.price_unknown ? "Price needs confirmation" : course.over_budget ? "Above this tier’s budget" : "Within budget alongside this route"}</p>
        {link.href ? <a className="block text-sm font-semibold text-emerald-300 underline" href={link.href} target="_blank" rel={link.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}>{course.title} ↗</a> : <p className="text-sm text-slate-300">{course.title} · Link unavailable</p>}
        <p className="text-xs text-slate-300">{course.price_unknown ? "Check current price on provider" : <Money amount={course.cost} currency={currency} />}{!course.price_unknown && (course.resources.billing_interval === "year" ? " total upfront for annual access" : course.months ? " for an estimated " + course.months + " month(s) of access" : " estimated course price")}. Not included until selected.</p>
        <label className="flex items-start gap-2 text-xs text-slate-200 cursor-pointer"><input type="checkbox" name="purchasedResourceId" value={course.resource_id} disabled={!signedIn} checked={purchased.includes(course.resource_id)} onChange={event => setPurchased(current => event.target.checked ? [...current,course.resource_id] : current.filter(id => id !== course.resource_id))} className="mt-0.5 accent-emerald-500" /><span>{course.subscription || course.months ? "I have an active subscription—include these course modules" : "I already own this course—add to my path"}</span></label>
      </div>;})}
      {purchased.length > 0 && <p role="status" className="text-xs text-amber-200">{purchased.length} course(s) will be added when you save this path. Your existing access is self-reported. Adding these courses does not increase the route’s planned new purchases or charge you.</p>}
    </fieldset>}
    {unavailable && purchased.length === 0 ? <p className="text-xs text-slate-400">Choose the free route, or confirm a course you purchased above to save this route.</p> : <ConfirmPathButton />}
  </form>;
}
