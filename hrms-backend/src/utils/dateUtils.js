import { format, startOfDay, endOfDay } from 'date-fns';

// Convert to UTC
export const toUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

// Start of day UTC
export const startOfDayUTC = (date) => startOfDay(toUTC(date));

// End of day UTC
export const endOfDayUTC = (date) => endOfDay(toUTC(date));

// Format for display (Indian)
export const formatDateIN = (date) => format(new Date(date), 'dd/MM/yyyy');

// Format ISO
export const formatDateISO = (date) => format(new Date(date), 'yyyy-MM-dd');