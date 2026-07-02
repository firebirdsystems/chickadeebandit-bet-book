import { describe, expect, it } from "vitest";
import {
  appStats,
  buildScoreboard,
  compactText,
  daysUntil,
  dueStatus,
  formatTerms,
  safeReceiptUrl,
  sortBets,
  validateBetDraft,
} from "../src/logic.js";

describe("validateBetDraft", () => {
  it("requires a title", () => {
    expect(validateBetDraft({ title: "", participants: [] }).valid).toBe(false);
  });

  it("requires two parties with predictions", () => {
    const result = validateBetDraft({
      title: "Will it snow?",
      participants: [{ member_name: "Alex", prediction: "Yes" }],
    });
    expect(result.valid).toBe(false);
  });

  it("accepts a complete draft and trims noisy text", () => {
    const result = validateBetDraft({
      title: "  Finish the deck   ",
      participants: [
        { member_name: " Alex ", prediction: " Before July " },
        { member_name: "Jordan", prediction: "After July" },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.title).toBe("Finish the deck");
  });
});

describe("dates and sorting", () => {
  const now = new Date("2026-07-02T12:00:00Z");

  it("calculates day offsets", () => {
    expect(daysUntil("2026-07-02", now)).toBe(0);
    expect(daysUntil("2026-07-09", now)).toBe(7);
    expect(daysUntil("2026-06-30", now)).toBe(-2);
  });

  it("labels overdue and due-soon bets", () => {
    expect(dueStatus({ status: "open", review_date: "2026-06-30" }, now)).toEqual({ tone: "danger", label: "2d overdue" });
    expect(dueStatus({ status: "open", review_date: "2026-07-02" }, now)).toEqual({ tone: "warning", label: "Review today" });
  });

  it("sorts actionable open bets before settled history", () => {
    const sorted = sortBets([
      { id: "settled", status: "settled", created_at: "2026-01-01T00:00:00Z" },
      { id: "late", status: "open", review_date: "2026-06-30", created_at: "2026-01-01T00:00:00Z" },
      { id: "future", status: "open", review_date: "2027-01-01", created_at: "2026-01-01T00:00:00Z" },
    ], now);
    expect(sorted.map(b => b.id)).toEqual(["late", "future", "settled"]);
  });
});

describe("scoreboard", () => {
  it("counts correct, incorrect, open, and voided results", () => {
    const bets = [
      { id: "b1", status: "settled" },
      { id: "b2", status: "open" },
      { id: "b3", status: "voided" },
    ];
    const board = buildScoreboard(bets, [
      { bet_id: "b1", member_name: "Alex", is_winner: 1 },
      { bet_id: "b1", member_name: "Jordan", is_winner: 0 },
      { bet_id: "b2", member_name: "Alex", is_winner: 0 },
      { bet_id: "b3", member_name: "Alex", is_winner: 0 },
    ]);
    expect(board[0]).toMatchObject({ name: "Alex", correct: 1, open: 1, voided: 1 });
    expect(board[1]).toMatchObject({ name: "Jordan", incorrect: 1 });
  });
});

describe("display helpers", () => {
  it("compacts long text", () => {
    expect(compactText("a ".repeat(100), 12)).toBe("a a a a a a...");
  });

  it("formats terms with wager details", () => {
    expect(formatTerms({ terms_type: "meal_treat", terms_text: "Loser buys tacos" })).toBe("Meal or treat: Loser buys tacos");
  });

  it("allows only safe receipt URL protocols", () => {
    expect(safeReceiptUrl("https://example.com/source")).toBe("https://example.com/source");
    expect(safeReceiptUrl("mailto:person@example.com")).toBe("mailto:person@example.com");
    expect(safeReceiptUrl("javascript:alert(1)")).toBe("");
    expect(safeReceiptUrl("data:text/html,boom")).toBe("");
  });

  it("summarizes app stats", () => {
    const stats = appStats([
      { id: "a", status: "open", review_date: "2020-01-01", created_at: "2020-01-01T00:00:00Z" },
      { id: "b", status: "settled", created_at: "2020-02-01T00:00:00Z" },
    ]);
    expect(stats.open).toBe(1);
    expect(stats.settled).toBe(1);
    expect(stats.overdue).toBe(1);
    expect(stats.longestOpen.id).toBe("a");
  });
});
