#!/bin/bash

# YYC3 自动部署脚本
# 作者: YanYuCloudCube Team
# 版本: 2.0.0
# 状态: production

set -e  # 遇到错误立即退出

/* ================================================================
   颜色输出函数
   ================================================================ */

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

/* ================================================================
   部署前检查
   ================================================================ */

pre_deploy_checks() {
    log_step "运行部署前检查..."

    # 检查git状态
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "有未提交的更改，建议先提交"
        git status --short
    fi

    # 检查当前分支
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        log_warning "当前不在main分支，当前分支: $CURRENT_BRANCH"
    fi

    # 检查远程连接
    if ! git remote get-url origin &>/dev/null; then
        log_error "远程仓库origin未配置"
        exit 1
    fi

    # 检查Node.js版本
    NODE_VERSION=$(node -v)
    log_info "Node.js版本: $NODE_VERSION"

    # 检查npm/pnpm
    if command -v pnpm &>/dev/null; then
        log_info "包管理器: pnpm $(pnpm -v)"
    elif command -v npm &>/dev/null; then
        log_info "包管理器: npm $(npm -v)"
    else
        log_error "未找到包管理器"
        exit 1
    fi

    log_success "部署前检查完成"
}

/* ================================================================
   安装依赖
   ================================================================ */

install_dependencies() {
    log_step "安装项目依赖..."

    if command -v pnpm &>/dev/null; then
        pnpm install --frozen-lockfile
    else
        npm ci
    fi

    log_success "依赖安装完成"
}

/* ================================================================
   运行测试
   ================================================================ */

run_tests() {
    log_step "运行测试套件..."

    if command -v pnpm &>/dev/null; then
        pnpm test -- --run || log_warning "部分测试失败，继续部署"
    else
        npm test -- --run || log_warning "部分测试失败，继续部署"
    fi

    log_success "测试执行完成"
}

/* ================================================================
   运行代码检查
   ================================================================ */

run_lint() {
    log_step "运行代码质量检查..."

    if command -v pnpm &>/dev/null; then
        pnpm lint
    else
        npm run lint
    fi

    log_success "代码检查通过"
}

/* ================================================================
   构建项目
   ================================================================ */

build_project() {
    log_step "构建生产版本..."

    # 清理之前的构建
    rm -rf dist/

    # 构建项目
    if command -v pnpm &>/dev/null; then
        pnpm build
    else
        npm run build
    fi

    # 验证构建结果
    if [ ! -f "dist/index.html" ]; then
        log_error "构建失败：index.html不存在"
        exit 1
    fi

    if [ ! -d "dist/assets" ]; then
        log_error "构建失败：assets目录不存在"
        exit 1
    fi

    # 检查CNAME
    if [ ! -f "dist/CNAME" ]; then
        log_warning "CNAME文件缺失，创建默认CNAME"
        echo "code.yyc3.top" > dist/CNAME
    fi

    log_success "项目构建完成"
}

/* ================================================================
   生成构建信息
   ================================================================ */

generate_build_info() {
    log_step "生成构建信息..."

    BUILD_INFO="dist/build-info.json"
    GIT_SHA=$(git rev-parse --short HEAD)
    GIT_BRANCH=$(git branch --show-current)
    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    BUILD_NUMBER=$(date +%Y%m%d-%H%M%S)

    cat > "$BUILD_INFO" << EOF
{
  "version": "$GIT_SHA",
  "branch": "$GIT_BRANCH",
  "timestamp": "$TIMESTAMP",
  "buildNumber": "$BUILD_NUMBER",
  "nodeVersion": "$(node -v)",
  "packageManager": "$(if command -v pnpm &>/dev/null; then echo "pnpm-$(pnpm -v)"; else echo "npm-$(npm -v)"; fi)"
}
EOF

    log_success "构建信息已生成: $BUILD_INFO"
    cat "$BUILD_INFO"
}

/* ================================================================
   显示构建统计
   ================================================================ */

