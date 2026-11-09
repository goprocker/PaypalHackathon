// Demo Mode dataset: ~60 simulated payments for the demo family, plus the
// scenarios judges can load in one tap. Pure data, no bank or DB involved,
// so every section and agent can read it on any host.

export type Method = "upi" | "card" | "paypal" | "netbanking" | "forex";
export type PayStatus = "success" | "failed" | "pending" | "refund_pending" | "refunded";

export type DemoPayment = {
  id: string;
  txnId: string; // UPI UTR / card ref
  ownerId: "u_me" | "u_mom" | "u_dad";
  merchant: string;
  payee: string; // VPA or merchant account
  item: string;
  category: "Groceries" | "Bills" | "Shopping" | "Food" | "Subscriptions" | "Friends" | "Travel" | "Other";
  amountPaise: number;
  method: Method;
  status: PayStatus;
  private: boolean;
  daysAgo: number;
  refund?: { amountPaise: number; requestedDaysAgo: number; etaDays: number; stage: 0 | 1 | 2 | 3 }; // 0 requested … 3 credited
  note?: string;
};

type Row = [DemoPayment["ownerId"], string, string, string, DemoPayment["category"], number, Method, number, boolean?];

// [owner, merchant, payee, item, category, rupees, method, daysAgo, private]
const ROWS: Row[] = [
  ["u_me", "Spotify", "spotify@icici", "Music streaming", "Subscriptions", 119, "card", 2],
  ["u_me", "Netflix", "netflix@hdfcbank", "Video streaming", "Subscriptions", 499, "card", 4],
  ["u_me", "Zomato", "zomato@paytm", "Dinner with friends", "Food", 1240, "upi", 1],
  ["u_me", "Swiggy", "swiggy@icici", "Lunch", "Food", 860, "upi", 3],
  ["u_me", "Myntra", "myntra@axisbank", "Running shoes", "Shopping", 3499, "card", 6],
  ["u_me", "Amazon", "amazon@apl", "Birthday gift", "Shopping", 1899, "upi", 8, true],
  ["u_me", "Airtel", "airtel@axisbank", "Mobile and internet", "Bills", 1150, "upi", 9],
  ["u_me", "BigBasket", "bigbasket@hdfcbank", "Monthly groceries", "Groceries", 4200, "upi", 10],
  ["u_me", "Clinic", "drmeena@okaxis", "Counselling session", "Other", 2750, "upi", 12, true],
  ["u_me", "Karthik", "karthik.r@okicici", "Trip share", "Friends", 2200, "upi", 13],
  ["u_me", "Uber", "uber@axisbank", "Airport ride", "Travel", 640, "upi", 14],
  ["u_me", "Steam", "PayPal: Valve Corp", "Game (USD 19.99)", "Shopping", 1772, "paypal", 15],
  ["u_me", "Coursera", "PayPal: Coursera Inc", "Course (USD 49)", "Other", 4344, "paypal", 18],
  ["u_me", "Cult.fit", "cultfit@ybl", "Gym membership", "Subscriptions", 1499, "card", 20],
  ["u_me", "IRCTC", "irctc@sbi", "Train to Madurai", "Travel", 1385, "netbanking", 21],
  ["u_me", "Starbucks", "starbucks@hdfcbank", "Coffee", "Food", 410, "card", 22],
  ["u_me", "Decathlon", "decathlon@icici", "Cycling gloves", "Shopping", 899, "upi", 24],
  ["u_me", "Jio Cinema", "jiocinema@jio", "Streaming", "Subscriptions", 89, "upi", 25],
  ["u_me", "Booking.com", "Forex card", "Hotel in Singapore (SGD 180)", "Travel", 11420, "forex", 27],
  ["u_me", "Swiggy", "swiggy@icici", "Groceries top-up", "Groceries", 520, "upi", 28],
  ["u_mom", "Local market", "murugan.veg@okhdfc", "Vegetables and staples", "Groceries", 5600, "upi", 1],
  ["u_mom", "TNEB", "tneb@sbi", "Electricity", "Bills", 3100, "netbanking", 3],
  ["u_mom", "Amazon", "amazon@apl", "Kitchen items", "Shopping", 1800, "upi", 5],
  ["u_mom", "Bakery", "ajbakery@okaxis", "Snacks", "Food", 950, "upi", 6],
  ["u_mom", "Aavin", "aavin@indianbank", "Fruits and milk", "Groceries", 2400, "upi", 7],
  ["u_mom", "Pothys", "pothys@icici", "Saree", "Shopping", 6200, "card", 8, true],
  ["u_mom", "Temple", "temple.trust@sbi", "Donation", "Other", 700, "upi", 9],
  ["u_mom", "Indane", "indane@hdfcbank", "Gas cylinder", "Bills", 1450, "upi", 11],
  ["u_mom", "DMart", "dmart@ybl", "Monthly provisions", "Groceries", 2100, "upi", 12],
  ["u_mom", "Tata Play", "tataplay@icici", "TV channels", "Subscriptions", 399, "upi", 14],
  ["u_mom", "Meesho", "meesho@axisbank", "Bedsheets", "Shopping", 749, "upi", 16],
  ["u_mom", "Pharmacy", "medplus@ybl", "Medicines", "Other", 620, "upi", 18],
  ["u_mom", "Local market", "murugan.veg@okhdfc", "Vegetables", "Groceries", 1350, "upi", 20],
  ["u_mom", "Tailor", "selvi.tailor@okicici", "Blouse stitching", "Other", 800, "upi", 23],
  ["u_mom", "Aavin", "aavin@indianbank", "Milk card", "Groceries", 1200, "upi", 26],
  ["u_dad", "Society", "greenpark.soc@sbi", "Water and maintenance", "Bills", 4800, "netbanking", 2],
  ["u_dad", "Service centre", "marutiservice@hdfcbank", "Car service", "Other", 2600, "card", 3],
  ["u_dad", "Cafe", "chaikings@ybl", "Tea and snacks", "Food", 1350, "upi", 4],
  ["u_dad", "Apollo Pharmacy", "apollo@icici", "Medicines", "Other", 3900, "card", 5, true],
  ["u_dad", "Reliance Fresh", "reliancefresh@jio", "Weekly groceries", "Groceries", 3200, "upi", 6],
  ["u_dad", "Colleagues", "suresh.k@okaxis", "Retirement gift pool", "Friends", 1000, "upi", 7],
  ["u_dad", "Titan", "titan@hdfcbank", "Watch", "Shopping", 2999, "card", 8],
  ["u_dad", "LIC", "lic@sbi", "Insurance premium", "Bills", 5100, "netbanking", 9],
  ["u_dad", "The Hindu", "thehindu@icici", "News app", "Subscriptions", 299, "card", 10],
  ["u_dad", "Saravana Bhavan", "ssbhavan@okhdfc", "Family dinner", "Food", 1650, "upi", 11],
  ["u_dad", "Indian Oil", "iocl@sbi", "Petrol", "Travel", 3000, "upi", 13],
  ["u_dad", "BESCOM", "bescom@hdfcbank", "Electricity (old house)", "Bills", 1800, "netbanking", 15],
  ["u_dad", "Amazon", "amazon@apl", "Reading glasses", "Shopping", 1299, "upi", 17],
  ["u_dad", "Indian Oil", "iocl@sbi", "Petrol", "Travel", 2500, "upi", 22],
  ["u_dad", "Reliance Fresh", "reliancefresh@jio", "Groceries", "Groceries", 2750, "upi", 25],
];

