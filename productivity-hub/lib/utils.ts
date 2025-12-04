/**
 * Format a number as Indian Rupees currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate simple interest
 * @param principal - The principal amount
 * @param rate - Annual interest rate (as percentage, e.g., 10 for 10%)
 * @param days - Number of days
 */
export function calculateSimpleInterest(
  principal: number,
  rate: number,
  days: number
): number {
  return (principal * (rate / 100) * days) / 365;
}

/**
 * Calculate EMI (Equated Monthly Installment)
 * @param principal - Loan principal
 * @param annualRate - Annual interest rate (as percentage)
 * @param months - Number of months
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / months;

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return emi;
}

/**
 * Calculate number of days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get the start and end dates of the current week
 */
export function getCurrentWeek(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Calculate effort points based on category and hours
 */
export function calculateEffortPoints(
  category: string,
  hours: number
): number {
  if (category === "Gym") {
    return 1;
  }
  return hours * 1;
}

/**
 * Check if date string is today
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Generate a className string from an object of conditional classes
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
