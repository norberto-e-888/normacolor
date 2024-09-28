const formatter = Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatCents = (cents: number) => {
  return formatter.format(cents / 100);
};
