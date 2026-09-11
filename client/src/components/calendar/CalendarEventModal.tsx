import { useState } from 'react'
import { Repeat } from 'lucide-react'
import type { CalendarEvent, RecurrenceRule } from '../../types/calendar'
import type { TaskPriority } from '../../types/task'
import { endOfDay, startOfDay } from '../../lib/calendarTime'
function toDatetimeLocalValue(d: Date):string {
  const pad=(n: number)=>String(n).padStart(2,'0')
  return`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function defaultSlot(day: Date): { start: Date; end: Date } {
  const start=new Date(day)
  start.setHours(9, 0, 0, 0)
  const end=new Date(day)
  end.setHours(10, 0, 0, 0)
  return { start, end }
}
type Props={
  mode:'create' |'edit'
  anchorDay: Date
  event: CalendarEvent | null
  onClose: ()=>void
  onCreateEvent: (body: {
    title:string
    description:string | null
    startsAt:string
    endsAt:string
    allDay: boolean
    recurrenceRule?: RecurrenceRule | null
  })=>Promise<void>
  onCreateTask: (body: {
    title:string
    description:string | null
    dueAt:string | null
    priority: TaskPriority
  })=>Promise<void>
  onUpdateEvent: (
    id:string,
    body: Partial<{
      title:string
      description:string | null
      startsAt:string
      endsAt:string
      allDay: boolean
      recurrenceRule: RecurrenceRule | null
    }>
  )=>Promise<void>
  onDeleteEvent: (id:string)=>Promise<void>
  busy: boolean
}
export function CalendarEventModal({
  mode,
  anchorDay,
  event,
  onClose,
  onCreateEvent,
  onCreateTask,
  onUpdateEvent,
  onDeleteEvent,
  busy,
}: Props) {
  const type = 'event'
  const [title, setTitle]=useState(()=>(mode==='edit' && event ? event.title :''))
  const [description, setDescription]=useState(()=>
    mode==='edit' && event ? (event.description ??'') :''
  )
  const [allDay, setAllDay]=useState(()=>Boolean(mode==='edit' && event&&event.allDay))
  const [startLocal, setStartLocal]=useState(()=>{
    if (mode==='edit' && event) return toDatetimeLocalValue(new Date(event.startsAt))
    const { start }=defaultSlot(startOfDay(anchorDay))
    return toDatetimeLocalValue(start)
  })
  const [endLocal, setEndLocal]=useState(()=>{
    if (mode==='edit' && event) return toDatetimeLocalValue(new Date(event.endsAt))
    const { end }=defaultSlot(startOfDay(anchorDay))
    return toDatetimeLocalValue(end)
  })
  const [taskPriority, setTaskPriority]=useState<TaskPriority>('medium')
  const [taskDue, setTaskDue]=useState(()=>{
    const { start }=defaultSlot(startOfDay(anchorDay))
    return toDatetimeLocalValue(start)
  })

  // Recurring event state
  const [recurrenceFreq, setRecurrenceFreq] = useState<'none' | 'daily' | 'interval' | 'weekly' | 'monthly' | 'custom'>(() => {
    return (mode === 'edit' && event?.recurrenceRule?.frequency) || 'none'
  })
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(() => {
    return (mode === 'edit' && event?.recurrenceRule?.interval) || 2
  })
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(() => {
    if (mode === 'edit' && event?.recurrenceRule?.daysOfWeek) {
      return event.recurrenceRule.daysOfWeek
    }
    return [anchorDay.getDay()]
  })
  const [hasEndDate, setHasEndDate] = useState<boolean>(() => {
    return Boolean(mode === 'edit' && event?.recurrenceRule?.endDate)
  })
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>(() => {
    if (mode === 'edit' && event?.recurrenceRule?.endDate) {
      return event.recurrenceRule.endDate.slice(0, 10)
    }
    const d = new Date(anchorDay)
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 10)
  })

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setErrorMsg(null)
    
    try {
      if (type==='task' && mode==='create') {
        await onCreateTask({
          title: title.trim(),
          description: description.trim()||null,
          dueAt: taskDue ? new Date(taskDue).toISOString() : null,
          priority: taskPriority
        })
        return
      }
      let startsAt:string
      let endsAt:string
      if (allDay) {
        const day =
          startLocal.length>=10
            ? startOfDay(new Date(`${startLocal.slice(0, 10)}T12:00:00`))
            : startOfDay(anchorDay)
        startsAt=day.toISOString()
        endsAt=endOfDay(day).toISOString()
      } else {
        const s=new Date(startLocal)
        const en=new Date(endLocal)
        if (Number.isNaN(s.getTime())||Number.isNaN(en.getTime())||en<s) {
          setErrorMsg('Invalid start or end time')
          return
        }
        startsAt=s.toISOString()
        endsAt=en.toISOString()
      }

      const recurrenceRule: RecurrenceRule | null = recurrenceFreq === 'none' ? null : {
        frequency: recurrenceFreq,
        interval: recurrenceFreq === 'interval' || recurrenceFreq === 'custom' ? recurrenceInterval : 1,
        daysOfWeek: recurrenceFreq === 'weekly' || recurrenceFreq === 'custom' ? recurrenceDays : undefined,
        endDate: hasEndDate && recurrenceEndDate ? new Date(recurrenceEndDate + 'T23:59:59Z').toISOString() : null,
      }

      if (mode==='create') {
        await onCreateEvent({
          title: title.trim(),
          description: description.trim()||null,
          startsAt,
          endsAt,
          allDay,
          recurrenceRule,
        })
      } else if (event) {
        const targetId = event.originalEventId || event.id
        await onUpdateEvent(targetId, {
          title: title.trim(),
          description: description.trim()||null,
          startsAt,
          endsAt,
          allDay,
          recurrenceRule,
        })
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'An error occurred'
      setErrorMsg(msg)
    }
  }
  const inputCls =
    'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-400 [color-scheme:light] dark:[color-scheme:dark]'
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cal-event-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-950 dark:border dark:border-slate-800"
        onClick={(e)=>e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="cal-event-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {mode==='create' ?'Create new...' :'Edit event'}
          </h2>

        </div>
        
        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ev-title" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Title
            </label>
            <input
              id="ev-title"
              value={title}
              onChange={(e)=>setTitle(e.target.value)}
              className={inputCls}
              required
            />
          </div>
          {type==='event' && (
            <>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e)=>setAllDay(e.target.checked)}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                All day
              </label>
              {!allDay&&(
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ev-start" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Starts
                    </label>
                    <input
                      id="ev-start"
                      type="datetime-local"
                      value={startLocal}
                      onChange={(e)=>setStartLocal(e.target.value)}
                      className={inputCls}
                      required={!allDay}
                    />
                  </div>
                  <div>
                    <label htmlFor="ev-end" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Ends
                    </label>
                    <input
                      id="ev-end"
                      type="datetime-local"
                      value={endLocal}
                      onChange={(e)=>setEndLocal(e.target.value)}
                      className={inputCls}
                      required={!allDay}
                    />
                  </div>
                </div>
              )}
              {allDay&&(
                <div>
                  <label htmlFor="ev-day" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Date
                  </label>
                  <input
                    id="ev-day"
                    type="date"
                    value={
                      startLocal.length>=10
                        ? startLocal.slice(0, 10)
                        : toDatetimeLocalValue(startOfDay(anchorDay)).slice(0, 10)
                    }
                    onChange={(e)=>{
                      const v=e.target.value
                      if (v) setStartLocal(`${v}T12:00`)
                    }}
                    className={inputCls}
                  />
                </div>
              )}
            </>
          )}

          {/* Recurring Options */}
          {type === 'event' && (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Repeat className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  <span>Repeat</span>
                </label>
                <select
                  value={recurrenceFreq}
                  onChange={(e) => setRecurrenceFreq(e.target.value as any)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-sm focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily (Every day)</option>
                  <option value="interval">Every X days</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom selection</option>
                </select>
              </div>

              {/* Interval count for every X days or custom */}
              {(recurrenceFreq === 'interval' || recurrenceFreq === 'custom') && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>Every</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-xs font-bold text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <span>days</span>
                </div>
              )}

              {/* Day of Week checkboxes for weekly / custom */}
              {(recurrenceFreq === 'weekly' || recurrenceFreq === 'custom') && (
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Repeat on:
                  </span>
                  <div className="flex gap-1.5">
                    {[
                      { label: 'S', day: 0, title: 'Sunday' },
                      { label: 'M', day: 1, title: 'Monday' },
                      { label: 'T', day: 2, title: 'Tuesday' },
                      { label: 'W', day: 3, title: 'Wednesday' },
                      { label: 'T', day: 4, title: 'Thursday' },
                      { label: 'F', day: 5, title: 'Friday' },
                      { label: 'S', day: 6, title: 'Saturday' },
                    ].map(({ label, day, title }) => {
                      const isSelected = recurrenceDays.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          title={title}
                          onClick={() => {
                            if (isSelected) {
                              if (recurrenceDays.length > 1) {
                                setRecurrenceDays(recurrenceDays.filter((d) => d !== day))
                              }
                            } else {
                              setRecurrenceDays([...recurrenceDays, day].sort())
                            }
                          }}
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* End Date */}
              {recurrenceFreq !== 'none' && (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-2 dark:border-slate-800">
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={hasEndDate}
                      onChange={(e) => setHasEndDate(e.target.checked)}
                      className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span>Ends on</span>
                  </label>
                  {hasEndDate && (
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {type==='task' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="task-due" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Due Date
                </label>
                <input
                  id="task-due"
                  type="datetime-local"
                  value={taskDue}
                  onChange={(e)=>setTaskDue(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="task-priority" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={taskPriority}
                  onChange={(e)=>setTaskPriority(e.target.value as TaskPriority)}
                  className={inputCls}
                >
                  <option value="low" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Low Priority</option>
                  <option value="medium" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Medium Priority</option>
                  <option value="high" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">High Priority</option>
                </select>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="ev-desc" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Description
            </label>
            <textarea
              id="ev-desc"
              value={description}
              onChange={(e)=>setDescription(e.target.value)}
              rows={3}
              className={inputCls}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-2 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            {mode==='edit' && event&&(
              <button
                type="button"
                onClick={async ()=>{
                  if (confirm('Delete this event?')) await onDeleteEvent(event.id)
                }}
                disabled={busy}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy||!title.trim()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {busy ?'Saving…' : mode==='create' ?'Create' :'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}