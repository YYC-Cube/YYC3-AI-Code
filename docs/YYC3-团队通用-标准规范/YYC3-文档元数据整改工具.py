#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
file: YYC3-文档元数据整改工具.py
description: YYC³文档元数据整改工具 - 规范化YAML Front Matter、添加品牌标识和核心理念
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: active
tags: [工具],[批量处理],[元数据整改]
"""

import os
import re
import yaml
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class YYC3MetadataFixer:
    """YYC³文档元数据整改工具"""
    
    BRAND_HEADER = """> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***"""

    BRAND_FOOTER = """<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>"""

    CORE_PHILOSOPHY = """## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维"""
    
    def __init__(self, target_dir: str, dry_run: bool = True):
        """
        初始化元数据整改工具
        
        Args:
            target_dir: 目标目录路径
            dry_run: 是否为预演模式
        """
        self.target_dir = Path(target_dir)
        self.dry_run = dry_run
        self.fix_log: List[Dict] = []
        
    def extract_front_matter(self, content: str) -> Tuple[Optional[Dict], str]:
        """
        提取YAML Front Matter
        
        Args:
            content: 文档内容
            
        Returns:
            (元数据字典, 文档正文)
        """
        pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
        match = re.match(pattern, content, re.DOTALL)
        
        if match:
            try:
                metadata_yaml = match.group(1)
                body = match.group(2)
                
                # 处理@前缀的字段
                lines = metadata_yaml.split('\n')
                cleaned_lines = []
                for line in lines:
                    # 移除字段名前的@符号
                    if line.strip().startswith('@'):
                        line = line.replace('@', '', 1)
                    cleaned_lines.append(line)
                
                cleaned_yaml = '\n'.join(cleaned_lines)
                metadata = yaml.safe_load(cleaned_yaml) or {}
                
                return metadata, body
            except Exception as e:
                logger.warning(f"解析YAML失败: {e}")
                return None, content
        
        return None, content
    
    def normalize_metadata(self, metadata: Dict, file_path: Path) -> Dict:
        """
        规范化元数据
        
        Args:
            metadata: 原始元数据
            file_path: 文件路径
            
        Returns:
            规范化后的元数据
        """
        normalized = {}
        
        # file字段
        normalized['file'] = metadata.get('file') or file_path.name
        
        # description字段
        normalized['description'] = metadata.get('description', '文档描述待补充')
        
        # author字段 - 规范化格式
        author = metadata.get('author', 'YanYuCloudCube Team')
        if '<' not in author:
            author = f"{author} <admin@0379.email>"
        normalized['author'] = author
        
        # version字段 - 添加v前缀
        version = str(metadata.get('version', '1.0.0'))
        if not version.startswith('v'):
            version = f"v{version}"
        normalized['version'] = version
        
        # created字段
        normalized['created'] = metadata.get('created', datetime.now().strftime('%Y-%m-%d'))
        
        # updated字段
        normalized['updated'] = datetime.now().strftime('%Y-%m-%d')
        
        # status字段
        normalized['status'] = metadata.get('status', 'stable')
        
        # tags字段 - 规范化格式
        tags = metadata.get('tags', [])
        if isinstance(tags, str):
            # 如果是字符串,尝试解析
            if ',' in tags:
                tags = [tag.strip() for tag in tags.split(',')]
            else:
                tags = [tags]
        
        # 确保tags格式正确
        formatted_tags = []
        for tag in tags:
            tag = str(tag).strip()
            if tag and not tag.startswith('['):
                tag = f"[{tag}]"
            formatted_tags.append(tag)
        
        normalized['tags'] = ','.join(formatted_tags) if formatted_tags else '[文档]'
        
        # category字段
        normalized['category'] = metadata.get('category', self._infer_category(file_path))
        
        # language字段
        normalized['language'] = metadata.get('language', 'zh-CN')
        
        return normalized
    
    def _infer_category(self, file_path: Path) -> str:
        """根据文件路径推断分类"""
        path_str = str(file_path)
        
        if '架构' in path_str or 'architecture' in path_str.lower():
            return 'architecture'
        elif '设计' in path_str or 'design' in path_str.lower():
            return 'design'
        elif '开发' in path_str or 'development' in path_str.lower():
            return 'development'
        elif '测试' in path_str or 'test' in path_str.lower():
            return 'testing'
        elif '部署' in path_str or 'deployment' in path_str.lower():
            return 'deployment'
        elif '规范' in path_str or 'standard' in path_str.lower():
            return 'policy'
        elif '审核' in path_str or 'audit' in path_str.lower():
            return 'audit'
        else:
            return 'technical'
    
    def generate_checksum(self, content: str) -> str:
        """生成内容校验和"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()[:16]
    
    def generate_trace_id(self) -> str:
        """生成追溯ID"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        return f"TRC-{timestamp}"
    
    def add_brand_header(self, body: str) -> str:
        """添加品牌头"""
        # 检查是否已包含品牌头
        if 'YanYuCloudCube' in body[:500]:
            return body
        
        # 在第一个标题前插入品牌头
        lines = body.split('\n')
        insert_pos = 0
        
        for i, line in enumerate(lines):
            if line.startswith('#'):
                insert_pos = i
                break
        
        lines.insert(insert_pos, '\n' + self.BRAND_HEADER + '\n')
        return '\n'.join(lines)
    
    def add_core_philosophy(self, body: str) -> str:
        """添加核心理念"""
        # 检查是否已包含核心理念
        if '五高架构' in body or '五标体系' in body:
            return body
        
        # 在品牌头后插入核心理念
        if 'YanYuCloudCube' in body:
            # 找到品牌头后的位置
            lines = body.split('\n')
            insert_pos = 0
            
            for i, line in enumerate(lines):
                if 'All things converge in cloud pivot' in line:
                    insert_pos = i + 1
                    break
            
            lines.insert(insert_pos, '\n---\n\n' + self.CORE_PHILOSOPHY + '\n')
            return '\n'.join(lines)
        else:
            return body
    
    def add_brand_footer(self, body: str) -> str:
        """添加品牌尾"""
        # 检查是否已包含品牌尾
        if '© 2025-2026 YYC³ Team' in body:
            return body
        
        return body.rstrip() + '\n\n---\n\n' + self.BRAND_FOOTER + '\n'
    
    def add_traceability_info(self, body: str, metadata: Dict) -> str:
        """添加文档追溯信息"""
        # 检查是否已包含追溯信息
        if '文档追溯信息' in body:
            return body
        
        checksum = self.generate_checksum(body)
        trace_id = self.generate_trace_id()
        
        traceability_table = f"""## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | {metadata.get('version', 'v1.0.0')} |
| 创建日期 | {metadata.get('created', datetime.now().strftime('%Y-%m-%d'))} |
| 更新日期 | {metadata.get('updated', datetime.now().strftime('%Y-%m-%d'))} |
| 内容校验 | {checksum} |
| 追溯ID | {trace_id} |
| 关联文档 | 无 |
"""
        
        # 在品牌尾前插入追溯信息
        if '© 2025-2026 YYC³ Team' in body:
            parts = body.rsplit('---\n\n<div align="center">', 1)
            if len(parts) == 2:
                return parts[0] + '---\n\n' + traceability_table + '\n---\n\n<div align="center">' + parts[1]
        
        return body + '\n\n---\n\n' + traceability_table
    
    def fix_document(self, file_path: Path) -> bool:
        """
        整改单个文档
        
        Args:
            file_path: 文件路径
            
        Returns:
            是否成功
        """
        try:
            # 读取文件内容
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 提取元数据和正文
            metadata, body = self.extract_front_matter(content)
            
            # 规范化元数据
            if metadata is None:
                metadata = {}
            
            normalized_metadata = self.normalize_metadata(metadata, file_path)
            
            # 添加品牌头
            body = self.add_brand_header(body)
            
            # 添加核心理念
            body = self.add_core_philosophy(body)
            
            # 添加文档追溯信息
            body = self.add_traceability_info(body, normalized_metadata)
            
            # 添加品牌尾
            body = self.add_brand_footer(body)
            
            # 生成新的YAML Front Matter
            front_matter = '---\n'
            for key, value in normalized_metadata.items():
                front_matter += f"{key}: {value}\n"
            front_matter += '---\n\n'
            
            # 组合新内容
            # 如果body已经以---开头,说明有旧的元数据,需要移除
            if body.startswith('---'):
                # 移除旧的元数据块
                pattern = r'^---\s*\n.*?\n---\s*\n'
                body = re.sub(pattern, '', body, count=1, flags=re.DOTALL)
            
            new_content = front_matter + body
            
            # 写入文件
            if self.dry_run:
                logger.info(f"[预演] 整改文档: {file_path.name}")
            else:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                logger.info(f"✓ 整改成功: {file_path.name}")
            
            # 记录日志
            self.fix_log.append({
                "file": str(file_path),
                "original_metadata": metadata,
                "normalized_metadata": normalized_metadata,
                "status": "success" if not self.dry_run else "dry_run"
            })
            
            return True
            
        except Exception as e:
            logger.error(f"✗ 整改失败: {file_path.name} - {str(e)}")
            self.fix_log.append({
                "file": str(file_path),
                "error": str(e),
                "status": "failed"
            })
            return False
    
    def process_all_files(self) -> Dict:
        """
        处理所有文件
        
        Returns:
            处理结果统计
        """
        md_files = list(self.target_dir.rglob("*.md"))
        
        stats = {
            "total": len(md_files),
            "fixed": 0,
            "failed": 0
        }
        
        for file_path in md_files:
            # 跳过README和特殊文件
            if file_path.name in ['README.md', 'YYC3-文档合规审计报告-2026-04-08.md']:
                continue
            
            success = self.fix_document(file_path)
            if success:
                stats["fixed"] += 1
            else:
                stats["failed"] += 1
        
        logger.info(f"处理完成: 总计 {stats['total']} 个文件")
        logger.info(f"  - 整改: {stats['fixed']} 个")
        logger.info(f"  - 失败: {stats['failed']} 个")
        
        return stats
    
    def generate_report(self, output_path: str) -> None:
        """生成整改报告"""
        import json
        
        # 确保所有数据都是JSON可序列化的
        serializable_log = []
        for item in self.fix_log:
            serializable_item = {}
            for key, value in item.items():
                if isinstance(value, dict):
                    serializable_item[key] = {k: str(v) if not isinstance(v, (str, int, float, bool, list, dict, type(None))) else v for k, v in value.items()}
                else:
                    serializable_item[key] = str(value) if not isinstance(value, (str, int, float, bool, list, dict, type(None))) else value
            serializable_log.append(serializable_item)
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "target_directory": str(self.target_dir),
            "dry_run": self.dry_run,
            "total_operations": len(serializable_log),
            "operations": serializable_log
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        logger.info(f"整改报告已生成: {output_path}")

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='YYC³文档元数据整改工具')
    parser.add_argument('--dir', '-d',
                        default='/Volumes/Development/yyc3-77/YYC3-核心开发文档/YYC3-文档合规-标准整改',
                        help='目标目录路径')
    parser.add_argument('--execute', '-e',
                        action='store_true',
                        help='实际执行整改(默认为预演模式)')
    parser.add_argument('--report', '-r',
                        default='metadata_fix_report.json',
                        help='报告输出路径')
    
    args = parser.parse_args()
    
    # 创建整改工具实例
    fixer = YYC3MetadataFixer(
        target_dir=args.dir,
        dry_run=not args.execute
    )
    
    # 处理所有文件
    stats = fixer.process_all_files()
    
    # 生成报告
    fixer.generate_report(args.report)
    
    # 提示用户
    if not args.execute:
        logger.info("=" * 60)
        logger.info("当前为预演模式,未实际执行整改操作")
        logger.info("如需实际执行,请添加 --execute 或 -e 参数")
        logger.info("=" * 60)

if __name__ == "__main__":
    main()
