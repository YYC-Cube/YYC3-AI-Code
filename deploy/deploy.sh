#!/bin/bash

set -e

# ════════════════════════════════════════════════════════
# YYC³ AI - Server-Side Deployment Script
# Usage: ./deploy.sh [backup_name]
# ════════════════════════════════════════════════════════

# Configuration
DEPLOY_PATH="/var/www/code.yyc3.top"
BACKUP_PATH="/var/backups/code.yyc3.top"
DOMAIN="code.yyc3.top"
KEEP_BACKUPS=5
NGINX_SITE_CONF="/etc/nginx/sites-available/code.yyc3.top"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/code.yyc3.top"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root (sudo)"
    exit 1
fi

# ── Function: Create Backup ──
create_backup() {
    local backup_name="backup-$(date +%Y%m%d_%H%M%S)"
    local backup_dir="${BACKUP_PATH}/${backup_name}"
    
    log_info "Creating backup: ${backup_name}"
    
    mkdir -p "${BACKUP_PATH}"
    
    if [ -d "${DEPLOY_PATH}" ] && [ "$(ls -A ${DEPLOY_PATH} 2>/dev/null)" ]; then
        cp -r "${DEPLOY_PATH}" "${backup_dir}"
        log_success "Backup created: ${backup_dir}"
        
        # Clean old backups
        local backup_count=$(ls -dt ${BACKUP_PATH}/backup-* 2>/dev/null | wc -l)
        if [ "${backup_count}" -gt "${KEEP_BACKUPS}" ]; then
            log_info "Cleaning old backups (keeping ${KEEP_BACKUPS} latest)..."
            ls -dt ${BACKUP_PATH}/backup-* | tail -n +$((KEEP_BACKUPS + 1)) | xargs rm -rf
            log_success "Old backups cleaned"
        fi
        
        echo "${backup_name}"
    else
        log_warning "No existing deployment to backup"
        echo ""
    fi
}

