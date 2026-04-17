/**
 * @file CodeTranslator.tsx
 * @description AI code translator — 12 languages, side-by-side editors,
 * confidence scoring, translation notes/warnings, language swap
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-14
 * @status active
 * @license MIT
 * @prefix ct*
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  ArrowRightLeft, Copy, Check, ChevronDown, AlertTriangle,
  Info, Sparkles, Code2, FileCode, Lightbulb, ShieldAlert,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useLiquidGlass } from '../../utils/liquid-glass'

/* ================================================================
   Types
   ================================================================ */

interface CtLanguage {
  id: string
  name: string
  color: string
}

interface CtTranslation {
  sourceId: string
  targetId: string
  sourceCode: string
  targetCode: string
  confidence: number
  notes: string[]
  warnings: string[]
}

/* ================================================================
   Languages — 12 with unique colors
   ================================================================ */

const CT_LANGUAGES: CtLanguage[] = [
  { id: 'typescript', name: 'TypeScript', color: '#3178c6' },
  { id: 'javascript', name: 'JavaScript', color: '#f7df1e' },
  { id: 'python', name: 'Python', color: '#3776ab' },
  { id: 'rust', name: 'Rust', color: '#dea584' },
  { id: 'go', name: 'Go', color: '#00add8' },
  { id: 'java', name: 'Java', color: '#ed8b00' },
  { id: 'csharp', name: 'C#', color: '#68217a' },
  { id: 'cpp', name: 'C++', color: '#00599c' },
  { id: 'swift', name: 'Swift', color: '#fa7343' },
  { id: 'kotlin', name: 'Kotlin', color: '#7f52ff' },
  { id: 'php', name: 'PHP', color: '#777bb4' },
  { id: 'ruby', name: 'Ruby', color: '#cc342d' },
]

/* ================================================================
   Professional Translation Pairs
   ================================================================ */

const CT_TS_SOURCE = `// TypeScript — User model with validation
import { z } from 'zod'

export enum UserRole {
  Admin = 'admin',
  Editor = 'editor',
  Viewer = 'viewer',
}

export interface Address {
  street: string
  city: string
  country: string
  zipCode: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  address: Address
  tags: string[]
  createdAt: Date
  isActive: boolean
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  tags: z.array(z.string()),
  isActive: z.boolean(),
})

export function createUser(
  name: string,
  email: string,
  role: UserRole = UserRole.Viewer,
): User {
  return {
    id: crypto.randomUUID(),
    name,
    email,
    role,
    address: { street: '', city: '', country: '', zipCode: '' },
    tags: [],
    createdAt: new Date(),
    isActive: true,
  }
}

export function filterActiveUsers(users: User[]): User[] {
  return users.filter(u => u.isActive && u.role !== UserRole.Viewer)
}`

const CT_PYTHON_TARGET = `# Python — User model with dataclass + Enum
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List
from uuid import uuid4
from pydantic import BaseModel, EmailStr, Field


class UserRole(Enum):
    ADMIN = 'admin'
    EDITOR = 'editor'
    VIEWER = 'viewer'


@dataclass
class Address:
    street: str = ''
    city: str = ''
    country: str = ''
    zip_code: str = ''


@dataclass
class User:
    id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ''
    email: str = ''
    role: UserRole = UserRole.VIEWER
    address: Address = field(default_factory=Address)
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    is_active: bool = True


class UserSchema(BaseModel):
    id: str = Field(..., pattern=r'^[0-9a-f-]{36}$')
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role: UserRole
    tags: List[str]
    is_active: bool


def create_user(
    name: str,
    email: str,
    role: UserRole = UserRole.VIEWER,
) -> User:
    return User(
        id=str(uuid4()),
        name=name,
        email=email,
        role=role,
        address=Address(),
        tags=[],
        created_at=datetime.now(),
        is_active=True,
    )


def filter_active_users(users: List[User]) -> List[User]:
    return [u for u in users if u.is_active and u.role != UserRole.VIEWER]`

