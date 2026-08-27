import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatItemDisplayName(name: string, categoryName?: string | null) {
  return categoryName ? `${name} (${categoryName})` : name
}
