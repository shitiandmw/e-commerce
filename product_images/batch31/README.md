# Batch 31 - 高希霸系列图片更新

## 概述

本批次包含从 EGM Cigars 官方网站收集的高希霸（Cohiba）系列高质量产品图片。

- **批次编号**: batch31
- **日期**: 2026-04-03
- **来源**: EGM Cigars (https://zh-cn.egmcigars.com/collections/cohiba)
- **图片数量**: 16 张
- **覆盖产品**: 10 个高希霸产品

## 文件说明

- `cohiba_images.json` - 原始图片URL列表
- `product_image_mapping.json` - 产品与图片的映射关系
- `download_cohiba_images.sh` - 图片下载脚本
- `README.md` - 本说明文件
- `cohiba_*.jpg` / `cohiba_*.jpeg` - 下载的产品图片

## 图片质量

所有图片均为高质量产品图，包括：
- 盒装展示图
- 单支雪茄特写
- 铝管包装图
- 限量版礼盒图

图片分辨率适中，文件大小在 1KB - 789KB 之间，适合网站展示。

## 产品映射

### 已映射产品

1. **贝伊可54 BEHIKE 54** (`cohiba-54-behike-54-10`)
   - 2张高质量图片
   - 包含盒装和单支展示

2. **世纪2号 Siglo II** (`cohiba-2-siglo-ii-25`, `cohiba-2-siglo-ii-a-t-15`)
   - 1张盒装图
   - 可用于普通版和铝管版

3. **半世纪 MEDIO SIGLO** (`cohiba-medio-siglo-a-t-15`, `cohiba-medio-siglo-25`)
   - 2张图片
   - 铝管装和单支图

4. **马杜罗5奥秘小天才 MADURO 5 SECRETOS** (`cohiba-5-maduro-5-secretos-25`)
   - 2张高质量图

5. **魔术师 Magicos** (`cohiba-magicos-10`)
   - 2张图片

6. **宾利 PANETELAS** (`cohiba-panetelas-25`)
   - 2张图片

7. **55周年2021限量版** (`cohiba-55-2021-55-aniversario-2021-li`)
   - 2张图片（盒装+单支）

8. **黄金岁月兔年限量版 SIGLO DE ORO** (`cohiba-siglo-de-oro-year-of-the-rabbi`)
   - 2张图片

## 使用建议

### 1. 替换 placeholder 图片

当前数据库中以下产品使用 `placeholder.png`，建议优先替换：

- 罗伯图铝管 ROBUSTO A/T (3枝) - `cohiba-robusto-a-t-3`
- 大天才 GENIOS (25枝) - `cohiba-genios-25`
- 世纪1号 Siglo I (5枝) - `cohiba-1-siglo-i-5`
- 世纪1号 Siglo I (25枝) - `cohiba-1-siglo-i-25-18-19`
- 世纪2号纸盒 Siglo II (25枝) - `cohiba-2-siglo-ii-25-2`
- 世纪4号 Siglo IV (25枝) - `cohiba-4-siglo-iv-25`
- 世纪5号 Siglo V (25枝) - `cohiba-5-siglo-v-25`
- 世纪6号 Siglo VI (10枝/25枝) - `cohiba-6-siglo-vi-10`, `cohiba-6-siglo-vi-25`
- 宾利 PANETELAS (25枝) - `cohiba-panetelas-25` ✓ 已有图片
- 吉士图 EXQUISITOS (25枝) - `cohiba-exquisitos-25`
- 魔术师 Magicos (10枝) - `cohiba-magicos-10` ✓ 已有图片
- 长矛外交版 Lanceros VIP Gifts (25枝) - `cohiba-lanceros-vip-gifts-25`
- Ambar高希霸安巴尔（琥珀）- `cohiba-ambar`

### 2. 图片上传流程

1. 将图片上传到服务器 `/static/` 目录
2. 更新 `data/products.csv` 中对应产品的 `image1`, `image2` 等字段
3. 或者通过 Medusa Admin 后台上传并关联到产品

### 3. 后续收集

建议继续从以下网站收集更多高希霸图片：
- ✓ EGM Cigars (已完成)
- TimeC igar (需要进一步探索)
- 101Cigar (部分产品售罄，但图片可用)
- 70Cigars (需要搜索功能)

## 技术细节

### 下载脚本使用

```bash
# 重新下载所有图片
bash download_cohiba_images.sh

# 查看下载的图片
ls -lh cohiba_*.jpg cohiba_*.jpeg
```

### 图片命名规则

- 格式: `cohiba_{序号}_{原始文件名}`
- 序号从 1 开始递增
- 保留原始文件名以便追溯来源

## 注意事项

1. 所有图片均来自公开网站，用于商业用途前请确认版权
2. 部分图片可能需要裁剪或优化以适应网站布局
3. 建议保留原始图片作为备份
4. 更新产品图片后，记得清除 CDN 缓存

## 更新日志

- 2026-04-03: 创建 batch31，从 EGM Cigars 下载 16 张高希霸图片
