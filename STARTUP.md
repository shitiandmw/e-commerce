# 项目启动指南

## 环境要求

- Node.js >= 20
- npm >= 10
- Docker & Docker Compose（用于 PostgreSQL 和 Redis）

## 项目结构

```
e-commerce/
├── src/                  # Medusa 后端（端口 9000）
├── admin-ui/             # 自定义管理端 Next.js 前端（端口 3002）
├── scripts/              # 开发脚本
│   ├── dev.sh            # 一键启动开发环境
│   └── patch-watcher.js  # postinstall 补丁（自动执行）
├── docker-compose.yml    # PostgreSQL + Redis
├── medusa-config.ts      # Medusa 配置
└── .env                  # 环境变量
```

## 快速启动（推荐）

一条命令启动全部服务：

```bash
npm run dev:all
```

该脚本会自动：
1. 设置文件描述符限制（防止 ENFILE 错误）
2. 启动 Docker 基础设施（PostgreSQL + Redis）
3. 启动 Medusa 后端（端口 9000）
4. 启动 Admin UI 前端（端口 3002）
5. `Ctrl+C` 优雅关闭所有服务

## 手动启动

如需分步启动或调试，按以下顺序操作：

### 1. 启动基础设施

```bash
docker compose up -d
```

启动 PostgreSQL（5432）和 Redis（6379）。首次启动需等待容器健康检查通过。

### 2. 安装依赖

```bash
# 后端依赖（postinstall 会自动应用 watcher 补丁）
npm install

# 前端依赖
cd admin-ui && npm install && cd ..
```

### 3. 初始化数据库（仅首次）

```bash
npx medusa db:setup
```

如果数据库已存在，使用迁移命令：

```bash
npx medusa db:migrate
```

### 4. 提高文件描述符限制

```bash
ulimit -n 65536
```

> **为什么需要？** Medusa 的文件监视器（chokidar）会监控项目目录中的文件变化。
> 虽然 postinstall 补丁已将 `admin-ui/` 排除在监视范围外，但在某些系统上
> 默认限制仍然偏低，建议提高以防万一。

### 5. 启动后端

```bash
npm run dev
```

Medusa 后端运行在 `http://localhost:9000`。

### 6. 启动前端

新开一个终端窗口：

```bash
cd admin-ui
npm run dev
```

管理端运行在 `http://localhost:3002`。

## 创建管理员账号

首次使用需创建管理员：

```bash
npx medusa user -e admin@example.com -p your-password
```

然后在 `http://localhost:3002` 登录。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev:all` | **一键启动全部服务** |
| `docker compose up -d` | 启动 PostgreSQL + Redis |
| `docker compose down` | 停止基础设施 |
| `npm run dev` | 启动 Medusa 后端（开发模式） |
| `npm run build` | 构建后端 |
| `npm run start` | 启动后端（生产模式） |
| `cd admin-ui && npm run dev` | 启动管理端前端 |
| `cd admin-ui && npm run build` | 构建管理端前端 |
| `npx medusa db:migrate` | 执行数据库迁移 |
| `npx medusa db:setup` | 初始化数据库（首次） |

## 环境变量说明

后端 `.env`：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接地址 | `postgres://medusa:medusa_password@localhost:5432/medusa_ecommerce` |
| `REDIS_URL` | Redis 连接地址 | `redis://localhost:6379` |
| `JWT_SECRET` | JWT 签名密钥 | 需自行设置 |
| `COOKIE_SECRET` | Cookie 签名密钥 | 需自行设置 |
| `ADMIN_CORS` | 管理端允许的跨域来源 | 包含 `localhost:3002` |

前端 `admin-ui/.env.local`：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Medusa 后端地址 | `http://localhost:9000` |

## 已知问题与补丁

### Watcher 文件监视补丁

Medusa v2 的 `develop` 命令使用 chokidar 监视项目根目录，但只忽略根级 `node_modules`。
`admin-ui/node_modules` 包含数万个文件，会导致：

- **ENFILE**：文件描述符耗尽（`file table overflow`）
- **误触发重启**：admin-ui 中的任何文件变动都会重启后端

`scripts/patch-watcher.js` 通过 `postinstall` 钩子自动将 `admin-ui` 目录加入
chokidar 的忽略列表。每次 `npm install` 后自动生效。

### 媒体资源列表

Medusa v2 的上传 API 仅支持 `POST`（上传）和 `DELETE`（删除），不提供文件列表端点。
媒体库页面在上传文件前会显示空状态，上传后的文件通过 mutation 缓存刷新显示。
