import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with conditional logic and merges them for Tailwind CSS
 * 
 * @param inputs Class names or conditional expressions 
 * @returns Merged class names string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a currency
 * 
 * @param value Number to format 
 * @param currencyCode ISO currency code
 * @param locale Locale for formatting
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currencyCode = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(value);
}

/**
 * Formats a date in a consistent way
 * 
 * @param date Date to format
 * @param includeTime Whether to include the time
 * @param locale Locale for formatting
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  includeTime = false,
  locale = "en-US"
): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  };
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Delays execution for a specified amount of time
 * 
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncates text to a specified length with an ellipsis
 * 
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Gets the relative time from a date (e.g., "5 minutes ago")
 * 
 * @param date Date to compare
 * @param locale Locale for formatting
 * @returns Relative time string
 */
export function getRelativeTime(
  date: Date | string,
  locale = "en-US"
): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const now = new Date();
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
  
  // Convert to appropriate unit
  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(diffInSeconds, "second");
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, "minute");
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, "hour");
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, "day");
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, "month");
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return rtf.format(diffInYears, "year");
}

/**
 * Generates a random ID
 * 
 * @param length Length of the ID
 * @returns Random ID string
 */
export function generateId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Debounces a function
 * 
 * @param fn Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      fn(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function
 * 
 * @param fn Function to throttle
 * @param wait Wait time in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait = 300
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return function(...args: Parameters<T>): void {
    const now = Date.now();
    
    if (now - lastCall >= wait) {
      fn(...args);
      lastCall = now;
    }
  };
}