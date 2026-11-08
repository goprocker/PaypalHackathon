import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  relation: text("relation").notNull(), // Me, Mom, Dad
  familyId: text("family_id").notNull(),
});

export type Tag = "me" | "family" | "private";

/** Server-side record of a PayPal order, used to re-check amount before capture. */
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(), // PayPal order id (or MOCK-…)
  ownerId: text("owner_id").notNull().references(() => users.id),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull(),
  item: text("item").notNull(),
  category: text("category").notNull(),
  merchant: text("merchant").notNull(),
  fxRate: real("fx_rate").notNull(),
  totalPaise: integer("total_paise").notNull(),
  feesPaise: integer("fees_paise").notNull(),
  status: text("status").notNull(), // CREATED, COMPLETED, FAILED
  mock: integer("mock", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  amountPaise: integer("amount_paise").notNull(),
  amountCents: integer("amount_cents"),
  currency: text("currency").notNull(),
  fxRate: real("fx_rate"),
  feesPaise: integer("fees_paise").notNull().default(0),
  status: text("status").notNull(),
  tag: text("tag").$type<Tag>(),
  category: text("category").notNull(),
  item: text("item").notNull(),
  merchant: text("merchant").notNull(),
  paypalOrderId: text("paypal_order_id").unique(),
  captureId: text("capture_id"),
  createdAt: text("created_at").notNull(),
});

export const proofs = sqliteTable("proofs", {
  id: text("id").primaryKey(),
  txnId: text("txn_id").notNull().references(() => transactions.id).unique(),
  data: text("data").notNull(), // JSON snapshot, never updated
  createdAt: text("created_at").notNull(),
});
