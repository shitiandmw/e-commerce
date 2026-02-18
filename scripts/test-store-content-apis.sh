#!/usr/bin/env bash
# ============================================================================
# F198: Store 内容接口自动化测试
# 覆盖所有 Store 内容接口：正常请求、分页、筛选、404、空数据、发布状态、时间窗
# ============================================================================
set -uo pipefail

# ---------- 配置 ----------
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT_DIR/.ports.env" 2>/dev/null || true
BASE="http://localhost:${MEDUSA_PORT:-9433}"
PK=$(grep NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY "$ROOT_DIR/storefront/.env.local" | cut -d= -f2)

if [ -z "$PK" ]; then
  echo "ERROR: Publishable key not found"
  exit 1
fi

# ---------- 颜色 ----------
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
TOTAL=0

# ---------- 测试函数 ----------
assert_status() {
  local desc="$1" url="$2" expected="$3"
  TOTAL=$((TOTAL + 1))
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" -H "x-publishable-api-key: $PK")
  if [ "$status" = "$expected" ]; then
    echo -e "  ${GREEN}✓${NC} $desc (HTTP $status)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $desc (expected $expected, got $status)"
    FAIL=$((FAIL + 1))
  fi
}

assert_json_key() {
  local desc="$1" url="$2" key="$3"
  TOTAL=$((TOTAL + 1))
  local body
  body=$(curl -s --max-time 10 "$url" -H "x-publishable-api-key: $PK")
  if echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); assert '$key' in d" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $desc (key '$key' present)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $desc (key '$key' missing)"
    FAIL=$((FAIL + 1))
  fi
}

assert_json_array() {
  local desc="$1" url="$2" key="$3"
  TOTAL=$((TOTAL + 1))
  local body
  body=$(curl -s --max-time 10 "$url" -H "x-publishable-api-key: $PK")
  if echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); assert isinstance(d.get('$key'), list)" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $desc (key '$key' is array)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $desc (key '$key' not array)"
    FAIL=$((FAIL + 1))
  fi
}

assert_json_count() {
  local desc="$1" url="$2" key="$3" op="$4" val="$5"
  TOTAL=$((TOTAL + 1))
  local body count
  body=$(curl -s --max-time 10 "$url" -H "x-publishable-api-key: $PK")
  count=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('$key', [])))" 2>/dev/null || echo "-1")
  local ok=false
  case "$op" in
    gte) [ "$count" -ge "$val" ] && ok=true ;;
    eq)  [ "$count" -eq "$val" ] && ok=true ;;
    gt)  [ "$count" -gt "$val" ] && ok=true ;;
    lte) [ "$count" -le "$val" ] && ok=true ;;
  esac
  if $ok; then
    echo -e "  ${GREEN}✓${NC} $desc (count=$count)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $desc (count=$count, expected $op $val)"
    FAIL=$((FAIL + 1))
  fi
}

assert_format() {
  local desc="$1" url="$2" check="$3"
  TOTAL=$((TOTAL + 1))
  local body
  body=$(curl -s --max-time 10 "$url" -H "x-publishable-api-key: $PK")
  if echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); $check" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $desc"
    FAIL=$((FAIL + 1))
  fi
}

# ============================================================================
echo ""
echo "=========================================="
echo "  F198: Store 内容接口自动化测试"
echo "=========================================="
echo "  Backend: $BASE"
echo ""

# ---------- 1. /store/content/home ----------
echo -e "${YELLOW}[1/7] /store/content/home${NC}"
assert_status "正常请求返回 200" "$BASE/store/content/home" "200"
assert_json_key "返回 banners 字段" "$BASE/store/content/home" "banners"
assert_json_key "返回 announcements 字段" "$BASE/store/content/home" "announcements"
assert_json_key "返回 popups 字段" "$BASE/store/content/home" "popups"
assert_json_key "返回 collections 字段" "$BASE/store/content/home" "collections"
assert_json_array "banners 是数组" "$BASE/store/content/home" "banners"
assert_json_array "announcements 是数组" "$BASE/store/content/home" "announcements"
assert_json_array "popups 是数组" "$BASE/store/content/home" "popups"
assert_json_array "collections 是数组" "$BASE/store/content/home" "collections"
assert_format "banners items 仅含启用项" "$BASE/store/content/home" \
  "assert all(i.get('is_enabled', True) for s in d.get('banners', []) for i in s.get('items', []))"
echo ""

# ---------- 2. /store/content/menus ----------
echo -e "${YELLOW}[2/7] /store/content/menus${NC}"
assert_status "正常请求返回 200" "$BASE/store/content/menus" "200"
assert_json_key "返回 menus 字段" "$BASE/store/content/menus" "menus"
assert_json_array "menus 是数组" "$BASE/store/content/menus" "menus"
assert_status "key 参数过滤返回 200" "$BASE/store/content/menus?key=main" "200"
assert_status "不存在的 key 返回 200" "$BASE/store/content/menus?key=nonexistent_key_xyz" "200"
assert_json_count "不存在的 key 返回空数组" "$BASE/store/content/menus?key=nonexistent_key_xyz" "menus" "eq" "0"
echo ""