const utr = (i: number) => `4${String(31_000_000_000 + i * 7_919_311).slice(0, 11)}`;

const base: DemoPayment[] = ROWS.map(([ownerId, merchant, payee, item, category, rupees, method, daysAgo, priv], i) => ({
  id: `d${String(i + 1).padStart(2, "0")}`,
  txnId: utr(i + 1),
  ownerId,
  merchant,
  payee,
  item,
  category,
  amountPaise: rupees * 100,
  method,
  status: "success",
  private: priv ?? false,
  daysAgo,
}));

// Scenario rows: each one is the problem a scenario walks through.
const special: DemoPayment[] = [
  {
    id: "s_failed", txnId: utr(101), ownerId: "u_me", merchant: "Croma", payee: "croma@hdfcbank", item: "Headphones",
    category: "Shopping", amountPaise: 7999_00, method: "upi", status: "failed", private: false, daysAgo: 0,
    note: "Money debited from bank, merchant says payment failed.",
    refund: { amountPaise: 7999_00, requestedDaysAgo: 0, etaDays: 5, stage: 1 },
  },
  {
    id: "s_refund", txnId: utr(102), ownerId: "u_me", merchant: "Flipkart", payee: "flipkart@axisbank", item: "Returned jacket",
    category: "Shopping", amountPaise: 2499_00, method: "card", status: "refund_pending", private: false, daysAgo: 6,
    refund: { amountPaise: 2499_00, requestedDaysAgo: 4, etaDays: 7, stage: 2 },
  },
  {
    id: "s_refunded", txnId: utr(103), ownerId: "u_mom", merchant: "Meesho", payee: "meesho@axisbank", item: "Wrong size kurta",
    category: "Shopping", amountPaise: 649_00, method: "upi", status: "refunded", private: false, daysAgo: 19,
    refund: { amountPaise: 649_00, requestedDaysAgo: 17, etaDays: 0, stage: 3 },
  },
  {
    id: "s_dup1", txnId: utr(104), ownerId: "u_me", merchant: "ACT Fibernet", payee: "actfibernet@icici", item: "Broadband bill",
    category: "Bills", amountPaise: 1179_00, method: "upi", status: "success", private: false, daysAgo: 2,
  },
  {
    id: "s_dup2", txnId: utr(105), ownerId: "u_me", merchant: "ACT Fibernet", payee: "actfibernet@icici", item: "Broadband bill",
    category: "Bills", amountPaise: 1179_00, method: "upi", status: "success", private: false, daysAgo: 2,
    note: "Same amount, same payee, 3 minutes apart.",
  },
  {
    id: "s_pending", txnId: utr(106), ownerId: "u_dad", merchant: "Hospital", payee: "kmchospital@sbi", item: "Advance deposit",
    category: "Other", amountPaise: 25000_00, method: "upi", status: "pending", private: true, daysAgo: 0,
  },
  {
    id: "s_forex", txnId: utr(107), ownerId: "u_me", merchant: "Etsy", payee: "PayPal: Etsy Inc", item: "Handmade lamp (USD 85)",
    category: "Shopping", amountPaise: 7684_00, method: "paypal", status: "success", private: false, daysAgo: 11,
  },
  {
    id: "s_rejected", txnId: utr(108), ownerId: "u_mom", merchant: "Unknown", payee: "kyc.update.sbi@ybl", item: "\"KYC refund\" collect request",
    category: "Other", amountPaise: 4999_00, method: "upi", status: "failed", private: false, daysAgo: 1,
    note: "Declined: collect request from an unknown VPA.",
  },
];

