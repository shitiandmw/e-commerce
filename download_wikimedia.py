import urllib.request
import os
import time

# Wikimedia Commons 图片
urls = [
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Cohiba_lanceros_1.jpg/900px-Cohiba_lanceros_1.jpg", "cohiba_lanceros_wiki_1.jpg"),
    ("https://upload.wikimedia.org/wikipedia/commons/9/9e/Cohiba_lanceros_1.jpg", "cohiba_lanceros_wiki_2.jpg"),
]

output_dir = "product_images/batch31"
os.makedirs(output_dir, exist_ok=True)

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
        if file_size < 10240:
            print(f"  ✗ 文件太小 ({file_size} bytes)")
            os.remove(output_file)
        else:
            print(f"  ✓ 成功 ({file_size} bytes)")
            
    except Exception as e:
        print(f"  ✗ 失败: {e}")

print("\n检查下载的文件:")
os.system(f"ls -lh {output_dir}/cohiba_lanceros_*")
