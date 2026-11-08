// Seeds the demo family (Me, Mom, Dad) with ~30 transactions in the current month.
import { db, schema } from "../src/lib/db/client";
import type { Tag } from "../src/lib/db/schema";

const FAMILY = "fam_demo";
const users = [
  { id: "u_me", name: "Arun", relation: "Me", familyId: FAMILY },
  { id: "u_mom", name: "Lakshmi", relation: "Mom", familyId: FAMILY },
  { id: "u_dad", name: "Ravi", relation: "Dad", familyId: FAMILY },
];

// [owner, rupees, category, item, merchant, tag, dayOfMonth]
const rows: [string, number, string, string, string, Tag, number][] = [
  ["u_me", 649, "Subscriptions", "Music streaming", "Spotify", "me", 1],
  ["u_me", 1240, "Food", "Dinner with friends", "Zomato", "me", 2],
  ["u_me", 3499, "Shopping", "Running shoes", "Myntra", "me", 3],
  ["u_me", 2200, "Friends", "Trip share", "Split with Karthik", "me", 5],
  ["u_me", 1899, "Shopping", "Birthday gift", "Amazon", "private", 6],
  ["u_me", 499, "Subscriptions", "Video streaming", "Netflix", "me", 7],
  ["u_me", 860, "Food", "Lunch", "Swiggy", "me", 8],
  ["u_me", 4200, "Groceries", "Monthly groceries", "BigBasket", "family", 4],
  ["u_me", 2750, "Other", "Counselling session", "Clinic", "private", 9],
  ["u_me", 1150, "Bills", "Mobile and internet", "Airtel", "family", 3],
  ["u_mom", 5600, "Groceries", "Vegetables and staples", "Local market", "family", 2],
  ["u_mom", 3100, "Bills", "Electricity", "TNEB", "family", 4],
  ["u_mom", 1800, "Shopping", "Kitchen items", "Amazon", "family", 5],
  ["u_mom", 950, "Food", "Snacks", "Bakery", "me", 6],
  ["u_mom", 2400, "Groceries", "Fruits and milk", "Aavin", "family", 7],
  ["u_mom", 6200, "Shopping", "Saree", "Pothys", "private", 8],
  ["u_mom", 700, "Friends", "Temple donation", "Temple", "me", 9],
  ["u_mom", 1450, "Bills", "Gas cylinder", "Indane", "family", 6],
  ["u_mom", 2100, "Groceries", "Monthly provisions", "DMart", "family", 9],
  ["u_mom", 399, "Subscriptions", "TV channels", "Tata Play", "family", 1],
  ["u_dad", 4800, "Bills", "Water and maintenance", "Society", "family", 2],
  ["u_dad", 2600, "Other", "Car service", "Service centre", "family", 3],
  ["u_dad", 1350, "Food", "Tea and snacks", "Cafe", "me", 4],
  ["u_dad", 3900, "Other", "Medicines", "Apollo Pharmacy", "private", 5],
  ["u_dad", 3200, "Groceries", "Weekly groceries", "Reliance Fresh", "family", 6],
  ["u_dad", 1000, "Friends", "Retirement gift pool", "Colleagues", "me", 7],
  ["u_dad", 2999, "Shopping", "Watch", "Titan", "me", 8],
  ["u_dad", 5100, "Bills", "Insurance premium", "LIC", "family", 9],
  ["u_dad", 299, "Subscriptions", "News app", "The Hindu", "me", 2],
  ["u_dad", 1650, "Food", "Family dinner", "Saravana Bhavan", "family", 9],
];

async function main() {
  await db.delete(schema.proofs);
  await db.delete(schema.transactions);
  await db.delete(schema.orders);
  await db.delete(schema.users);
  await db.insert(schema.users).values(users);

  const now = new Date();
  const today = now.getDate();
  await db.insert(schema.transactions).values(
    rows.map(([ownerId, rupees, category, item, merchant, tag, day], i) => ({
      id: `seed_${String(i).padStart(2, "0")}`,
      ownerId,
      amountPaise: rupees * 100,
      currency: "INR",
      status: "COMPLETED",
      tag,
      category,
      item,
      merchant,
      // Keep seeded dates in the past within this month.
      createdAt: new Date(now.getFullYear(), now.getMonth(), Math.max(1, Math.min(day, today)), 10 + (i % 9)).toISOString(),
    })),
  );
  console.log(`Seeded ${users.length} users and ${rows.length} transactions.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
