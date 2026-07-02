SELECT id, title, category, terms_type, terms_text, review_date, dispute_rule, status, locked_at, created_at, updated_at
FROM app_bet_book__bets
WHERE status IN ('open', 'ready')
ORDER BY
  CASE WHEN review_date IS NULL OR review_date = '' THEN 1 ELSE 0 END,
  review_date ASC,
  created_at DESC
