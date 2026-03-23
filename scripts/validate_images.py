#!/usr/bin/env python3
"""
验证下载的产品图片，删除无效/损坏的图片文件。
用法: python validate_images.py <目录路径>
"""
import sys
import os
from PIL import Image

def validate_dir(dir_path):
    valid = 0
    invalid = 0
    deleted = []

    for f in sorted(os.listdir(dir_path)):
        fp = os.path.join(dir_path, f)
        if not os.path.isfile(fp):
            continue
        try:
            img = Image.open(fp)
            img.verify()
            # 额外检查：文件大小至少1KB
            if os.path.getsize(fp) < 1024:
                raise ValueError("文件太小，可能不是有效图片")
            valid += 1
        except Exception as e:
            invalid += 1
            deleted.append(f)
            os.remove(fp)
            print(f"删除无效图片: {f} ({e})")

    print(f"\n验证完成: {valid} 有效, {invalid} 无效已删除")
    return valid, invalid

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python validate_images.py <目录路径>")
        sys.exit(1)
    validate_dir(sys.argv[1])