# ── Function: Restore from Backup ──
restore_backup() {
    local backup_name=$1
    
    if [ -z "${backup_name}" ]; then
        # Find latest backup
        backup_name=$(ls -dt ${BACKUP_PATH}/backup-* 2>/dev/null | head -1 | xargs basename)
    fi
    
    local backup_dir="${BACKUP_PATH}/${backup_name}"
    
    if [ ! -d "${backup_dir}" ]; then
        log_error "Backup not found: ${backup_name}"
        exit 1
    fi
    
    log_warning "Restoring from backup: ${backup_name}"
    
    # Remove current deployment
    rm -rf ${DEPLOY_PATH}/*
    
    # Restore from backup
    cp -r ${backup_dir}/* ${DEPLOY_PATH}/
    
    # Set permissions
    chown -R www-data:www-data ${DEPLOY_PATH}
    chmod -R 755 ${DEPLOY_PATH}
    
    # Reload Nginx
    systemctl reload nginx
    
    log_success "Rollback completed successfully!"
}

# ── Function: Deploy New Version ──
deploy_new_version() {
    local package_path=$1
    
    if [ ! -f "${package_path}" ]; then
        log_error "Deployment package not found: ${package_path}"
        exit 1
    fi
    
    log_info "Deploying new version..."
    
    # Extract to temporary directory first
    local temp_dir=$(mktemp -d)
    tar -xzf "${package_path}" -C "${temp_dir}"
    
    # Verify extraction
    if [ ! -f "${temp_dir}/index.html" ]; then
        log_error "Invalid deployment package (missing index.html)"
        rm -rf "${temp_dir}"
        exit 1
    fi
    
    # Replace current deployment
    rm -rf ${DEPLOY_PATH}/*
    cp -r ${temp_dir}/* ${DEPLOY_PATH}/
    
    # Cleanup temp directory
    rm -rf "${temp_dir}"
    
    # Set permissions
    chown -R www-data:www-data ${DEPLOY_PATH}
    chmod -R 755 ${DEPLOY_PATH}
    
    log_success "New version deployed successfully!"
}

# ── Function: Setup Nginx ──
setup_nginx() {
    log_info "Setting up Nginx configuration..."
    
    # Check if config file exists in deploy directory
    if [ -f "${DEPLOY_PATH}/nginx-code.yyc3.top.conf" ]; then
        cp "${DEPLOY_PATH}/nginx-code.yyc3.top.conf" "${NGINX_SITE_CONF}"
        log_success "Nginx configuration copied"
    fi
    
    # Create symlink if not exists
    if [ ! -L "${NGINX_SITE_ENABLED}" ]; then
        ln -s "${NGINX_SITE_CONF}" "${NGINX_SITE_ENABLED}"
        log_success "Nginx site enabled"
    fi
    
    # Test configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    log_success "Nginx reloaded successfully!"
}

# ── Function: Health Check ──
health_check() {
    log_info "Running health check..."
    
    local max_retries=10
    local retry_count=0
    
    while [ ${retry_count} -lt ${max_retries} ]; do
        local http_status=$(curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN} || echo "000")
        
        if [ "${http_status}" = "200" ] || [ "${http_status}" = "301" ] || [ "${http_status}" = "302" ]; then
            log_success "Health check passed! Status: ${http_status}"
            return 0
        fi
        
        log_info "Attempt $((retry_count + 1))/${max_retries} - Status: ${http_status}"
        retry_count=$((retry_count + 1))
        sleep 3
    done
    
    log_error "Health check failed after ${max_retries} attempts"
    return 1
}

# ── Function: Show Deployment Info ──
show_info() {
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "🎯 Deployment Information"
    echo "═══════════════════════════════════════════════════"
    echo "Domain: https://${DOMAIN}"
    echo "Path: ${DEPLOY_PATH}"
    echo "Backup Path: ${BACKUP_PATH}"
    
    if [ -f "${DEPLOY_PATH}/build-info.json" ]; then
        echo ""
        echo "Build Info:"
        cat "${DEPLOY_PATH}/build-info.json" | grep -E '"(version|timestamp|actor)"' | sed 's/.*"\([^"]*\)": "\(.*\)".*/  \1: \2/'
    fi
    
    echo ""
    echo "Recent Backups:"
    ls -dt ${BACKUP_PATH}/backup-* 2>/dev/null | head -5 | while read backup; do
        echo "  • $(basename ${backup})"
    done
    
    echo "═══════════════════════════════════════════════════"
    echo ""
}

# ── Main Script Logic ──
case "${1:-deploy}" in
    backup)
        create_backup
        ;;
    restore)
        restore_backup "${2:-}"
        setup_nginx
        health_check
        show_info
        ;;
    deploy)
        PACKAGE_PATH="${2:-/tmp/deploy-package.tar.gz}"
        
        # Create backup before deploying
        BACKUP_NAME=$(create_backup)
        
        # Deploy new version
        deploy_new_version "${PACKAGE_PATH}"
        
        # Setup Nginx
        setup_nginx
        
        # Health check
        if ! health_check; then
            log_error "Deployment failed! Rolling back..."
            if [ -n "${BACKUP_NAME}" ]; then
                restore_backup "${BACKUP_NAME}"
                setup_nginx
                log_warning "Rolled back to previous version"
            fi
            exit 1
        fi
        
        show_info
        log_success "✅ Deployment completed successfully!"
        ;;
    info)
        show_info
        ;;
    *)
        echo "Usage: $0 {backup|restore [backup_name]|deploy [package_path]|info}"
        echo ""
        echo "Commands:"
        echo "  backup                  Create a backup of current deployment"
        echo "  restore [backup_name]   Restore from a specific or latest backup"
        echo "  deploy [package_path]   Deploy new version (default: /tmp/deploy-package.tar.gz)"
        echo "  info                    Show deployment information"
        exit 1
        ;;
esac
