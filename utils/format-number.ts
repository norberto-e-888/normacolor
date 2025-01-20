export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-EN").format(value);
}
