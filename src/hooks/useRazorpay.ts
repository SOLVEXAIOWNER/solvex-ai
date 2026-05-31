'use client'

import { useState } from 'react'

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill: {
    name?: string
    email?: string
  }
  theme: {
    color: string
  }
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void
      close: () => void
    }
  }
}

export function useRazorpay() {
  const [isProcessing, setIsProcessing] = useState(false)

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const initiatePayment = async ({
    orderId,
    amount,
    currency,
    userEmail,
    onSuccess,
    onFailure,
  }: {
    orderId: string
    amount: number
    currency: string
    userEmail?: string
    onSuccess: (response: RazorpayResponse) => void
    onFailure: (error: Error) => void
  }) => {
    setIsProcessing(true)

    try {
      const isLoaded = await loadRazorpayScript()

      if (!isLoaded) {
        throw new Error('Failed to load Razorpay SDK')
      }

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: amount,
        currency,
        name: 'Solvex AI',
        description: 'Pro Plan - Monthly Subscription',
        order_id: orderId,
        handler: (response) => {
          onSuccess(response)
          setIsProcessing(false)
        },
        prefill: {
          email: userEmail,
        },
        theme: {
          color: '#2563eb',
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      onFailure(error as Error)
      setIsProcessing(false)
    }
  }

  return {
    initiatePayment,
    isProcessing,
  }
}
