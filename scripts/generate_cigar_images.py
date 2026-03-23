#!/usr/bin/env python3
"""
批量生成雪茄产品图片
"""
import pandas as pd
import subprocess
import time
import json
from pathlib import Path
import re

# 配置
EXCEL_FILE = '/Users/shitian/Downloads/香港上茄古巴非古雪茄.xlsx'
OUTPUT_DIR = Path('/Users/shitian/Work/shitian/waibao/e-commerce/generated_images')
QWEN_SKILL_DIR = Path('/Users/shitian/.claude/skills/qwen-image')
DELAY_SECONDS = 2  # API 调用间隔

# 创建输出目录
OUTPUT_DIR.mkdir(exist_ok=True)

def clean_filename(text):
    """清理文件名，移除特殊字符"""
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '_', text)
    return text[:50]  # 限制长度

def extract_brand_model(model_text):
    """从型号文本中提取品牌和型号"""
    # 简单处理：取前面的英文部分作为关键词
    english_parts = re.findall(r'[A-Za-z0-9\s]+', str(model_text))
    if english_parts:
        return ' '.join(english_parts).strip()
    return str(model_text)

def generate_prompt(brand, model, is_cuban=True):
    """生成图片提示词"""
    cigar_type = "Cuban" if is_cuban else "non-Cuban"
    keywords = extract_brand_model(model)

    prompt = f"Professional product photography of {keywords} luxury {cigar_type} cigar, "
    prompt += "single premium cigar displayed on clean white background, "
    prompt += "studio lighting with soft shadows, high-end commercial photography, "
    prompt += "detailed texture of tobacco leaf wrapper, elegant presentation, "
    prompt += "4K quality, sharp focus, luxury product shot"

    return prompt[:800]  # API 限制

def load_products():
    """加载产品数据"""
    products = []

    # 古巴雪茄
    df_cuba = pd.read_excel(EXCEL_FILE, sheet_name='古巴')
    df_cuba.columns = ['型号', '价格', '尺寸']
    df_cuba_clean = df_cuba[df_cuba['价格'].notna()].copy()

    for idx, row in df_cuba_clean.iterrows():
        if pd.notna(row['型号']) and '/' not in str(row['型号']):
            products.append({
                'type': 'cuban',
                'brand': 'Davidoff',  # 默认品牌
                'model': row['型号'],
                'price': row['价格'],
                'size': row['尺寸']
            })

    # 非古巴雪茄
    df_non_cuba = pd.read_excel(EXCEL_FILE, sheet_name='非古')

    print(f"加载了 {len(products)} 个产品")
    return products

def generate_image(product, index, total):
    """生成单个产品图片"""
    model = product['model']
    is_cuban = product['type'] == 'cuban'

    print(f"\n[{index}/{total}] 生成: {model}")

    # 生成提示词
    prompt = generate_prompt(product['brand'], model, is_cuban)
    print(f"提示词: {prompt[:100]}...")

    # 调用生成脚本
    cmd = [
        'python', str(QWEN_SKILL_DIR / 'scripts/generate.py'),
        '--prompt', prompt,
        '--size', '1024*1024',
        '--model', 'qwen-image-2.0-pro'
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

        if result.returncode == 0:
            # 提取生成的文件路径
            output = result.stdout
            if 'Image saved:' in output:
                file_path = output.split('Image saved:')[1].strip().split('\n')[0]
                print(f"✓ 生成成功: {file_path}")
                return file_path
        else:
            print(f"✗ 生成失败: {result.stderr}")
            return None

    except subprocess.TimeoutExpired:
        print("✗ 超时")
        return None
    except Exception as e:
        print(f"✗ 错误: {e}")
        return None

def main():
    print("=== 雪茄产品图片批量生成 ===\n")

    # 加载产品
    products = load_products()

    # 测试模式：只生成前 3 个
    test_mode = True
    if test_mode:
        products = products[:3]
        print(f"\n⚠️  测试模式：只生成前 {len(products)} 个产品\n")

    # 生成记录
    results = []

    for idx, product in enumerate(products, 1):
        file_path = generate_image(product, idx, len(products))

        results.append({
            'model': product['model'],
            'type': product['type'],
            'image_path': file_path,
            'success': file_path is not None
        })

        # API 限流
        if idx < len(products):
            time.sleep(DELAY_SECONDS)

    # 保存结果
    results_file = OUTPUT_DIR / 'generation_results.json'
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # 统计
    success_count = sum(1 for r in results if r['success'])
    print(f"\n=== 生成完成 ===")
    print(f"成功: {success_count}/{len(results)}")
    print(f"结果保存到: {results_file}")

if __name__ == '__main__':
    main()
