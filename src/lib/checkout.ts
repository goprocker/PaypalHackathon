import { z } from "zod";
import { CATEGORIES } from "./config";

/** Shared input for the verdict check and order creation. */
export const CheckoutInput = z.object({
  link: z.string().max(2000),
  item: z.string().trim().min(1).max(200),
  priceCents: z.number().int().positive().max(10_000_000),
  shippingCents: z.number().int().min(0).max(1_000_000).default(0),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  includeDuty: z.boolean().default(false),
});
export type CheckoutInput = z.infer<typeof CheckoutInput>;

/** Host only, for display. The app never fetches the link. */
export function merchantFromLink(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "").slice(0, 100);
  } catch {
    return "Unknown merchant";
  }
}
