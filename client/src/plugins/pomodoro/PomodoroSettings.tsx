import type { ChangeEvent } from 'react'

export interface PomodoroSettingsData {
  workDuration: number
  shortBreak: number
  longBreak: number
  soundEnabled: boolean
  autoStartBreak: boolean
}

export function PomodoroSettings({
  settings,
  onChange,
}: {
  settings: PomodoroSettingsData
  onChange: (newSettings: PomodoroSettingsData) => void
}) {
  const update = (patch: Partial<PomodoroSettingsData>) => {
    onChange({ ...settings, ...patch })
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Timer Durations</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure the duration in minutes for focus sessions and recovery breaks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Focus Session
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={120}
              value={settings.workDuration}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                update({ workDuration: Math.max(1, parseInt(e.target.value) || 25) })
              }
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <span className="text-xs text-slate-400">min</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Short Break
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={30}
              value={settings.shortBreak}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                update({ shortBreak: Math.max(1, parseInt(e.target.value) || 5) })
              }
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <span className="text-xs text-slate-400">min</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Long Break
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={60}
              value={settings.longBreak}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                update({ longBreak: Math.max(1, parseInt(e.target.value) || 15) })
              }
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <span className="text-xs text-slate-400">min</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Sound Chimes</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Play a gentle two-tone chime when a session finishes
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => update({ soundEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Auto-start Breaks</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automatically transition into break when focus countdown finishes
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.autoStartBreak}
            onChange={(e) => update({ autoStartBreak: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
      </div>
    </div>
  )
}
