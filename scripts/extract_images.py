#!/usr/bin/env python3
"""
Extract actual image URLs from cigar product pages
"""
import csv
import time
from scrapling.fetchers import Fetcher

def extract_image_urls(page_url):
    """Extract image URLs from a product page"""
    try:
        print(f"Fetching: {page_url}")
        page = Fetcher.get(page_url, timeout=15, stealthy_headers=True)

        # Try multiple common image selectors
        image_urls = []

        # Common product image selectors
        selectors = [
            'img.product-image::attr(src)',
            'img[itemprop="image"]::attr(src)',
            '.product-image img::attr(src)',
            '.product-photo img::attr(src)',
            'img[alt*="cigar"]::attr(src)',
            'img[alt*="Cigar"]::attr(src)',
            '.gallery img::attr(src)',
            'img.main-image::attr(src)',
        ]

        for selector in selectors:
            imgs = page.css(selector).getall()
            for img in imgs:
                if img and img.startswith('http') and img not in image_urls:
                    # Filter out tiny images (icons, logos)
                    if not any(x in img.lower() for x in ['logo', 'icon', 'sprite', 'banner']):
                        image_urls.append(img)

        # If no images found with specific selectors, try all images
        if not image_urls:
            all_imgs = page.css('img::attr(src)').getall()
            for img in all_imgs:
                if img and img.startswith('http'):
                    # Filter out small/irrelevant images
                    if not any(x in img.lower() for x in ['logo', 'icon', 'sprite', 'banner', 'flag']):
                        image_urls.append(img)

        return image_urls[:5]  # Return max 5 images

    except Exception as e:
        print(f"Error fetching {page_url}: {e}")
        return []

def main():
    input_file = 'image_links_batch5.csv'
    output_file = 'image_links_batch5_verified.csv'

    # Read the input CSV
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Process each row
    results = []
    for i, row in enumerate(rows, 1):
        print(f"\nProcessing {i}/{len(rows)}: {row['model']}")

        result = {
            'row_index': row['row_index'],
            'type': row['type'],
            'brand_cn': row['brand_cn'],
            'brand_en': row['brand_en'],
            'model': row['model'],
            'image_url_1': '',
            'image_url_2': '',
            'image_url_3': '',
            'image_url_4': '',
            'image_url_5': '',
        }

        # Try each page link until we find images
        for link_num in range(1, 6):
            link_key = f'image_link_{link_num}'
            if link_key in row and row[link_key]:
                images = extract_image_urls(row[link_key])
                if images:
                    for j, img_url in enumerate(images, 1):
                        result[f'image_url_{j}'] = img_url
                    break  # Found images, no need to check more links
                time.sleep(1)  # Be polite

        results.append(result)
        time.sleep(2)  # Rate limiting

    # Write results
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['row_index', 'type', 'brand_cn', 'brand_en', 'model',
                     'image_url_1', 'image_url_2', 'image_url_3', 'image_url_4', 'image_url_5']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    print(f"\n✓ Results saved to {output_file}")

if __name__ == '__main__':
    main()
