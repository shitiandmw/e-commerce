#!/bin/bash
# 生成并更新产品缩略图

set -e

# 配置
API_BASE="https://api.shangjiacigar.com"
EMAIL="admin@test.com"
PASSWORD="admin123456"
LOG_FILE="scripts/upload_log_20260407_160438.json"
THUMB_DIR="product_images/batch31/thumbnails"
THUMB_SIZE=400
THUMB_QUALITY=85
UPDATE_LOG="scripts/thumbnail_update_log_$(date +%Y%m%d_%H%M%S).json"

echo "=========================================="
echo "高希霸产品缩略图生成和更新"
echo "=========================================="
echo ""
echo "开始时间: $(date)"
echo "缩略图目录: $THUMB_DIR"
echo "缩略图尺寸: ${THUMB_SIZE}x${THUMB_SIZE}"
echo "更新日志: $UPDATE_LOG"
echo ""

# 创建缩略图目录
mkdir -p "$THUMB_DIR"

# 1. 登录获取 token
echo "步骤 1: 登录获取 token..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/user/emailpass" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  exit 1
fi

echo "✓ 登录成功"
echo ""

# 初始化日志
echo "{\"start_time\": \"$(date -Iseconds)\", \"products\": []}" > "$UPDATE_LOG"

# 2. 读取上传日志
echo "步骤 2: 读取产品列表..."
PRODUCTS=$(jq -c '.products[] | select(.status == "success")' "$LOG_FILE")
TOTAL=$(echo "$PRODUCTS" | wc -l | tr -d ' ')

echo "找到 $TOTAL 个产品需要更新缩略图"
echo ""

CURRENT=0
SUCCESS=0
FAILED=0

