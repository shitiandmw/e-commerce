import json
import urllib.request
import os
import time

# 从 cigars-of-cuba.com 和其他来源下载剩余产品图片
urls = [
    # Lanceros
    ("https://www.cigars-of-cuba.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/c/o/cohiba-lanceros-box-of-25.jpg", "cohiba_lanceros_1.jpg"),
    ("https://www.cigars-of-cuba.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/c/o/cohiba-lanceros-single-cigar.jpg", "cohiba_lanceros_2.jpg"),
    
    # Exquisitos - 尝试从 topcubans
    ("https://www.topcubans.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/c/o/cohiba-exquisitos-box-of-25.jpg", "cohiba_exquisitos_1.jpg"),
    
    # Mini - 尝试通用图片源
    ("https://www.cigars-of-cuba.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/c/o/cohiba-mini-cigarillos-pack-of-100.jpg", "cohiba_mini_1.jpg"),
    
    # Short 系列
    ("https://www.cigars-of-cuba.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/c/o/cohiba-short-box-of-100.jpg", "cohiba_short_1.jpg"),
]

output_dir = "product_images/batch31"
os.makedirs(output_dir, exist_ok=True)

results = []
for url, filename in urls:
    try:
        output_file = os.path.join(output_dir, filename)
        print(f"下载: {url}")
        
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        
        urllib.request.urlretrieve(url, output_file)
        time.sleep(1)
        
        file_size = os.path.getsize(output_file)
        if file_size < 10240:  # 小于10KB
            print(f"  ✗ 文件太小 ({file_size} bytes)，删除")
            os.remove(output_file)
            results.append({"url": url, "filename": filename, "status": "too_small", "size": file_size})
        else:
            print(f"  ✓ 成功 ({file_size} bytes)")
            results.append({"url": url, "filename": filename, "status": "success", "size": file_size})
            
    except Exception as e:
        print(f"  ✗ 失败: {e}")
        results.append({"url": url, "filename": filename, "status": "error", "error": str(e)})

print(f"\n完成: {len([r for r in results if r['status'] == 'success'])}/{len(urls)}")
print(json.dumps(results, indent=2, ensure_ascii=False))
