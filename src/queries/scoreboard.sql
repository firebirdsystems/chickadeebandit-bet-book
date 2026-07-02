SELECT
  p.member_name,
  p.member_id,
  SUM(CASE WHEN b.status = 'settled' AND w.participant_id IS NOT NULL THEN 1 ELSE 0 END) AS correct,
  SUM(CASE WHEN b.status = 'settled' AND w.participant_id IS NULL THEN 1 ELSE 0 END) AS incorrect,
  SUM(CASE WHEN b.status IN ('open', 'ready') THEN 1 ELSE 0 END) AS open_bets
FROM app_bet_book__participants p
JOIN app_bet_book__bets b ON b.id = p.bet_id
LEFT JOIN app_bet_book__settlement_winners w ON w.bet_id = p.bet_id AND w.participant_id = p.id
GROUP BY p.member_name, p.member_id
ORDER BY correct DESC, open_bets DESC, member_name ASC
