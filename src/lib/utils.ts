import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Formats a number as Dominican Pesos (RD$).
 * @param amount The number to format.
 * @returns The formatted currency string (e.g., "RD$ 1,500.00").
 */
export function formatCurrencyRD(amount: number | undefined | null): string {
    if (amount === undefined || amount === null || isNaN(amount)) {
        amount = 0;
    }
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP', // Dominican Peso code
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a Firestore Timestamp or Date object into a string.
 * @param date Timestamp or Date object.
 * @param formatString Desired date format (default: 'dd/MM/yyyy').
 * @returns Formatted date string.
 */
export function formatDate(date: Timestamp | Date | string | undefined | null, formatString = 'dd/MM/yyyy'): string {
  if (!date) return '-';
  let dateObj: Date;
  if (typeof date === 'string') {
      dateObj = new Date(date);
  } else if (date instanceof Timestamp) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
       return '-'; // Handle invalid date
  }

  return format(dateObj, formatString, { locale: es });
}
