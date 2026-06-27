-- 数据库迁移脚本：为 positions 表添加唯一约束
-- 执行前请备份数据库
-- 用法: cd devour-service && sqlite3 data/devour.db < scripts/migrate_add_unique_constraint.sql

-- 步骤1: 清理重复数据（保留每个组合中每只股票的最早记录）
DELETE FROM positions 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM positions 
    GROUP BY portfolio_id, symbol
);

-- 步骤2: 创建唯一索引（SQLite 不支持 ALTER TABLE ADD CONSTRAINT UNIQUE）
CREATE UNIQUE INDEX IF NOT EXISTS uq_portfolio_symbol ON positions (portfolio_id, symbol);
