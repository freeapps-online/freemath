ALTER TABLE users ADD COLUMN math_rating INTEGER NOT NULL DEFAULT 400;
ALTER TABLE users ADD COLUMN active_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_practiced_on TEXT;

UPDATE users
SET
  math_rating = CASE
    WHEN highest_level >= 35 THEN 1700
    WHEN highest_level >= 30 THEN 1450
    WHEN highest_level >= 25 THEN 1200
    WHEN highest_level >= 20 THEN 950
    WHEN highest_level >= 15 THEN 750
    WHEN highest_level >= 10 THEN 580
    ELSE 400
  END,
  active_days = CASE WHEN total_answers > 0 THEN 1 ELSE 0 END,
  last_practiced_on = CASE WHEN total_answers > 0 THEN date(updated_at) ELSE NULL END
WHERE math_rating = 400 AND active_days = 0;

CREATE INDEX IF NOT EXISTS idx_users_math_rating ON users(math_rating DESC);
