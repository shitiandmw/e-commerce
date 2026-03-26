#!/usr/bin/env python3
"""更新商品图片设置：thumbnail=压缩图, images=所有图片"""

import json
import subprocess
import time

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3Rvcl9pZCI6InVzZXJfMDFLTUoxOUFIUTFKNFJNNlZUTUtRNUJQNVEiLCJhY3Rvcl90eXBlIjoidXNlciIsImF1dGhfaWRlbnRpdHlfaWQiOiJhdXRoaWRfMDFLTUoxOUFQRjlERUs4WURLU0czUjM3VDEiLCJhcHBfbWV0YWRhdGEiOnsidXNlcl9pZCI6InVzZXJfMDFLTUoxOUFIUTFKNFJNNlZUTUtRNUJQNVEiLCJyb2xlcyI6W119LCJ1c2VyX21ldGFkYXRhIjp7fSwiaWF0IjoxNzc0NTE1MzE1LCJleHAiOjE3NzQ2MDE3MTV9.lrfhu40DRMNd8k5DJ7MIAq9nhs7YJu-cf9WtFHkkyzs"

API_BASE = "https://api.shangjiacigar.com"

def get_products():
    """获取所有商品"""
    cmd = [
        "curl", "-s", "-g",
        f"{API_BASE}/admin/products?limit=100&offset=0",
        "-H", f"Authorization: Bearer {TOKEN}"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)
    return data.get("products", []), data.get("count", 0)

def get_all_products():
    """获取所有商品（分页）"""
    all_products = []
    offset = 0
    limit = 100

    while True:
        cmd = [
            "curl", "-s", "-g",
            f"{API_BASE}/admin/products?limit={limit}&offset={offset}",
            "-H", f"Authorization: Bearer {TOKEN}"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        data = json.loads(result.stdout)
        products = data.get("products", [])
        all_products.extend(products)

        if len(products) < limit:
            break
        offset += limit
        print(f"已获取 {len(all_products)} 个商品...")

    return all_products

def update_product_images(product_id, thumbnail_url, image_urls):
    """更新商品图片"""
    # 构建请求体
    body = {
        "thumbnail": thumbnail_url,
        "images": [{"url": url} for url in image_urls]
    }

    # 调用 API
    cmd = [
        "curl", "-s", "-X", "POST",
        f"{API_BASE}/admin/products/{product_id}",
        "-H", f"Authorization: Bearer {TOKEN}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps(body)
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        resp = json.loads(result.stdout)
        if resp.get("product"):
            return True, None
        else:
            return False, resp
    except:
        return False, result.stdout

def main():
    # 加载缩略图 URL 映射
    with open("data/thumbnail_url_map.json") as f:
        thumb_map = json.load(f)

    # 加载商品 ID 映射（handle -> id）
    with open("data/product_id_map.json") as f:
        product_id_map = json.load(f)

    # 获取所有商品
    print("正在获取商品列表...")
    products = get_all_products()
    print(f"共获取 {len(products)} 个商品")

    # 构建 handle -> thumbnail_url 映射（用于获取第一张原图 URL）
    # 由于 API 返回的 thumbnail 就是第一张图，我们用它作为原图 URL

    success_count = 0
    fail_count = 0
    fail_list = []

    print(f"\n开始更新 {len(products)} 个商品...")

    for i, product in enumerate(products):
        product_id = product["id"]
        handle = product["handle"]

        # 获取 thumbnail URL（第一张原图）
        original_thumbnail = product.get("thumbnail", "")

        # 获取压缩图 URL
        compressed_thumbnail = thumb_map.get(handle)

        if not compressed_thumbnail:
            print(f"  警告: 没有找到 {handle} 的压缩图 URL")
            fail_count += 1
            fail_list.append(handle)
            continue

        # 获取所有图片 URL（包括 thumbnail）
        all_images = []
        if original_thumbnail:
            all_images.append(original_thumbnail)

        # 添加其他图片
        for img in product.get("images", []):
            img_url = img.get("url", "")
            if img_url and img_url not in all_images:
                all_images.append(img_url)

        # 更新商品
        success, resp = update_product_images(product_id, compressed_thumbnail, all_images)

        if success:
            success_count += 1
        else:
            fail_count += 1
            fail_list.append((handle, resp))

        # 进度显示
        if (i + 1) % 50 == 0 or (i + 1) == len(products):
            print(f"进度: {i + 1}/{len(products)}, 成功: {success_count}, 失败: {fail_count}")

        # 避免请求过快
        time.sleep(0.15)

    print(f"\n更新完成! 成功: {success_count}, 失败: {fail_count}")

    if fail_list:
        print(f"失败列表（前10个）:")
        for item in fail_list[:10]:
            if isinstance(item, tuple):
                print(f"  {item[0]}: {item[1]}")
            else:
                print(f"  {item}")

if __name__ == "__main__":
    main()