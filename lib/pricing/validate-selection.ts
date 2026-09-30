import type { PathOption } from "@/lib/ai/build-options";
import { currentQuote } from "./current-quote";

export class SelectionPriceError extends Error {}

/** Recheck planned purchases, before adding self-reported existing access. */
export async function validateSelectionPrices(option: PathOption, currency: string, country: string) {
  const purchases = [...new Map(option.stages.flatMap(stage => stage.stage_resources)
    .map(item => item.resources)
    .filter(resource => resource.price > 0 || resource.price_unverified)
    .map(resource => [resource.url, resource])).values()];
  await Promise.all(purchases.map(async resource => {
    const quote = await currentQuote(resource.url, currency, country);
    if (!quote || quote.price === null) throw new SelectionPriceError("A course price could not be verified. Please try again shortly or generate fresh options and choose the free route.");
    const interval = "billing_interval" in quote.signals ? quote.signals.billing_interval : undefined;
    if (resource.currency !== currency || resource.price_unverified ||
        Math.round(quote.price * 100) > Math.round(resource.price * 100) ||
        interval !== resource.billing_interval) {
      throw new SelectionPriceError("A course price or billing plan has changed. Generate fresh options to review the updated cost before saving.");
    }
  }));
}