# ---------- 3. /store/content/articles ----------
echo -e "${YELLOW}[3/7] /store/content/articles${NC}"
assert_status "正常请求返回 200" "$BASE/store/content/articles" "200"
assert_json_key "返回 articles 字段" "$BASE/store/content/articles" "articles"
assert_json_array "articles 是数组" "$BASE/store/content/articles" "articles"
assert_json_key "返回 count 字段" "$BASE/store/content/articles" "count"
# 分页测试
assert_status "分页 limit=1 返回 200" "$BASE/store/content/articles?limit=1" "200"
assert_json_count "limit=1 最多返回 1 条" "$BASE/store/content/articles?limit=1" "articles" "lte" "1"
assert_status "分页 offset=0&limit=2 返回 200" "$BASE/store/content/articles?offset=0&limit=2" "200"
# 筛选测试
assert_status "搜索 q 参数返回 200" "$BASE/store/content/articles?q=test" "200"
assert_status "分类筛选返回 200" "$BASE/store/content/articles?category=nonexistent" "200"
assert_json_count "不存在分类返回空" "$BASE/store/content/articles?category=nonexistent_cat_xyz" "articles" "eq" "0"
# 发布状态：仅返回已发布文章
assert_format "仅返回已发布文章" "$BASE/store/content/articles" \
  "assert all(a.get('status') == 'published' for a in d.get('articles', []) if d.get('articles'))"
echo ""

# ---------- 4. /store/content/articles/:slug ----------
echo -e "${YELLOW}[4/7] /store/content/articles/:slug${NC}"
assert_status "不存在的 slug 返回 404" "$BASE/store/content/articles/nonexistent-slug-xyz-12345" "404"
echo ""

# ---------- 5. /store/content/pages/:slug ----------
echo -e "${YELLOW}[5/7] /store/content/pages/:slug${NC}"
assert_status "不存在的 slug 返回 404" "$BASE/store/content/pages/nonexistent-page-xyz-12345" "404"
echo ""

# ---------- 6. /store/content/collections ----------
echo -e "${YELLOW}[6/7] /store/content/collections${NC}"
assert_status "正常请求返回 200" "$BASE/store/content/collections" "200"
assert_json_key "返回 collections 字段" "$BASE/store/content/collections" "collections"
assert_json_array "collections 是数组" "$BASE/store/content/collections" "collections"
assert_status "key 参数过滤返回 200" "$BASE/store/content/collections?key=featured" "200"
assert_status "不存在的 key 返回 200" "$BASE/store/content/collections?key=nonexistent_xyz" "200"
assert_json_count "不存在的 key 返回空" "$BASE/store/content/collections?key=nonexistent_xyz" "collections" "eq" "0"
echo ""

# ---------- 7. /store/content/brands ----------
echo -e "${YELLOW}[7/7] /store/content/brands${NC}"
assert_status "正常请求返回 200" "$BASE/store/content/brands" "200"
assert_json_key "返回 brands 字段" "$BASE/store/content/brands" "brands"
assert_json_array "brands 是数组" "$BASE/store/content/brands" "brands"
assert_json_key "返回 count 字段" "$BASE/store/content/brands" "count"
# 分页
assert_status "分页 limit=1 返回 200" "$BASE/store/content/brands?limit=1" "200"
assert_json_count "limit=1 最多返回 1 条" "$BASE/store/content/brands?limit=1" "brands" "lte" "1"
# 搜索
assert_status "搜索 q 参数返回 200" "$BASE/store/content/brands?q=test" "200"
# 不存在的 handle
assert_status "不存在的 handle 返回 404" "$BASE/store/content/brands/nonexistent-brand-xyz-12345" "404"
echo ""

# ---------- 格式一致性检查 ----------
echo -e "${YELLOW}[格式一致性] 所有列表接口返回格式检查${NC}"
assert_format "articles 列表含 count 数字" "$BASE/store/content/articles" \
  "assert isinstance(d.get('count'), int)"
assert_format "brands 列表含 count 数字" "$BASE/store/content/brands" \
  "assert isinstance(d.get('count'), int)"
assert_format "home 返回 JSON 对象" "$BASE/store/content/home" \
  "assert isinstance(d, dict)"
assert_format "menus 返回 JSON 对象" "$BASE/store/content/menus" \
  "assert isinstance(d, dict)"
assert_format "collections 返回 JSON 对象" "$BASE/store/content/collections" \
  "assert isinstance(d, dict)"
echo ""

# ---------- 汇总 ----------
echo "=========================================="
echo -e "  总计: $TOTAL  通过: ${GREEN}$PASS${NC}  失败: ${RED}$FAIL${NC}"
echo "=========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo -e "${GREEN}所有测试通过！${NC}"