const CT_RUST_TARGET = `// Rust — User model with struct + impl + derive macros
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    Editor,
    Viewer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Address {
    pub street: String,
    pub city: String,
    pub country: String,
    pub zip_code: String,
}

impl Default for Address {
    fn default() -> Self {
        Self {
            street: String::new(),
            city: String::new(),
            country: String::new(),
            zip_code: String::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub address: Address,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub is_active: bool,
}

impl User {
    pub fn new(name: impl Into<String>, email: impl Into<String>, role: UserRole) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: name.into(),
            email: email.into(),
            role,
            address: Address::default(),
            tags: Vec::new(),
            created_at: Utc::now(),
            is_active: true,
        }
    }
}

pub fn create_user(name: &str, email: &str, role: Option<UserRole>) -> User {
    User::new(name, email, role.unwrap_or(UserRole::Viewer))
}

pub fn filter_active_users(users: &[User]) -> Vec<&User> {
    users
        .iter()
        .filter(|u| u.is_active && u.role != UserRole::Viewer)
        .collect()
}`

const CT_GO_TARGET = `// Go — Goroutine-safe User struct with sync.RWMutex
package models

import (
\t"sync"
\t"time"

\t"github.com/google/uuid"
)

// UserRole represents user permission levels
type UserRole string

const (
\tUserRoleAdmin  UserRole = "admin"
\tUserRoleEditor UserRole = "editor"
\tUserRoleViewer UserRole = "viewer"
)

// Address holds postal address information
type Address struct {
\tStreet  string \`json:"street"\`
\tCity    string \`json:"city"\`
\tCountry string \`json:"country"\`
\tZipCode string \`json:"zipCode"\`
}

// User represents an application user (goroutine-safe)
type User struct {
\tmu        sync.RWMutex \`json:"-"\`
\tID        string       \`json:"id"\`
\tName      string       \`json:"name"\`
\tEmail     string       \`json:"email"\`
\tRole      UserRole     \`json:"role"\`
\tAddress   Address      \`json:"address"\`
\tTags      []string     \`json:"tags"\`
\tCreatedAt time.Time    \`json:"createdAt"\`
\tIsActive  bool         \`json:"isActive"\`
}

// NewUser creates a new User with defaults
func NewUser(name, email string, role ...UserRole) *User {
\tr := UserRoleViewer
\tif len(role) > 0 {
\t\tr = role[0]
\t}
\treturn &User{
\t\tID:        uuid.New().String(),
\t\tName:      name,
\t\tEmail:     email,
\t\tRole:      r,
\t\tAddress:   Address{},
\t\tTags:      make([]string, 0),
\t\tCreatedAt: time.Now(),
\t\tIsActive:  true,
\t}
}

// SetActive safely updates the active status
func (u *User) SetActive(active bool) {
\tu.mu.Lock()
\tdefer u.mu.Unlock()
\tu.IsActive = active
}

// GetActive safely reads the active status
func (u *User) GetActive() bool {
\tu.mu.RLock()
\tdefer u.mu.RUnlock()
\treturn u.IsActive
}

// FilterActiveUsers returns non-viewer active users
func FilterActiveUsers(users []*User) []*User {
\tresult := make([]*User, 0, len(users))
\tfor _, u := range users {
\t\tif u.GetActive() && u.Role != UserRoleViewer {
\t\t\tresult = append(result, u)
\t\t}
\t}
\treturn result
}`

