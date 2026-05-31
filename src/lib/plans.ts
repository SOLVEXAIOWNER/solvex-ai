export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    messagesPerDay: 20,
    features: [
      '20 messages per day',
      'Basic AI responses',
      'Chat history',
    ],
  },
  pro: {
    name: 'Pro',
    price: 499, // INR
    pricePaise: 49900, // for Razorpay
    messagesPerDay: Infinity,
    features: [
      'Unlimited messages',
      'Priority AI responses',
      'Chat history',
      'Priority support',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan]
}

export function canSendMessage(messagesUsedToday: number, plan: PlanType): boolean {
  const limit = PLANS[plan].messagesPerDay
  return limit === Infinity || messagesUsedToday < limit
}

export function getMessagesRemaining(messagesUsedToday: number, plan: PlanType): number | string {
  const limit = PLANS[plan].messagesPerDay
  if (limit === Infinity) return 'Unlimited'
  return Math.max(0, limit - messagesUsedToday)
}
