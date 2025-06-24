import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { emails } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(
  request: NextRequest,
  { params }: { params: { emailId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { emailId } = params

    // Fetch the email from the database
    const [email] = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, emailId), eq(emails.userId, userId)))
      .limit(1)

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    // Prepare the email content for classification
    const emailContent = `
Subject: ${email.subject || 'No subject'}
From: ${typeof email.from === 'object' && email.from !== null ? (email.from as any).email : 'Unknown'}
To: ${Array.isArray(email.to) ? email.to.map((t: any) => t.email).join(', ') : 'Unknown'}
Date: ${email.receivedAt || email.sentAt || 'Unknown'}

Body:
${email.body || email.htmlBody?.replace(/<[^>]*>/g, '') || 'No content'}
`

    // Call OpenAI to classify the email
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an email classification assistant. Analyze the email and provide:
1. Category: One of [personal, work, promotional, newsletter, social, spam, transactional, other]
2. Sentiment: One of [positive, negative, neutral, mixed]
3. Summary: A brief 1-2 sentence summary of the email
4. Is it a promotion: true/false

Respond in JSON format like:
{
  "category": "promotional",
  "sentiment": "neutral",
  "summary": "A promotional email about...",
  "isPromotion": true
}`
        },
        {
          role: 'user',
          content: emailContent
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    })

    const classification = JSON.parse(completion.choices[0].message.content || '{}')

    // Update the email with AI classification
    await db
      .update(emails)
      .set({
        aiCategory: classification.category,
        aiSentiment: classification.sentiment,
        aiSummary: classification.summary,
        aiExtractedData: {
          ...email.aiExtractedData as any,
          isPromotion: classification.isPromotion,
          classifiedAt: new Date().toISOString()
        },
        updatedAt: new Date()
      })
      .where(and(eq(emails.id, emailId), eq(emails.userId, userId)))

    return NextResponse.json({
      success: true,
      classification,
      emailId
    })
  } catch (error) {
    console.error('Error enriching email:', error)
    return NextResponse.json(
      { error: 'Failed to enrich email' },
      { status: 500 }
    )
  }
}