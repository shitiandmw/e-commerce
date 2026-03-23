#!/usr/bin/env python3
"""
根据文件名关键词将下载的图片重新匹配到产品。
改进版：从所有文本字段提取英文关键词，支持品牌别名和模糊匹配。
"""
import csv, os, re
from collections import defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 品牌别名映射：文件名中可能出现的变体 -> 产品列表中的brand_en
BRAND_ALIASES = {
    'cohiba': 'COHIBA', 'bolivar': 'BOLIVAR', 'hoyo': 'HOYO',
    'montecristo': 'MONTECRISTO', 'romeo': 'ROMEO', 'romeojulieta': 'ROMEO',
    'partagas': 'PARTAGAS', 'trinidad': 'TRINIDAD',
    'punch': 'PUNCH', 'quintero': 'QUINTERO',
    'hupmann': 'H. Upmann', 'upmann': 'H. Upmann',
    'ramonallones': 'RAMON ALLONES', 'ramon': 'RAMON ALLONES',
    'lagloriacubana': 'LA GLORIA CUBANA', 'gloria': 'LA GLORIA CUBANA',
    'vegasrobaina': 'VEGAS ROBAINA', 'vegueros': 'Vegueros',
    'cuaba': 'Cuaba', 'diplomaticos': 'Diplomáticos',
    'saintluisrey': 'Saint Luis Rey', 'sancristobal': 'San Cristobal',
    'sanchopanza': 'SANCHO PANZA', 'sancho': 'SANCHO PANZA',
    'laflordelcano': 'La Flor de Cano', 'florcano': 'La Flor de Cano',
    'juanlopez': 'JUAN LOPEZ', 'combinaciones': 'COMBINACIONES',
    'davidoff': 'Davidoff', 'camacho': 'Davidoff', 'zino': 'Davidoff',
    'quaidorsay': 'QUAI DORSAY', 'lcdh': 'LCDH',
    'godoffire': 'Davidoff', 'opusx': 'Davidoff', 'opus': 'Davidoff',
    'doncarlos': 'Davidoff', 'fuente': 'Davidoff',
    'foxcigar': 'Davidoff',
}

# 从文件名中无法区分的品牌，需要从上下文推断
BRAND_FROM_CONTEXT = {
    'COHIBA': ['cohiba'],
    'HOYO': ['hoyo'],
    'MONTECRISTO': ['montecristo'],
    'ROMEO': ['romeo', 'romeojulieta'],
}

def normalize(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())

