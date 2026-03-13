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

现有模块：brand, tag, announcement, popup, banner, article, curated-collection, menu

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
- storefront-v2 大部分页面已对接 Medusa API（商品、分类、文章、认证、账户），购物车和结账流程待对接
- Page 模块已废弃，内容统一通过 Article + ArticleCategory 管理；"页面"是 handle 为 `page` 的 ArticleCategory，Store 端 `/store/content/pages` 路由查 article 表

## 已知问题

### NODE_ENV=production 导致依赖缺失

**问题**：如果 shell 环境中设置了 `NODE_ENV=production`，运行 `npm install` 会跳过所有 `devDependencies`，包括 `ts-node`。这会导致：
- Medusa 无法加载 TypeScript 配置文件（`medusa-config.ts`）
- Build 失败，报错：`TypeError: Cannot read properties of null (reading 'admin')`
- 配置加载器返回 `null`

**根本原因**：
1. Medusa 启动时尝试注册 `ts-node` 来支持 TypeScript 文件
2. 如果 `ts-node` 未安装，Node.js 无法加载 `.ts` 文件
3. `medusa-config.ts` 中的 `defineConfig()` 会验证自定义模块路径
4. 模块验证失败导致配置加载返回 `null`

**解决方案**：
- **项目级**：`package.json` 中的关键脚本（`build`, `dev`, `seed`）已强制设置 `NODE_ENV=development`
- **环境级**：如果全局设置了 `NODE_ENV=production`，运行 `unset NODE_ENV` 或 `export NODE_ENV=development`
- **新 worktree**：使用 `bash init.sh` 一键启动，脚本会自动使用 development 模式安装依赖并编译

**预防措施**：
- `package.json` 的 `preinstall` 钩子会在 `NODE_ENV=production` 时显示警告
- `init.sh` 脚本强制使用 `NODE_ENV=development npm install`
- 首次启动时会先编译生成 `.medusa/server/` 目录

### Chokidar 文件监视补丁

Medusa 的 `develop` 命令用 chokidar 监视项目根目录，但只忽略根级 `node_modules`。子项目（admin-ui、storefront、storefront-v2）各自的 `node_modules` 包含数万文件，会导致 ENFILE（文件描述符耗尽）和误触发后端重启。

`scripts/patch-watcher.js` 通过 `postinstall` 钩子自动将这些目录加入忽略列表，每次 `npm install` 后自动生效。如果新增子项目目录，需要同步更新此脚本。

Medusa 官方暂未提供配置项（无 `.medusaignore`、无 `medusa-config.ts` 选项），ignored 列表硬编码在 `develop.js` 中（参考 [#9811](https://github.com/medusajs/medusa/issues/9811)）。postinstall patch 是当前唯一方案，Medusa 升级后需验证 patch 是否仍兼容。

开发时建议提高文件描述符限制：`ulimit -n 65536`
