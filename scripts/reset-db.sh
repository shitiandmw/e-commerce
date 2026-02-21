#!/usr/bin/env bash
# ============================================================================
# reset-db.sh — 重置数据库（清空 → 迁移 → 种子数据）
# 用法: bash scripts/reset-db.sh
# ============================================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[reset-db]${NC} $1"; }
warn() { echo -e "${YELLOW}[reset-db]${NC} $1"; }
err()  { echo -e "${RED}[reset-db]${NC} $1"; }

# ---------- 环境变量 ----------
export DATABASE_URL="${DATABASE_URL:-postgres://medusa:medusa_password@localhost:55432/medusa_ecommerce}"

DB_NAME="medusa_ecommerce"
DB_USER="medusa"
DB_HOST="localhost"
DB_PORT="55432"

# ---------- 确认 ----------
echo ""
warn "即将重置数据库 $DB_NAME，所有数据将被清空！"
read -p "确认继续？(y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  log "已取消"
  exit 0
fi

# ---------- 1. 清空数据库 ----------
log "清空数据库..."
docker exec ecommerce-postgres psql -U "$DB_USER" -d postgres -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" >/dev/null 2>&1 || true

docker exec ecommerce-postgres psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null
docker exec ecommerce-postgres psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null
log "✓ 数据库已重建"

# ---------- 2. 运行迁移 ----------
log "运行数据库迁移..."
npx medusa db:migrate 2>&1 | tail -5
log "✓ 迁移完成"

# ---------- 3. 创建管理员 ----------
log "创建管理员账号..."
npx medusa user -e admin@test.com -p admin123456 2>&1 | tail -2 || warn "管理员可能已存在"
log "✓ 管理员: admin@test.com / admin123456"

# ---------- 4. 运行种子数据 ----------
log "导入基础种子数据..."
npx medusa exec ./src/scripts/seed.ts 2>&1 | tail -5
log "✓ 基础种子数据完成"

log "导入分类数据..."
npx medusa exec ./src/scripts/seed-categories.ts 2>&1 | tail -3
log "✓ 分类数据完成"

log "导入品牌数据..."
npx medusa exec ./src/scripts/seed-brands.ts 2>&1 | tail -3
log "✓ 品牌数据完成"

log "导入菜单数据..."
npx medusa exec ./src/scripts/seed-menu.ts 2>&1 | tail -3
log "✓ 菜单数据完成"

log "导入 Banner 数据..."
npx medusa exec ./src/scripts/seed-banners.ts 2>&1 | tail -3
log "✓ Banner 数据完成"

log "导入精选集数据..."
npx medusa exec ./src/scripts/seed-collections.ts 2>&1 | tail -3
log "✓ 精选集数据完成"

# ---------- 完成 ----------
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  数据库重置完成${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "  管理员: admin@test.com / admin123456"
echo -e "  启动开发环境: bash init.sh"
echo -e "${GREEN}============================================${NC}"
echo ""
