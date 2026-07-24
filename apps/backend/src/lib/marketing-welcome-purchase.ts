export const postEnrollmentOrderFilters = (
  email: string,
  enteredAt: Date,
) => ({
  email,
  created_at: { $gte: enteredAt },
})

export const isHistoricalWelcomeOrder = (
  orderCreatedAt: Date,
  enteredAt: Date,
) => orderCreatedAt < enteredAt
