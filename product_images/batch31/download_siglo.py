import json
import urllib.request
import time
import os

urls = {
    "Siglo I": [
        "https://egmcigars.com/cdn/shop/products/no40.jpg",
        "https://egmcigars.com/cdn/shop/products/no43.jpg",
        "https://egmcigars.com/cdn/shop/products/no41.jpg",
        "https://egmcigars.com/cdn/shop/products/no42.jpg",
        "https://egmcigars.com/cdn/shop/products/no38.jpg",
        "https://egmcigars.com/cdn/shop/products/no39.jpg"
    ],
    "Siglo III": [
        "https://egmcigars.com/cdn/shop/products/no62.jpg",
        "https://egmcigars.com/cdn/shop/products/no64.jpg",
        "https://egmcigars.com/cdn/shop/products/no65.jpg",
        "https://egmcigars.com/cdn/shop/products/no63.jpg"
    ],
    "Siglo IV": [
        "https://egmcigars.com/cdn/shop/products/no68.jpg",
        "https://egmcigars.com/cdn/shop/products/no69.jpg",
        "https://egmcigars.com/cdn/shop/products/no71.jpg",
        "https://egmcigars.com/cdn/shop/products/no70.jpg",
        "https://egmcigars.com/cdn/shop/products/no72.jpg",
        "https://egmcigars.com/cdn/shop/products/no67.jpg"
    ],
    "Siglo V": [
        "https://egmcigars.com/cdn/shop/products/no77.jpg",
        "https://egmcigars.com/cdn/shop/products/no76.jpg",
        "https://egmcigars.com/cdn/shop/products/no78.jpg",
        "https://egmcigars.com/cdn/shop/products/no79.jpg"
    ],
    "Siglo VI": [
        "https://egmcigars.com/cdn/shop/files/Cohiba_Siglo_VI_Cigar_Box_of_25_Cigars_EGM_Cigars.jpg",
        "https://egmcigars.com/cdn/shop/files/Cohiba_Siglo_VI_Cigar_Single_EGM_Cigars.jpg",
        "https://egmcigars.com/cdn/shop/products/CohibSigloVIBox_EGMCigars_da102fe0-0335-48cc-ba82-3b3d2bd0d6a2.jpg",
        "https://egmcigars.com/cdn/shop/products/no83.jpg",
        "https://egmcigars.com/cdn/shop/products/no81.jpg"
    ]
}

counter = 22
all_images = []

for product, image_urls in urls.items():
    print(f'\n=== {product} ===')
    
    for url in image_urls:
        filename = url.split('/')[-1].split('?')[0]
        output_file = f'cohiba_{counter}_{filename}'
        
        print(f'下载: {url}')
        try:
            urllib.request.urlretrieve(url, output_file)
            file_size = os.path.getsize(output_file)
            
            if file_size < 10240:
                print(f'✗ 文件太小 ({file_size} bytes)，删除')
                os.remove(output_file)
            else:
                print(f'✓ 成功: {output_file} ({file_size} bytes)')
                all_images.append({
                    'product': product,
                    'file': output_file,
                    'url': url,
                    'size': file_size
                })
                counter += 1
        except Exception as e:
            print(f'✗ 失败: {e}')
        
        time.sleep(0.3)

print(f'\n\n总计下载: {len(all_images)} 张图片')

with open('siglo_series_images.json', 'w', encoding='utf-8') as f:
    json.dump(all_images, f, indent=2, ensure_ascii=False)
