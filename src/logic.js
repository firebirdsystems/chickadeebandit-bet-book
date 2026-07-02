export const CATEGORIES = [
  { value: "family", label: "Family" },
  { value: "sports", label: "Sports" },
  { value: "pop_culture", label: "Pop culture" },
  { value: "house_projects", label: "House projects" },
  { value: "weather", label: "Weather" },
  { value: "finance", label: "Finance" },
  { value: "wild_claims", label: "Wild claims" },
];

export const TERM_TYPES = [
  { value: "bragging_rights", label: "Bragging rights" },
  { value: "custom_prize", label: "Custom prize" },
  { value: "money", label: "Money" },
  { value: "favor_chore", label: "Favor or chore" },
  { value: "meal_treat", label: "Meal or treat" },
  { value: "other", label: "Other" },
];

export const DISPUTE_RULES = [
  { value: "all_parties", label: "All parties agree" },
  { value: "creator_decides", label: "Creator decides" },
  { value: "majority_vote", label: "Majority vote" },
  { value: "admin_resolves", label: "Admin resolves" },
];

export function compactText(value, max = 180) {
  const trimmed = String(value ?? "").trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trim()}...`;
}

export function validateBetDraft(draft) {
  const title = compactText(draft?.title, 160);
  if (!title) return { valid: false, error: "Give the bet a title." };
  const participants = Array.isArray(draft?.participants) ? draft.participants : [];
  const usable = participants.filter(p => compactText(p.member_name, 80) && compactText(p.prediction, 500));
  if (usable.length < 2) return { valid: false, error: "Add at least two parties with predictions." };
  return { valid: true, title, participants: usable };
}

export function labelFor(list, value) {
  return list.find(item => item.value === value)?.label ?? value;
}

export function formatTerms(bet) {
  const type = labelFor(TERM_TYPES, bet?.terms_type ?? "bragging_rights");
  const text = compactText(bet?.terms_text, 120);
  return text ? `${type}: ${text}` : type;
}

export function safeReceiptUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, "https://example.invalid");
    if (!["http:", "https:", "mailto:"].includes(url.protocol)) return "";
    return raw;
  } catch {
    return "";
  }
}

export function daysUntil(dateValue, now = new Date()) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date - today) / 86400000);
}

export function dueStatus(bet, now = new Date()) {
  if (!bet?.review_date || bet.status === "settled" || bet.status === "voided") {
    return { tone: "neutral", label: bet?.status ?? "open" };
  }
  const days = daysUntil(bet.review_date, now);
  if (days === null) return { tone: "neutral", label: "No date" };
  if (days < 0) return { tone: "danger", label: `${Math.abs(days)}d overdue` };
  if (days === 0) return { tone: "warning", label: "Review today" };
  if (days <= 14) return { tone: "warning", label: `${days}d left` };
  return { tone: "neutral", label: new Date(`${bet.review_date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) };
}

export function sortBets(bets, now = new Date()) {
  const rank = { ready: 0, open: 1, settled: 2, voided: 3 };
  return [...bets].sort((a, b) => {
    const statusDiff = (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
    if (statusDiff) return statusDiff;
    const aDays = daysUntil(a.review_date, now);
    const bDays = daysUntil(b.review_date, now);
    if (aDays !== null && bDays !== null && aDays !== bDays) return aDays - bDays;
    if (aDays !== null) return -1;
    if (bDays !== null) return 1;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });
}

export function buildScoreboard(bets, participants) {
  const byPerson = new Map();
  for (const participant of participants) {
    const name = participant.member_name || "Unknown";
    if (!byPerson.has(name)) {
      byPerson.set(name, { name, member_id: participant.member_id ?? "", correct: 0, incorrect: 0, open: 0, voided: 0 });
    }
    const score = byPerson.get(name);
    const bet = bets.find(b => b.id === participant.bet_id);
    if (!bet) continue;
    if (bet.status === "settled") {
      if (Number(participant.is_winner)) score.correct += 1;
      else score.incorrect += 1;
    } else if (bet.status === "voided") {
      score.voided += 1;
    } else {
      score.open += 1;
    }
  }
  return [...byPerson.values()].sort((a, b) =>
    b.correct - a.correct ||
    b.open - a.open ||
    a.name.localeCompare(b.name)
  );
}

export function appStats(bets) {
  const open = bets.filter(b => b.status === "open" || b.status === "ready");
  const settled = bets.filter(b => b.status === "settled");
  const overdue = open.filter(b => daysUntil(b.review_date) !== null && daysUntil(b.review_date) < 0);
  const longestOpen = open.slice().sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")))[0] ?? null;
  return { open: open.length, settled: settled.length, overdue: overdue.length, longestOpen };
}
