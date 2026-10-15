-- 0) ตรวจ token ทุกคำขอ: แฮช Bearer token ด้วย SHA-256 แล้วค้นหา (ได้ user_id หรือไม่ได้แถวเลย = 401)
UPDATE api_tokens t
SET last_used_at = now()
FROM users u
WHERE t.user_id = u.user_id
  AND t.token_hash = :token_hash
  AND t.revoked_at IS NULL
  AND t.expires_at > now()
  AND u.is_active
RETURNING t.user_id;

-- 0.1) logout: เพิกถอน token ปัจจุบัน
UPDATE api_tokens SET revoked_at = now() WHERE token_hash = :token_hash AND revoked_at IS NULL;

-- 1) ผ่อนคงเหลือรายแผนของบัตรหนึ่งใบ (เฉพาะของผู้ใช้นี้)
SELECT p.plan_id, p.item_name,
       COUNT(*) FILTER (WHERE t.status = 'PENDING')                    AS remaining_terms,
       COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'PENDING'), 0)  AS remaining_balance
FROM installment_plans p
JOIN cards c        ON c.card_id = p.card_id AND c.user_id = :user_id
JOIN transactions t ON t.plan_id = p.plan_id
WHERE p.card_id = :card_id
GROUP BY p.plan_id, p.item_name;

-- 2) ยอดต้องชำระของรอบบิล แยกรายบัตร (รูดบัตร + งวดผ่อนที่ยังไม่จ่าย)
SELECT c.name,
       SUM(t.amount) FILTER (WHERE t.txn_type = 'PURCHASE')     AS spending,
       SUM(t.amount) FILTER (WHERE t.txn_type = 'INSTALLMENT')  AS installments,
       SUM(t.amount)                                            AS total_due
FROM transactions t
JOIN cards c ON c.card_id = t.card_id
WHERE c.user_id = :user_id
  AND t.statement_month = :statement_month
  AND t.status IN ('POSTED', 'PENDING')
GROUP BY c.name;

-- 3) กด "จ่ายงวดนี้แล้ว": ปิดงวดที่ค้างเก่าสุดของแผน (ตรวจเจ้าของแผนด้วย)
UPDATE transactions
SET status = 'PAID', paid_at = CURRENT_DATE
WHERE txn_id = (
  SELECT t.txn_id
  FROM transactions t
  JOIN installment_plans p ON p.plan_id = t.plan_id
  JOIN cards c             ON c.card_id = p.card_id AND c.user_id = :user_id
  WHERE t.plan_id = :plan_id AND t.status = 'PENDING'
  ORDER BY t.installment_no LIMIT 1
);

-- 4) ภาระผ่อน 12 เดือนข้างหน้า
SELECT t.statement_month, t.card_id, SUM(t.amount) AS installment_due
FROM transactions t
JOIN cards c ON c.card_id = t.card_id AND c.user_id = :user_id
WHERE t.txn_type = 'INSTALLMENT' AND t.status = 'PENDING'
  AND t.statement_month < (date_trunc('month', CURRENT_DATE) + interval '12 months')
GROUP BY t.statement_month, t.card_id
ORDER BY t.statement_month;
