-- PostgreSQL
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------- login
CREATE TABLE users (
  user_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext NOT NULL UNIQUE,
  name           text NOT NULL,
  password_hash  text NOT NULL,             -- argon2id หรือ bcrypt ห้ามเก็บรหัสผ่านจริง
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_login_at  timestamptz
);

CREATE TABLE api_tokens (
  token_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  token_hash    char(64) NOT NULL UNIQUE,   -- SHA-256 (hex) ของ token ห้ามเก็บ token จริง
  label         text,                       -- เช่น "iPhone" หรือ "web"
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,       -- แนะนำ created_at + 8 ชั่วโมง
  last_used_at  timestamptz,
  revoked_at    timestamptz                 -- ตั้งค่าเมื่อ logout
);
CREATE INDEX ix_tokens_user ON api_tokens (user_id);

-- ---------------------------------------------------------------- card book
CREATE TABLE cards (
  card_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  name           text NOT NULL,
  bank           text,
  last4          varchar(4),
  credit_limit   numeric(12,2) NOT NULL CHECK (credit_limit > 0),
  statement_day  smallint NOT NULL CHECK (statement_day BETWEEN 1 AND 31),
  due_day        smallint NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  color          text,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)                    -- ชื่อบัตรไม่ซ้ำภายในบัญชีเดียวกัน
);
CREATE INDEX ix_cards_user ON cards (user_id);

CREATE TABLE categories (
  category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE
);

CREATE TABLE statements (
  statement_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id         uuid NOT NULL REFERENCES cards ON DELETE CASCADE,
  statement_month date NOT NULL,            -- วันที่ 1 ของเดือนรอบบิล
  cutoff_date     date NOT NULL,
  due_date        date NOT NULL,
  total_due       numeric(12,2),
  paid_amount     numeric(12,2) NOT NULL DEFAULT 0,
  paid_at         date,
  UNIQUE (card_id, statement_month)
);

CREATE TABLE installment_plans (
  plan_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id               uuid NOT NULL REFERENCES cards ON DELETE CASCADE,
  item_name             text NOT NULL,
  principal             numeric(12,2),      -- ราคาสินค้า (ไม่บังคับ)
  term_count            smallint NOT NULL CHECK (term_count BETWEEN 1 AND 120),
  monthly_amount        numeric(12,2) NOT NULL CHECK (monthly_amount > 0),
  first_statement_month date NOT NULL,
  status                text NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE','COMPLETED','CANCELLED')),
  note                  text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  txn_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id         uuid NOT NULL REFERENCES cards ON DELETE CASCADE,
  statement_id    uuid REFERENCES statements,
  category_id     uuid REFERENCES categories,
  plan_id         uuid REFERENCES installment_plans ON DELETE CASCADE,
  installment_no  smallint,
  txn_type        text NOT NULL CHECK (txn_type IN ('PURCHASE','INSTALLMENT','FEE','REFUND')),
  txn_date        date NOT NULL,            -- งวดผ่อน = วันตัดรอบของเดือนนั้น
  statement_month date NOT NULL,
  description     text,
  amount          numeric(12,2) NOT NULL CHECK (amount > 0),
  status          text NOT NULL DEFAULT 'POSTED'
                  CHECK (status IN ('POSTED','PENDING','PAID','VOID')),
  paid_at         date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (txn_type <> 'INSTALLMENT' OR (plan_id IS NOT NULL AND installment_no IS NOT NULL)),
  CHECK (status <> 'PAID' OR paid_at IS NOT NULL)
);
CREATE UNIQUE INDEX uq_txn_plan_term ON transactions (plan_id, installment_no) WHERE plan_id IS NOT NULL;
CREATE INDEX ix_txn_card_stmt ON transactions (card_id, statement_month);
CREATE INDEX ix_txn_pending ON transactions (plan_id) WHERE status = 'PENDING';

-- ความเป็นเจ้าของ: users -> cards -> (statements, installment_plans, transactions)
-- ทุก query ต้องกรองผ่าน cards.user_id ของผู้ใช้ที่ถือ token