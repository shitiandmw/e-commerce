#!/usr/bin/env bash
# ============================================================================
# dev.sh — 一键启动开发环境（基础设施 + 后端 + 前端）
# 用法: npm run dev:all 或 bash scripts/dev.sh
# 支持多 worktree 并行开发，应用端口基于目录路径自动派生
# ============================================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# ---------- 颜色 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[dev]${NC} $1"; }
warn() { echo -e "${YELLOW}[dev]${NC} $1"; }
err()  { echo -e "${RED}[dev]${NC} $1"; }

# ---------- 端口自动派生 ----------
if [ -n "$PORT_OFFSET" ]; then
  OFFSET=$PORT_OFFSET
else
  OFFSET=$(echo "$ROOT_DIR" | cksum | awk '{print $1 % 500}')
fi

MEDUSA_PORT=$((9000 + OFFSET))
ADMIN_PORT=$((3002 + OFFSET))
STOREFRONT_PORT=$((3000 + OFFSET))

export MEDUSA_PORT ADMIN_PORT STOREFRONT_PORT

log "端口偏移量: $OFFSET（基于目录路径）"
log "Medusa=$MEDUSA_PORT  Admin=$ADMIN_PORT  Storefront=$STOREFRONT_PORT"

# 写入 .ports.env 供其他工具读取
cat > "$ROOT_DIR/.ports.env" <<EOF
PORT_OFFSET=$OFFSET
MEDUSA_PORT=$MEDUSA_PORT
ADMIN_PORT=$ADMIN_PORT
STOREFRONT_PORT=$STOREFRONT_PORT
EOF

# 生成 admin-ui/.env.local
cat > "$ROOT_DIR/admin-ui/.env.local" <<EOF
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:$MEDUSA_PORT
EOF

# 生成 storefront/.env.local
cat > "$ROOT_DIR/storefront/.env.local" <<EOF
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:$MEDUSA_PORT
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-pk_test_51TestKeyForDevelopmentOnly000000000000000000000000000000}
EOF

# ---------- 环境变量配置 ----------
export DATABASE_URL="postgres://medusa:medusa_password@localhost:55432/medusa_ecommerce"
export REDIS_URL="redis://localhost:56739"

export STORE_CORS="http://localhost:$STOREFRONT_PORT,http://localhost:8000,http://localhost:3000"
export ADMIN_CORS="http://localhost:$ADMIN_PORT,http://localhost:$MEDUSA_PORT,http://localhost:5173,http://localhost:9000,http://localhost:3001,http://localhost:3002"
export AUTH_CORS="http://localhost:$ADMIN_PORT,http://localhost:$MEDUSA_PORT,http://localhost:$STOREFRONT_PORT,http://localhost:5173,http://localhost:9000,http://localhost:8000,http://localhost:3001,http://localhost:3002"

# Stripe 配置（Test Mode）
export STRIPE_API_KEY="${STRIPE_API_KEY:-sk_test_51TestKeyForDevelopmentOnly000000000000000000000000000000}"
export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_test_secret}"

# ---------- 提高文件描述符限制 ----------
CURRENT_LIMIT=$(ulimit -n)
TARGET_LIMIT=65536

if [ "$CURRENT_LIMIT" -lt "$TARGET_LIMIT" ] 2>/dev/null; then
  ulimit -n $TARGET_LIMIT 2>/dev/null || {
    warn "无法设置 ulimit -n $TARGET_LIMIT（当前: $CURRENT_LIMIT）"
    warn "如遇 ENFILE 错误，请手动执行: ulimit -n $TARGET_LIMIT"
  }
  log "文件描述符限制: $(ulimit -n)"
else
  log "文件描述符限制: $CURRENT_LIMIT（已满足）"
fi

# ---------- 清理函数 ----------
BACKEND_PID=""
FRONTEND_PID=""
STOREFRONT_PID=""

