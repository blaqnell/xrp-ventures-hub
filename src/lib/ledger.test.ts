import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { parseCreditAmount } from "./ledger";

describe("admin deposit amount", () => {
  it("accepts a positive amount and normalises to cents", () => {
    expect(parseCreditAmount("$1,000")).toBe("1000.00");
    expect(parseCreditAmount("25.5")).toBe("25.50");
  });
  it("rejects zero and negative amounts", () => {
    expect(parseCreditAmount("0")).toBeNull();
    expect(parseCreditAmount("-50")).toBeNull();
  });
  it("rejects more than 2 decimal places", () => {
    expect(parseCreditAmount("10.001")).toBeNull();
  });
  it("caps a single deposit at 1,000,000,000", () => {
    expect(parseCreditAmount("1000000000")).toBe("1000000000.00");
    expect(parseCreditAmount("1000000000.01")).toBeNull();
  });
});
