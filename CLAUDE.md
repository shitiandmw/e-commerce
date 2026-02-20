# TIMECIGAR 电商平台

基于 Medusa v2.13.1 的雪茄电商平台，包含三个子项目：
- **后端**（根目录）— Medusa 服务端，PostgreSQL + Redis
- **admin-ui/** — 独立 Next.js 14 管理后台（非 Medusa 内置 admin）
- **storefront-v2/** — 主力店铺前端（Next.js 16 + Radix UI），开发中
- **storefront/** — 旧版店铺前端，逐步废弃，新功能请在 storefront-v2 中实现

## 开发命令

```bash
# 启动全部服务（后端 + 前端 + Docker）
npm run dev:all

# 单独启动
npm run dev                          # 后端 (port 9000)
cd admin-ui && npm run dev           # 管理后台 (port 3002)
cd storefront-v2 && npm run dev      # 店铺前端

# 数据库
npm run db:reset                     # 重置数据库
npm run seed                         # 填充种子数据

# 构建 & 测试
npm run build
npm run test:unit
npm run test:integration:http
npm run test:integration:modules
```

## 后端结构约定

### 模块 (`src/modules/{name}/`)

每个模块包含：
- `models/{Name}.ts` — MikroORM 数据模型
- `service.ts` — 继承 MedusaService 的服务类
- `index.ts` — 模块定义（Module()）
- `migrations/` — 数据库迁移

新模块必须在 `medusa-config.ts` 的 `modules` 数组中注册。

现有模块：brand, page, tag, announcement, popup, banner, article, curated-collection, menu

### API 路由 (`src/api/`)

- Admin: `src/api/admin/{resource}/route.ts` + `validators.ts`（Zod 验证）
- Store: `src/api/store/content/{resource}/route.ts`
- 每个路由文件导出 GET/POST/DELETE 等 handler

### 工作流 (`src/workflows/`)

按模块组织，使用 `createWorkflow` + `createStep`，支持补偿逻辑。

### 模块关系 (`src/links/`)

跨模块关系通过 link 文件定义（如 product-brand, product-tag）。

## 翻译系统

通过 Medusa Translation Module 统一管理，`translation` 表以 `reference` + `reference_id` + `locale_code` 关联实体。

- 模型文本字段用 `.translatable()` 标记，模型上不存储 translations JSON 字段
- 读取：`query.graph()` 第二个参数传 `{ locale }`，框架自动应用翻译
- 写入：通过 Translation Module 的 `listTranslations` / `createTranslations` / `updateTranslations` 操作
- Store 端通过 `x-medusa-locale` header 或 `?locale=` 查询参数传递语言
- 支持语言：zh-CN, zh-TW, en

## 关键架构决策

- Medusa 内置 admin 已禁用（`admin.disable: true`），使用独立 admin-ui
- 支付集成：Stripe（`@medusajs/payment-stripe`）
- storefront-v2 是主力开发方向，storefront v1 仅维护不新增功能
- storefront-v2 数据层尚未接入 Medusa API，当前使用本地 mock 数据，需要逐步替换
