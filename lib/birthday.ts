// lib/birthday.ts
//
// Birthday is stored as a Sanity "date" string: "YYYY-MM-DD".
// Only the month/day are ever used for countdowns and matching —
// the stored year is whatever year the customer happened to pick
// in the date input and carries no meaning by itself.

/** Days remaining until the next occurrence of this birthday (0 = today). */
export function daysUntilNextBirthday(birthday: string): number {
  const { month, day } = monthDay(birthday);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = new Date(today.getFullYear(), month - 1, day);
  next.setHours(0, 0, 0, 0);

  if (next.getTime() < today.getTime()) {
    next = new Date(today.getFullYear() + 1, month - 1, day);
  }

  const diffMs = next.getTime() - today.getTime();
  return Math.round(diffMs / 86_400_000);
}

export function isBirthdayToday(birthday: string): boolean {
  return daysUntilNextBirthday(birthday) === 0;
}

/** "MM-DD" — matched against today's "MM-DD" by the birthday cron job. */
export function monthDayKey(birthday: string): string {
  const { month, day } = monthDay(birthday);
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayMonthDayKey(): string {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function monthDay(birthday: string): { month: number; day: number } {
  const [, monthStr, dayStr] = birthday.split("-");
  return { month: Number(monthStr), day: Number(dayStr) };
}
