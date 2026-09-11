import React, { createContext, useContext, useState } from 'react'
import type { SecondBrainPlugin, PluginContextType } from '../types/plugin'
import { pomodoroPlugin } from '../plugins/pomodoro/pomodoroPlugin'
import { kanbanPlugin } from '../plugins/kanban/kanbanPlugin'
import { PluginManagerModal } from '../components/plugins/PluginManagerModal'

const REGISTERED_PLUGINS: SecondBrainPlugin[] = [
  pomodoroPlugin,
  kanbanPlugin,
]

const PluginContext = createContext<PluginContextType | null>(null)

export function PluginProvider({ children }: { children: React.ReactNode }) {
  const [plugins] = useState<SecondBrainPlugin[]>(REGISTERED_PLUGINS)

  // Initialize enabled plugins from localStorage
  const [enabledPluginIds, setEnabledPluginIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('secondbrain_plugins_enabled')
      if (saved) {
        return new Set(JSON.parse(saved))
      }
    } catch {}
    // Default: all registered plugins enabled
    return new Set(REGISTERED_PLUGINS.map((p) => p.id))
  })

  // Plugin settings store
  const [settingsStore, setSettingsStore] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    for (const p of REGISTERED_PLUGINS) {
      try {
        const saved = localStorage.getItem(`secondbrain_plugin_${p.id}_settings`)
        initial[p.id] = saved ? JSON.parse(saved) : p.defaultSettings || {}
      } catch {
        initial[p.id] = p.defaultSettings || {}
      }
    }
    return initial
  })

  const [isManagerOpen, setIsManagerOpen] = useState(false)

  // Persist enabled plugin IDs
  const togglePlugin = (id: string) => {
    setEnabledPluginIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem('secondbrain_plugins_enabled', JSON.stringify(Array.from(next)))
      return next
    })
  }

  const isPluginEnabled = (id: string) => enabledPluginIds.has(id)

  const getPluginSettings = <T = Record<string, any>>(id: string): T => {
    return (settingsStore[id] || {}) as T
  }

  const updatePluginSettings = (id: string, patch: Record<string, any>) => {
    setSettingsStore((prev) => {
      const updated = { ...prev, [id]: { ...(prev[id] || {}), ...patch } }
      localStorage.setItem(`secondbrain_plugin_${id}_settings`, JSON.stringify(updated[id]))
      // Dispatch storage event so active widgets update in real time
      window.dispatchEvent(new Event('storage'))
      return updated
    })
  }

  return (
    <PluginContext.Provider
      value={{
        plugins,
        enabledPluginIds,
        isPluginEnabled,
        togglePlugin,
        getPluginSettings,
        updatePluginSettings,
        isManagerOpen,
        openManager: () => setIsManagerOpen(true),
        closeManager: () => setIsManagerOpen(false),
      }}
    >
      {children}

      {/* Global Plugin Manager Modal */}
      <PluginManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        plugins={plugins}
        enabledPluginIds={enabledPluginIds}
        onTogglePlugin={togglePlugin}
        getPluginSettings={getPluginSettings}
        onUpdatePluginSettings={updatePluginSettings}
      />
    </PluginContext.Provider>
  )
}

export function usePlugins(): PluginContextType {
  const ctx = useContext(PluginContext)
  if (!ctx) {
    throw new Error('usePlugins must be used within a PluginProvider')
  }
  return ctx
}

// Slot renderers
export function PluginHeaderSlots() {
  const { plugins, isPluginEnabled } = usePlugins()
  return (
    <>
      {plugins
        .filter((p) => isPluginEnabled(p.id) && p.slots.headerAction)
        .map((p) => {
          const ActionComponent = p.slots.headerAction!
          return <ActionComponent key={p.id} />
        })}
    </>
  )
}

export function PluginFloatingSlots() {
  const { plugins, isPluginEnabled } = usePlugins()
  return (
    <>
      {plugins
        .filter((p) => isPluginEnabled(p.id) && p.slots.floatingWidget)
        .map((p) => {
          const WidgetComponent = p.slots.floatingWidget!
          return <WidgetComponent key={p.id} />
        })}
    </>
  )
}
