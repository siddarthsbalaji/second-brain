import type { ComponentType } from 'react'

export interface PluginSlotComponents {
  headerAction?: ComponentType
  floatingWidget?: ComponentType
  settingsComponent?: ComponentType<{ settings: any; onChange: (newSettings: any) => void }>
}

export interface SecondBrainPlugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: ComponentType<{ className?: string }>
  category: 'productivity' | 'organization' | 'capture' | 'utility'
  defaultEnabled: boolean
  slots: PluginSlotComponents
  defaultSettings?: Record<string, any>
}

export interface PluginContextType {
  plugins: SecondBrainPlugin[]
  enabledPluginIds: Set<string>
  isPluginEnabled: (id: string) => boolean
  togglePlugin: (id: string) => void
  getPluginSettings: <T = Record<string, any>>(id: string) => T
  updatePluginSettings: (id: string, patch: Record<string, any>) => void
  isManagerOpen: boolean
  openManager: () => void
  closeManager: () => void
}
