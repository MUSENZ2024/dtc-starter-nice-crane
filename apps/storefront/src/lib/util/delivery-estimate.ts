const ONE_DAY = 24 * 60 * 60 * 1000

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * ONE_DAY)

const month = (date: Date) =>
  date.toLocaleDateString("en-NZ", { month: "short" })

export function getDeliveryDateRange(
  minDays = 13,
  maxDays = 16,
  from = new Date()
) {
  const start = addDays(from, minDays)
  const end = addDays(from, maxDays)
  const startMonth = month(start)
  const endMonth = month(end)

  if (startMonth === endMonth) {
    return `${start.getDate()}-${end.getDate()} ${endMonth}`
  }

  return `${start.getDate()} ${startMonth}-${end.getDate()} ${endMonth}`
}

export function getDeliveredByLabel(minDays = 13, maxDays = 16) {
  return `Delivered by ${getDeliveryDateRange(minDays, maxDays)}`
}

export function getOrderDeliveryEstimate(
  fulfillmentType: "nzstock" | "standard" | string,
  from: Date = new Date()
) {
  if (fulfillmentType === "nzstock") {
    return `Est. ${getDeliveryDateRange(1, 3, from)}`
  }

  return `Est. ${getDeliveryDateRange(13, 16, from)}`
}
