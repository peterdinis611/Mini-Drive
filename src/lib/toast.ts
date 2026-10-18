export type ToastTone = 'success' | 'error' | 'info' | 'message'

export type ToastAction = {
  label: string
  onClick: () => void
}

export type ToastInput = {
  title: string
  description?: string
  tone?: ToastTone
  duration?: number
  action?: ToastAction
}

export type ToastItem = {
  id: string
  title: string
  description?: string
  tone: ToastTone
  duration: number
  action?: ToastAction
  createdAt: number
}

type Listener = (toasts: ToastItem[]) => void

const DEFAULT_DURATION = 4200
const MAX_VISIBLE = 4

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function emit() {
  const snapshot = toasts
  for (const listener of listeners) listener(snapshot)
}

function uid() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function push(input: ToastInput): string {
  const id = uid()
  const item: ToastItem = {
    id,
    title: input.title,
    description: input.description,
    tone: input.tone ?? 'message',
    duration: input.duration ?? DEFAULT_DURATION,
    action: input.action,
    createdAt: Date.now(),
  }

  toasts = [item, ...toasts].slice(0, MAX_VISIBLE)
  emit()

  if (item.duration > 0) {
    const timer = setTimeout(() => dismiss(id), item.duration)
    timers.set(id, timer)
  }

  return id
}

export function dismiss(id?: string) {
  if (!id) {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
    toasts = []
    emit()
    return
  }

  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  listener(toasts)
  return () => {
    listeners.delete(listener)
  }
}

export function getToasts() {
  return toasts
}

function show(
  title: string,
  tone: ToastTone,
  opts?: Omit<ToastInput, 'title' | 'tone'>,
) {
  return push({ title, tone, ...opts })
}

export const toast = {
  success: (title: string, opts?: Omit<ToastInput, 'title' | 'tone'>) =>
    show(title, 'success', opts),
  error: (title: string, opts?: Omit<ToastInput, 'title' | 'tone'>) =>
    show(title, 'error', opts),
  info: (title: string, opts?: Omit<ToastInput, 'title' | 'tone'>) =>
    show(title, 'info', opts),
  message: (title: string, opts?: Omit<ToastInput, 'title' | 'tone'>) =>
    show(title, 'message', opts),
  dismiss,
  /** Promise helper — loading → success/error. */
  promise: async <T>(
    promise: Promise<T>,
    labels: {
      loading: string
      success: string | ((value: T) => string)
      error: string | ((error: unknown) => string)
    },
  ): Promise<T> => {
    const id = push({
      title: labels.loading,
      tone: 'info',
      duration: 0,
    })
    try {
      const value = await promise
      dismiss(id)
      toast.success(
        typeof labels.success === 'function'
          ? labels.success(value)
          : labels.success,
      )
      return value
    } catch (error) {
      dismiss(id)
      toast.error(
        typeof labels.error === 'function' ? labels.error(error) : labels.error,
      )
      throw error
    }
  },
}
