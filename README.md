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

复制生产环境变量模板：

```bash
cp .env.production.example .env.production
```

至少修改以下配置项：

```env
POSTGRES_USER=medusa
POSTGRES_PASSWORD=<强密码>
POSTGRES_DB=medusa_ecommerce
DATABASE_URL=postgres://medusa:<与 POSTGRES_PASSWORD 保持一致，特殊字符需 URL 编码>@postgres:5432/medusa_ecommerce?sslmode=disable
REDIS_URL=redis://redis:6379

JWT_SECRET=<随机字符串>
COOKIE_SECRET=<随机字符串>

STORE_CORS=https://your-store-domain.com
ADMIN_CORS=https://your-admin-domain.com
AUTH_CORS=https://your-admin-domain.com,https://your-store-domain.com

STRIPE_API_KEY=<Stripe 密钥>
STRIPE_WEBHOOK_SECRET=<Stripe Webhook 密钥>

NEXT_PUBLIC_MEDUSA_BACKEND_URL_ADMIN=https://your-api-domain.com
NEXT_PUBLIC_MEDUSA_BACKEND_URL_STORE=https://your-api-domain.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<Publishable API Key>
```

注意：
- 所有生产环境 `docker compose` 命令都应显式带上 `--env-file .env.production`
- `POSTGRES_PASSWORD` 只在 PostgreSQL 数据卷首次初始化时生效。卷已存在时修改该值，不会自动同步数据库中的 `medusa` 用户密码；此时需要重置数据卷或手动执行 `ALTER USER`/`\password`

### 2. 构建并启动服务

```bash
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f medusa
```

首次启动时 Medusa 容器会自动执行 `db:migrate` 创建数据库表。

### 3. 创建管理员账号（仅首次部署）

```bash
docker compose --env-file .env.production --profile init run --rm init
```

默认账号 `admin@test.com` / `admin123456`，可通过环境变量自定义：

```bash
ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=yourpassword \
  docker compose --env-file .env.production --profile init run --rm init
```

### 4. 导入种子数据（可选，用于开发/演示环境）

```bash
docker compose --env-file .env.production --profile seed run --rm seed
```

导入分类、品牌、菜单、Banner、精选集等演示数据。

### 5. 启用 Nginx 反向代理（可选）

```bash
docker compose --env-file .env.production --profile with-nginx up -d
```

需配置 `STORE_DOMAIN`、`ADMIN_DOMAIN`、`API_DOMAIN` 环境变量。