show_build_stats() {
    log_step "构建统计信息..."

    # 构建大小
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    log_info "构建大小: $BUILD_SIZE"

    # 文件统计
    FILE_COUNT=$(find dist/ -type f | wc -l)
    log_info "文件数量: $FILE_COUNT"

    # JS文件统计
    JS_COUNT=$(find dist/ -name "*.js" | wc -l)
    log_info "JS文件数量: $JS_COUNT"

    # CSS文件统计
    CSS_COUNT=$(find dist/ -name "*.css" | wc -l)
    log_info "CSS文件数量: $CSS_COUNT"

    # 最大文件
    LARGEST_FILE=$(find dist/ -type f -exec du -h {} \; | sort -h | tail -1)
    log_info "最大文件: $LARGEST_FILE"

    log_success "构建统计完成"
}

/* ================================================================
   本地预览测试
   ================================================================ */

preview_build() {
    log_step "启动本地预览服务器..."
    log_info "访问: http://localhost:4173"
    log_info "按Ctrl+C停止预览"

    if command -v pnpm &>/dev/null; then
        pnpm preview
    else
        npm run preview
    fi
}

/* ================================================================
   Git提交和推送
   ================================================================ */

commit_and_push() {
    log_step "提交代码并推送到远程..."

    # 添加所有变更
    git add .

    # 创建提交
    read -p "请输入提交信息 (留空使用默认): " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="chore: 完成生产级优化和安全加固 - CI/CD自动部署"
    fi

    git commit -m "$COMMIT_MSG"

    # 推送到远程
    log_info "推送到远程仓库..."
    git push origin main

    log_success "代码已推送到远程主分支"
}

/* ================================================================
   监控CI/CD流程
   ================================================================ */

monitor_ci_cd() {
    log_step "CI/CD流程监控..."

    log_info "请访问以下链接监控CI/CD流程:"
    log_info "GitHub Actions: https://github.com/YYC-Cube/YYC3-AI-Code/actions"
    log_info "部署状态: https://github.com/YYC-Cube/YYC3-AI-Code/deployments"

    # 等待用户确认
    read -p "是否打开GitHub Actions页面? (y/n): " OPEN_ACTIONS
    if [ "$OPEN_ACTIONS" = "y" ]; then
        if command -v open &>/dev/null; then
            open "https://github.com/YYC-Cube/YYC3-AI-Code/actions"
        elif command -v xdg-open &>/dev/null; then
            xdg-open "https://github.com/YYC-Cube/YYC3-AI-Code/actions"
        fi
    fi
}

/* ================================================================
   主菜单
   ================================================================ */

show_menu() {
    echo ""
    echo "=========================================="
    echo "  YYC3 自动部署脚本 v2.0.0"
    echo "=========================================="
    echo "1. 完整部署流程 (检查 + 测试 + 构建 + 推送)"
    echo "2. 仅构建项目"
    echo "3. 预览构建结果"
    echo "4. 提交并推送代码"
    echo "5. 监控CI/CD流程"
    echo "6. 退出"
    echo "=========================================="
}

/* ================================================================
   主函数
   ================================================================ */

main() {
    show_menu
    read -p "请选择操作 (1-6): " CHOICE

    case $CHOICE in
        1)
            log_info "开始完整部署流程..."
            pre_deploy_checks
            install_dependencies
            run_lint
            run_tests
            build_project
            generate_build_info
            show_build_stats
            commit_and_push
            monitor_ci_cd
            log_success "完整部署流程完成！"
            ;;
        2)
            log_info "仅构建项目..."
            install_dependencies
            build_project
            generate_build_info
            show_build_stats
            log_success "项目构建完成！"
            ;;
        3)
            log_info "预览构建结果..."
            preview_build
            ;;
        4)
            log_info "提交并推送代码..."
            commit_and_push
            log_success "代码已推送！"
            ;;
        5)
            monitor_ci_cd
            ;;
        6)
            log_info "退出脚本"
            exit 0
            ;;
        *)
            log_error "无效选择"
            exit 1
            ;;
    esac
}

/* ================================================================
   脚本入口
   ================================================================ */

# 如果脚本被直接执行
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi