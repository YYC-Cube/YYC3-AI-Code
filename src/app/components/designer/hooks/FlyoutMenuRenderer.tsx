/**
 * SharedFlyoutMenu — theme-agnostic flyout menu renderer.
 *
 * All three themes (Classic / Liquid Glass / Aurora) share the
 * same flyout structure:  header + search + items + arrow.
 * Only CSS classes differ.  This component encapsulates the
 * common rendering logic so each theme just supplies a style config.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Clock } from 'lucide-react';
import { useFlyoutKeyboard, type FlyoutItemBase } from './useFlyoutMenu';

/* ----------------------------------------------------------------
   Style configuration — each theme fills this in
   ---------------------------------------------------------------- */

export interface FlyoutStyleConfig {
  /** Outer glass container class */
  containerClass: string;
  /** Min height on the glass container */
  containerMinHeight?: number;
  /** Box shadow string on outer container */
  containerShadow?: string;
  /** Container inline border color override */
  containerBorderColor?: string;
  /** Header border-bottom inline style */
  headerBorder: string;
  /** Header icon wrapper class (w-5 h-5 rounded-md …) */
  headerIconClass: string;
  /** Header icon color class */
  headerIconColor: string;
  /** Header label text class */
  headerLabelClass: string;
  /** Search input wrapper class */
  searchWrapperClass: string;
  /** Search icon class */
  searchIconClass: string;
  /** Search input class */
  searchInputClass: string;
  /** Clear search button class */
  searchClearClass: string;
  /** History dropdown container class */
  historyContainerClass: string;
  /** History label class */
  historyLabelClass: string;
  /** History clear button class */
  historyClearBtnClass: string;
  /** History item row class */
  historyItemClass: string;
  /** History item icon class */
  historyIconClass: string;
  /** History item text class */
  historyTextClass: string;
  /** History item delete button class */
  historyDeleteClass: string;
  /** Menu item button class */
  itemBtnClass: string;
  /** Focus ring class for menu items */
  itemFocusRing: string;
  /** Item icon wrapper class */
  itemIconWrapperClass: string;
  /** Item icon class */
  itemIconClass: string;
  /** Item label class */
  itemLabelClass: string;
  /** Item description class */
  itemDescClass: string;
  /** Empty state class */
  emptyClass: string;
  /** Arrow indicator class */
  arrowClass: string;
  /** Arrow inline style overrides */
  arrowStyle?: React.CSSProperties;
  /** Badge renderer (optional) */
  renderBadge?: (item: any, ctx: any) => React.ReactNode;
  /** Left offset for the flyout */
  leftOffset: number;
}

/* ----------------------------------------------------------------
   FlyoutItem — extended base for rendering
   ---------------------------------------------------------------- */

export interface FlyoutRenderItem extends FlyoutItemBase {
  icon: React.ElementType;
  /** Description text */
  desc?: string;
  description?: string;
  /** Color class for the icon (or gradient class) */
  color?: string;
  /** Badge function */
  badge?: (ctx: any) => string | null;
}

export interface FlyoutNavRenderItem {
  icon: React.ElementType;
  label: string;
  /** Gradient or color class for the header icon */
  gradient?: string;
  color?: string;
}

/* ----------------------------------------------------------------
   SharedFlyoutMenu component
   ---------------------------------------------------------------- */

