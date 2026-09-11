import type { EventRow } from '../domain/eventRow'

export interface RecurrenceRule {
  frequency: 'daily' | 'interval' | 'weekly' | 'monthly' | 'custom'
  interval?: number
  daysOfWeek?: number[] // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  endDate?: string | null
}

export interface ExpandedEventJson {
  id: string
  originalEventId?: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string
  allDay: boolean
  recurrenceRule: RecurrenceRule | null
  isRecurringInstance?: boolean
  createdAt: string
  updatedAt: string
}

export function expandRecurringEvents(
  events: EventRow[],
  rangeStart: Date,
  rangeEnd: Date
): ExpandedEventJson[] {
  const result: ExpandedEventJson[] = []

  for (const event of events) {
    const rawRule = event.recurrence_rule
    const startAt = new Date(event.starts_at)
    const endAt = new Date(event.ends_at)
    const createdAt = new Date(event.created_at)
    const updatedAt = new Date(event.updated_at)

    if (!rawRule || typeof rawRule !== 'object' || !rawRule.frequency || rawRule.frequency === 'none') {
      // Standard single event
      result.push({
        id: event.id,
        title: event.title,
        description: event.description,
        startsAt: startAt.toISOString(),
        endsAt: endAt.toISOString(),
        allDay: event.all_day,
        recurrenceRule: null,
        isRecurringInstance: false,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      })
      continue
    }

    const rule = rawRule as RecurrenceRule
    const duration = endAt.getTime() - startAt.getTime()
    const ruleEndDate = rule.endDate ? new Date(rule.endDate) : null
    const effectiveEnd = ruleEndDate && ruleEndDate < rangeEnd ? ruleEndDate : rangeEnd

    const origStart = new Date(startAt)
    const interval = Math.max(1, rule.interval || 1)

    // Helper to test and add an occurrence
    const addOccurrence = (occStart: Date) => {
      if (occStart < origStart) return
      if (ruleEndDate && occStart > ruleEndDate) return
      const occEnd = new Date(occStart.getTime() + duration)
      if (occStart < rangeEnd && occEnd > rangeStart) {
        const isBase = occStart.getTime() === origStart.getTime()
        result.push({
          id: isBase ? event.id : `${event.id}_occ_${occStart.toISOString().slice(0, 10)}`,
          originalEventId: event.id,
          title: event.title,
          description: event.description,
          startsAt: occStart.toISOString(),
          endsAt: occEnd.toISOString(),
          allDay: event.all_day,
          recurrenceRule: rule,
          isRecurringInstance: true,
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        })
      }
    }

    if (rule.frequency === 'daily' || rule.frequency === 'interval') {
      const stepDays = rule.frequency === 'daily' ? 1 : interval
      // Calculate start date jump
      let cur = new Date(origStart)
      // Fast-forward to near rangeStart if possible
      if (cur < rangeStart) {
        const diffMs = rangeStart.getTime() - cur.getTime()
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
        const stepsToSkip = Math.floor(diffDays / stepDays)
        if (stepsToSkip > 0) {
          cur.setDate(cur.getDate() + stepsToSkip * stepDays)
        }
      }

      while (cur < effectiveEnd) {
        addOccurrence(new Date(cur))
        cur.setDate(cur.getDate() + stepDays)
      }
    } else if (rule.frequency === 'weekly' || (rule.frequency === 'custom' && rule.daysOfWeek && rule.daysOfWeek.length > 0)) {
      const targetDays = rule.daysOfWeek && rule.daysOfWeek.length > 0
        ? rule.daysOfWeek
        : [origStart.getDay()]

      // Iterate week by week
      let weekStart = new Date(origStart)
      // Align to start of origStart's week (Sunday)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())

      // Fast-forward weeks if way behind
      if (weekStart < rangeStart) {
        const diffMs = rangeStart.getTime() - weekStart.getTime()
        const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
        const weeksToSkip = Math.floor(diffWeeks / interval)
        if (weeksToSkip > 1) {
          weekStart.setDate(weekStart.getDate() + (weeksToSkip - 1) * 7 * interval)
        }
      }

      while (weekStart < effectiveEnd) {
        for (const dayOfWeek of targetDays) {
          const occ = new Date(weekStart)
          occ.setDate(weekStart.getDate() + dayOfWeek)
          occ.setHours(origStart.getHours(), origStart.getMinutes(), origStart.getSeconds(), origStart.getMilliseconds())
          addOccurrence(occ)
        }
        weekStart.setDate(weekStart.getDate() + 7 * interval)
      }
    } else if (rule.frequency === 'monthly') {
      const dayOfMonth = origStart.getDate()
      let cur = new Date(origStart)

      while (cur < effectiveEnd) {
        addOccurrence(new Date(cur))
        // Increment month safely
        const nextMonth = cur.getMonth() + interval
        cur.setMonth(nextMonth)
        // Handle months with fewer days (e.g. Feb 30 -> Mar 2)
        if (cur.getDate() !== dayOfMonth) {
          cur.setDate(0) // Last day of previous month
        }
      }
    } else {
      // Fallback for custom without days of week: treat as interval days
      let cur = new Date(origStart)
      const stepDays = interval
      while (cur < effectiveEnd) {
        addOccurrence(new Date(cur))
        cur.setDate(cur.getDate() + stepDays)
      }
    }
  }

  // Sort by startsAt
  return result.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
}