const CT_TRANSLATIONS: CtTranslation[] = [
  {
    sourceId: 'typescript',
    targetId: 'python',
    sourceCode: CT_TS_SOURCE,
    targetCode: CT_PYTHON_TARGET,
    confidence: 94,
    notes: [
      'TypeScript `interface` mapped to Python `@dataclass` for mutable data classes',
      'TypeScript `enum` mapped to Python `Enum` class with string values',
      'Zod schema replaced with Pydantic `BaseModel` for runtime validation',
      'camelCase fields converted to snake_case per PEP 8 conventions',
    ],
    warnings: [
      'Python `datetime.now()` returns local time; TypeScript `new Date()` is UTC-aware — consider using `datetime.utcnow()`',
      'Pydantic v2 uses `model_validator` instead of `validator` — ensure Pydantic v2+ is installed',
    ],
  },
  {
    sourceId: 'typescript',
    targetId: 'rust',
    sourceCode: CT_TS_SOURCE,
    targetCode: CT_RUST_TARGET,
    confidence: 88,
    notes: [
      'TypeScript `interface` mapped to Rust `struct` with `#[derive(Serialize, Deserialize)]`',
      'TypeScript `enum` mapped to Rust `enum` with `#[serde(rename_all)]` for JSON compat',
      'Optional parameters use `Option<T>` with `unwrap_or` default pattern',
      '`impl` block provides constructor and associated methods on User struct',
    ],
    warnings: [
      'Rust `filter_active_users` returns `Vec<&User>` (borrowed refs) — caller must not outlive the source slice',
      'No runtime validation equivalent to Zod — consider `validator` crate for struct-level validation',
    ],
  },
  {
    sourceId: 'typescript',
    targetId: 'go',
    sourceCode: CT_TS_SOURCE,
    targetCode: CT_GO_TARGET,
    confidence: 91,
    notes: [
      'TypeScript `interface` mapped to Go `struct` with JSON struct tags',
      'TypeScript `enum` mapped to Go `const` block with typed string constants',
      'Added `sync.RWMutex` for goroutine-safe field access patterns',
      'Variadic `role ...UserRole` parameter emulates optional argument pattern',
    ],
    warnings: [
      'Go does not have union types — complex TypeScript union types require interface-based patterns',
      'Mutex is embedded but excluded from JSON serialization with `json:"-"` tag',
    ],
  },
]

/* ================================================================
   Helpers
   ================================================================ */

function ctCountLines(code: string): number {
  return code.split('\n').length
}

function ctConfidenceLabel(c: number): { label: string; color: string } {
  if (c >= 90) {return { label: 'High', color: 'text-emerald-400' }}
  if (c >= 70) {return { label: 'Medium', color: 'text-amber-400' }}
  return { label: 'Low', color: 'text-red-400' }
}

function ctConfidenceBg(c: number): string {
  if (c >= 90) {return 'bg-emerald-500'}
  if (c >= 70) {return 'bg-amber-500'}
  return 'bg-red-500'
}

/* ================================================================
   Component
   ================================================================ */

