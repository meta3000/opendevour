-- Code review skill —— 拉取待评审变更（示例 SQL）WWWW
-- 演示 Skills 工作区对 SQL 文件的语法高亮。

WITH recent_changes AS (
    SELECT
        c.id            AS change_id,
        c.author,
        c.repo,
        c.created_at,
        COUNT(f.id)     AS file_count,
        SUM(f.additions) AS additions,
        SUM(f.deletions) AS deletions
    FROM changes c
    JOIN change_files f ON f.change_id = c.id
    WHERE c.status = 'pending'
      AND c.created_at >= NOW() - INTERVAL 7 DAY
    GROUP BY c.id, c.author, c.repo, c.created_at
)
SELECT
    change_id,
    author,
    repo,
    file_count,
    additions + deletions AS churn,
    created_at
FROM recent_changes
WHERE additions + deletions > 50
ORDER BY churn DESC
LIMIT 20;
