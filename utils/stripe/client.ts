import { loadStripe } from '@stripe/stripe-js'

const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
if (!key) throw new Error('Falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')

export const stripePromise = loadStripe(key)