def load_products():
    products = []
    with open(os.path.join(BASE, 'product_list_complete.csv'), 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            products.append(row)
    # 修复空brand_en：根据row_index范围和前一行推断品牌
    # 已知的空brand_en段的实际品牌（从原始Excel合并单元格推断）
    ROW_BRAND_MAP = {
        19: 'BOLIVAR',
        range(57, 72): 'COHIBA',       # row 57-71: COHIBA续
        range(73, 79): 'HOYO',          # row 73-78: HOYO (有brand_en的)
        range(80, 104): 'HOYO',         # row 80-103: HOYO续
        range(112, 152): 'ROMEO',       # row 112-151: ROMEO续
        range(157, 197): 'MONTECRISTO', # row 157-196: MONTECRISTO续 (No.2-5, Edmundo, Open, Joyitas)
        range(200, 235): 'PARTAGAS',    # row 200-234: PARTAGAS (Lusitanias, Serie D/E/P, Short等)
        range(243, 251): 'TRINIDAD',    # row 243-250: TRINIDAD续 (Coloniales到Short)
        range(253, 276): 'H. Upmann',   # row 253-275: H. Upmann (Magnum, Regalias等)
        range(318, 321): 'RAMON ALLONES',
        325: 'Cuaba',
        range(364, 367): 'San Cristobal',
        378: 'Saint Luis Rey',
    }
    def get_inferred_brand(row_idx):
        try:
            idx = int(row_idx)
        except:
            return ''
        for key, brand in ROW_BRAND_MAP.items():
            if isinstance(key, range):
                if idx in key:
                    return brand
            elif idx == key:
                return brand
        return ''

    prev_brand_en = ''
    for p in products:
        if p.get('type') == 'cuban':
            b = (p.get('brand_en') or '').strip()
            if b and b not in ['T (15枝)']:
                prev_brand_en = b
            elif not b:
                inferred = get_inferred_brand(p.get('row_index', ''))
                if inferred:
                    p['brand_en_inferred'] = inferred
                elif prev_brand_en:
                    p['brand_en_inferred'] = prev_brand_en
    return products

# non-cuban Davidoff产品的中文model -> 英文文件名关键词映射
CN_EN_MODEL_MAP = {
    '火神': 'GodOfFire', '唐卡洛斯': 'DonCarlos', '卡利托': 'Carlito',
    '富恩特巨著': 'OpusX', '富恩特OPUSX': 'OpusX', '富恩特巨著OPUS': 'Opus',
    '短篇小说': 'ShortStory', '国王T': 'King_T', '海明威': 'Hemingway',
    '失落之城': 'LostCity', '天使': 'Angels', '禁忌': 'Forbidden',
    '简单铂金': 'Zino_Platinum', '简单黑': 'Zino_Nicaragua',
    '卡马乔': 'Camacho', '至暗时刻': 'LateHour', '至暗時刻': 'LateHour',
    '艾斯库里': 'Escurio', '艾斯庫里': 'Escurio',
    '尼加拉瓜': 'Nicaragua', '唯佳': 'VegaFina', 'Vega': 'Vega',
    '庆典': 'Celebracion', '黑檀木': 'Ebony', '马杜罗': 'Maduro',
    '金牛座': 'Tauros', '天蝎座': 'Scorpio', '紫雨': 'PurpleRain',
    '鱼雷': 'Torpedo', '双皇冠': 'DoubleCor', '罗布图': 'Robusto',
    '公牛': 'Toro', '金字塔': 'Piramide', '丘吉尔': 'Churchill',
    '大帝': 'GrandMaster', '组合装': 'Sampler',
    '红混合': 'RedMixture', '叶丝': 'RedMixture',
}

def extract_en_keywords(text):
    if not text:
        return []
    parts = re.findall(r'[A-Za-z][A-Za-z0-9.\']+', text)
    return [p for p in parts if len(p) > 1 and p.lower() not in
            ('枝', 'no', 'de', 'le', 'la', 'du', 'en', 'el', 'at', 'a')]

def detect_brand_from_filename(fn_norm):
    for alias, brand in BRAND_ALIASES.items():
        if alias in fn_norm:
            return brand
    return None

def match_file_to_product(filename, candidates):
    fn = filename.rsplit('.', 1)[0]
    fn_norm = normalize(fn)
    fn_brand = detect_brand_from_filename(fn_norm)
    best_match = None
    best_score = 0
    for p in candidates:
        brand_en = (p.get('brand_en') or p.get('brand_en_inferred', '')).strip()
        model = (p.get('model') or '').strip()
        brand_cn = (p.get('brand_cn') or '').strip()
        if not brand_en:
            continue
        # Check brand match - also handle sub-brands
        brand_norm = normalize(brand_en)
        brand_match = False
        # Direct brand match
        if brand_norm in fn_norm:
            brand_match = True
        # Alias-based match: file brand resolves to same brand_en
        elif fn_brand:
            fn_brand_norm = normalize(fn_brand)
            if fn_brand_norm == brand_norm:
                brand_match = True
            # Davidoff sub-brands: Camacho/Zino/OpusX files -> Davidoff products
            elif fn_brand == 'Davidoff' and brand_en == 'Davidoff':
                brand_match = True
        if not brand_match:
            for part in brand_en.replace('.', ' ').split():
                if len(part) > 2 and normalize(part) in fn_norm:
                    brand_match = True
                    break
        if not brand_match:
            continue
        # Score model keywords from model field
        all_keywords = extract_en_keywords(model)
        # Also extract from brand_cn (which might contain model info for shifted rows)
        all_keywords.extend(extract_en_keywords(brand_cn))
        # Map Chinese model terms to English for non-cuban products
        for cn_term, en_term in CN_EN_MODEL_MAP.items():
            if cn_term in model or cn_term in brand_cn:
                all_keywords.extend(extract_en_keywords(en_term))
        score = 0
        for kw in all_keywords:
            kw_norm = normalize(kw)
            if len(kw_norm) > 1 and kw_norm in fn_norm:
                score += len(kw_norm)
        # Bonus for number matches (e.g., No2, 52, 46)
        model_nums = re.findall(r'\d+', model)
        fn_nums = re.findall(r'\d+', fn)
        for mn in model_nums:
            if mn in fn_nums and len(mn) >= 2:
                score += 3
        if score > best_score:
            best_score = score
            best_match = p
    return best_match, best_score

def get_batch_range(batch_num):
    if batch_num == 20:
        return (418, 429)
    return ((batch_num - 1) * 22, batch_num * 22)

def process_batch(batch_num, products):
    batch_dir = os.path.join(BASE, f'product_images/batch{batch_num}')
    if not os.path.isdir(batch_dir):
        print(f"batch{batch_num}: 目录不存在")
        return
    files = sorted([f for f in os.listdir(batch_dir)
                    if f.lower().endswith(('.jpg', '.jpeg', '.png'))
                    and os.path.isfile(os.path.join(batch_dir, f))])
    if not files:
        print(f"batch{batch_num}: 无图片")
        return
    start, end = get_batch_range(batch_num)
    batch_products = products[start:end]
    product_images = defaultdict(list)
    unmatched = []
    for f in files:
        # 先在批次范围内匹配
        match, score = match_file_to_product(f, batch_products)
        if not match or score < 3:
            # 再在全部产品中匹配
            match, score = match_file_to_product(f, products)
        if match and score >= 3:
            key = (match.get('type',''), match.get('row_index',''))
            img_path = f'product_images/batch{batch_num}/{f}'
            if len(product_images[key]) < 5:
                product_images[key].append(img_path)
        else:
            unmatched.append(f)
    # Write CSV - 使用 (type, row_index) 作为唯一键
    csv_path = os.path.join(BASE, f'image_links_batch{batch_num}.csv')
    with open(csv_path, 'w', newline='', encoding='utf-8') as csvf:
        writer = csv.writer(csvf)
        writer.writerow(['row_index', 'type', 'brand_cn', 'brand_en', 'model',
                         'local_image1', 'local_image2', 'local_image3', 'local_image4', 'local_image5'])
        for p in batch_products:
            key = (p.get('type',''), p.get('row_index',''))
            imgs = product_images.get(key, [])
            brand = p.get('brand_en') or p.get('brand_en_inferred', '')
            row = [p.get('row_index',''), p.get('type',''),
                   p.get('brand_cn',''), brand, p.get('model','')]
            row.extend(imgs)
            row.extend([''] * (10 - len(row)))
            writer.writerow(row)
    matched_count = sum(1 for imgs in product_images.values() if imgs)
    total_imgs = sum(len(imgs) for imgs in product_images.values())
    print(f"batch{batch_num}: {len(files)}图 -> {matched_count}产品({total_imgs}张匹配), {len(unmatched)}未匹配")
    if unmatched:
        for u in unmatched[:3]:
            print(f"  ? {u}")
        if len(unmatched) > 3:
            print(f"  ... +{len(unmatched)-3}")

def main():
    products = load_products()
    print(f"产品总数: {len(products)}\n")
    for i in range(1, 21):
        process_batch(i, products)
    # 汇总
    total_imgs = 0
    total_matched = 0
    for i in range(1, 21):
        d = os.path.join(BASE, f'product_images/batch{i}')
        if os.path.isdir(d):
            total_imgs += len([f for f in os.listdir(d) if f.lower().endswith(('.jpg','.jpeg','.png'))])
    print(f"\n总计: {total_imgs}张图片")

if __name__ == '__main__':
    main()
