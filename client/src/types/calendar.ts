import type { Task } from './task'

export interface RecurrenceRule {
  frequency: 'none' | 'daily' | 'interval' | 'weekly' | 'monthly' | 'custom'
  interval?: number // e.g. every X days/weeks/months
  daysOfWeek?: number[] // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  endDate?: string | null // ISO string or null for indefinite
}

export type CalendarEvent = {
  id: string
  originalEventId?: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string
  allDay: boolean
  recurrenceRule?: RecurrenceRule | null
  isRecurringInstance?: boolean
  createdAt: string
  updatedAt: string
}

export type CalendarRangeResponse = {
  start: string
  end: string
  tasks: Task[]
  events: CalendarEvent[]
}

export type CalendarViewMode = 'day' | 'week' | 'month'