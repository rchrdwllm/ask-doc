import type { DocumentRow } from "@/db/schema"

export type ViewMode = "list" | "grid"

export interface DocumentDisplay extends Omit<DocumentRow, "storage_path" | "errorMessage"> {
  formattedSize?: string
  errorMessage?: string | null
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

const MINUTE_SECONDS = 60
const HOUR_SECONDS = 60 * MINUTE_SECONDS
const DAY_SECONDS = 24 * HOUR_SECONDS
const WEEK_SECONDS = 7 * DAY_SECONDS
const MONTH_SECONDS = 30 * DAY_SECONDS
const YEAR_SECONDS = 365 * DAY_SECONDS

export function extractTextFromParts(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join(" ")
}

export function sanitizePlainText(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/(^|\n)\s*#+\s+/g, "$1")
    .replace(/(^|\n)\s*>\s+/g, "$1")
    .replace(/(^|\n)\s*[-*+]\s+/g, "$1")
    .replace(/(^|\n)\s*\d+\.\s+/g, "$1")
    .replace(/[\*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function formatRelativeTime(date: Date, now: Date): string {
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000)

  if (diffSeconds <= 0) return "just now"
  if (diffSeconds < MINUTE_SECONDS) return "just now"

  if (diffSeconds < HOUR_SECONDS) {
    const minutes = Math.round(diffSeconds / MINUTE_SECONDS)
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`
  }

  if (diffSeconds < DAY_SECONDS) {
    const hours = Math.round(diffSeconds / HOUR_SECONDS)
    return `${hours} hr${hours === 1 ? "" : "s"} ago`
  }

  if (diffSeconds < WEEK_SECONDS) {
    const days = Math.round(diffSeconds / DAY_SECONDS)
    return `${days} day${days === 1 ? "" : "s"} ago`
  }

  if (diffSeconds < MONTH_SECONDS) {
    const weeks = Math.round(diffSeconds / WEEK_SECONDS)
    return `${weeks} wk${weeks === 1 ? "" : "s"} ago`
  }

  if (diffSeconds < YEAR_SECONDS) {
    const months = Math.round(diffSeconds / MONTH_SECONDS)
    return `${months} mo${months === 1 ? "" : "s"} ago`
  }

  const years = Math.round(diffSeconds / YEAR_SECONDS)
  return `${years} yr${years === 1 ? "" : "s"} ago`
}
