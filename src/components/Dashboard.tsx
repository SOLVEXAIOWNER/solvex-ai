'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRazorpay } from '@/hooks/useRazorpay'
import { logout } from '@/lib/auth/actions'

interface Message {
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

interface UserProfile {
  id: string
  email: string
  plan: string
  messages_used_today: number
}

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { initiatePayment, isProcessing } = useRazorpay()

  useEffect(() => {
    loadProfile()
    loadChatHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profileData)
  }

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/chat')
      const data = await response.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      const data = await response.json()

      if (response.status === 403 && data.upgradeRequired) {
        setShowUpgradeModal(true)
        setMessages((prev) => prev.filter((msg) => msg !== userMessage))
      } else if (response.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
        await loadProfile()
      } else {
        console.error('Error:', data.error)
        setMessages((prev) => prev.filter((msg) => msg !== userMessage))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages((prev) => prev.filter((msg) => msg !== userMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      await initiatePayment({
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency,
        userEmail: profile?.email,
        onSuccess: async (paymentResponse) => {
          const verifyResponse = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentResponse),
          })

          if (verifyResponse.ok) {
            await loadProfile()
            setShowUpgradeModal(false)
            alert('Successfully upgraded to Pro!')
          } else {
            alert('Payment verification failed')
          }
        },
        onFailure: (error) => {
          console.error('Payment failed:', error)
          alert('Payment failed. Please try again.')
        },
      })
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to initiate upgrade. Please try again.')
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-900">Solvex AI</h1>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {profile?.plan === 'pro' ? 'Pro' : 'Free'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {profile?.plan === 'free' && (
                <div className="text-sm text-gray-600">
                  {20 - (profile?.messages_used_today || 0)} messages left today
                </div>
              )}
              {profile?.plan === 'free' && (
                <button
                  onClick={handleUpgrade}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Upgrade to Pro
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg font-medium">Welcome to Solvex AI</p>
              <p className="text-sm">Start a conversation by typing a message below</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                <p className="text-gray-500">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={sendMessage} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Daily Limit Reached
            </h2>
            <p className="text-gray-600 mb-6">
              You've used all 20 messages for today. Upgrade to Pro for unlimited
              messages and priority support.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isProcessing ? 'Processing...' : 'Upgrade for 499/month'}
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