export function CodeTranslator() {
  const { isLG } = useLiquidGlass()

  const [ctSource, setCtSource] = useState('typescript')
  const [ctTarget, setCtTarget] = useState('python')
  const [ctSourceCode, setCtSourceCode] = useState(CT_TS_SOURCE)
  const [ctShowSourcePicker, setCtShowSourcePicker] = useState(false)
  const [ctShowTargetPicker, setCtShowTargetPicker] = useState(false)
  const [ctShowNotes, setCtShowNotes] = useState(true)
  const [ctCopied, setCtCopied] = useState(false)

  const sourcePickerRef = useRef<HTMLDivElement>(null)
  const targetPickerRef = useRef<HTMLDivElement>(null)

  // Close pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sourcePickerRef.current && !sourcePickerRef.current.contains(e.target as Node)) {setCtShowSourcePicker(false)}
      if (targetPickerRef.current && !targetPickerRef.current.contains(e.target as Node)) {setCtShowTargetPicker(false)}
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Find matching translation or use first
  const ctActiveTrans = useMemo(() => {
    const match = CT_TRANSLATIONS.find(t => t.sourceId === ctSource && t.targetId === ctTarget)
    if (match) {return match}
    // Return a placeholder
    return {
      sourceId: ctSource,
      targetId: ctTarget,
      sourceCode: ctSourceCode,
      targetCode: `// Translation from ${ctSource} to ${ctTarget}\n// AI translation would appear here...\n// Currently supported pairs:\n//   TypeScript -> Python\n//   TypeScript -> Rust\n//   TypeScript -> Go`,
      confidence: 0,
      notes: ['No pre-built translation available for this language pair'],
      warnings: ['Select TypeScript as source with Python/Rust/Go as target for full translations'],
    }
  }, [ctSource, ctTarget, ctSourceCode])

  // Sync source code when translation pair has one
  useEffect(() => {
    const match = CT_TRANSLATIONS.find(t => t.sourceId === ctSource && t.targetId === ctTarget)
    if (match) {setCtSourceCode(match.sourceCode)}
  }, [ctSource, ctTarget])

  const ctSourceLang = CT_LANGUAGES.find(l => l.id === ctSource)!
  const ctTargetLang = CT_LANGUAGES.find(l => l.id === ctTarget)!
  const ctConf = ctConfidenceLabel(ctActiveTrans.confidence)

  const handleSwap = useCallback(() => {
    const prevSource = ctSource
    const prevTarget = ctTarget
    setCtSource(prevTarget)
    setCtTarget(prevSource)
    // Also swap code content if we have a real translation
    if (ctActiveTrans.confidence > 0) {
      setCtSourceCode(ctActiveTrans.targetCode)
    }
  }, [ctSource, ctTarget, ctActiveTrans])

  const handleCopyTarget = useCallback(() => {
    navigator.clipboard.writeText(ctActiveTrans.targetCode).then(() => {
      setCtCopied(true)
      toast.success('Translated code copied')
      setTimeout(() => setCtCopied(false), 2000)
    })
  }, [ctActiveTrans])

  const ctSourceLines = ctCountLines(ctSourceCode)
  const ctTargetLines = ctCountLines(ctActiveTrans.targetCode)

  const accentText = isLG ? 'text-emerald-400' : 'text-violet-400'
  const accentBg = isLG ? 'bg-emerald-500/10' : 'bg-violet-500/10'
  const accentBgHover = isLG ? 'hover:bg-emerald-500/20' : 'hover:bg-violet-500/20'
  const accentBorder = isLG ? 'border-emerald-500/20' : 'border-violet-500/20'

  /** Language picker dropdown */
  function LanguagePicker({
    selected,
    onSelect,
    isOpen,
    setIsOpen,
    pickerRef,
    exclude,
  }: {
    selected: CtLanguage
    onSelect: (id: string) => void
    isOpen: boolean
    setIsOpen: (v: boolean) => void
    pickerRef: React.RefObject<HTMLDivElement | null>
    exclude: string
  }) {
    return (
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
        >
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selected.color }} />
          <span className="text-[12px] text-white/80">{selected.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full mt-1.5 left-0 z-50 w-48 rounded-xl border border-white/[0.08] shadow-2xl py-1.5 max-h-64 overflow-y-auto"
              style={{ background: 'rgba(18,18,30,0.96)', backdropFilter: 'blur(16px)' }}
            >
              {CT_LANGUAGES.filter(l => l.id !== exclude).map(lang => (
                <button
                  key={lang.id}
                  onClick={() => { onSelect(lang.id); setIsOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] transition-colors ${
                    lang.id === selected.id
                      ? `${accentBg} ${accentText}`
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: lang.color }} />
                  {lang.name}
                  {lang.id === selected.id && <Check className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a14] text-white overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <FileCode className={`w-5 h-5 ${accentText}`} />
          <span className="text-sm text-white/80">AI Code Translator</span>
          <span className="text-[10px] text-white/20 px-2 py-0.5 rounded bg-white/[0.04]">
            {CT_LANGUAGES.length} languages
          </span>
        </div>

        {/* Language selectors */}
        <div className="flex items-center gap-2">
          <LanguagePicker
            selected={ctSourceLang}
            onSelect={setCtSource}
            isOpen={ctShowSourcePicker}
            setIsOpen={setCtShowSourcePicker}
            pickerRef={sourcePickerRef}
            exclude={ctTarget}
          />

          <button
            onClick={handleSwap}
            className={`p-2 rounded-lg ${accentBg} ${accentText} ${accentBgHover} transition-colors`}
            title="Swap languages"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <LanguagePicker
            selected={ctTargetLang}
            onSelect={setCtTarget}
            isOpen={ctShowTargetPicker}
            setIsOpen={setCtShowTargetPicker}
            pickerRef={targetPickerRef}
            exclude={ctSource}
          />
        </div>
      </div>

      {/* ── Confidence Bar ── */}
      {ctActiveTrans.confidence > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.04] shrink-0">
          <Sparkles className={`w-3.5 h-3.5 ${accentText}`} />
          <span className="text-[11px] text-white/40">Confidence</span>
          <div className="flex-1 max-w-xs h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${ctActiveTrans.confidence}%` }}
              transition={{ duration: 0.6 }}
              className={`h-full rounded-full ${ctConfidenceBg(ctActiveTrans.confidence)}`}
            />
          </div>
          <span className={`text-[12px] font-mono ${ctConf.color}`}>
            {ctActiveTrans.confidence}%
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${ctConf.color} bg-white/[0.04]`}>
            {ctConf.label}
          </span>
        </div>
      )}

      {/* ── Side-by-Side Editors ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Source Editor */}
        <div className="flex-1 flex flex-col border-r border-white/[0.06] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04] shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: ctSourceLang.color }} />
              <span className="text-[11px] text-white/50">Source — {ctSourceLang.name}</span>
              <span className="text-[9px] text-white/20">{ctSourceLines} lines</span>
            </div>
            <span className="text-[9px] text-white/15">editable</span>
          </div>
          <div className="flex-1 flex overflow-auto">
            {/* Line numbers */}
            <div className="shrink-0 py-2 pr-2 pl-3 text-right select-none border-r border-white/[0.03]">
              {Array.from({ length: ctSourceLines }, (_, i) => (
                <div key={i} className="text-[10px] text-white/10 h-[18px] font-mono">{i + 1}</div>
              ))}
            </div>
            {/* Code textarea */}
            <textarea
              value={ctSourceCode}
              onChange={e => setCtSourceCode(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none resize-none p-2 text-[11px] text-white/70 font-mono leading-[18px] min-w-0"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Target Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04] shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: ctTargetLang.color }} />
              <span className="text-[11px] text-white/50">Target — {ctTargetLang.name}</span>
              <span className="text-[9px] text-white/20">{ctTargetLines} lines</span>
            </div>
            <button
              onClick={handleCopyTarget}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
            >
              {ctCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {ctCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex-1 flex overflow-auto">
            {/* Line numbers */}
            <div className="shrink-0 py-2 pr-2 pl-3 text-right select-none border-r border-white/[0.03]">
              {Array.from({ length: ctTargetLines }, (_, i) => (
                <div key={i} className="text-[10px] text-white/10 h-[18px] font-mono">{i + 1}</div>
              ))}
            </div>
            {/* Code display */}
            <pre className="flex-1 p-2 text-[11px] text-white/60 font-mono leading-[18px] whitespace-pre overflow-x-auto min-w-0">
              {ctActiveTrans.targetCode}
            </pre>
          </div>
        </div>
      </div>

      {/* ── Notes & Warnings Panel ── */}
      <div className={`border-t border-white/[0.06] shrink-0`}>
        <button
          onClick={() => setCtShowNotes(prev => !prev)}
          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/[0.02] transition-colors"
        >
          <ChevronRight className={`w-3.5 h-3.5 text-white/30 transition-transform ${ctShowNotes ? 'rotate-90' : ''}`} />
          <span className="text-[11px] text-white/40">
            Translation Notes ({ctActiveTrans.notes.length}) & Warnings ({ctActiveTrans.warnings.length})
          </span>
        </button>

        <AnimatePresence>
          {ctShowNotes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
                {/* Notes */}
                {ctActiveTrans.notes.map((note, i) => (
                  <div key={`note-${i}`} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/[0.02]">
                    <Lightbulb className={`w-3.5 h-3.5 ${accentText} shrink-0 mt-0.5`} />
                    <span className="text-[11px] text-white/50">{note}</span>
                  </div>
                ))}
                {/* Warnings */}
                {ctActiveTrans.warnings.map((warn, i) => (
                  <div key={`warn-${i}`} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/[0.04] border border-amber-500/10">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-amber-400/70">{warn}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
