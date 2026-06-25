-- 数据库迁移脚本：为 positions 表添加唯一约束
-- 执行前请备份数据库

-- 步骤1: 清理重复数据（保留每个组合中每只股票的最早记录）
DELETE FROM positions 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM positions 
    GROUP BY portfolio_id, symbol
);

-- 步骤2: 添加唯一约束
ALTER TABLE positions ADD CONSTRAINT uq_portfolio_symbol UNIQUE (portfolio_id, symbol);

-- 验证：查看约束是否创建成功
-- .schema positions
-- 应该看到：CREATE UNIQUE INDEX uq_portfolio_symbol ON positions(portfolio_id, symbol);
