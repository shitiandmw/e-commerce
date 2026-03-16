# Docker Compose 生产部署指南

## 前置要求

- Docker 20.10+
- Docker Compose v2+
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

## 快速开始

### 1. 配置环境变量

复制环境变量模板并填入实际值：

```bash
cp .env.production.example .env.production
```

**必须修改的配置项**：

```bash
# 安全密钥（生成强随机字符串）
JWT_SECRET=your-super-secret-jwt-key
COOKIE_SECRET=your-super-secret-cookie-key
POSTGRES_PASSWORD=your-strong-database-password

# AI 客服配置（如需使用 AI 托管功能）
AI_PROVIDER=openai              # 或 anthropic
AI_API_KEY=sk-xxx               # 你的 API Key
AI_MODEL=gpt-4o-mini            # 或 claude-3-5-sonnet-20241022

# 生产域名（替换 localhost）
PROD_STORE_CORS=https://your-store.com
PROD_ADMIN_CORS=https://admin.your-store.com
NEXT_PUBLIC_MEDUSA_BACKEND_URL_ADMIN=https://api.your-store.com
NEXT_PUBLIC_MEDUSA_BACKEND_URL_STORE=https://api.your-store.com
NEXT_PUBLIC_SOCKET_URL=https://api.your-store.com:49001

# Stripe 支付（可选）
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Publishable Key（从 Medusa Admin 获取）
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxx
```

### 2. 启动服务

```bash
# 构建并启动所有服务
docker compose --env-file .env.production up --build -d

# 查看日志
docker compose logs -f medusa
```

### 3. 初始化数据库

```bash
# 创建管理员账号
docker compose --env-file .env.production --profile init up init

# 导入种子数据（可选）
docker compose --env-file .env.production --profile seed up seed
```

### 4. 访问服务

- **店铺前端**: http://localhost:43000
- **管理后台**: http://localhost:43002
- **API 后端**: http://localhost:49000
- **Socket.io**: http://localhost:49001

## 服务架构

```
┌─────────────────┐
│   Nginx (可选)   │  反向代理 + SSL
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐ ┌───▼────┐
│Medusa │ │Admin│  │Storefront│ │Socket.io│
│ :9000 │ │:3002│  │  :3000   │ │ :9001  │
└───┬───┘ └─────┘  └──────────┘ └────────┘
    │
┌───┴────┬────────┐
│Postgres│  Redis │
│ :5432  │ :6379  │
└────────┴────────┘
```

## 核心功能说明

### Socket.io 实时通信

- **端口**: 9001（容器内）/ 49001（宿主机）
- **用途**: 客服聊天、AI 托管、实时通知
- **依赖**: Redis（用于多实例消息同步）

### AI 客服托管

支持两种 AI 提供商：

1. **OpenAI**
   ```bash
   AI_PROVIDER=openai
   AI_API_KEY=sk-xxx
   AI_MODEL=gpt-4o-mini
   ```

2. **Anthropic Claude**
   ```bash
   AI_PROVIDER=anthropic
   AI_API_KEY=sk-ant-xxx
   AI_MODEL=claude-3-5-sonnet-20241022
   ```

3. **兼容 OpenAI 的第三方服务**
   ```bash
   AI_PROVIDER=openai
   AI_API_URL=https://your-proxy.com/v1
   AI_API_KEY=xxx
   AI_MODEL=gpt-4o-mini
   ```

## 常用命令

### 服务管理

```bash
# 启动服务
docker compose --env-file .env.production up -d

# 停止服务
docker compose down

# 重启单个服务
docker compose restart medusa

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f [service_name]
```

### 数据库管理

```bash
# 重置数据库（危险操作！）
docker compose down -v
docker compose --env-file .env.production up -d postgres redis
docker compose --env-file .env.production --profile init up init

# 备份数据库
docker exec ecommerce-prod-postgres pg_dump -U medusa medusa_ecommerce > backup.sql

# 恢复数据库
docker exec -i ecommerce-prod-postgres psql -U medusa medusa_ecommerce < backup.sql
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose --env-file .env.production up --build -d

# 清理旧镜像
docker image prune -f
```

## 使用 Nginx 反向代理（推荐生产环境）

```bash
# 启动包含 Nginx 的完整栈
docker compose --env-file .env.production --profile with-nginx up -d
```

配置域名解析后访问：
- 店铺: https://store.example.com
- 管理后台: https://admin.example.com
- API: https://api.example.com

## 故障排查

### 1. Medusa 启动失败

```bash
# 检查日志
docker compose logs medusa

# 常见问题：
# - 数据库连接失败 → 检查 DATABASE_URL
# - Redis 连接失败 → 检查 REDIS_URL
# - 端口冲突 → 修改 .env.production 中的端口
```

### 2. Socket.io 连接失败

```bash
# 检查端口是否开放
docker compose ps | grep medusa

# 检查 CORS 配置
docker compose exec medusa env | grep CORS

# 确认前端配置
docker compose exec admin-ui env | grep SOCKET
```

### 3. AI 客服不工作

```bash
# 检查 AI 配置
docker compose exec medusa env | grep AI_

# 查看 AI 调用日志
docker compose logs medusa | grep "\[AI\]"
```

### 4. Seed 数据导入失败

```bash
# 检查编译后的脚本是否存在
docker compose exec medusa ls -la .medusa/server/src/scripts/

# 如果不存在，需要先构建
docker compose exec medusa npm run build
```

## 性能优化建议

1. **数据库连接池**: 默认配置已优化，如需调整可在 `medusa-config.ts` 中修改
2. **Redis 持久化**: 生产环境建议启用 AOF 持久化
3. **文件上传**: 建议配置 S3/MinIO 等对象存储
4. **CDN**: 静态资源建议使用 CDN 加速
5. **监控**: 建议集成 Prometheus + Grafana 监控

## 安全建议

1. ✅ 修改所有默认密钥和密码
2. ✅ 使用 HTTPS（通过 Nginx + Let's Encrypt）
3. ✅ 限制数据库和 Redis 端口仅内网访问
4. ✅ 定期备份数据库
5. ✅ 启用防火墙，仅开放必要端口（80, 443）
6. ✅ 定期更新 Docker 镜像和依赖

## Next.js Standalone 模式注意事项

本项目使用 Next.js standalone 模式进行 Docker 部署，需要注意以下几点：

### 必须手动复制的目录

standalone 模式只会自动打包 `.next/standalone` 和 `.next/static`，以下目录需要在 Dockerfile 中手动复制：

1. **messages/** - 国际化翻译文件（next-intl）
   ```dockerfile
   COPY --from=builder /app/messages ./messages
   ```
   如果缺失会导致：
   - 所有翻译文本无法显示
   - 主题切换按钮失效
   - 页面可能无法正常渲染

2. **public/** - 静态资源（图标、图片等）
   ```dockerfile
   COPY --from=builder /app/public ./public
   ```
   如果缺失会导致：
   - 网站图标 404
   - 静态图片无法加载

### 验证方法

使用提供的验证脚本检查配置：
```bash
bash scripts/validate-deployment.sh
```

该脚本会自动检查所有必需的目录是否正确配置。

## 扩展阅读

- [Medusa 官方文档](https://docs.medusajs.com)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 配置指南](https://nginx.org/en/docs/)
