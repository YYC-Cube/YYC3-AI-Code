import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { pinyin, match as pinyinMatch } from 'pinyin-pro';

/**
 * Minimal interface for flyout items used by the keyboard hook.
 * Theme-specific items can extend this with additional style fields.
 */
export interface FlyoutItemBase {
  id: string;
  label: string;
  action: (ctx: any) => void;
}

export interface FlyoutSubItem extends FlyoutItemBase {
  icon: React.ElementType;
  desc: string;
  color: string;
}

export interface FlyoutNavItem {
  section: string;
  icon: React.ElementType;
  label: string;
  gradient: string;
  getSubItems: () => FlyoutSubItem[];
}

/* ----------------------------------------------------------------
   Search History — persisted to localStorage
   ---------------------------------------------------------------- */

const HISTORY_KEY = 'flyout-search-history';
const MAX_HISTORY = 8;
const DECAY_FACTOR = 0.85; // Weight decays by 15% per position

interface HistoryEntry {
  term: string;
  score: number; // frequency-weighted score
  lastUsed: number; // timestamp
}

function loadSearchHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migration: handle old string[] format
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
      return (parsed as string[]).map((term, i) => ({
        term,
        score: Math.pow(DECAY_FACTOR, i),
        lastUsed: Date.now() - i * 60000,
      }));
    }
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(history: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch { /* ignore quota errors */ }
}

/** Add a term with frequency-weighted scoring and time decay */
function pushHistory(term: string): HistoryEntry[] {
  const trimmed = term.trim();
  if (!trimmed) return loadSearchHistory();
  const prev = loadSearchHistory();
  const existing = prev.find(h => h.term === trimmed);
  const now = Date.now();

  // Apply time decay to all existing scores
  const decayed = prev
    .filter(h => h.term !== trimmed)
    .map(h => {
      // Decay based on time elapsed (half-life ~1 hour)
      const hoursSince = (now - h.lastUsed) / 3600000;
      const timeDecay = Math.pow(DECAY_FACTOR, hoursSince);
      return { ...h, score: h.score * timeDecay };
    });

  // Boost or create entry
  const newScore = existing ? existing.score + 1.0 : 1.0;
  const entry: HistoryEntry = { term: trimmed, score: newScore, lastUsed: now };

  // Sort by score descending
  const next = [entry, ...decayed].sort((a, b) => b.score - a.score).slice(0, MAX_HISTORY);
  saveSearchHistory(next);
  return next;
}

function removeHistoryItem(term: string): HistoryEntry[] {
  const prev = loadSearchHistory().filter(h => h.term !== term);
  saveSearchHistory(prev);
  return prev;
}

function clearAllHistory(): HistoryEntry[] {
  saveSearchHistory([]);
  return [];
}

/* ----------------------------------------------------------------
   Pinyin-aware fuzzy matching
   ---------------------------------------------------------------- */

function matchesPinyin(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  // Direct substring match
  if (lower.includes(q)) return true;
  // pinyin-pro match (supports initials like "sjhb" matching "设计画布")
  const indices = pinyinMatch(text, q, { continuous: true });
  if (indices && indices.length > 0) return true;
  // Full pinyin match (e.g. "shejihuabu")
  const fullPy = pinyin(text, { toneType: 'none', type: 'array' }).join('').toLowerCase();
  if (fullPy.includes(q)) return true;
  // Initial letters match (e.g. "sjhb")
  const initials = pinyin(text, { pattern: 'first', toneType: 'none', type: 'array' }).join('').toLowerCase();
  if (initials.includes(q)) return true;
  return false;
}

/**
 * Shared flyout menu logic for all three themes (Classic / Liquid Glass / Aurora).
 * Encapsulates:
 * - open/close state tracking
 * - anchor rect positioning
 * - button ref management
 */
export function useFlyoutMenu() {
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const openSection = useCallback((section: string) => {
    const btn = buttonRefs.current[section];
    if (btn) setAnchorRect(btn.getBoundingClientRect());
    setOpenFlyout(prev => prev === section ? null : section);
  }, []);

  const closeFlyout = useCallback(() => setOpenFlyout(null), []);

  const setButtonRef = useCallback((section: string) => (el: HTMLButtonElement | null) => {
    buttonRefs.current[section] = el;
  }, []);

  return {
    openFlyout,
    anchorRect,
    openSection,
    closeFlyout,
    setButtonRef,
    setOpenFlyout,
  };
}

/**
 * Keyboard navigation + click-outside + pinyin search + history for an open flyout panel.
 * Used inside individual flyout render components.
 * Generic over item type — only requires `id`, `label`, and `action`.
 */
