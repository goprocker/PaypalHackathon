import { describe, expect, it } from "vitest";
import { trustScore } from "../src/lib/risk";
import { ruleVerdict } from "../src/lib/verdict";

describe("trustScore", () => {
  it("trusts known https stores", () => {
    const t = trustScore("https://www.amazon.com/dp/B0ABC");
    expect(t.label).toBe("Trusted");
  });
  it("flags look-alike store domains", () => {
    const t = trustScore("https://amazon-deals-free.xyz/item");
    expect(t.label).toBe("High risk");
  });
  it("flags raw IP over http", () => {
    expect(trustScore("http://192.168.1.4/buy").label).toBe("High risk");
  });
  it("handles unreadable links", () => {
    expect(trustScore("not a url").score).toBe(10);
  });
});

describe("ruleVerdict", () => {
  const trust = trustScore("https://www.bestbuy.com/x");
  const base = { item: "Headphones", category: "Shopping", budgetPaise: 1000000, trust };
  it("good when well under budget", () => {
    expect(ruleVerdict({ ...base, totalPaise: 200000, spentPaise: 0 }).verdict).toBe("GOOD FOR YOU");
  });
  it("think again at 80%+", () => {
    expect(ruleVerdict({ ...base, totalPaise: 300000, spentPaise: 550000 }).verdict).toBe("THINK AGAIN");
  });
  it("not worth it over budget", () => {
    expect(ruleVerdict({ ...base, totalPaise: 600000, spentPaise: 500000 }).verdict).toBe("NOT WORTH IT");
  });
  it("not worth it for high-risk links", () => {
    const bad = trustScore("http://10.0.0.1/free-giveaway");
    expect(ruleVerdict({ ...base, trust: bad, totalPaise: 1, spentPaise: 0 }).verdict).toBe("NOT WORTH IT");
  });
});
