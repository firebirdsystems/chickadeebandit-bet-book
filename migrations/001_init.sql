CREATE TABLE IF NOT EXISTS app_bet_book__bets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'wild_claims' CHECK (category IN ('family', 'sports', 'pop_culture', 'house_projects', 'weather', 'finance', 'wild_claims')),
  terms_type TEXT NOT NULL DEFAULT 'bragging_rights' CHECK (terms_type IN ('bragging_rights', 'custom_prize', 'money', 'favor_chore', 'meal_treat', 'other')),
  terms_text TEXT,
  review_date TEXT,
  dispute_rule TEXT NOT NULL DEFAULT 'all_parties' CHECK (dispute_rule IN ('all_parties', 'creator_decides', 'majority_vote', 'admin_resolves')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ready', 'settled', 'voided')),
  locked_at TEXT,
  resolved_at TEXT,
  resolved_by TEXT,
  outcome_summary TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_bet_book__participants (
  id TEXT PRIMARY KEY,
  bet_id TEXT NOT NULL,
  member_id TEXT,
  member_name TEXT NOT NULL,
  side_label TEXT NOT NULL,
  prediction TEXT NOT NULL,
  is_winner INTEGER NOT NULL DEFAULT 0 CHECK (is_winner IN (0, 1)),
  result_note TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_bet_book__evidence (
  id TEXT PRIMARY KEY,
  bet_id TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'note' CHECK (kind IN ('note', 'link', 'photo', 'screenshot')),
  label TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  added_by TEXT,
  added_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_bet_book__amendments (
  id TEXT PRIMARY KEY,
  bet_id TEXT NOT NULL,
  body TEXT NOT NULL,
  added_by TEXT,
  added_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_bet_book__settlement_votes (
  id TEXT PRIMARY KEY,
  bet_id TEXT NOT NULL,
  member_id TEXT,
  vote TEXT NOT NULL CHECK (vote IN ('settled', 'voided', 'agree', 'disagree')),
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_bet_book__settlement_winners (
  id TEXT PRIMARY KEY,
  bet_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  marked_by TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (bet_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_bet_book_bets_status_review_created
  ON app_bet_book__bets (status, review_date, created_at);

CREATE INDEX IF NOT EXISTS idx_bet_book_participants_bet_id
  ON app_bet_book__participants (bet_id);

CREATE INDEX IF NOT EXISTS idx_bet_book_evidence_bet_added
  ON app_bet_book__evidence (bet_id, added_at);

CREATE INDEX IF NOT EXISTS idx_bet_book_amendments_bet_added
  ON app_bet_book__amendments (bet_id, added_at);

CREATE INDEX IF NOT EXISTS idx_bet_book_votes_bet_created
  ON app_bet_book__settlement_votes (bet_id, created_at);

CREATE INDEX IF NOT EXISTS idx_bet_book_winners_bet_participant
  ON app_bet_book__settlement_winners (bet_id, participant_id);
