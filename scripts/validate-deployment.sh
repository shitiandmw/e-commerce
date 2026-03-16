#!/bin/bash
# Docker Compose 部署配置验证脚本

set -e

echo "=========================================="
echo "Docker Compose 部署配置验证"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. 检查 Docker 和 Docker Compose
echo "1. 检查 Docker 环境..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    check_pass "Docker 已安装: $DOCKER_VERSION"
else
    check_fail "Docker 未安装"
fi

if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    check_pass "Docker Compose 已安装: $COMPOSE_VERSION"
else
    check_fail "Docker Compose 未安装"
fi
echo ""

# 2. 检查 docker-compose.yml 语法
echo "2. 检查 docker-compose.yml 语法..."
if docker compose -f docker-compose.yml config --quiet; then
    check_pass "docker-compose.yml 语法正确"
else
    check_fail "docker-compose.yml 语法错误"
fi
echo ""

# 3. 检查服务定义
echo "3. 检查服务定义..."
SERVICES=$(docker compose -f docker-compose.yml config --services)
EXPECTED_SERVICES=("postgres" "redis" "medusa" "admin-ui" "storefront")

for service in "${EXPECTED_SERVICES[@]}"; do
    if echo "$SERVICES" | grep -q "^${service}$"; then
        check_pass "服务 '$service' 已定义"
    else
        check_fail "服务 '$service' 未定义"
    fi
done
echo ""

# 4. 检查 Socket.io 配置
echo "4. 检查 Socket.io 配置..."
CONFIG_OUTPUT=$(docker compose -f docker-compose.yml config)

if echo "$CONFIG_OUTPUT" | grep -q "SOCKET_PORT"; then
    check_pass "SOCKET_PORT 环境变量已配置"
else
    check_fail "SOCKET_PORT 环境变量缺失"
fi

if echo "$CONFIG_OUTPUT" | grep -q "target: 9001"; then
    check_pass "Socket.io 端口映射已配置 (9001)"
else
    check_fail "Socket.io 端口映射缺失"
fi

if echo "$CONFIG_OUTPUT" | grep -q "NEXT_PUBLIC_SOCKET_URL"; then
    check_pass "前端 Socket.io URL 已配置"
else
    check_fail "前端 Socket.io URL 缺失"
fi
echo ""

# 5. 检查 AI 配置
echo "5. 检查 AI 配置..."
AI_VARS=("AI_PROVIDER" "AI_API_KEY" "AI_MODEL")

for var in "${AI_VARS[@]}"; do
    if echo "$CONFIG_OUTPUT" | grep -q "$var"; then
        check_pass "AI 环境变量 '$var' 已配置"
    else
        check_fail "AI 环境变量 '$var' 缺失"
    fi
done
echo ""

# 6. 检查 .env.production.example
echo "6. 检查 .env.production.example..."
if [ -f ".env.production.example" ]; then
    check_pass ".env.production.example 文件存在"

    # 检查关键配置项
    REQUIRED_VARS=("SOCKET_PORT" "AI_PROVIDER" "AI_API_KEY" "AI_MODEL" "NEXT_PUBLIC_SOCKET_URL")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env.production.example || grep -q "^# ${var}" .env.production.example; then
            check_pass "环境变量 '$var' 已在示例文件中"
        else
            check_warn "环境变量 '$var' 未在示例文件中"
        fi
    done
else
    check_fail ".env.production.example 文件不存在"
fi
echo ""

# 7. 检查 Dockerfile
echo "7. 检查 Dockerfile..."
if [ -f "Dockerfile" ]; then
    check_pass "后端 Dockerfile 存在"
else
    check_fail "后端 Dockerfile 不存在"
fi

if [ -f "admin-ui/Dockerfile" ]; then
    check_pass "admin-ui Dockerfile 存在"
else
    check_fail "admin-ui Dockerfile 不存在"
fi

if [ -f "storefront-v2/Dockerfile" ]; then
    check_pass "storefront-v2 Dockerfile 存在"

    # 检查 public 目录是否被复制
    if grep -q "COPY --from=builder /app/public" storefront-v2/Dockerfile; then
        check_pass "storefront-v2 Dockerfile 包含 public 目录复制"
    else
        check_warn "storefront-v2 Dockerfile 可能缺少 public 目录复制"
    fi

    # 检查 messages 目录是否被复制（国际化必需）
    if grep -q "COPY --from=builder /app/messages" storefront-v2/Dockerfile; then
        check_pass "storefront-v2 Dockerfile 包含 messages 目录复制（国际化支持）"
    else
        check_fail "storefront-v2 Dockerfile 缺少 messages 目录复制（会导致翻译和主题切换失效）"
    fi
else
    check_fail "storefront-v2 Dockerfile 不存在"
fi
echo ""

# 8. 检查 seed 脚本路径
echo "8. 检查 seed 脚本配置..."
if grep -q ".medusa/server/src/scripts/seed.js" docker-compose.yml; then
    check_pass "seed 脚本路径已更新为编译后路径"
else
    check_warn "seed 脚本可能使用源码路径（可能导致运行失败）"
fi
echo ""

# 9. 检查端口冲突
echo "9. 检查端口占用..."
PORTS=(45432 46379 49000 49001 43002 43000)
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        check_warn "端口 $port 已被占用"
    else
        check_pass "端口 $port 可用"
    fi
done
echo ""

# 10. 总结
echo "=========================================="
echo -e "${GREEN}配置验证完成！${NC}"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 复制环境变量模板: cp .env.production.example .env.production"
echo "2. 编辑 .env.production 填入实际配置"
echo "3. 启动服务: docker compose --env-file .env.production up -d"
echo "4. 初始化数据: docker compose --env-file .env.production --profile init up init"
echo ""
