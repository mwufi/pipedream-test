#!/usr/bin/env bun
import { exit } from 'process'
import { db } from '../lib/db'
import { parseArgs } from 'util'

interface Participant {
  email: string
  name?: string
}

interface ParticipantStats {
  email: string
  name?: string
  totalEmails: number
  sentToMe: number
  sentByUser: number
  repliedTo: number
  directRepliesFromUser: number
  inConversations: number
  isSpam: number
  isImportant: number
  isStarred: number
  isRead: number
  isUnread: number
  lastInteractionDate: Date | null
  daysSinceLastContact: number
  relevanceScore: number
  category: 'high-engagement' | 'medium-engagement' | 'low-engagement' | 'spam-likely'
}

// Configurable scoring weights
const SCORING_CONFIG = {
  // Email state scores
  starred: 7,
  important: 5,
  read: 6,
  unread: -2,
  spam: -5,
  
  // Interaction scores
  sentByUser: 10,         // User actively wrote TO them
  directReply: 10,        // User replied to their email
  inConversation: 8,      // User replied in thread where they sent email
  anyInteraction: 1,      // Base score per email
  
  // Engagement ratio bonus (multiplier)
  engagementRatioMultiplier: 35,
  
  // Recency bonuses
  recency: {
    within7Days: 7,
    within30Days: 5,
    within90Days: -2,
    other: -10
  }
}

// Parse command line arguments
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    debug: {
      type: 'boolean',
      short: 'd',
      default: false
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false
    }
  },
  strict: true,
  allowPositionals: true
})

if (values.help) {
  console.log(`
📧 Email Participant Extractor

Usage: bun run scripts/extract-participants.ts [options]

Options:
  -d, --debug    Show detailed scoring information for each participant
  -h, --help     Show this help message

The script analyzes your emails and scores participants based on:
  • Starred emails: +${SCORING_CONFIG.starred} points
  • Important emails: +${SCORING_CONFIG.important} points
  • Read emails: +${SCORING_CONFIG.read} points
  • Unread emails: ${SCORING_CONFIG.unread} points
  • Emails you sent to them: +${SCORING_CONFIG.sentByUser} points
  • Direct replies from you: +${SCORING_CONFIG.directReply} points
  • Recency: +${SCORING_CONFIG.recency.within7Days} (<7d), +${SCORING_CONFIG.recency.within30Days} (<30d), +${SCORING_CONFIG.recency.within90Days} (<90d)

Participants are categorized as:
  🔥 High engagement
  💬 Medium engagement
  📧 Low engagement
  🚫 Spam likely
`)
  exit(0)
}

const DEBUG = values.debug

// Clean email address by removing trailing characters like >
function cleanEmail(email: string): string {
  return email.toLowerCase().replace(/[<>]/g, '').trim()
}