# 3. 处理每个产品
while IFS= read -r product; do
  CURRENT=$((CURRENT + 1))

  HANDLE=$(echo "$product" | jq -r '.handle')
  PRODUCT_ID=$(echo "$product" | jq -r '.product_id')
  FIRST_IMAGE_URL=$(echo "$product" | jq -r '.urls[0]')

  echo "=========================================="
  echo "[$CURRENT/$TOTAL] 处理: $HANDLE"
  echo "=========================================="
  echo "产品 ID: $PRODUCT_ID"
  echo "原图 URL: $FIRST_IMAGE_URL"

  # 下载原图
  TEMP_IMAGE="/tmp/cohiba_original_$$.jpg"
  echo "  下载原图..."

  if ! curl -s -o "$TEMP_IMAGE" "$FIRST_IMAGE_URL"; then
    echo "  ❌ 下载失败"
    FAILED=$((FAILED + 1))
    jq --arg handle "$HANDLE" --arg status "failed" --arg reason "download_failed" \
      '.products += [{"handle": $handle, "status": $status, "reason": $reason}]' \
      "$UPDATE_LOG" > "${UPDATE_LOG}.tmp" && mv "${UPDATE_LOG}.tmp" "$UPDATE_LOG"
    continue
  fi

  # 生成缩略图
  THUMB_FILE="${THUMB_DIR}/${HANDLE}__thumb.jpg"
  echo "  生成缩略图..."

  # 使用 sips 生成缩略图（macOS 内置工具）
  if ! sips -Z "$THUMB_SIZE" -s format jpeg -s formatOptions "$THUMB_QUALITY" "$TEMP_IMAGE" --out "$THUMB_FILE" > /dev/null 2>&1; then
    echo "  ❌ 生成缩略图失败"
    rm -f "$TEMP_IMAGE"
    FAILED=$((FAILED + 1))
    jq --arg handle "$HANDLE" --arg status "failed" --arg reason "thumbnail_generation_failed" \
      '.products += [{"handle": $handle, "status": $status, "reason": $reason}]' \
      "$UPDATE_LOG" > "${UPDATE_LOG}.tmp" && mv "${UPDATE_LOG}.tmp" "$UPDATE_LOG"
    continue
  fi

  THUMB_SIZE_KB=$(du -k "$THUMB_FILE" | cut -f1)
  echo "  ✓ 缩略图生成成功 (${THUMB_SIZE_KB}KB)"

  # 上传缩略图
  echo "  上传缩略图..."
  UPLOAD_RESPONSE=$(curl -s -X POST "${API_BASE}/admin/uploads" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "files=@${THUMB_FILE}")

  THUMB_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.files[0].url // empty')

  if [ -z "$THUMB_URL" ]; then
    echo "  ❌ 上传失败"
    rm -f "$TEMP_IMAGE"
    FAILED=$((FAILED + 1))
    jq --arg handle "$HANDLE" --arg status "failed" --arg reason "upload_failed" \
      '.products += [{"handle": $handle, "status": $status, "reason": $reason}]' \
      "$UPDATE_LOG" > "${UPDATE_LOG}.tmp" && mv "${UPDATE_LOG}.tmp" "$UPDATE_LOG"
    continue
  fi

  # 修正 URL
  THUMB_URL=$(echo "$THUMB_URL" | sed 's|http://localhost:9000|https://api.shangjiacigar.com|')
  echo "  ✓ 上传成功: $THUMB_URL"

  # 更新产品缩略图
  echo "  更新产品..."
  UPDATE_RESPONSE=$(curl -s -X POST "${API_BASE}/admin/products/${PRODUCT_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"thumbnail\":\"${THUMB_URL}\"}")

  UPDATED_PRODUCT_ID=$(echo "$UPDATE_RESPONSE" | jq -r '.product.id // empty')

  if [ "$UPDATED_PRODUCT_ID" = "$PRODUCT_ID" ]; then
    echo "  ✓ 产品更新成功"
    SUCCESS=$((SUCCESS + 1))

    # 记录到日志
    jq --arg handle "$HANDLE" \
       --arg status "success" \
       --arg product_id "$PRODUCT_ID" \
       --arg thumb_url "$THUMB_URL" \
      '.products += [{"handle": $handle, "status": $status, "product_id": $product_id, "thumbnail_url": $thumb_url}]' \
      "$UPDATE_LOG" > "${UPDATE_LOG}.tmp" && mv "${UPDATE_LOG}.tmp" "$UPDATE_LOG"
  else
    echo "  ❌ 产品更新失败"
    FAILED=$((FAILED + 1))
    jq --arg handle "$HANDLE" --arg status "failed" --arg reason "update_failed" \
      '.products += [{"handle": $handle, "status": $status, "reason": $reason}]' \
      "$UPDATE_LOG" > "${UPDATE_LOG}.tmp" && mv "${UPDATE_LOG}.tmp" "$UPDATE_LOG"
  fi

  # 清理临时文件
  rm -f "$TEMP_IMAGE"

  echo ""
  sleep 1
done <<< "$PRODUCTS"

# 4. 更新日志统计
jq --arg end_time "$(date -Iseconds)" \
   --argjson total "$TOTAL" \
   --argjson success "$SUCCESS" \
   --argjson failed "$FAILED" \
   '.end_time = $end_time | .summary = {"total": $total, "success": $success, "failed": $failed}' \
   "$UPDATE_LOG" > "${UPDATE_LOG}.tmp" && mv "${UPDATE_LOG}.tmp" "$UPDATE_LOG"

echo "=========================================="
echo "缩略图更新完成！"
echo "=========================================="
echo ""
echo "结束时间: $(date)"
echo "总计: $TOTAL 个产品"
echo "成功: $SUCCESS 个"
echo "失败: $FAILED 个"
echo ""
echo "缩略图保存在: $THUMB_DIR"
echo "详细日志: $UPDATE_LOG"
echo ""

if [ $FAILED -gt 0 ]; then
  echo "失败的产品:"
  jq -r '.products[] | select(.status == "failed") | "  - \(.handle): \(.reason)"' "$UPDATE_LOG"
  echo ""
fi

echo "=========================================="
