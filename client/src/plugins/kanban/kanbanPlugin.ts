import { LayoutGrid } from 'lucide-react'
import type { SecondBrainPlugin } from '../../types/plugin'

export const kanbanPlugin: SecondBrainPlugin = {
  id: 'kanban',
  name: 'Kanban Board',
  description: 'Converts tasks and lists into an interactive Kanban board with drag-and-drop columns and checklist subtasks inside every card.',
  version: '1.0.0',
  author: 'Second Brain Core',
  icon: LayoutGrid,
  category: 'organization',
  defaultEnabled: true,
  slots: {},
  defaultSettings: {
    defaultView: 'kanban',
  },
}
