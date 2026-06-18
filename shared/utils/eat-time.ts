import { CHECK_IN_BLOCK_HOURS, EAT_TIMEZONE } from '../constants/check-in';

type EatParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
};

function parseEatParts(date: Date = new Date()): EatParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EAT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
  };
}

/** YYYY-MM-DD in East Africa Time */
export function getEatDateString(date: Date = new Date()): string {
  const { year, month, day } = parseEatParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Block index 0–5 for 4-hour windows starting at 00:00 EAT */
export function getEatFourHourBlock(date: Date = new Date()): number {
  const { hour } = parseEatParts(date);
  return Math.floor(hour / CHECK_IN_BLOCK_HOURS);
}

export function isWithinHoursOfSignup(
  createdAtIso: string,
  hours: number,
  now: Date = new Date()
): boolean {
  const created = new Date(createdAtIso).getTime();
  return now.getTime() - created <= hours * 60 * 60 * 1000;
}
