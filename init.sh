#!/usr/bin/env bash
# ============================================================================
# init.sh — 一键启动开发环境（基础设施 + 后端 + 前端）
# 用法: bash init.sh 或 ./init.sh
# ============================================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# ---------- 颜色 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[init]${NC} $1"; }
warn() { echo -e "${YELLOW}[init]${NC} $1"; }
err()  { echo -e "${RED}[init]${NC} $1"; }

# ---------- 环境变量配置 ----------
export DATABASE_URL="postgres://medusa:medusa_password@localhost:55432/medusa_ecommerce"
export REDIS_URL="redis://localhost:56739"

# ---------- 安装依赖 ----------
if [ ! -d "node_modules" ]; then
  log "安装项目依赖..."
  npm install
fi

# ---------- 安装 Admin UI 依赖 ----------
if [ ! -d "admin-ui/node_modules" ]; then
  log "安装 Admin UI 依赖..."
  cd "$ROOT_DIR/admin-ui" && npm install && cd "$ROOT_DIR"
fi

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

cleanup() {
  log "正在停止服务..."
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
    docker compose up -d 2>&1 | grep -v "^time=" || true
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

# ---------- 2. 初始化数据库 ----------
log "检查数据库迁移状态..."
DB_NEEDS_INIT=false
if ! npx medusa db:migrate 2>&1 | grep -q "No pending migrations"; then
  log "运行数据库迁移..."
  npx medusa db:migrate || {
    warn "迁移失败，尝试完整初始化..."
    npx medusa db:setup || {
      err "数据库初始化失败"
      exit 1
    }
  }
  log "数据库迁移完成"
  DB_NEEDS_INIT=true
else
  log "数据库已是最新状态"
fi

# ---------- 3. 创建默认管理员账号 ----------
if [ "$DB_NEEDS_INIT" = true ]; then
  log "创建默认管理员账号..."
  npx medusa user -e admin@test.com -p admin123456 2>/dev/null || {
    warn "管理员账号可能已存在或创建失败"
    warn "默认账号: admin@test.com / admin123456"
  }
  log "✓ 管理员账号: admin@test.com / admin123456"
fi

# ---------- 4. 启动 Medusa 后端 ----------
log "启动 Medusa 后端（端口 9000）..."
npm run dev &
BACKEND_PID=$!

# 等待后端就绪
log "等待后端就绪..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "" http://localhost:9000/health 2>/dev/null; then
    log "✓ Medusa 后端就绪 → http://localhost:9000"
    break
  fi
  [ "$i" -eq 30 ] && { err "后端启动超时（30s）"; cleanup; }
  sleep 1
done

# ---------- 5. 启动 Admin UI 前端 ----------
log "启动 Admin UI 前端（端口 3002）..."
cd "$ROOT_DIR/admin-ui"
npx next dev -p 3002 &
FRONTEND_PID=$!
cd "$ROOT_DIR"

# 等待前端就绪
log "等待前端就绪..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "" http://localhost:3002 2>/dev/null; then
    log "✓ Admin UI 就绪 → http://localhost:3002"
    break
  fi
  [ "$i" -eq 30 ] && { warn "前端启动较慢，请稍候..."; }
  sleep 1
done

# ---------- 就绪 ----------
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}  开发环境已启动${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "  后端: ${GREEN}http://localhost:9000${NC}"
echo -e "  前端: ${GREEN}http://localhost:3002${NC}"
echo -e "  数据库: PostgreSQL :55432"
echo -e "  缓存: Redis :56739"
echo -e "${BLUE}--------------------------------------------${NC}"
echo -e "  管理员账号:"
echo -e "  邮箱: ${GREEN}admin@test.com${NC}"
echo -e "  密码: ${GREEN}admin123456${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "  按 ${YELLOW}Ctrl+C${NC} 停止所有服务"
echo ""

# 保持脚本运行，等待子进程
wait
