/**
 * @file CreateProjectDialog.tsx
 * @description Project creation dialog — name, description, tech stack selection
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.1.0
 */

import { useState, useRef, useEffect } from 'react'
import { X, FolderPlus, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../../stores/app-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'

interface CreateProjectDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (projectId: string) => void
}

export function CreateProjectDialog({ open, onClose, onCreated }: CreateProjectDialogProps) {
  const { createProject } = useAppStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setTimeout(() => nameRef.current?.focus(), 150)
    }
  }, [open])

  const handleCreate = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {return}
    const id = createProject(trimmedName, description.trim())
    onCreated(id)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreate()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const templates = [
    { name: 'Dashboard', desc: t('project.tplDashboard', 'designer') },
    { name: 'Landing Page', desc: t('project.tplLandingPage', 'designer') },
    { name: 'SaaS App', desc: t('project.tplSaasApp', 'designer') },
    { name: 'Mobile App', desc: t('project.tplMobileApp', 'designer') },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-6 ${
              isLG ? 'border-emerald-500/[0.1]' : 'border-white/[0.08]'
            }`}
            style={{
              background: isLG ? 'rgba(10,15,10,0.96)' : 'rgba(14,14,24,0.96)',
              backdropFilter: isLG ? 'blur(30px) saturate(180%)' : 'blur(20px)',
              boxShadow: isLG
                ? '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(16,185,129,0.08)'
                : '0 25px 60px rgba(0,0,0,0.5)',
            }}
            role="dialog"
            aria-label={t('project.createTitle', 'designer')}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                  isLG
                    ? 'bg-emerald-500/15 border-emerald-500/25'
                    : 'bg-violet-500/15 border-violet-500/25'
                }`}>
                  <FolderPlus className={`w-4 h-4 ${isLG ? 'text-emerald-400' : 'text-violet-400'}`} />
                </div>
                <div>
                  <div className="text-[14px] text-white/90">{t('project.createTitle', 'designer')}</div>
                  <div className="text-[10px] text-white/30">{t('project.createSubtitle', 'designer')}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
                aria-label={t('project.close', 'designer')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-[11px] text-white/40 mb-1.5">
                  {t('project.projectName', 'designer')} <span className="text-red-400/60">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="My Awesome Project"
                  className={`w-full px-3 py-2.5 rounded-xl border bg-white/[0.03] text-[13px] text-white/80 placeholder:text-white/15 outline-none transition-colors ${
                    isLG
                      ? 'border-white/[0.08] focus:border-emerald-500/30 caret-emerald-400'
                      : 'border-white/[0.08] focus:border-violet-500/30'
                  }`}
                  maxLength={60}
                />
                <div className="text-[9px] text-white/15 mt-1 text-right">{name.length}/60</div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] text-white/40 mb-1.5">{t('project.projectDescription', 'designer')}</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('project.descPlaceholder', 'designer')}
                  rows={3}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-white/[0.03] text-[13px] text-white/80 placeholder:text-white/15 outline-none resize-none transition-colors ${
                    isLG
                      ? 'border-white/[0.08] focus:border-emerald-500/30 caret-emerald-400'
                      : 'border-white/[0.08] focus:border-violet-500/30'
                  }`}
                  maxLength={200}
                />
              </div>

              {/* Quick Templates */}
              <div>
                <label className="block text-[11px] text-white/30 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {t('project.quickTemplates', 'designer')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map(tpl => (
                    <button
                      key={tpl.name}
                      onClick={() => {
                        setName(tpl.name)
                        setDescription(tpl.desc)
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] transition-colors ${
                        name === tpl.name
                          ? isLG
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400/80'
                            : 'border-violet-500/30 bg-violet-500/10 text-violet-400/80'
                          : 'border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/[0.12]'
                      }`}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[12px] text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
              >
                {t('project.cancel', 'designer')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className={`px-5 py-2 rounded-lg text-[12px] transition-all disabled:opacity-30 ${
                  isLG
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20'
                    : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border border-violet-500/20'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" />
                  {t('project.createProject', 'designer')}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