async function extractEmailParticipants() {
  console.log('🔍 Extracting email participants with engagement analysis...\n')

  try {
    // Get current user's email from accounts to identify sent emails
    const accounts = await db.query.accounts.findMany({
      columns: {
        email: true,
      }
    })

    const userEmails = accounts.map(acc => acc.email.toLowerCase())
    console.log(`👤 User emails: ${userEmails.join(', ')}\n`)

    // Query all emails with their participant and engagement data
    const emails = await db.query.emails.findMany({
      columns: {
        id: true,
        threadId: true,
        from: true,
        to: true,
        cc: true,
        bcc: true,
        category: true,
        isImportant: true,
        isStarred: true,
        isRead: true,
        sentAt: true,
      }
    })

    console.log(`📧 Found ${emails.length} emails\n`)

    // Debug: Count user-sent emails with cleaned addresses
    const userSentCount = emails.filter(email => {
      const fromEmail = (email.from as Participant)?.email ? cleanEmail((email.from as Participant).email) : null
      return fromEmail && userEmails.includes(fromEmail)
    }).length
    console.log(`📤 User sent ${userSentCount} emails out of ${emails.length} total\n`)

    // Build thread conversation analysis
    const threadMap = new Map<string, { emails: typeof emails, hasUserReplies: boolean }>()

    for (const email of emails) {
      if (!threadMap.has(email.threadId)) {
        threadMap.set(email.threadId, { emails: [], hasUserReplies: false })
      }
      threadMap.get(email.threadId)!.emails.push(email)

      // Check if user sent this email (indicating a reply)
      const fromEmail = (email.from as Participant)?.email ? cleanEmail((email.from as Participant).email) : null
      if (fromEmail && userEmails.includes(fromEmail)) {
        threadMap.get(email.threadId)!.hasUserReplies = true
      }
    }

    // Extract and analyze participants
    const participantMap = new Map<string, ParticipantStats>()

    for (const email of emails) {
      const thread = threadMap.get(email.threadId)!
      const participants = []

      // Add sender
      if (email.from) {
        participants.push({
          participant: email.from as Participant,
          role: 'sender'
        })
      }

      // Add recipients
      if (email.to && Array.isArray(email.to)) {
        participants.push(...(email.to as Participant[]).map(p => ({ participant: p, role: 'recipient' })))
      }

      if (email.cc && Array.isArray(email.cc)) {
        participants.push(...(email.cc as Participant[]).map(p => ({ participant: p, role: 'cc' })))
      }

      if (email.bcc && Array.isArray(email.bcc)) {
        participants.push(...(email.bcc as Participant[]).map(p => ({ participant: p, role: 'bcc' })))
      }

      // Process each participant
      for (const { participant, role } of participants) {
        if (participant?.email) {
          const key = cleanEmail(participant.email)

          // Skip user's own emails
          if (userEmails.includes(key)) continue

          const existing = participantMap.get(key)

          if (existing) {
            existing.totalEmails++
            if (!existing.name && participant.name) {
              existing.name = participant.name
            }
          } else {
            participantMap.set(key, {
              email: participant.email,
              name: participant.name,
              totalEmails: 1,
              sentToMe: 0,
              sentByUser: 0,
              repliedTo: 0,
              directRepliesFromUser: 0,
              inConversations: 0,
              isSpam: 0,
              isImportant: 0,
              isStarred: 0,
              isRead: 0,
              isUnread: 0,
              lastInteractionDate: null,
              daysSinceLastContact: 0,
              relevanceScore: 0,
              category: 'low-engagement'
            })
          }

          const stats = participantMap.get(key)!

          // Track last interaction date
          if (email.sentAt) {
            const emailDate = new Date(email.sentAt)
            if (!stats.lastInteractionDate || emailDate > stats.lastInteractionDate) {
              stats.lastInteractionDate = emailDate
            }
          }

          // Analyze engagement patterns
          if (role === 'sender') {
            stats.sentToMe++

            // Check if user directly replied to this email
            // Look for user emails in the same thread sent after this email
            const thisEmailDate = email.sentAt ? new Date(email.sentAt) : null
            if (thisEmailDate) {
              const userRepliesInThread = thread.emails.filter(e => {
                const fromEmail = (e.from as Participant)?.email ? cleanEmail((e.from as Participant).email) : null
                const emailDate = e.sentAt ? new Date(e.sentAt) : null
                return fromEmail && userEmails.includes(fromEmail) &&
                  emailDate && emailDate > thisEmailDate
              })
              if (userRepliesInThread.length > 0) {
                stats.directRepliesFromUser++
              }
            }
          }

          // Check if user sent an email TO this participant
          const fromEmail = (email.from as Participant)?.email ? cleanEmail((email.from as Participant).email) : null
          if (fromEmail && userEmails.includes(fromEmail) && (role === 'recipient' || role === 'cc' || role === 'bcc')) {
            stats.sentByUser++
          }

          // Track if this participant is in a conversation thread
          if (thread.emails.length > 1) {
            stats.inConversations++
          }
          
          // Track if user has replied in this thread (different from direct reply)
          if (thread.hasUserReplies && role === 'sender') {
            stats.repliedTo++
          }

          // Check email categories and flags
          if (email.category === 'spam') {
            stats.isSpam++
          }

          if (email.isImportant) {
            stats.isImportant++
          }

          if (email.isStarred) {
            stats.isStarred++
          }
          
          // Track read/unread status
          if (email.isRead) {
            stats.isRead++
          } else {
            stats.isUnread++
          }
        }
      }
    }

    // Calculate relevance scores and categorize
    for (const stats of Array.from(participantMap.values())) {
      // Calculate days since last contact
      if (stats.lastInteractionDate) {
        const diffTime = Date.now() - stats.lastInteractionDate.getTime()
        stats.daysSinceLastContact = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      } else {
        stats.daysSinceLastContact = Infinity
      }

      // Scoring algorithm using configurable weights
      let score = 0

      // Interaction scores
      score += stats.sentByUser * SCORING_CONFIG.sentByUser
      score += stats.directRepliesFromUser * SCORING_CONFIG.directReply
      score += stats.repliedTo * SCORING_CONFIG.inConversation
      score += stats.inConversations * SCORING_CONFIG.anyInteraction * 2  // Small bonus for being in conversations
      score += stats.totalEmails * SCORING_CONFIG.anyInteraction

      // Email state scores
      score += stats.isImportant * SCORING_CONFIG.important
      score += stats.isStarred * SCORING_CONFIG.starred
      score += stats.isRead * SCORING_CONFIG.read
      score += stats.isUnread * SCORING_CONFIG.unread
      score -= stats.isSpam * Math.abs(SCORING_CONFIG.spam)

      // Bonus for high engagement ratio
      const engagementRatio = stats.totalEmails > 0 ? (stats.directRepliesFromUser + stats.sentByUser) / stats.totalEmails : 0
      score += engagementRatio * SCORING_CONFIG.engagementRatioMultiplier

      // Recency bonus
      if (stats.daysSinceLastContact < 7) {
        score += SCORING_CONFIG.recency.within7Days
      } else if (stats.daysSinceLastContact < 30) {
        score += SCORING_CONFIG.recency.within30Days
      } else if (stats.daysSinceLastContact < 90) {
        score += SCORING_CONFIG.recency.within90Days
      } else {
        score += SCORING_CONFIG.recency.other
      }

      stats.relevanceScore = Math.max(0, score)

      // Categorize based on score and patterns
      if (stats.isSpam > stats.totalEmails * 0.5) {
        stats.category = 'spam-likely'
      } else if (stats.directRepliesFromUser > 0 || stats.sentByUser > 0 || stats.relevanceScore > 25) {
        stats.category = 'high-engagement'
      } else if (stats.inConversations > 0 || stats.isImportant > 0 || stats.isStarred > 0 || stats.daysSinceLastContact < 30) {
        stats.category = 'medium-engagement'
      } else {
        stats.category = 'low-engagement'
      }
    }

    // Sort by relevance score
    const sortedParticipants = Array.from(participantMap.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Debug mode: Show detailed email information
    if (DEBUG) {
      console.log('🔍 DEBUG MODE - Showing email details:\n')
      console.log('Scoring Configuration:')
      console.log(JSON.stringify(SCORING_CONFIG, null, 2))
      console.log('\n' + '='.repeat(100) + '\n')
      
      // Show details for top 20 participants
      const debugParticipants = sortedParticipants.slice(0, 20)
      
      for (const participant of debugParticipants) {
        console.log(`📧 ${participant.email} (${participant.name || 'No name'})`)
        console.log(`   Score: ${participant.relevanceScore} | Category: ${participant.category}`)
        console.log(`   Days since contact: ${participant.daysSinceLastContact === Infinity ? '∞' : participant.daysSinceLastContact}`)
        console.log('\n   Raw Features:')
        console.log(`   - Total emails: ${participant.totalEmails} (${participant.totalEmails * SCORING_CONFIG.anyInteraction} points)`)
        console.log(`   - Sent to me: ${participant.sentToMe}`)
        console.log(`   - Sent by user: ${participant.sentByUser} (${participant.sentByUser * SCORING_CONFIG.sentByUser} points)`)
        console.log(`   - Direct replies from user: ${participant.directRepliesFromUser} (${participant.directRepliesFromUser * SCORING_CONFIG.directReply} points)`)
        console.log(`   - Replied to (threads): ${participant.repliedTo} (${participant.repliedTo * SCORING_CONFIG.inConversation} points)`)
        console.log(`   - In conversations: ${participant.inConversations} (${participant.inConversations * SCORING_CONFIG.anyInteraction * 2} points)`)
        console.log(`   - Starred: ${participant.isStarred} (${participant.isStarred * SCORING_CONFIG.starred} points)`)
        console.log(`   - Important: ${participant.isImportant} (${participant.isImportant * SCORING_CONFIG.important} points)`)
        console.log(`   - Read: ${participant.isRead} (${participant.isRead * SCORING_CONFIG.read} points)`)
        console.log(`   - Unread: ${participant.isUnread} (${participant.isUnread * SCORING_CONFIG.unread} points)`)
        console.log(`   - Spam: ${participant.isSpam} (${-participant.isSpam * Math.abs(SCORING_CONFIG.spam)} points)`)
        
        // Calculate recency score
        let recencyScore = 0
        if (participant.daysSinceLastContact < 7) {
          recencyScore = SCORING_CONFIG.recency.within7Days
        } else if (participant.daysSinceLastContact < 30) {
          recencyScore = SCORING_CONFIG.recency.within30Days
        } else if (participant.daysSinceLastContact < 90) {
          recencyScore = SCORING_CONFIG.recency.within90Days
        } else {
          recencyScore = SCORING_CONFIG.recency.other
        }
        console.log(`   - Recency bonus: ${recencyScore} points`)
        
        const engagementRatio = participant.totalEmails > 0 ? (participant.directRepliesFromUser + participant.sentByUser) / participant.totalEmails : 0
        console.log(`   - Engagement ratio: ${(engagementRatio * 100).toFixed(1)}% (${(engagementRatio * SCORING_CONFIG.engagementRatioMultiplier).toFixed(1)} points)`)
        
        console.log('\n' + '-'.repeat(100) + '\n')
      }
      
      if (sortedParticipants.length > 20) {
        console.log(`... and ${sortedParticipants.length - 20} more participants\n`)
      }
      
      console.log('='.repeat(100) + '\n')
    }

    // Display results by category
    const categories = {
      'high-engagement': '🔥 HIGH ENGAGEMENT (People you actively communicate with)',
      'medium-engagement': '💬 MEDIUM ENGAGEMENT (Important but less active)',
      'low-engagement': '📧 LOW ENGAGEMENT (Mostly one-way communication)',
      'spam-likely': '🚫 LIKELY SPAM (Mostly spam/promotional)'
    }

    console.log(`👥 Found ${sortedParticipants.length} unique participants:\n`)

    for (const [category, title] of Object.entries(categories)) {
      const categoryParticipants = sortedParticipants.filter(p => p.category === category)

      if (categoryParticipants.length === 0) continue

      console.log('\n' + title + ` (${categoryParticipants.length} contacts)`)
      console.log('='.repeat(80))
      console.log('Name'.padEnd(25) + 'Email'.padEnd(30) + 'Score' + ' Reply' + ' Days' + ' Total')
      console.log('-'.repeat(80))

      for (const participant of categoryParticipants.slice(0, 15)) { // Show top 15 per category
        const name = participant.name || 'Unknown'
        const displayName = name.length > 23 ? name.substring(0, 20) + '...' : name
        const displayEmail = participant.email.length > 28 ? participant.email.substring(0, 25) + '...' : participant.email
        const daysDisplay = participant.daysSinceLastContact === Infinity ? '∞' : participant.daysSinceLastContact.toString()

        console.log(
          displayName.padEnd(25) +
          displayEmail.padEnd(30) +
          participant.relevanceScore.toString().padEnd(6) +
          participant.directRepliesFromUser.toString().padEnd(5) +
          daysDisplay.padEnd(5) +
          participant.totalEmails.toString()
        )
      }

      if (categoryParticipants.length > 15) {
        console.log(`... and ${categoryParticipants.length - 15} more`)
      }
    }

    console.log(`\n✅ Analysis complete! Found ${sortedParticipants.length} unique participants.`)
    console.log(`🔥 ${sortedParticipants.filter(p => p.category === 'high-engagement').length} high-engagement contacts`)
    console.log(`💬 ${sortedParticipants.filter(p => p.category === 'medium-engagement').length} medium-engagement contacts`)
    console.log(`📧 ${sortedParticipants.filter(p => p.category === 'low-engagement').length} low-engagement contacts`)
    console.log(`🚫 ${sortedParticipants.filter(p => p.category === 'spam-likely').length} likely spam contacts`)
    exit(0)
  } catch (error) {
    console.error('❌ Error extracting participants:', error)
    exit(1)
  }
}

// Run the extraction
extractEmailParticipants()
