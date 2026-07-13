export function compact(value, digits = 1) {
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: digits }).format(Number(value) || 0);
}

export function currency(value, options = {}) {
  if (value == null) return 'Unknown';
  const absolute = Math.abs(value);
  if (options.compact !== false && absolute >= 1_000_000) {
    return Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: absolute >= 1_000_000_000 ? 1 : 0,
    }).format(value);
  }
  return Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function integer(value) {
  return Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function percent(value, digits = 0) {
  return Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: digits }).format(Number(value) || 0);
}

export function duration(months) {
  if (months == null) return 'Disputed';
  if (months < 12) return `${months} mo`;
  const years = months / 12;
  return Number.isInteger(years) ? `${years} yr` : `${years.toFixed(1)} yr`;
}

export function metricDisplay(record, value = record.value) {
  if (value == null) return record.display;
  return currency(value);
}
