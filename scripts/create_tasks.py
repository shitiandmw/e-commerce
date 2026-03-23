#!/usr/bin/env python3
"""
批量创建 agent-tower 任务的配置生成器
"""
import math

total_products = 429
num_batches = 20
batch_size = math.ceil(total_products / num_batches)
project_id = "0f0fb252-06a5-4393-bef9-fffbb8176808"

tasks = []

for i in range(num_batches):
    start_idx = i * batch_size
    end_idx = min((i + 1) * batch_size, total_products)

    if start_idx >= total_products:
        break

    batch_num = i + 1

    task = {
        "batch": batch_num,
        "title": f"查找雪茄产品图片链接 - 批次{batch_num} (产品{start_idx+1}-{end_idx})",
        "description": f"""为产品列表中的第{start_idx+1}-{end_idx}个产品查找官方图片链接。

任务要求：
1. 读取 /Users/shitian/Work/shitian/waibao/e-commerce/product_list_complete.csv 文件
2. 处理第{start_idx+1}-{end_idx}行产品（索引{start_idx}-{end_idx-1}）
3. 为每个产品使用 WebSearch 查找官方图片链接（优先品牌官网）
4. 将结果保存到 /Users/shitian/Work/shitian/waibao/e-commerce/image_links_batch{batch_num}.csv
5. CSV格式：row_index,brand_en,model,image_url

提示：
- 优先搜索品牌官网（davidoff.com, habanos.com等）
- 如果官网找不到，使用零售商网站（cigars.com, cigarsinternational.com）
- 每个产品只需要1个主图链接
- 图片链接必须是直接的图片URL（.jpg, .png, .webp等）""",
        "project_id": project_id
    }

    tasks.append(task)

# 输出为 JSON
import json
print(json.dumps(tasks, ensure_ascii=False, indent=2))
