#!/bin/bash
# 批量修复组件导入问题

# 需要检查的组件列表
components=(
  "TaskBoard"
  "IDELeftPanel"
  "CyberEditor"
  "ModelSettings"
  "AIServiceTabs"
  "ChatInterface"
  "ToolbarMenu"
  "ProjectPanel"
  "KeyboardShortcuts"
  "SettingsNavigation"
  "SettingsHeader"
)

echo "检查组件导出方式..."

for component in "${components[@]}"; do
  file_path="src/app/components/${component}.tsx"
  test_path="tests/unit/components/${component}.test.tsx"
  
  if [ -f "$file_path" ]; then
    # 检查是否是命名导出
    if grep -q "export function $component" "$file_path"; then
      export_type="named"
    elif grep -q "export default" "$file_path"; then
      export_type="default"
    else
      export_type="unknown"
    fi
    
    echo "组件 $component: $export_type"
    
    # 如果测试文件存在，检查导入方式
    if [ -f "$test_path" ]; then
      if [ "$export_type" = "named" ]; then
        # 检查是否使用了默认导入
        if grep -q "^import $component from '@/app/components/$component'" "$test_path"; then
          echo "  ⚠️  需要修复导入：默认导入 → 命名导入"
          # 自动修复
          sed -i '' "s|^import $component from '@/app/components/$component'|import { $component } from '@/app/components/$component'|g" "$test_path"
          echo "  ✅ 已自动修复"
        fi
      fi
    fi
  fi
done

echo "完成！"
