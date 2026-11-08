import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "./client";

export const monthStart = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1).toISOString();

/** Month-to-date completed spend for one user in one category, in paise. */
export async function monthSpent(ownerId: string, category: string): Promise<number> {
  const t = schema.transactions;
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${t.amountPaise}), 0)` })
    .from(t)
    .where(and(eq(t.ownerId, ownerId), eq(t.category, category), eq(t.status, "COMPLETED"), gte(t.createdAt, monthStart())));
  return Number(row?.total ?? 0);
}

export async function getUser(id: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  return u ?? null;
}
