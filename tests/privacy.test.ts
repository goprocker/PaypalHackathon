import { describe, expect, it } from "vitest";
import { PRIVATE_LABEL, shapeForViewer, type Member, type RawTxn } from "../src/lib/privacy";

const me: Member = { id: "u_me", name: "Arun", relation: "Me", familyId: "f1" };
const mom: Member = { id: "u_mom", name: "Lakshmi", relation: "Mom", familyId: "f1" };
const stranger: Member = { id: "u_x", name: "X", relation: "Me", familyId: "f2" };
const members = [me, mom, stranger];

const txn = (id: string, ownerId: string, tag: RawTxn["tag"], amountPaise = 10000): RawTxn => ({
  id, ownerId, amountPaise, tag, status: "COMPLETED", category: "Shopping", item: `item-${id}`, merchant: `shop-${id}`, createdAt: "2026-11-01T00:00:00Z",
});

const rows = [
  txn("a", "u_mom", "me"),
  txn("b", "u_mom", "family"),
  txn("c", "u_mom", "private", 55500),
  txn("d", "u_mom", null),
  txn("e", "u_me", "private"),
  txn("z", "u_x", "family"),
];

describe("shapeForViewer", () => {
  const view = shapeForViewer(me, rows, members);
  const get = (id: string) => view.find((v) => v.id === id)!;

  it("owner sees own private items in full", () => {
    expect(get("e")).toMatchObject({ item: "item-e", merchant: "shop-e", tag: "private", redacted: false, isMine: true });
  });

  it("family tag is fully visible to others", () => {
    expect(get("b")).toMatchObject({ item: "item-b", merchant: "shop-b", redacted: false });
  });

  it("me tag is visible under the owner's name", () => {
    expect(get("a")).toMatchObject({ item: "item-a", ownerName: "Mom", redacted: false });
  });

  it("others' private items show only 'Personal – Other' but keep the amount", () => {
    expect(get("c")).toMatchObject({ item: PRIVATE_LABEL, merchant: null, category: "Personal", amountPaise: 55500, redacted: true });
    expect(JSON.stringify(get("c"))).not.toContain("item-c");
    expect(JSON.stringify(get("c"))).not.toContain("shop-c");
  });

  it("untagged items from others are treated as private", () => {
    expect(get("d")).toMatchObject({ item: PRIVATE_LABEL, merchant: null, redacted: true });
  });

  it("drops rows from other families", () => {
    expect(view.find((v) => v.id === "z")).toBeUndefined();
  });

  it("never drops an amount from the family total", () => {
    const familyRows = rows.filter((r) => r.ownerId !== "u_x");
    const total = familyRows.reduce((s, r) => s + r.amountPaise, 0);
    expect(view.reduce((s, v) => s + v.amountPaise, 0)).toBe(total);
  });

  it("is symmetric: Mom cannot see my private item", () => {
    const momView = shapeForViewer(mom, rows, members);
    expect(momView.find((v) => v.id === "e")).toMatchObject({ item: PRIVATE_LABEL, merchant: null });
  });
});
