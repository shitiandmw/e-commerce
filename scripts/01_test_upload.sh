#!/bin/bash
# 测试图片上传功能

set -e

# 配置
API_BASE="https://api.shangjiacigar.com"
EMAIL="admin@test.com"
PASSWORD="admin123456"

echo "=========================================="
echo "测试 Medusa 图片上传功能"
echo "=========================================="

# 1. 登录获取 token
echo ""
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
echo "Token: ${TOKEN:0:50}..."

# 2. 测试上传一张图片
echo ""
echo "步骤 2: 测试上传图片..."

# 选择第一张图片进行测试
TEST_IMAGE="product_images/batch31/cohiba_47_no596.jpg"

if [ ! -f "$TEST_IMAGE" ]; then
  echo "❌ 测试图片不存在: $TEST_IMAGE"
  exit 1
fi

echo "上传文件: $TEST_IMAGE"
echo "文件大小: $(du -h "$TEST_IMAGE" | cut -f1)"

UPLOAD_RESPONSE=$(curl -s -X POST "${API_BASE}/admin/uploads" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "files=@${TEST_IMAGE}")

echo ""
echo "上传响应:"
echo "$UPLOAD_RESPONSE" | jq .

# 检查上传是否成功
UPLOADED_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.files[0].url // .uploads[0].url // .url // empty')

if [ -z "$UPLOADED_URL" ]; then
  echo ""
  echo "❌ 上传失败，无法获取图片 URL"
  exit 1
fi

echo ""
echo "✓ 上传成功！"
echo "原始 URL: $UPLOADED_URL"

# 替换 localhost 为正确的域名
UPLOADED_URL=$(echo "$UPLOADED_URL" | sed 's|http://localhost:9000|https://api.shangjiacigar.com|')
echo "修正后 URL: $UPLOADED_URL"

# 3. 验证图片可访问
echo ""
echo "步骤 3: 验证图片可访问..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$UPLOADED_URL")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ 图片可访问 (HTTP $HTTP_CODE)"
else
  echo "⚠️  图片访问异常 (HTTP $HTTP_CODE)"
fi

echo ""
echo "=========================================="
echo "测试完成！"
echo "=========================================="
echo ""
echo "上传的图片 URL: $UPLOADED_URL"
echo ""
echo "如果测试成功，可以继续执行批量上传脚本。"
