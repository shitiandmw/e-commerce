#!/usr/bin/env python3
from PIL import Image
import os
import sys

batch_dir = '/Users/shitian/Work/shitian/waibao/e-commerce/product_images/batch7'
for filename in os.listdir(batch_dir):
    if filename.endswith(('.jpg', '.png', '.webp')):
        filepath = os.path.join(batch_dir, filename)
        try:
            img = Image.open(filepath)
            img.verify()
            print(f"✓ {filename}")
        except Exception as e:
            print(f"✗ {filename}: {e}")
            os.remove(filepath)