export function useFlyoutKeyboard<T extends FlyoutItemBase>({
  items,
  ctx,
  onClose,
  searchable = false,
}: {
  items: T[];
  ctx: any;
  onClose: () => void;
  searchable?: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<HistoryEntry[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Load history on mount
  useEffect(() => {
    if (searchable) {
      setSearchHistory(loadSearchHistory());
    }
  }, [searchable]);

  // Filter items by search query with pinyin support
  const filteredItems = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return items;
    const q = searchQuery.trim();
    return items.filter(item => {
      if (matchesPinyin(item.label, q)) return true;
      // Also check 'desc' / 'description' if present on the item
      const desc = (item as any).desc || (item as any).description || '';
      if (desc && matchesPinyin(desc, q)) return true;
      if (item.id.toLowerCase().includes(q.toLowerCase())) return true;
      return false;
    });
  }, [items, searchQuery, searchable]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filteredItems.length);
  }, [filteredItems.length]);

  // Reset focused index when filtered list changes
  useEffect(() => {
    if (filteredItems.length > 0) {
      setFocusedIndex(0);
      // Delay focus to let DOM update
      requestAnimationFrame(() => {
        itemRefs.current[0]?.focus();
      });
    } else {
      setFocusedIndex(-1);
    }
  }, [filteredItems.length, searchQuery]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Record search to history when user selects an item
  const commitSearchHistory = useCallback((query: string) => {
    if (query.trim()) {
      const updated = pushHistory(query.trim());
      setSearchHistory(updated);
    }
  }, []);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const isSearchFocused = searchInputRef.current && document.activeElement === searchInputRef.current;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          if (searchable && searchQuery) {
            setSearchQuery('');
            setShowHistory(false);
          } else if (showHistory) {
            setShowHistory(false);
          } else {
            onClose();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          setShowHistory(false);
          if (filteredItems.length === 0) break;
          setFocusedIndex(prev => {
            const n = prev < filteredItems.length - 1 ? prev + 1 : 0;
            itemRefs.current[n]?.focus();
            return n;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (filteredItems.length === 0) break;
          if (isSearchFocused) break; // Don't navigate up from search
          setFocusedIndex(prev => {
            // If at first item and searchable, focus back to search input
            if (searchable && prev <= 0) {
              searchInputRef.current?.focus();
              return -1;
            }
            const n = prev > 0 ? prev - 1 : filteredItems.length - 1;
            itemRefs.current[n]?.focus();
            return n;
          });
          break;
        case 'Enter':
        case ' ':
          if (isSearchFocused && e.key === ' ') break; // Allow space in search
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredItems.length) {
            commitSearchHistory(searchQuery);
            filteredItems[focusedIndex].action(ctx);
            onClose();
          }
          break;
        case 'Tab':
          e.preventDefault();
          onClose();
          break;
        default:
          // If searchable and user types a character while not in search, focus search
          if (searchable && !isSearchFocused && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
            searchInputRef.current?.focus();
          }
          break;
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, filteredItems, ctx, focusedIndex, searchable, searchQuery, showHistory, commitSearchHistory]);

  // Auto-focus: search input if searchable, first item otherwise
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      } else if (filteredItems.length > 0) {
        setFocusedIndex(0);
        itemRefs.current[0]?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [searchable]);

  const setItemRef = (index: number) => (el: HTMLButtonElement | null) => {
    itemRefs.current[index] = el;
  };

  const handleMouseEnter = (index: number) => () => {
    setFocusedIndex(index);
    itemRefs.current[index]?.focus();
  };

  // Item click wrapper that also records history
  const handleItemClick = useCallback((item: T) => {
    commitSearchHistory(searchQuery);
    item.action(ctx);
    onClose();
  }, [searchQuery, ctx, onClose, commitSearchHistory]);

  // History helpers for flyout UIs
  const selectHistoryTerm = useCallback((term: string) => {
    setSearchQuery(term);
    setShowHistory(false);
    searchInputRef.current?.focus();
  }, []);

  const deleteHistoryItem = useCallback((term: string) => {
    const updated = removeHistoryItem(term);
    setSearchHistory(updated);
  }, []);

  const clearHistory = useCallback(() => {
    const updated = clearAllHistory();
    setSearchHistory(updated);
    setShowHistory(false);
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (!searchQuery.trim() && searchHistory.length > 0) {
      setShowHistory(true);
    }
  }, [searchQuery, searchHistory.length]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (!value.trim() && searchHistory.length > 0) {
      setShowHistory(true);
    } else {
      setShowHistory(false);
    }
  }, [searchHistory.length]);

  return {
    menuRef,
    focusedIndex,
    setItemRef,
    handleMouseEnter,
    // Search-related
    searchQuery,
    setSearchQuery: handleSearchChange,
    searchInputRef,
    filteredItems,
    handleItemClick,
    // History-related
    showHistory,
    setShowHistory,
    searchHistory,
    selectHistoryTerm,
    deleteHistoryItem,
    clearHistory,
    handleSearchFocus,
  };
}

/**
 * Shared handleNavClick logic for all three theme ActivityBars.
 * Encapsulates the common pattern of:
 * - Toggle flyout on re-click
 * - Direct action for single sub-item sections
 * - Open flyout for multi sub-item sections
 * - Special handling for 'components' section
 */
export function useActivityBarNav<
  TNav extends {
    section: string;
    getSubItems: () => { action: (ctx: any) => void }[];
  }
>({
  ctx,
  setActiveNavSection,
}: {
  ctx: any;
  setActiveNavSection: (section: any) => void;
}) {
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleNavClick = useCallback((section: string, navItem: TNav) => {
    // Toggle: re-click the same flyout section closes it
    if (openFlyout === section) {
      setOpenFlyout(null);
      return;
    }

    const subItems = navItem.getSubItems();

    // ComponentPalette is toggled via its own mechanism
    if (section === 'components') {
      setActiveNavSection(section);
      setOpenFlyout(null);
      return;
    }

    // Single sub-item → fire directly, no flyout
    if (subItems.length === 1) {
      subItems[0].action(ctx);
      setActiveNavSection(section);
      setOpenFlyout(null);
      return;
    }

    // Multiple sub-items → open flyout
    if (subItems.length > 1) {
      const btn = buttonRefs.current[section];
      if (btn) setAnchorRect(btn.getBoundingClientRect());
      setOpenFlyout(section);
      setActiveNavSection(section);
      return;
    }

    // No sub-items → just set active
    setActiveNavSection(section);
  }, [openFlyout, ctx, setActiveNavSection]);

  const closeFlyout = useCallback(() => setOpenFlyout(null), []);

  const setButtonRef = useCallback((section: string) => (el: HTMLButtonElement | null) => {
    buttonRefs.current[section] = el;
  }, []);

  return {
    openFlyout,
    anchorRect,
    handleNavClick,
    closeFlyout,
    setButtonRef,
  };
}