cleanup() {
  log "正在停止服务..."
  [ -n "$STOREFRONT_PID" ] && kill $STOREFRONT_PID 2>/dev/null && log "Storefront 已停止"
  [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null && log "前端已停止"
  [ -n "$BACKEND_PID" ]  && kill $BACKEND_PID 2>/dev/null  && log "后端已停止"
  # 确保子进程也被终止
  jobs -p | xargs -r kill 2>/dev/null
  log "开发环境已关闭"
  exit 0
}

trap cleanup SIGINT SIGTERM

# ---------- 1. 检查并启动 Docker 基础设施 ----------
log "检查 Docker 服务..."
if command -v docker &>/dev/null; then
  POSTGRES_RUNNING=$(docker ps --filter "name=ecommerce-postgres" --filter "status=running" -q 2>/dev/null)
  if [ -z "$POSTGRES_RUNNING" ]; then
    log "启动 PostgreSQL + Redis..."
    docker compose -f docker-compose-dev.yml up -d 2>&1 | grep -v "^time=" || true
    log "等待数据库就绪..."
    sleep 5
    # 等待 PostgreSQL 健康
    for i in $(seq 1 10); do
      if docker exec ecommerce-postgres pg_isready -U medusa -d medusa_ecommerce &>/dev/null; then
        log "PostgreSQL 就绪"
        break
      fi
      [ "$i" -eq 10 ] && { err "PostgreSQL 启动超时"; exit 1; }
      sleep 2
    done
  else
    log "Docker 服务已在运行"
  fi
else
  warn "未检测到 Docker，跳过基础设施启动"
  warn "请确保 PostgreSQL 和 Redis 已手动启动"
fi

# ---------- 2. 启动 Medusa 后端 ----------
log "启动 Medusa 后端（端口 $MEDUSA_PORT）..."
npx medusa develop --port $MEDUSA_PORT &
BACKEND_PID=$!

# 等待后端就绪
log "等待后端就绪..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "" http://localhost:$MEDUSA_PORT/health 2>/dev/null; then
    log "✓ Medusa 后端就绪 → http://localhost:$MEDUSA_PORT"
    break
  fi
  [ "$i" -eq 30 ] && { err "后端启动超时（30s）"; cleanup; }
  sleep 1
done

# ---------- 2.1 获取 Publishable API Key 写入 storefront/.env.local ----------
log "获取 Publishable API Key..."
ADMIN_TOKEN=$(curl -s http://localhost:$MEDUSA_PORT/auth/user/emailpass \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123456"}' 2>/dev/null | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -n "$ADMIN_TOKEN" ]; then
  PUB_KEY=$(curl -s http://localhost:$MEDUSA_PORT/admin/api-keys \
    -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null | \
    python3 -c "import sys,json; keys=json.load(sys.stdin).get('api_keys',[]); pk=[k for k in keys if k.get('type')=='publishable' and not k.get('revoked_at')]; print(pk[0]['token'] if pk else '')" 2>/dev/null)

  if [ -n "$PUB_KEY" ]; then
    cat > "$ROOT_DIR/storefront/.env.local" <<EOF
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:$MEDUSA_PORT
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$PUB_KEY
EOF
    log "✓ Publishable Key 已写入 storefront/.env.local"
  else
    warn "未找到 Publishable API Key，storefront 可能无法调用 Store API"
  fi
else
  warn "无法获取管理员 Token，跳过 Publishable Key 配置"
fi

# ---------- 3. 启动 Admin UI 前端 ----------
log "启动 Admin UI 前端（端口 $ADMIN_PORT）..."
cd "$ROOT_DIR/admin-ui"
npx next dev -p $ADMIN_PORT &
FRONTEND_PID=$!
cd "$ROOT_DIR"

# 等待前端就绪
log "等待前端就绪..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "" http://localhost:$ADMIN_PORT 2>/dev/null; then
    log "✓ Admin UI 就绪 → http://localhost:$ADMIN_PORT"
    break
  fi
  [ "$i" -eq 30 ] && { warn "前端启动较慢，请稍候..."; }
  sleep 1
done

# ---------- 4. 启动 Storefront ----------
log "启动 Storefront（端口 $STOREFRONT_PORT）..."
cd "$ROOT_DIR/storefront"
npx next dev -p $STOREFRONT_PORT &
STOREFRONT_PID=$!
cd "$ROOT_DIR"

# 等待 Storefront 就绪
log "等待 Storefront 就绪..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "" http://localhost:$STOREFRONT_PORT 2>/dev/null; then
    log "✓ Storefront 就绪 → http://localhost:$STOREFRONT_PORT"
    break
  fi
  [ "$i" -eq 30 ] && { warn "Storefront 启动较慢，请稍候..."; }
  sleep 1
done

# ---------- 就绪 ----------
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}  开发环境已启动${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "  后端:       ${GREEN}http://localhost:$MEDUSA_PORT${NC}"
echo -e "  管理后台:   ${GREEN}http://localhost:$ADMIN_PORT${NC}"
echo -e "  前台商城:   ${GREEN}http://localhost:$STOREFRONT_PORT${NC}"
echo -e "  数据库: PostgreSQL :55432"
echo -e "  缓存: Redis :56739"
echo -e "${BLUE}============================================${NC}"
echo -e "  按 ${YELLOW}Ctrl+C${NC} 停止所有服务"
echo ""

# 保持脚本运行，等待子进程
wait
