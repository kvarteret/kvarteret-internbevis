import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Compose conditional class names and resolve Tailwind utility conflicts.
 *
 * Use this helper for `className` values instead of manual template strings
 * when combining conditionals or overlapping utilities.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-green-600', disabled && 'opacity-50');
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}
