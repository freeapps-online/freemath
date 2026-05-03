CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Math Player',
  language TEXT NOT NULL DEFAULT 'en-US',
  total_score INTEGER NOT NULL DEFAULT 0,
  total_answers INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  highest_level INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS problem_stats (
  user_id TEXT NOT NULL,
  problem_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, problem_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_total_score ON users(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_best_streak ON users(best_streak DESC);
CREATE INDEX IF NOT EXISTS idx_users_accuracy ON users(correct_answers DESC, total_answers DESC);
CREATE INDEX IF NOT EXISTS idx_problem_stats_last_seen ON problem_stats(user_id, last_seen DESC);
