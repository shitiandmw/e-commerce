#!/usr/bin/env python3
"""
批量创建20个图片查找任务的说明文档
由于 MCP 限制，需要手动在 agent-tower 中创建这些任务
"""

import math

total_products = 429
num_batches = 20
batch_size = math.ceil(total_products / num_batches)

print("=" * 80)
print("雪茄产品图片URL查找任务 - 批量创建指南")
print("=" * 80)
print(f"\n总产品数: {total_products}")
print(f"批次数: {num_batches}")
print(f"每批次约: {batch_size} 个产品\n")

task_template = """
**关键要求：**
1. 读取 /Users/shitian/Work/shitian/waibao/e-commerce/product_list_complete.csv
2. 处理索引{start_idx}-{end_idx}的产品
3. 使用 WebSearch 查找产品页面，然后使用 WebFetch 提取页面中的图片URL
4. **必须是直接图片URL**，以 .jpg, .jpeg, .png, .webp, .gif 结尾
5. 每个产品收集1-5张图片URL
6. 保存到 /Users/shitian/Work/shitian/waibao/e-commerce/image_links_batch{batch_num}.csv

**验证步骤（必须执行）：**
- 检查每个URL是否以图片扩展名结尾
- 如果URL不是直接图片链接，使用 WebFetch 访问产品页面提取实际图片URL
- 过滤掉所有非图片URL（如产品页面、分类页面等）

**CSV格式：**
row_index,brand_en,model,image_url1,image_url2,image_url3,image_url4,image_url5

**示例：**
正确：https://example.com/images/cigar.jpg
错误：https://example.com/product/cigar-name
"""

print("请在 agent-tower 中创建以下20个任务：\n")

for i in range(num_batches):
    start_idx = i * batch_size
    end_idx = min((i + 1) * batch_size, total_products)

    if start_idx >= total_products:
        break

    batch_num = i + 1

    print(f"\n{'='*80}")
    print(f"批次 {batch_num}: 产品 {start_idx+1}-{end_idx}")
    print(f"{'='*80}")
    print(f"标题: 查找雪茄产品图片URL - 批次{batch_num} (产品{start_idx+1}-{end_idx})")
    print(f"\n描述:")
    print(f"为产品列表中的第{start_idx+1}-{end_idx}个产品查找直接图片URL。")
    print(task_template.format(
        start_idx=start_idx,
        end_idx=end_idx-1,
        batch_num=batch_num
    ))

print("\n" + "="*80)
print("创建完成后，使用 Claude Code 启动所有任务")
print("="*80)
