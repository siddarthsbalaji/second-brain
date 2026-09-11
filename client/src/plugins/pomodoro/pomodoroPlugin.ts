import { Timer } from 'lucide-react'
import type { SecondBrainPlugin } from '../../types/plugin'
import { PomodoroWidget } from './PomodoroWidget'
import { PomodoroSettings } from './PomodoroSettings'

export const pomodoroPlugin: SecondBrainPlugin = {
  id: 'pomodoro',
  name: 'Pomodoro Focus Timer',
  description: 'Deep work focus cycles, recovery breaks, gentle synthesized audio chimes, and direct task linkage.',
  version: '1.0.0',
  author: 'Second Brain Core',
  icon: Timer,
  category: 'productivity',
  defaultEnabled: true,
  slots: {
    floatingWidget: PomodoroWidget,
    settingsComponent: PomodoroSettings,
  },
  defaultSettings: {
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    soundEnabled: true,
    autoStartBreak: false,
  },
}