export const DEMO_PAYMENTS: DemoPayment[] = [...base, ...special].sort((a, b) => a.daysAgo - b.daysAgo);

export const DEMO_MEMBERS = [
  { id: "u_me", name: "Arun", relation: "Me" },
  { id: "u_mom", name: "Lakshmi", relation: "Mom" },
  { id: "u_dad", name: "Ravi", relation: "Dad" },
] as const;

/** A scam QR for the Protect scenario: looks like a shop, pays a personal VPA and requests money. */
export const SCAM_QR = "upi://pay?pa=paytm.refund.help@ybl&pn=Amazon%20Refund%20Desk&am=4999&cu=INR&tn=Refund%20processing%20fee";
export const SAFE_QR = "upi://pay?pa=bigbasket@hdfcbank&pn=BigBasket&cu=INR";

export const SCENARIOS = [
  { id: "failed", title: "Failed payment, money debited", desc: "₹7,999 left the bank but Croma says it failed.", href: "/track?txn=s_failed", focus: "s_failed" },
  { id: "refund", title: "Refund still pending", desc: "Flipkart refund, day 4 of 7. Don't pay again.", href: "/track?txn=s_refund", focus: "s_refund" },
  { id: "duplicate", title: "Charged twice", desc: "Broadband bill paid two times, 3 minutes apart.", href: "/money?focus=duplicates", focus: "s_dup2" },
  { id: "scam_qr", title: "Scam QR code", desc: "A 'refund desk' QR that actually asks you to pay.", href: "/protect?qr=scam", focus: null },
  { id: "family", title: "Family with private items", desc: "Mom and Dad share spending, private items stay hidden.", href: "/family", focus: null },
  { id: "international", title: "Buying from abroad", desc: "USD 85 lamp: which way to pay costs least?", href: "/pay?tool=intl&price=85&cur=USD", focus: "s_forex" },
] as const;

export type ScenarioId = (typeof SCENARIOS)[number]["id"];
export const isScenario = (v: unknown): v is ScenarioId => SCENARIOS.some((s) => s.id === v);

export const paymentById = (id: string) => DEMO_PAYMENTS.find((p) => p.id === id);
export const paymentsFor = (ownerId: string) => DEMO_PAYMENTS.filter((p) => p.ownerId === ownerId);
