// The single place that shapes transactions for a viewer. Routes must never return raw rows
// belonging to someone else; pass them through shapeForViewer first.
import type { Tag } from "./db/schema";

export const PRIVATE_LABEL = "Personal – Other";

export interface RawTxn {
  id: string;
  ownerId: string;
  amountPaise: number;
  status: string;
  tag: Tag | null;
  category: string;
  item: string;
  merchant: string;
  createdAt: string;
}

export interface Member { id: string; name: string; relation: string; familyId: string }

export interface ViewTxn {
  id: string;
  ownerId: string;
  ownerName: string;
  isMine: boolean;
  amountPaise: number;
  status: string;
  /** Others' private/untagged items show as "private" so the tag itself reveals nothing more. */
  tag: Tag | null;
  category: string;
  item: string;
  merchant: string | null;
  createdAt: string;
  redacted: boolean;
}

/**
 * Privacy matrix (PRD F3.3):
 * - Owner sees full detail for every tag.
 * - Family tag: everyone in the family sees full detail.
 * - Me tag: family sees it under the owner's name.
 * - Private (and untagged, as a safe default): family sees "Personal – Other", no item, no merchant.
 * Amounts are never dropped, so family totals always include everything.
 * Rows from other families are removed entirely.
 */
export function shapeForViewer(viewer: Member, rows: RawTxn[], members: Member[]): ViewTxn[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const out: ViewTxn[] = [];
  for (const r of rows) {
    const owner = byId.get(r.ownerId);
    if (!owner || owner.familyId !== viewer.familyId) continue;
    const isMine = r.ownerId === viewer.id;
    const hide = !isMine && (r.tag === "private" || r.tag === null);
    out.push({
      id: r.id,
      ownerId: r.ownerId,
      // "Me" is the account holder's own label, so others see their name instead.
      ownerName: isMine ? "You" : owner.relation === "Me" ? owner.name : owner.relation,
      isMine,
      amountPaise: r.amountPaise,
      status: r.status,
      tag: hide ? "private" : r.tag,
      category: hide ? "Personal" : r.category,
      item: hide ? PRIVATE_LABEL : r.item,
      merchant: hide ? null : r.merchant,
      createdAt: r.createdAt,
      redacted: hide,
    });
  }
  return out;
}
