#!/bin/bash
# 预览缩略图更新操作

set -e

LOG_FILE="scripts/upload_log_20260407_160438.json"

echo "=========================================="
echo "缩略图更新预览"
echo "=========================================="
echo ""

if [ ! -f "$LOG_FILE" ]; then
  echo "❌ 日志文件不存在: $LOG_FILE"
  exit 1
fi

PRODUCTS=$(jq -c '.products[] | select(.status == "success")' "$LOG_FILE")
TOTAL=$(echo "$PRODUCTS" | wc -l | tr -d ' ')

echo "将为 $TOTAL 个产品生成和更新缩略图"
echo ""

CURRENT=0
TOTAL_SIZE=0

while IFS= read -r product; do
  CURRENT=$((CURRENT + 1))
  HANDLE=$(echo "$product" | jq -r '.handle')
  FIRST_IMAGE_URL=$(echo "$product" | jq -r '.urls[0]')

  # 获取原图大小
  SIZE=$(curl -sI "$FIRST_IMAGE_URL" | grep -i content-length | awk '{print $2}' | tr -d '\r')
  SIZE_KB=$((SIZE / 1024))
  TOTAL_SIZE=$((TOTAL_SIZE + SIZE))

  echo "[$CURRENT/$TOTAL] $HANDLE"
  echo "  原图: $FIRST_IMAGE_URL"
  echo "  大小: ${SIZE_KB}KB"
  echo ""
done <<< "$PRODUCTS"

TOTAL_SIZE_MB=$((TOTAL_SIZE / 1024 / 1024))

echo "=========================================="
echo "统计信息"
echo "=========================================="
echo "产品总数: $TOTAL"
echo "原图总大小: ${TOTAL_SIZE_MB}MB"
echo "预计缩略图总大小: 约 1-2MB (压缩后)"
echo ""

echo "=========================================="
echo "执行计划"
echo "=========================================="
echo ""
echo "脚本将执行以下操作："
echo "1. 下载每个产品的第一张图片"
echo "2. 使用 sips 生成 400x400 缩略图（质量 85%）"
echo "3. 上传缩略图到服务器"
echo "4. 更新产品的 thumbnail 字段"
echo "5. 清理临时文件"
echo ""
echo "预计耗时: 约 2-3 分钟"
echo ""
echo "=========================================="
echo ""
echo "如果确认无误，执行以下命令开始更新："
echo ""
echo "  bash scripts/03_update_thumbnails.sh"
echo ""
echo "=========================================="
