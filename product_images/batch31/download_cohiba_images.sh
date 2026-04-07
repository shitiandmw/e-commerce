#!/bin/bash

# 下载高希霸图片脚本
# 使用方法: bash download_cohiba_images.sh

BATCH_DIR="product_images/batch31"
JSON_FILE="$BATCH_DIR/cohiba_images.json"

echo "开始下载高希霸图片到 $BATCH_DIR"

# 读取 JSON 并下载图片
counter=1

# 使用 jq 解析 JSON（如果没有 jq，使用 Python）
if command -v jq &> /dev/null; then
    # 使用 jq
    jq -r '.[] | .images[]' "$JSON_FILE" | while read -r url; do
        filename=$(basename "$url" | cut -d'?' -f1)
        output_file="$BATCH_DIR/cohiba_${counter}_${filename}"

        echo "下载: $url"
        curl -L -o "$output_file" "$url"

        if [ $? -eq 0 ]; then
            echo "✓ 成功: $output_file"
        else
            echo "✗ 失败: $url"
        fi

        counter=$((counter + 1))
        sleep 0.5  # 避免请求过快
    done
else
    # 使用 Python
    python3 << 'EOF'
import json
import urllib.request
import time
import os

with open('product_images/batch31/cohiba_images.json', 'r') as f:
    data = json.load(f)

counter = 1
for product in data:
    for url in product['images']:
        filename = url.split('/')[-1].split('?')[0]
        output_file = f'product_images/batch31/cohiba_{counter}_{filename}'

        print(f'下载: {url}')
        try:
            urllib.request.urlretrieve(url, output_file)
            print(f'✓ 成功: {output_file}')
        except Exception as e:
            print(f'✗ 失败: {url} - {e}')

        counter += 1
        time.sleep(0.5)
EOF
fi

echo "下载完成！"
echo "图片保存在: $BATCH_DIR"
ls -lh "$BATCH_DIR"/*.jpg "$BATCH_DIR"/*.jpeg "$BATCH_DIR"/*.png 2>/dev/null | wc -l | xargs echo "共下载图片:"
