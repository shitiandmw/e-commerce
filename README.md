# TIMECIGAR 电商平台

基于 Medusa v2 的雪茄电商平台。

## 项目结构

- **根目录** — Medusa 后端（PostgreSQL + Redis）
- **admin-ui/** — 独立 Next.js 管理后台
- **storefront-v2/** — 店铺前端（Next.js + Radix UI）

## 本地开发

```bash
bash init.sh          # 启动全部服务（Docker + 后端 + 前端）
npm run db:reset      # 重置数据库并导入种子数据
```

## 生产环境部署

### 1. 配置环境变量

复制 `.env.example`（如有）或手动创建 `.env`：

```env
POSTGRES_USER=medusa
POSTGRES_PASSWORD=<强密码>
POSTGRES_DB=medusa_ecommerce
JWT_SECRET=<随机字符串>
COOKIE_SECRET=<随机字符串>
PROD_STORE_CORS=https://your-store-domain.com
PROD_ADMIN_CORS=https://your-admin-domain.com
AUTH_CORS=https://your-admin-domain.com,https://your-store-domain.com
STRIPE_API_KEY=<Stripe 密钥>
STRIPE_WEBHOOK_SECRET=<Stripe Webhook 密钥>
NEXT_PUBLIC_MEDUSA_BACKEND_URL_ADMIN=https://your-api-domain.com
NEXT_PUBLIC_MEDUSA_BACKEND_URL_STORE=https://your-api-domain.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<Publishable API Key>
```

### 2. 构建并启动服务

```bash
docker compose up -d --build
```

首次启动时 Medusa 容器会自动执行 `db:migrate` 创建数据库表。

### 3. 创建管理员账号（仅首次部署）

```bash
docker compose --profile init run --rm init
```

默认账号 `admin@test.com` / `admin123456`，可通过环境变量自定义：

```bash
ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=yourpassword \
  docker compose --profile init run --rm init
```

### 4. 导入种子数据（可选，用于开发/演示环境）

```bash
docker compose --profile seed run --rm seed
```

导入分类、品牌、菜单、Banner、精选集等演示数据。

### 5. 启用 Nginx 反向代理（可选）

```bash
docker compose --profile with-nginx up -d
```

需配置 `STORE_DOMAIN`、`ADMIN_DOMAIN`、`API_DOMAIN` 环境变量。
