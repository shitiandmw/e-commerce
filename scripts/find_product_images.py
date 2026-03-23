#!/usr/bin/env python3
"""
为雪茄产品查找官方图片链接
"""
import pandas as pd
import re
import time
from pathlib import Path

# 配置
EXCEL_FILE = '/Users/shitian/Downloads/香港上茄古巴非古雪茄.xlsx'
OUTPUT_FILE = '/Users/shitian/Downloads/香港上茄古巴非古雪茄_带图片链接.xlsx'

# 品牌英文名映射
BRAND_MAPPING = {
    '大衛杜夫': 'Davidoff',
    '高希霸': 'Cohiba',
    '蒙特': 'Montecristo',
    '羅密歐': 'Romeo y Julieta',
    '潘趣': 'Punch',
    '玻利瓦爾': 'Bolivar',
    '好友': 'Hoyo de Monterrey',
    '千里達': 'Trinidad',
    '烏普曼': 'H.Upmann',
    '聖克里斯托': 'San Cristobal',
    '桑丘潘沙': 'Sancho Panza',
    '雷蒙': 'Ramon Allones',
    '古巴榮耀': 'La Gloria Cubana',
    '世界之王': 'El Rey del Mundo',
    '拉斐爾': 'Rafael Gonzalez',
    '外交官': 'Diplomaticos',
    '聖路易斯.雷伊': 'Saint Luis Rey',
    '比亞達': 'Jose L. Piedra',
    '波爾': 'Por Larranaga',
    '多爾賽碼頭': 'Quai d\'Orsay',
    '胡安': 'Juan Lopez',
    '威古洛': 'Vegueros',
    '金特羅': 'Quintero',
    '卡諾之花': 'La Flor de Cano',
    '羅賓納': 'Vegas Robaina',
    '庫阿巴': 'Cuaba',
    '豐塞卡': 'Fonseca'
}

def extract_brand_from_text(text):
    """从文本中提取品牌"""
    if not text or pd.isna(text):
        return None

    text = str(text).strip()

    # 检查是否包含斜杠分隔的中英文品牌名
    if '/' in text:
        parts = text.split('/')
        chinese_brand = parts[0].strip()
        english_brand = parts[1].strip() if len(parts) > 1 else None
        return chinese_brand, english_brand

    return text, None

def get_english_brand(chinese_brand):
    """获取品牌英文名"""
    if not chinese_brand:
        return None

    # 直接匹配
    if chinese_brand in BRAND_MAPPING:
        return BRAND_MAPPING[chinese_brand]

    # 模糊匹配
    for cn, en in BRAND_MAPPING.items():
        if cn in chinese_brand:
            return en

    return None

def extract_english_keywords(model_text):
    """从型号中提取英文关键词"""
    if not model_text or pd.isna(model_text):
        return []

    # 提取所有英文单词
    english_words = re.findall(r'[A-Z][a-z]+|[A-Z]+(?=[A-Z][a-z]|\s|$)', str(model_text))

    # 过滤掉常见的无用词
    stopwords = {'BOX', 'TIN', 'LTD', 'EDT', 'EDITION'}
    keywords = [w for w in english_words if w.upper() not in stopwords]

    return keywords[:3]  # 最多取3个关键词

def generate_search_query(brand_en, model_text):
    """生成搜索查询"""
    keywords = extract_english_keywords(model_text)

    if brand_en and keywords:
        return f"{brand_en} {' '.join(keywords)} cigar"
    elif brand_en:
        return f"{brand_en} cigar"
    else:
        return None

def load_products():
    """加载产品数据"""
    df = pd.read_excel(EXCEL_FILE, sheet_name='古巴')
    df.columns = ['型号', '价格', '尺寸']

    products = []
    current_brand_cn = None
    current_brand_en = None

    for idx, row in df.iterrows():
        model = str(row['型号']).strip() if pd.notna(row['型号']) else ''
        price = row['价格']
        size = row['尺寸']

        # 检测品牌行
        if pd.isna(price) and model:
            brand_info = extract_brand_from_text(model)
            if brand_info:
                if isinstance(brand_info, tuple):
                    current_brand_cn, current_brand_en = brand_info
                    if not current_brand_en:
                        current_brand_en = get_english_brand(current_brand_cn)
                else:
                    current_brand_cn = brand_info
                    current_brand_en = get_english_brand(brand_info)

        # 产品行
        elif pd.notna(price) and model and model != '型號 MODEL':
            search_query = generate_search_query(current_brand_en, model)

            products.append({
                'row_index': idx + 1,  # Excel 行号（从1开始）
                'brand_cn': current_brand_cn,
                'brand_en': current_brand_en,
                'model': model,
                'price': price,
                'size': size,
                'search_query': search_query,
                'image_url': ''  # 待填充
            })

    return products

def main():
    print("=== 雪茄产品图片链接查找 ===\n")

    # 加载产品
    products = load_products()
    print(f"加载了 {len(products)} 个产品\n")

    # 显示前10个产品的搜索查询
    print("前10个产品的搜索查询示例：")
    for i, p in enumerate(products[:10], 1):
        print(f"{i}. [{p['brand_en']}] {p['model']}")
        print(f"   搜索: {p['search_query']}")

    print("\n注意：实际搜索需要手动进行或使用 WebSearch API")
    print("建议：")
    print("1. 先为主要品牌（Davidoff, Cohiba, Montecristo等）手动查找官网")
    print("2. 使用品牌官网的产品目录页面")
    print("3. 对于找不到的产品，使用零售商网站（如 cigars.com）")

    # 保存产品列表到 CSV 供参考
    df_products = pd.DataFrame(products)
    csv_path = '/Users/shitian/Work/shitian/waibao/e-commerce/product_list.csv'
    df_products.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"\n产品列表已保存到: {csv_path}")

if __name__ == '__main__':
    main()
