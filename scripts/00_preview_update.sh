#!/bin/bash
# 预览批量更新操作

set -e

MAPPING_FILE="product_images/batch31/product_mapping_final.json"
IMAGE_DIR="product_images/batch31"

echo "=========================================="
echo "高希霸产品图片更新预览"
echo "=========================================="
echo ""

if [ ! -f "$MAPPING_FILE" ]; then
  echo "❌ 映射文件不存在: $MAPPING_FILE"
  exit 1
fi

HANDLES=$(jq -r 'keys[]' "$MAPPING_FILE")
TOTAL_PRODUCTS=$(echo "$HANDLES" | wc -l | tr -d ' ')
TOTAL_IMAGES=0
MISSING_IMAGES=0

echo "将要更新 $TOTAL_PRODUCTS 个产品"
echo ""

for HANDLE in $HANDLES; do
  IMAGE_FILES=$(jq -r --arg handle "$HANDLE" '.[$handle][]' "$MAPPING_FILE")
  IMAGE_COUNT=$(echo "$IMAGE_FILES" | wc -l | tr -d ' ')
  TOTAL_IMAGES=$((TOTAL_IMAGES + IMAGE_COUNT))

  echo "产品: $HANDLE"
  echo "  图片数量: $IMAGE_COUNT"

  for IMAGE_FILE in $IMAGE_FILES; do
    IMAGE_PATH="${IMAGE_DIR}/${IMAGE_FILE}"
    if [ -f "$IMAGE_PATH" ]; then
      SIZE=$(du -h "$IMAGE_PATH" | cut -f1)
      echo "    ✓ $IMAGE_FILE ($SIZE)"
    else
      echo "    ✗ $IMAGE_FILE (文件不存在)"
      MISSING_IMAGES=$((MISSING_IMAGES + 1))
    fi
  done
  echo ""
done

echo "=========================================="
echo "统计信息"
echo "=========================================="
echo "产品总数: $TOTAL_PRODUCTS"
echo "图片总数: $TOTAL_IMAGES"
echo "缺失图片: $MISSING_IMAGES"
echo ""

if [ $MISSING_IMAGES -gt 0 ]; then
  echo "⚠️  警告: 有 $MISSING_IMAGES 张图片文件不存在"
  echo ""
fi

echo "=========================================="
echo "执行计划"
echo "=========================================="
echo ""
echo "脚本将执行以下操作："
echo "1. 登录 Medusa API 获取认证 token"
echo "2. 逐个处理 $TOTAL_PRODUCTS 个产品："
echo "   - 上传该产品的所有图片到服务器"
echo "   - 查询产品 ID"
echo "   - 更新产品的图片 URL"
echo "3. 生成详细的执行日志"
echo ""
echo "预计上传 $TOTAL_IMAGES 张图片"
echo "预计耗时: 约 $((TOTAL_PRODUCTS * 2)) 秒"
echo ""
echo "=========================================="
echo ""
echo "如果确认无误，执行以下命令开始批量更新："
echo ""
echo "  bash scripts/02_batch_upload_and_update.sh"
echo ""
echo "=========================================="
