import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions'

// Initialize Groq client with API key (only when needed)
function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  })
}

const SYSTEM_PROMPT = `You are Solvex AI, a helpful and knowledgeable assistant. You provide clear, accurate, and thoughtful responses. Be friendly but professional. If you're unsure about something, say so. Always strive to be helpful while being honest about the limits of your knowledge.`

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if it's a new day, reset counter if needed
    const today = new Date().toISOString().split('T')[0]
    if (profile.last_message_date !== today) {
      await supabase
        .from('profiles')
        .update({
          messages_used_today: 0,
          last_message_date: today
        })
        .eq('id', user.id)
      profile.messages_used_today = 0
    }

    // Check message limits for free users
    if (profile.plan === 'free' && profile.messages_used_today >= 20) {
      return NextResponse.json({
        error: 'Daily message limit reached',
        limitReached: true,
        upgradeRequired: true
      }, { status: 403 })
    }

    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    // Initialize Groq client
    const groq = getGroqClient()

    // Call Groq API
    const formattedMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ]

    const completion = await groq.chat.completions.create({
      messages: formattedMessages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    })

    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

    // Save user message
    const lastUserMessage = messages[messages.length - 1]
    await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: user.id,
          role: 'user',
          content: lastUserMessage.content
        },
        {
          user_id: user.id,
          role: 'assistant',
          content: assistantMessage
        }
      ])

    // Increment message counter for free users
    if (profile.plan === 'free') {
      await supabase
        .from('profiles')
        .update({
          messages_used_today: profile.messages_used_today + 1
        })
        .eq('id', user.id)
    }

    return NextResponse.json({
      message: assistantMessage,
      messagesUsed: profile.plan === 'free' ? profile.messages_used_today + 1 : null,
      messagesRemaining: profile.plan === 'free' ? 20 - (profile.messages_used_today + 1) : null
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get chat history
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })

  } catch (error) {
    console.error('Chat history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}
