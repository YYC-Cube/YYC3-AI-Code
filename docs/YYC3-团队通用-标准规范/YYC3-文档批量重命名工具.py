#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
file: YYC3-文档批量重命名工具.py
description: YYC³文档批量重命名工具 - 自动添加YYC3-前缀、移除空格、规范化命名
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: active
tags: [工具],[批量处理],[文件重命名]
"""

import os
import re
import shutil
from pathlib import Path
from typing import List, Tuple, Dict
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class YYC3DocumentRenamer:
    """YYC³文档批量重命名工具"""
    
    def __init__(self, target_dir: str, dry_run: bool = True):
        """
        初始化重命名工具
        
        Args:
            target_dir: 目标目录路径
            dry_run: 是否为预演模式(True则不实际执行重命名)
        """
        self.target_dir = Path(target_dir)
        self.dry_run = dry_run
        self.rename_log: List[Dict] = []
        
    def scan_files(self) -> List[Path]:
        """扫描目标目录下所有Markdown文件"""
        md_files = list(self.target_dir.rglob("*.md"))
        logger.info(f"扫描到 {len(md_files)} 个Markdown文件")
        return md_files
    
    def needs_rename(self, file_path: Path) -> Tuple[bool, str, str]:
        """
        检查文件是否需要重命名
        
        Args:
            file_path: 文件路径
            
        Returns:
            (是否需要重命名, 当前文件名, 新文件名)
        """
        current_name = file_path.name
        
        # 检查是否包含"copy"
        if " copy" in current_name:
            new_name = current_name.replace(" copy", "")
            return True, current_name, new_name
        
        # 检查是否包含空格
        if " " in current_name:
            new_name = current_name.replace(" ", "-")
            return True, current_name, new_name
        
        # 检查是否缺少YYC3-前缀
        if not current_name.startswith("YYC3-") and not current_name == "README.md":
            new_name = f"YYC3-{current_name}"
            return True, current_name, new_name
        
        # 检查英文命名(特定文件)
        english_name_map = {
            "YYC3-P1-left-panel.md": "YYC3-P1-前端-左侧面板.md",
            "YYC3-P2-Advanced-Feature-Multi-Instance.md": "YYC3-P2-高级功能-多实例管理.md",
            "YYC3-P5-Closing-Review-Reminder.md": "YYC3-P5-交付审核-提醒.md",
            "YYC3-Standardization-Audit-Report.md": "YYC3-标准化审计报告.md",
        }
        
        if current_name in english_name_map:
            return True, current_name, english_name_map[current_name]
        
        return False, current_name, current_name
    
    def rename_file(self, file_path: Path, new_name: str) -> bool:
        """
        重命名文件
        
        Args:
            file_path: 文件路径
            new_name: 新文件名
            
        Returns:
            是否成功
        """
        try:
            new_path = file_path.parent / new_name
            
            # 检查新文件名是否已存在
            if new_path.exists():
                logger.warning(f"文件已存在,跳过: {new_path}")
                return False
            
            if self.dry_run:
                logger.info(f"[预演] 重命名: {file_path.name} -> {new_name}")
            else:
                file_path.rename(new_path)
                logger.info(f"✓ 重命名成功: {file_path.name} -> {new_name}")
            
            # 记录日志
            self.rename_log.append({
                "original_path": str(file_path),
                "new_path": str(new_path),
                "original_name": file_path.name,
                "new_name": new_name,
                "status": "success" if not self.dry_run else "dry_run"
            })
            
            return True
            
        except Exception as e:
            logger.error(f"✗ 重命名失败: {file_path.name} - {str(e)}")
            self.rename_log.append({
                "original_path": str(file_path),
                "original_name": file_path.name,
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
        files = self.scan_files()
        
        stats = {
            "total": len(files),
            "renamed": 0,
            "skipped": 0,
            "failed": 0
        }
        
        for file_path in files:
            needs_rename, current_name, new_name = self.needs_rename(file_path)
            
            if needs_rename:
                success = self.rename_file(file_path, new_name)
                if success:
                    stats["renamed"] += 1
                else:
                    stats["failed"] += 1
            else:
                stats["skipped"] += 1
        
        logger.info(f"处理完成: 总计 {stats['total']} 个文件")
        logger.info(f"  - 重命名: {stats['renamed']} 个")
        logger.info(f"  - 跳过: {stats['skipped']} 个")
        logger.info(f"  - 失败: {stats['failed']} 个")
        
        return stats
    
    def generate_report(self, output_path: str) -> None:
        """
        生成重命名报告
        
        Args:
            output_path: 报告输出路径
        """
        import json
        from datetime import datetime
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "target_directory": str(self.target_dir),
            "dry_run": self.dry_run,
            "total_operations": len(self.rename_log),
            "operations": self.rename_log
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        logger.info(f"重命名报告已生成: {output_path}")

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='YYC³文档批量重命名工具')
    parser.add_argument('--dir', '-d', 
                        default='/Volumes/Development/yyc3-77/YYC3-核心开发文档/YYC3-文档合规-标准整改',
                        help='目标目录路径')
    parser.add_argument('--execute', '-e', 
                        action='store_true',
                        help='实际执行重命名(默认为预演模式)')
    parser.add_argument('--report', '-r',
                        default='rename_report.json',
                        help='报告输出路径')
    
    args = parser.parse_args()
    
    # 创建重命名工具实例
    renamer = YYC3DocumentRenamer(
        target_dir=args.dir,
        dry_run=not args.execute
    )
    
    # 处理所有文件
    stats = renamer.process_all_files()
    
    # 生成报告
    renamer.generate_report(args.report)
    
    # 提示用户
    if not args.execute:
        logger.info("=" * 60)
        logger.info("当前为预演模式,未实际执行重命名操作")
        logger.info("如需实际执行,请添加 --execute 或 -e 参数")
        logger.info("=" * 60)

if __name__ == "__main__":
    main()
