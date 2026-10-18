export function firstOrThrow<T>(rows: T[], message: string): T {
  const row = rows.at(0)
  if (row === undefined) {
    throw new Error(message)
  }
  return row
}

export function firstOrNull<T>(rows: T[]): T | null {
  return rows.at(0) ?? null
}
