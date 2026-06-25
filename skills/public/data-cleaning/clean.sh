#!/usr/bin/env bash
# Data cleaning skill —— 数据清洗脚本（示例）
# 演示 Skills 工作区对 Shell 文件的语法高亮。

set -euo pipefail

INPUT="${1:-data/raw.csv}"
OUTPUT="${2:-data/clean.csv}"

if [[ ! -f "$INPUT" ]]; then
  echo "输入文件不存在: $INPUT" >&2
  exit 1
fi

# 1) 备份
cp "$INPUT" "${INPUT}.bak"

# 2) 去除空行 + 去重（保留表头）
{
  head -n 1 "$INPUT"
  tail -n +2 "$INPUT" | grep -v '^[[:space:]]*$' | sort -u
} > "$OUTPUT"

rows_in=$(wc -l < "$INPUT")
rows_out=$(wc -l < "$OUTPUT")
echo "清洗完成：$rows_in 行 -> $rows_out 行，输出 $OUTPUT"
