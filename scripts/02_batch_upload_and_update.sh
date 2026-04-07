#!/bin/bash
# 批量上传高希霸产品图片并更新产品

set -e

# 配置
API_BASE="https://api.shangjiacigar.com"
EMAIL="admin@test.com"
PASSWORD="admin123456"
IMAGE_DIR="product_images/batch31"
MAPPING_FILE="product_images/batch31/product_mapping_final.json"
LOG_FILE="scripts/upload_log_$(date +%Y%m%d_%H%M%S).json"

echo "=========================================="
echo "高希霸产品图片批量更新"
echo "=========================================="
echo ""
echo "开始时间: $(date)"
echo "图片目录: $IMAGE_DIR"
echo "映射文件: $MAPPING_FILE"
echo "日志文件: $LOG_FILE"
echo ""

# 1. 登录获取 token
echo "步骤 1: 登录获取 token..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/user/emailpass" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✓ 登录成功"
echo ""

# 初始化日志
echo "{\"start_time\": \"$(date -Iseconds)\", \"products\": []}" > "$LOG_FILE"

# 2. 读取产品映射并处理
echo "步骤 2: 读取产品映射..."
HANDLES=$(jq -r 'keys[]' "$MAPPING_FILE")
TOTAL_PRODUCTS=$(echo "$HANDLES" | wc -l | tr -d ' ')

echo "找到 $TOTAL_PRODUCTS 个产品需要更新"
echo ""

CURRENT=0
SUCCESS=0
FAILED=0

# 3. 逐个处理产品
for HANDLE in $HANDLES; do
  CURRENT=$((CURRENT + 1))
  echo "=========================================="
  echo "[$CURRENT/$TOTAL_PRODUCTS] 处理产品: $HANDLE"
  echo "=========================================="

  # 获取该产品的图片列表
  IMAGE_FILES=$(jq -r --arg handle "$HANDLE" '.[$handle][]' "$MAPPING_FILE")
  IMAGE_COUNT=$(echo "$IMAGE_FILES" | wc -l | tr -d ' ')

  echo "需要上传 $IMAGE_COUNT 张图片"

  # 上传图片并收集 URL
  UPLOADED_URLS=()
  UPLOAD_SUCCESS=true

  for IMAGE_FILE in $IMAGE_FILES; do
    IMAGE_PATH="${IMAGE_DIR}/${IMAGE_FILE}"

    if [ ! -f "$IMAGE_PATH" ]; then
      echo "  ⚠️  图片不存在: $IMAGE_FILE"
      continue
    fi

    echo "  上传: $IMAGE_FILE ($(du -h "$IMAGE_PATH" | cut -f1))"

    UPLOAD_RESPONSE=$(curl -s -X POST "${API_BASE}/admin/uploads" \
      -H "Authorization: Bearer ${TOKEN}" \
      -F "files=@${IMAGE_PATH}")

    UPLOADED_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.files[0].url // empty')

    if [ -z "$UPLOADED_URL" ]; then
      echo "  ❌ 上传失败"
      UPLOAD_SUCCESS=false
      break
    fi

    # 修正 URL
    UPLOADED_URL=$(echo "$UPLOADED_URL" | sed 's|http://localhost:9000|https://api.shangjiacigar.com|')
    UPLOADED_URLS+=("$UPLOADED_URL")
    echo "  ✓ 上传成功: $UPLOADED_URL"
  done

  if [ "$UPLOAD_SUCCESS" = false ]; then
    echo "❌ 产品 $HANDLE 图片上传失败，跳过更新"
    FAILED=$((FAILED + 1))

    # 记录到日志
    jq --arg handle "$HANDLE" --arg status "failed" --arg reason "upload_failed" \
      '.products += [{"handle": $handle, "status": $status, "reason": $reason}]' \
      "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"

    echo ""
    continue
  fi

  # 4. 查询产品 ID
  echo "  查询产品信息..."
  PRODUCT_RESPONSE=$(curl -s "${API_BASE}/admin/products?handle=${HANDLE}" \
    -H "Authorization: Bearer ${TOKEN}")

  PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.products[0].id // empty')

  if [ -z "$PRODUCT_ID" ]; then
    echo "  ❌ 产品不存在: $HANDLE"
    FAILED=$((FAILED + 1))

    # 记录到日志
    jq --arg handle "$HANDLE" --arg status "failed" --arg reason "product_not_found" \
      '.products += [{"handle": $handle, "status": $status, "reason": $reason}]' \
      "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"

    echo ""
    continue
  fi

  echo "  产品 ID: $PRODUCT_ID"

  # 5. 构建图片数组
  IMAGES_JSON="["
  for i in "${!UPLOADED_URLS[@]}"; do
    if [ $i -gt 0 ]; then
      IMAGES_JSON+=","
    fi
    IMAGES_JSON+="{\"url\":\"${UPLOADED_URLS[$i]}\"}"
  done
  IMAGES_JSON+="]"

  # 6. 更新产品
  echo "  更新产品图片..."
  UPDATE_RESPONSE=$(curl -s -X POST "${API_BASE}/admin/products/${PRODUCT_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"images\":${IMAGES_JSON}}")

  # 检查更新是否成功
  UPDATED_PRODUCT_ID=$(echo "$UPDATE_RESPONSE" | jq -r '.product.id // empty')

  if [ "$UPDATED_PRODUCT_ID" = "$PRODUCT_ID" ]; then
    echo "  ✓ 产品更新成功"
    SUCCESS=$((SUCCESS + 1))

    # 记录到日志
    URLS_JSON=$(printf '%s\n' "${UPLOADED_URLS[@]}" | jq -R . | jq -s .)
    jq --arg handle "$HANDLE" \
       --arg status "success" \
       --arg product_id "$PRODUCT_ID" \
       --argjson urls "$URLS_JSON" \
      '.products += [{"handle": $handle, "status": $status, "product_id": $product_id, "urls": $urls}]' \
      "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
  else
    echo "  ❌ 产品更新失败"
    echo "  响应: $UPDATE_RESPONSE"
    FAILED=$((FAILED + 1))

    # 记录到日志
    jq --arg handle "$HANDLE" --arg status "failed" --arg reason "update_failed" \
      '.products += [{"handle": $handle, "status": $status, "reason": $reason}]' \
      "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
  fi

  echo ""
  sleep 1  # 避免请求过快
done

# 7. 更新日志统计
jq --arg end_time "$(date -Iseconds)" \
   --argjson total "$TOTAL_PRODUCTS" \
   --argjson success "$SUCCESS" \
   --argjson failed "$FAILED" \
   '.end_time = $end_time | .summary = {"total": $total, "success": $success, "failed": $failed}' \
   "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"

echo "=========================================="
echo "批量更新完成！"
echo "=========================================="
echo ""
echo "结束时间: $(date)"
echo "总计: $TOTAL_PRODUCTS 个产品"
echo "成功: $SUCCESS 个"
echo "失败: $FAILED 个"
echo ""
echo "详细日志: $LOG_FILE"
echo ""

if [ $FAILED -gt 0 ]; then
  echo "失败的产品:"
  jq -r '.products[] | select(.status == "failed") | "  - \(.handle): \(.reason)"' "$LOG_FILE"
  echo ""
fi

echo "=========================================="
