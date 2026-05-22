import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function safeFetchJson<T = any>(res: Response, fallback: T): Promise<T> {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await res.json() as T;
    } catch (e) {
      console.warn('Failed to parse response as JSON despite headers:', e);
      return fallback;
    }
  }
  return fallback;
}
