import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Blocks,
  Search,
  Settings,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import type { SecondBrainPlugin } from '../../types/plugin'

interface PluginManagerModalProps {
  isOpen: boolean
  onClose: () => void
  plugins: SecondBrainPlugin[]
  enabledPluginIds: Set<string>
  onTogglePlugin: (id: string) => void
  getPluginSettings: (id: string) => any
  onUpdatePluginSettings: (id: string, patch: any) => void
}

export function PluginManagerModal({
  isOpen,
  onClose,
  plugins,
  enabledPluginIds,
  onTogglePlugin,
  getPluginSettings,
  onUpdatePluginSettings,
}: PluginManagerModalProps) {
  const [search, setSearch] = useState('')
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null)

  if (!isOpen) return null

  const filteredPlugins = plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  )

  const activePlugin = plugins.find((p) => p.id === selectedPluginId) || null
  const SettingsComponent = activePlugin?.slots.settingsComponent

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {selectedPluginId ? (
                <button
                  type="button"
                  onClick={() => setSelectedPluginId(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                  title="Back to Plugins list"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                  <Blocks className="h-5 w-5" />
                </div>
              )}

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {activePlugin ? `${activePlugin.name} Options` : 'Obsidian-Style Plugins'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activePlugin
                    ? `Configure ${activePlugin.name} preferences and behavior`
                    : 'Extend your Second Brain workspace with modular, toggleable plugins'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search bar (only on main list) */}
          {!selectedPluginId && (
            <div className="border-b border-slate-100 px-6 py-3 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search installed plugins..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedPluginId && activePlugin && SettingsComponent ? (
              /* Plugin Specific Settings View */
              <div className="space-y-6">
                <SettingsComponent
                  settings={getPluginSettings(activePlugin.id)}
                  onChange={(newSettings) => onUpdatePluginSettings(activePlugin.id, newSettings)}
                />
              </div>
            ) : (
              /* Plugins Directory List View */
              <div className="space-y-3.5">
                {filteredPlugins.map((plugin) => {
                  const isEnabled = enabledPluginIds.has(plugin.id)
                  const Icon = plugin.icon
                  const hasSettings = Boolean(plugin.slots.settingsComponent)

                  return (
                    <div
                      key={plugin.id}
                      className="group flex flex-col justify-between gap-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-violet-300 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-violet-800/70 sm:flex-row sm:items-center"
                    >
                      {/* Plugin Details */}
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {plugin.name}
                            </h4>
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              v{plugin.version}
                            </span>
                            <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                              {plugin.category}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                            {plugin.description}
                          </p>

                          <span className="mt-1.5 block text-[11px] text-slate-400">
                            By {plugin.author}
                          </span>
                        </div>
                      </div>

                      {/* Plugin Controls */}
                      <div className="flex items-center justify-end gap-3 shrink-0">
                        {hasSettings && isEnabled && (
                          <button
                            type="button"
                            onClick={() => setSelectedPluginId(plugin.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            title="Configure settings"
                          >
                            <Settings className="h-3.5 w-3.5" />
                            <span>Options</span>
                          </button>
                        )}

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isEnabled}
                          onClick={() => onTogglePlugin(plugin.id)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                            isEnabled ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {filteredPlugins.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-xs text-slate-400">No plugins match your search.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/70 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <span>Plugins operate safely in your browser and keep your notes private</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-500 transition"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
