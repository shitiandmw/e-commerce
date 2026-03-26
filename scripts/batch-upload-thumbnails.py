#!/usr/bin/env python3
"""批量上传缩略图并生成 URL 映射"""

import json
import os
import subprocess
import time
from pathlib import Path

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3Rvcl9pZCI6InVzZXJfMDFLTUoxOUFIUTFKNFJNNlZUTUtRNUJQNVEiLCJhY3Rvcl90eXBlIjoidXNlciIsImF1dGhfaWRlbnRpdHlfaWQiOiJhdXRoaWRfMDFLTUoxOUFQRjlERUs4WURLU0czUjM3VDEiLCJhcHBfbWV0YWRhdGEiOnsidXNlcl9pZCI6InVzZXJfMDFLTUoxOUFIUTFKNFJNNlZUTUtRNUJQNVEiLCJyb2xlcyI6W119LCJ1c2VyX21ldGFkYXRhIjp7fSwiaWF0IjoxNzc0NTE1MzE1LCJleHAiOjE3NzQ2MDE3MTV9.lrfhu40DRMNd8k5DJ7MIAq9nhs7YJu-cf9WtFHkkyzs"

THUMB_DIR = "product_images/_thumbnails"
OUTPUT_FILE = "data/thumbnail_url_map.json"
API_BASE = "https://api.shangjiacigar.com"

def upload_thumbnail(handle):
    """上传单个缩略图"""
    thumb_file = f"{handle}__thumb.jpg"
    thumb_path = os.path.join(THUMB_DIR, thumb_file)

    if not os.path.exists(thumb_path):
        return None

    # 上传文件
    cmd = [
        "curl", "-s", "-X", "POST",
        f"{API_BASE}/admin/uploads",
        "-H", f"Authorization: Bearer {TOKEN}",
        "-F", f"files=@{thumb_path}"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    try:
        data = json.loads(result.stdout)
        if data.get("files") and len(data["files"]) > 0:
            # 把 localhost:9000 替换成 api.shangjiacigar.com
            url = data["files"][0]["url"].replace("http://localhost:9000", API_BASE)
            return url
    except:
        pass

    return None

def main():
    # 获取所有缩略图文件
    thumb_files = [f.replace('__thumb.jpg', '') for f in os.listdir(THUMB_DIR) if f.endswith('__thumb.jpg')]
    thumb_files.sort()

    print(f"开始上传 {len(thumb_files)} 个缩略图...")

    url_map = {}
    success_count = 0
    fail_count = 0
    fail_list = []

    for i, handle in enumerate(thumb_files):
        url = upload_thumbnail(handle)
        if url:
            url_map[handle] = url
            success_count += 1
        else:
            fail_count += 1
            fail_list.append(handle)

        # 进度显示
        if (i + 1) % 50 == 0 or (i + 1) == len(thumb_files):
            print(f"进度: {i + 1}/{len(thumb_files)}, 成功: {success_count}, 失败: {fail_count}")

        # 避免请求过快
        time.sleep(0.1)

    # 保存映射
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(url_map, f, ensure_ascii=False, indent=2)

    print(f"\n上传完成! 成功: {success_count}, 失败: {fail_count}")
    print(f"映射文件已保存: {OUTPUT_FILE}")

    if fail_list:
        print(f"失败列表: {fail_list[:10]}...")

    return url_map

if __name__ == "__main__":
    main()