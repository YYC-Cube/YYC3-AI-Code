/**
 * @file OptimizedDataTable.tsx
 * @description YYC3 优化数据表格组件 — 虚拟滚动 + 性能优化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-05-22
 * @status production
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags performance,virtual-scroll,table,optimization
 */

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { VirtualScrollList } from './VirtualScrollList';

/* ================================================================
   类型定义
   ================================================================ */

export interface TableColumn<T = any> {
  key: string;
  title: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: (a: T, b: T) => number;
  filters?: Array<{ text: string; value: any }>;
  onFilter?: (value: any, record: T) => boolean;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: string | ((record: T) => string);
  height?: number;
  rowHeight?: number;
  enableVirtualScroll?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableSelection?: boolean;
  onRowClick?: (record: T, index: number) => void;
  onRowDoubleClick?: (record: T, index: number) => void;
  onSelectionChange?: (selectedRows: T[], selectedRowKeys: string[]) => void;
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  className?: string;
  style?: React.CSSProperties;
}

export interface TableRowSelection {
  selectedRowKeys: string[];
  onChange: (selectedRowKeys: string[], selectedRows: any[]) => void;
}

/* ================================================================
   优化数据表格组件
   ================================================================ */

export function OptimizedDataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  height = 400,
  rowHeight = 50,
  enableVirtualScroll = true,
  enableSorting = true,
  enableFiltering = true,
  enableSelection = false,
  onRowClick,
  onRowDoubleClick,
  onSelectionChange,
  loading = false,
  pagination,
  className = '',
  style = {},
}: TableProps<T>) {
  /* ================================================================
     状态管理
     ================================================================ */

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const [filterConfig, setFilterConfig] = useState<Record<string, any[]>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  /* ================================================================
     计算属性
     ================================================================ */

  // 获取行key的函数
  const getRowKey = useCallback((record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || `row-${index}`;
  }, [rowKey]);

  // 排序数据
  const sortedData = useMemo(() => {
    if (!sortConfig || !enableSorting) return data;

    const column = columns.find(col => col.key === sortConfig.key);
    if (!column?.sorter) return data;

    return [...data].sort((a, b) => {
      const result = column.sorter!(a, b);
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [data, sortConfig, columns, enableSorting]);

  // 过滤数据
  const filteredData = useMemo(() => {
    if (!enableFiltering || Object.keys(filterConfig).length === 0) return sortedData;

    return sortedData.filter(record => {
      return Object.entries(filterConfig).every(([key, values]) => {
        if (values.length === 0) return true;

        const column = columns.find(col => col.key === key);
        if (!column?.onFilter) return true;

        return values.some(value => column.onFilter!(value, record));
      });
    });
  }, [sortedData, filterConfig, columns, enableFiltering]);

  // 分页数据
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;

    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, pagination]);

  /* ================================================================
     事件处理
     ================================================================ */

  // 处理排序
  const handleSort = useCallback((columnKey: string) => {
    if (!enableSorting) return;

    setSortConfig(prev => {
      if (prev?.key === columnKey) {
        return prev.direction === 'asc'
          ? { key: columnKey, direction: 'desc' }
          : null;
      }
      return { key: columnKey, direction: 'asc' };
    });
  }, [enableSorting]);

  // 处理过滤
  const handleFilter = useCallback((columnKey: string, values: any[]) => {
    if (!enableFiltering) return;

    setFilterConfig(prev => ({
      ...prev,
      [columnKey]: values,
    }));
  }, [enableFiltering]);

  // 处理行选择
  const handleRowSelection = useCallback((record: T, selected: boolean) => {
    if (!enableSelection) return;

    const key = getRowKey(record, data.indexOf(record));
    setSelectedRowKeys(prev => {
      const newKeys = selected
        ? [...prev, key]
        : prev.filter(k => k !== key);

      // 触发选择变化回调
      if (onSelectionChange) {
        const selectedRows = data.filter(row =>
          newKeys.includes(getRowKey(row, data.indexOf(row)))
        );
        onSelectionChange(selectedRows, newKeys);
      }

      return newKeys;
    });
  }, [enableSelection, getRowKey, data, onSelectionChange]);

  // 处理全选
  const handleSelectAll = useCallback((selected: boolean) => {
    if (!enableSelection) return;

    const newKeys = selected ? paginatedData.map((record, index) => getRowKey(record, index)) : [];

    setSelectedRowKeys(newKeys);

    if (onSelectionChange) {
      const selectedRows = selected ? paginatedData : [];
      onSelectionChange(selectedRows, newKeys);
    }
  }, [enableSelection, paginatedData, getRowKey, onSelectionChange]);

  /* ================================================================
     渲染函数
     ================================================================ */

  // 渲染表头
  const renderTableHeader = useCallback(() => {
    return (
      <div className="table-header" style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {enableSelection && (
          <div className="table-cell selection-cell" style={{ width: 50, padding: '12px' }}>
            <input
              type="checkbox"
              checked={paginatedData.length > 0 && selectedRowKeys.length === paginatedData.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        )}

        {columns.map(column => (
          <div
            key={column.key}
            className="table-cell header-cell"
            style={{
              flex: column.width ? undefined : 1,
              width: column.width,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
              padding: '12px',
              textAlign: column.align || 'left',
              fontWeight: 600,
              fontSize: '13px',
              color: '#374151',
              cursor: column.sortable ? 'pointer' : 'default',
              userSelect: 'none',
            }}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: column.align === 'center' ? 'center' : 'flex-start' }}>
              <span>{column.title}</span>
              {column.sortable && sortConfig?.key === column.key && (
                <span style={{ marginLeft: 4, fontSize: 10 }}>
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }, [columns, enableSelection, paginatedData.length, selectedRowKeys, handleSelectAll, sortConfig, handleSort]);

  // 渲染表格行
  const renderTableRow = useCallback((record: T, index: number) => {
    const key = getRowKey(record, index);
    const isSelected = selectedRowKeys.includes(key);

    const rowStyle: React.CSSProperties = {
      display: 'flex',
      borderBottom: '1px solid #f3f4f6',
      backgroundColor: isSelected ? '#eff6ff' : index % 2 === 0 ? '#ffffff' : '#f9fafb',
      cursor: onRowClick ? 'pointer' : 'default',
      transition: 'background-color 0.2s',
    };

    const handleRowClick = (e: React.MouseEvent) => {
      // 防止选择框点击触发行点击
      if ((e.target as HTMLInputElement).type === 'checkbox') return;

      if (onRowClick) {
        onRowClick(record, index);
      }
    };

    const handleRowDoubleClick = () => {
      if (onRowDoubleClick) {
        onRowDoubleClick(record, index);
      }
    };

    return (
      <div
        key={key}
        className="table-row"
        style={rowStyle}
        onClick={handleRowClick}
        onDoubleClick={handleRowDoubleClick}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
          }
        }}
      >
        {enableSelection && (
          <div className="table-cell selection-cell" style={{ width: 50, padding: '12px' }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleRowSelection(record, e.target.checked)}
              style={{ cursor: 'pointer' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {columns.map(column => {
          const value = record[column.key];
          const content = column.render ? column.render(value, record, index) : value;

          return (
            <div
              key={column.key}
              className="table-cell data-cell"
              style={{
                flex: column.width ? undefined : 1,
                width: column.width,
                minWidth: column.minWidth,
                maxWidth: column.maxWidth,
                padding: '12px',
                textAlign: column.align || 'left',
                fontSize: '13px',
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {content}
            </div>
          );
        })}
      </div>
    );
  }, [columns, enableSelection, selectedRowKeys, getRowKey, handleRowSelection, onRowClick, onRowDoubleClick]);

  /* ================================================================
     主渲染
     ================================================================ */

  const tableContent = (
    <div className={`optimized-data-table ${className}`} style={style}>
      {/* 表头 */}
      {renderTableHeader()}

      {/* 表格内容 */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          加载中...
        </div>
      ) : paginatedData.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          暂无数据
        </div>
      ) : enableVirtualScroll ? (
        <VirtualScrollList
          items={paginatedData}
          itemHeight={rowHeight}
          containerHeight={height}
          overscan={5}
          renderItem={renderTableRow}
          keyExtractor={(record, index) => getRowKey(record, index)}
        />
      ) : (
        <div className="table-body" style={{ maxHeight: height, overflow: 'auto' }}>
          {paginatedData.map((record, index) => renderTableRow(record, index))}
        </div>
      )}

      {/* 分页 */}
      {pagination && (
        <div className="table-pagination" style={{ padding: '12px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            共 {filteredData.length} 条记录
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
              disabled={pagination.current === 1}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: pagination.current === 1 ? '#f3f4f6' : '#ffffff',
                color: pagination.current === 1 ? '#9ca3af' : '#374151',
                cursor: pagination.current === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              上一页
            </button>
            <span style={{ padding: '6px 12px', color: '#374151' }}>
              {pagination.current} / {Math.ceil(filteredData.length / pagination.pageSize)}
            </span>
            <button
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
              disabled={pagination.current >= Math.ceil(filteredData.length / pagination.pageSize)}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: pagination.current >= Math.ceil(filteredData.length / pagination.pageSize) ? '#f3f4f6' : '#ffffff',
                color: pagination.current >= Math.ceil(filteredData.length / pagination.pageSize) ? '#9ca3af' : '#374151',
                cursor: pagination.current >= Math.ceil(filteredData.length / pagination.pageSize) ? 'not-allowed' : 'pointer',
              }}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return tableContent;
}

/* ================================================================
   预设配置
   ================================================================ */

export const TablePresets = {
  // 小型表格配置
  small: {
    height: 300,
    rowHeight: 40,
    enableVirtualScroll: false,
  },

  // 中型表格配置
  medium: {
    height: 400,
    rowHeight: 50,
    enableVirtualScroll: true,
  },

  // 大型表格配置
  large: {
    height: 600,
    rowHeight: 50,
    enableVirtualScroll: true,
    overscan: 10,
  },
};

export default OptimizedDataTable;