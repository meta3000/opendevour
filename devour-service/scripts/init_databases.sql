-- devour-service SQLite 数据库初始化
-- 用法：sqlite3 data/devour.db < scripts/init_databases.sql
-- 注意：应用启动时 lifespan 会自动执行 Base.metadata.create_all，通常无需手动运行此脚本。

PRAGMA foreign_keys = ON;

-- 简单冒烟表，便于验证数据库连通性
CREATE TABLE IF NOT EXISTS app_meta (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key         VARCHAR(128) NOT NULL UNIQUE,
  value       VARCHAR(512),
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_meta (key, value)
VALUES ('schema_version', '1')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;

-- 投资组合表
CREATE TABLE IF NOT EXISTS portfolios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(500) DEFAULT '',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 持仓明细表
CREATE TABLE IF NOT EXISTS positions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  portfolio_id  INTEGER NOT NULL,
  symbol        VARCHAR(20) NOT NULL,
  name          VARCHAR(50) DEFAULT '',
  quantity      INTEGER DEFAULT 0,
  avg_cost      REAL DEFAULT 0.0,
  current_price REAL DEFAULT 0.0,
  sector        VARCHAR(50) DEFAULT '',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_positions_portfolio FOREIGN KEY (portfolio_id)
    REFERENCES portfolios(id) ON DELETE CASCADE
);

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  position_id INTEGER NOT NULL,
  type        VARCHAR(10) NOT NULL,
  quantity    INTEGER NOT NULL,
  price       REAL NOT NULL,
  timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes       VARCHAR(200) DEFAULT '',
  CONSTRAINT fk_transactions_position FOREIGN KEY (position_id)
    REFERENCES positions(id) ON DELETE CASCADE
);
