import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

export function getPeriodArray(start, end, granularity) {
  const arr = [];
  let curr = dayjs(start);
  const last = dayjs(end);

  if (granularity === 'daily') {
    while (curr.isBefore(last) || curr.isSame(last, 'day')) {
      arr.push(curr.format('YYYY-MM-DD'));
      curr = curr.add(1, 'day');
    }
  } else if (granularity === 'weekly') {
    curr = curr.startOf('isoWeek');
    while (curr.isBefore(last) || curr.isSame(last, 'isoWeek')) {
      const weekStart = curr.startOf('isoWeek');
      arr.push({
        key: `${weekStart.format('YYYY')}-W${weekStart.isoWeek().toString().padStart(2, '0')}`,
        label: `${weekStart.format('DD/MM')}-${weekStart.endOf('isoWeek').format('DD/MM')}`,
      });
      curr = curr.add(1, 'week');
    }
  } else if (granularity === 'monthly') {
    curr = curr.startOf('month');
    while (curr.isBefore(last) || curr.isSame(last, 'month')) {
      arr.push({
        key: curr.format('YYYY-MM'),
        label: curr.format('MMM YYYY'),
      });
      curr = curr.add(1, 'month');
    }
  } else if (granularity === '90days') {
    curr = curr.startOf('quarter');
    while (curr.isBefore(last) || curr.isSame(last, 'quarter')) {
      const qStart = curr.startOf('quarter');
      const qEnd = curr.endOf('quarter');
      arr.push({
        key: `${qStart.format('YYYY')}-Q${qStart.quarter()}`,
        label: `${qStart.format('MMM')}-${qEnd.format('MMM YYYY')}`,
      });
      curr = curr.add(1, 'quarter');
    }
  }
  return arr;
}

export function formatPeriodLabel(period, granularity) {
  if (typeof period === 'object' && period !== null) {
    period = period.key || period.period || '';
  }
  if (granularity === 'daily') {
    return dayjs(period).format('DD/MM');
  }
  if (granularity === 'weekly') {
    if (typeof period !== 'string' || !period.includes('-W')) return period;
    const [year, week] = period.split('-W');
    const weekStart = dayjs().year(Number(year)).isoWeek(Number(week)).startOf('isoWeek');
    const weekEnd = weekStart.endOf('isoWeek');
    return `${weekStart.format('DD')}/${weekEnd.format('DD-MM')}`;
  }
  if (granularity === 'monthly') {
    return dayjs(period + '-01').format('MMM');
  }
  if (granularity === '90days') {
    if (typeof period !== 'string' || !period.includes('-Q')) return period;
    const [year, q] = period.split('-Q');
    const qStart = dayjs().year(Number(year)).quarter(Number(q)).startOf('quarter');
    const qEnd = qStart.endOf('quarter');
    return `${qStart.format('MMM')}-${qEnd.format('MMM')}`;
  }
  return period;
} 