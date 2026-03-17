import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utilitaire pour combiner des classes Tailwind sans conflits
// Exemple : cn("px-2 py-1", condition && "bg-red-500")
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
