#!/usr/bin/env python3
"""
批量上传商品图片到 Medusa 后端，并更新 products.csv 中的图片地址。

用法:
  export MEDUSA_ADMIN_TOKEN='你的BearerToken'
  python3 scripts/batch-upload-images.py

依赖: pip install requests tqdm
"""

import csv
import os
import sys
import json
import time
import requests
from collections import defaultdict
from tqdm import tqdm

# ── 配置 ───────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CSV_PATH = os.path.join(DATA_DIR, "products.csv")
OUT_PATH = os.path.join(DATA_DIR, "products_with_urls.csv")

# 后端
API_BASE = "https://api.shangjiacigar.com"
TOKEN    = os.environ.get("MEDUSA_ADMIN_TOKEN", "")

BATCH_SIZE = 5   # 每批上传几张（不要太大，防止超时）

# ── 读取 CSV，收集唯一图片路径 ────────────────────────────────────────────────
IMAGE_COLS = ["image1", "image2", "image3", "image4", "image5"]

print("📖 读取 products.csv ...")
rows = []
with open(CSV_PATH, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        rows.append(row)

# 收集所有唯一本地路径（含 placeholder 单独处理）
local_to_url   = {}   # local_path -> remote_url
unique_paths   = []   # 按出现顺序去重后的路径
seen_paths_set = set()

for row in rows:
    for col in IMAGE_COLS:
        p = row.get(col, "").strip()
        if p and p not in seen_paths_set:
            seen_paths_set.add(p)
            unique_paths.append(p)

# 过滤掉 placeholder（不需要上传）
paths_to_upload = [p for p in unique_paths
                   if p and p != "product_images/placeholder.png"]
print(f"   总行数: {len(rows)},  唯一图片路径: {len(unique_paths)},  需上传: {len(paths_to_upload)}")

# 检查文件是否存在
files_to_upload = []
missing = []
for local_path in paths_to_upload:
    full_path = os.path.join(BASE_DIR, local_path)
    if os.path.exists(full_path):
        files_to_upload.append((local_path, full_path))
    else:
        missing.append(local_path)

if missing:
    print(f"   ⚠️  {len(missing)} 个文件不存在，已跳过")
    for m in missing[:5]:
        print(f"      {m}")

# ── Token 检查 ────────────────────────────────────────────────────────────────
if not TOKEN:
    print("\n❌ 未设置 MEDUSA_ADMIN_TOKEN 环境变量！")
    print("   请先运行:  export MEDUSA_ADMIN_TOKEN='你的BearerToken'")
    sys.exit(1)

headers    = {"Authorization": f"Bearer {TOKEN}"}
upload_url = f"{API_BASE}/admin/uploads"

# ── 先测试单张上传，确认返回格式 ───────────────────────────────────────────────
print(f"\n🧪 测试上传（单张）...")
test_path = files_to_upload[0][1] if files_to_upload else None
if test_path:
    with open(test_path, "rb") as fh:
        test_files = [("files", (os.path.basename(test_path), fh, "image/jpeg"))]
        try:
            resp = requests.post(
                upload_url, headers=headers, files=test_files, timeout=30
            )
            print(f"   HTTP {resp.status_code}")
            if resp.status_code == 200:
                result = resp.json()
                print(f"   返回字段: {list(result.keys())}")
                sample = result.get("files", [{}])[0]
                print(f"   文件对象字段: {list(sample.keys())}")
                print(f"   样例 URL: {sample.get('url', 'N/A')}")
            else:
                print(f"   内容: {resp.text[:300]}")
        except Exception as e:
            print(f"   异常: {e}")
            sys.exit(1)
else:
    print("   无文件可测试")

# ── 批量上传 ─────────────────────────────────────────────────────────────────
print(f"\n🚀 开始批量上传 ({len(files_to_upload)} 张) ...")
for i in tqdm(range(0, len(files_to_upload), BATCH_SIZE)):
    batch = files_to_upload[i : i + BATCH_SIZE]

    # 准备 multipart/form-data
    multipart = []
    for local_path, full_path in batch:
        basename = os.path.basename(full_path)
        fh = open(full_path, "rb")
        multipart.append(
            ("files", (basename, fh, "image/jpeg"))
        )

    try:
        resp = requests.post(
            upload_url, headers=headers, files=multipart, timeout=120
        )
        if resp.status_code == 200:
            result = resp.json()
            ret_files = result.get("files", [])
            for idx, f_info in enumerate(ret_files):
                if idx < len(batch):
                    local_path, _ = batch[idx]
                    url = f_info.get("url", "")
                    if url:
                        local_to_url[local_path] = url
        else:
            print(f"\n   ❌ HTTP {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"\n   ❌ Exception: {e}")
    finally:
        # multipart = [ ("files", (basename, fh, mime)) ]
        for _, entry in multipart:
            # entry = (basename, fh, mime)
            try:
                entry[1].close()   # fh 是 tuple 中的第二个元素
            except Exception:
                pass

    time.sleep(0.2)

print(f"\n✅ 成功映射 {len(local_to_url)} 个远程 URL")

# ── 替换 localhost URL 为公网地址 ─────────────────────────────────────────────
# Medusa 本地文件服务返回 http://localhost:9000，需要替换为公网地址
LOCAL_URL_REPLACE = "http://localhost:9000"
PUBLIC_URL_BASE   = "https://api.shangjiacigar.com"

for lp, url in local_to_url.items():
    if url.startswith(LOCAL_URL_REPLACE):
        local_to_url[lp] = url.replace(LOCAL_URL_REPLACE, PUBLIC_URL_BASE)

print(f"   (已替换 {sum(1 for u in local_to_url.values() if PUBLIC_URL_BASE in u)} 个 URL 为公网地址)")

# ── 更新 CSV ───────────────────────────────────────────────────────────────────
print(f"\n📝 更新 CSV ...")
fieldnames = list(rows[0].keys()) if rows else []

for row in rows:
    for col in IMAGE_COLS:
        p = row.get(col, "").strip()
        if p == "product_images/placeholder.png":
            # 占位图：记录为自身（后续需要生成/上传）
            continue
        if p in local_to_url:
            row[col] = local_to_url[p]
        elif p and p not in local_to_url:
            # 找不到的列出来（避免静默丢失）
            pass  # 已在上面跳过

with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"   ✅ 已写入 {OUT_PATH}")

# ── 统计 ─────────────────────────────────────────────────────────────────────
total_images = sum(
    1 for row in rows for col in IMAGE_COLS
    if row.get(col, "").strip()
)
uploaded_images = sum(
    1 for row in rows for col in IMAGE_COLS
    if row.get(col, "").strip() and row.get(col, "").strip() != "product_images/placeholder.png"
)
print(f"\n📊 统计:")
print(f"   商品行数: {len(rows)}")
print(f"   有图片的商品列: {uploaded_images}")
print(f"   成功映射 URL: {len(local_to_url)}")
print(f"   未找到 URL: {len(paths_to_upload) - len(local_to_url)}")

# 保存映射供后续使用
map_path = os.path.join(DATA_DIR, "image_url_map.json")
with open(map_path, "w", encoding="utf-8") as f:
    json.dump(local_to_url, f, ensure_ascii=False, indent=2)
print(f"\n💾 映射已保存到 {map_path}")
