import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { shapeForViewer, type ViewTxn } from "../privacy";
import { db, schema } from "./client";
import { getUser, monthStart } from "./queries";

/** This month's family transactions, already shaped for the viewer. Null if the viewer is unknown. */
export async function familyMonth(viewerId: string): Promise<{ rows: ViewTxn[]; memberCount: number } | null> {
  const viewer = await getUser(viewerId);
  if (!viewer) return null;
  const members = await db.select().from(schema.users).where(eq(schema.users.familyId, viewer.familyId));
  const t = schema.transactions;
  const raw = await db
    .select()
    .from(t)
    .where(and(inArray(t.ownerId, members.map((m) => m.id)), gte(t.createdAt, monthStart())))
    .orderBy(desc(t.createdAt));
  return { rows: shapeForViewer(viewer, raw, members), memberCount: members.length };
}
