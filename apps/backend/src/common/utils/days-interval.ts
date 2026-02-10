/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/common/utils/days-interval.ts
import { DateTime } from 'luxon';

export const daysInterval = (startDate: Date, endDate: Date): DateTime[] => {
  const start = DateTime.fromJSDate(startDate).startOf('day');
  const end = DateTime.fromJSDate(endDate).startOf('day');

  const days: DateTime[] = [];
  let currentDay = start;

  while (currentDay <= end) {
    days.push(currentDay);
    currentDay = currentDay.plus({ days: 1 });
  }

  return days;
};