export function SharedFlyoutMenu<T extends FlyoutRenderItem>({
  items,
  navItem,
  ctx,
  onClose,
  anchorRect,
  style,
}: {
  items: T[];
  navItem: FlyoutNavRenderItem;
  ctx: any;
  onClose: () => void;
  anchorRect: DOMRect | null;
  style: FlyoutStyleConfig;
}) {
  const enableSearch = items.length >= 3;
  const {
    menuRef, focusedIndex, setItemRef, handleMouseEnter,
    searchQuery, setSearchQuery, searchInputRef, filteredItems,
    handleItemClick, showHistory, searchHistory, selectHistoryTerm,
    deleteHistoryItem, clearHistory, handleSearchFocus,
  } = useFlyoutKeyboard<T>({ items, ctx, onClose, searchable: enableSearch });

  const top = anchorRect ? anchorRect.top : 0;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, x: -12, scale: 0.92, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -10, scale: 0.94, filter: 'blur(3px)' }}
      transition={{
        duration: 0.25,
        ease: [0.23, 1, 0.32, 1],
        opacity: { duration: 0.2 },
        filter: { duration: 0.2 },
      }}
      className="fixed z-[300] w-[220px]"
      style={{ left: style.leftOffset, top: Math.max(8, Math.min(top - 8, window.innerHeight - 320)) }}
    >
      <div
        className={`${style.containerClass} rounded-xl overflow-hidden`}
        style={{
          minHeight: style.containerMinHeight ?? 200,
          boxShadow: style.containerShadow,
          borderColor: style.containerBorderColor,
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.2, ease: 'easeOut' }}
          className="px-3 py-2.5 flex items-center gap-2"
          style={{ borderBottom: style.headerBorder }}
        >
          <div className={style.headerIconClass}>
            <navItem.icon className={`w-3 h-3 ${style.headerIconColor}`} />
          </div>
          <span className={style.headerLabelClass}>{navItem.label}</span>
        </motion.div>

        {/* Search input */}
        {enableSearch && (
          <div className="px-2 pt-2 pb-0.5">
            <div className={style.searchWrapperClass}>
              <Search className={`w-3 h-3 ${style.searchIconClass} shrink-0`} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                placeholder="搜索（支持拼音）..."
                className={style.searchInputClass}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className={`${style.searchClearClass} shrink-0`}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Search history dropdown */}
            {showHistory && searchHistory.length > 0 && !searchQuery && (
              <div className={style.historyContainerClass}>
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className={style.historyLabelClass}>最近搜索</span>
                  <button onClick={clearHistory} className={style.historyClearBtnClass}>清除</button>
                </div>
                {searchHistory.map(entry => (
                  <div
                    key={entry.term}
                    className={style.historyItemClass}
                    onClick={() => selectHistoryTerm(entry.term)}
                  >
                    <Clock className={`w-2.5 h-2.5 ${style.historyIconClass} shrink-0`} />
                    <span className={style.historyTextClass}>{entry.term}</span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteHistoryItem(entry.term); }}
                      className={style.historyDeleteClass}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="py-1.5 px-1.5 flex-1" role="menu" aria-label={navItem.label}>
          {filteredItems.length === 0 && searchQuery ? (
            <div className={style.emptyClass}>无匹配项</div>
          ) : (
            filteredItems.map((item, index) => {
              const badgeText = item.badge?.(ctx);
              const badgeNode = style.renderBadge?.(item, ctx);
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{
                    delay: 0.05 + index * 0.04,
                    duration: 0.22,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${style.itemBtnClass} ${style.itemFocusRing} transition-all group text-left`}
                  ref={setItemRef(index)}
                  tabIndex={focusedIndex === index ? 0 : -1}
                  role="menuitem"
                  onMouseEnter={handleMouseEnter(index)}
                >
                  <div className={`w-6 h-6 rounded-md ${style.itemIconWrapperClass} ${item.color || ''} flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-3.5 h-3.5 ${style.itemIconClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={style.itemLabelClass}>{item.label}</div>
                    <div className={style.itemDescClass}>{item.desc || item.description || ''}</div>
                  </div>
                  {badgeNode}
                  {!badgeNode && badgeText && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{badgeText}</span>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Arrow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ delay: 0.08, duration: 0.18 }}
        className={`absolute w-2 h-2 -rotate-45 ${style.arrowClass}`}
        style={{ left: -4, top: anchorRect ? Math.min(20, items.length * 24) : 20, ...style.arrowStyle }}
      />
    </motion.div>
  );
}
