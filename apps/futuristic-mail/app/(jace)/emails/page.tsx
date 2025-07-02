"use client";

import React, { useState, useCallback } from 'react';
import { EmailGroup } from '@/components/EmailGroup';
import { AIBox } from '@/components/AIBox';
import { EmailStatus } from '@/components/EmailItem';

interface Label {
    id: string;
    name: string;
    color: string;
}

interface Email {
    id: string;
    href: string;
    sender: string;
    subject: string;
    preview: string;
    messageCount?: number;
    date: string;
    labels?: Label[];
    status?: EmailStatus;
}

// Sample email data grouped by time periods
const initialEmailGroups = [
    {
        title: "Today",
        emails: [
            {
                id: 'email-1',
                href: '/inbox/email-1',
                sender: 'Avis Chan',
                subject: 'Legal Secrets Every Startup & YC Founder Must Know!',
                preview: 'haha thanks, Ms. Professional :) On Tue, May 13, 2025 at 7:16 PM Avis Chan <chanavis@stanford.edu> wrote: > FYI :) > **Avis Chan** > MBA Candidate, Class of 2025',
                messageCount: 2,
                date: '2:30 PM',
                labels: [
                    { id: 'important', name: 'Important', color: 'bg-red-500' }
                ],
                status: 'normal' as EmailStatus
            },
            {
                id: 'email-2',
                href: '/inbox/email-2',
                sender: 'Sarah Johnson',
                subject: 'Project Update - Q4 Launch Plans',
                preview: 'Hi team, I wanted to provide an update on our Q4 launch plans. We\'re making great progress and should be on track for the December release...',
                messageCount: 5,
                date: '11:45 AM',
                labels: [
                    { id: 'work', name: 'Work', color: 'bg-blue-500' }
                ],
                status: 'normal' as EmailStatus
            },
            {
                id: 'email-3',
                href: '/inbox/email-3',
                sender: 'John Smith',
                subject: 'Meeting Request - New Partnership Discussion',
                preview: 'I hope this email finds you well. I wanted to reach out regarding a potential partnership opportunity that I believe could be mutually beneficial...',
                messageCount: 1,
                date: '9:15 AM',
                labels: [
                    { id: 'meeting', name: 'Meeting', color: 'bg-indigo-500' }
                ],
                status: 'normal' as EmailStatus
            }
        ]
    },
    {
        title: "Yesterday",
        emails: [
            {
                id: 'email-4',
                href: '/inbox/email-4',
                sender: 'GitHub',
                subject: '[GitHub] New pull request: Fix authentication bug',
                preview: 'A new pull request has been opened for repository fluffymail/core. The pull request includes fixes for the authentication bug we discussed...',
                messageCount: 1,
                date: '6:22 PM',
                labels: [
                    { id: 'development', name: 'Development', color: 'bg-green-500' }
                ],
                status: 'normal' as EmailStatus
            },
            {
                id: 'email-5',
                href: '/inbox/email-5',
                sender: 'Alex Chen, Michael Davis',
                subject: 'Weekly Team Sync - Action Items',
                preview: 'Thanks everyone for a productive sync today! Here are the key action items we discussed: 1. Complete API documentation by Friday...',
                messageCount: 8,
                date: '3:15 PM',
                labels: [
                    { id: 'meeting', name: 'Meeting', color: 'bg-indigo-500' },
                    { id: 'urgent', name: 'Urgent', color: 'bg-orange-500' }
                ],
                status: 'normal' as EmailStatus
            }
        ]
    },
    {
        title: "This Week",
        emails: [
            {
                id: 'email-6',
                href: '/inbox/email-6',
                sender: 'Stripe',
                subject: 'Your payment has been processed',
                preview: 'Your monthly subscription payment of $29.00 has been successfully processed. Receipt #inv_1234567890...',
                messageCount: 1,
                date: 'May 10',
                labels: [
                    { id: 'finance', name: 'Finance', color: 'bg-green-600' }
                ],
                status: 'normal' as EmailStatus
            },
            {
                id: 'email-7',
                href: '/inbox/email-7',
                sender: 'Mom',
                subject: 'Dinner this weekend?',
                preview: 'Hi honey! Hope you\'re doing well. Your dad and I were wondering if you\'d like to come over for dinner this weekend. We haven\'t seen you in a while...',
                messageCount: 3,
                date: 'May 9',
                labels: [
                    { id: 'personal', name: 'Personal', color: 'bg-pink-500' }
                ],
                status: 'normal' as EmailStatus
            }
        ]
    }
];

export default function EmailsPage() {
    const [emailGroups, setEmailGroups] = useState(initialEmailGroups);
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

    // Get all emails from all groups for easier manipulation
    const getAllEmails = useCallback(() => {
        return emailGroups.flatMap(group => group.emails);
    }, [emailGroups]);

    // Get selected email objects for the AI box
    const getSelectedEmailObjects = useCallback(() => {
        const allEmails = getAllEmails();
        return Array.from(selectedEmails)
            .map(id => allEmails.find(email => email.id === id))
            .filter(Boolean) as Email[];
    }, [selectedEmails, getAllEmails]);

    const handleEmailSelect = useCallback((emailId: string, selected: boolean) => {
        setSelectedEmails(prev => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(emailId);
            } else {
                newSet.delete(emailId);
            }
            return newSet;
        });
    }, []);

    const handleEmailClick = useCallback((emailId: string) => {
        console.log('Navigating to email:', emailId);
        // In a real app, this would navigate to the email detail page
        // router.push(`/inbox/${emailId}`);
    }, []);

    const handleDelegate = useCallback((emailId: string) => {
        console.log('Delegating email to Eleanor:', emailId);
        // Implementation for delegation
    }, []);

    const handleArchive = useCallback((emailId: string) => {
        console.log('Archiving email:', emailId);
        // Implementation for archiving
    }, []);

    const handleRemindLater = useCallback((emailId: string) => {
        console.log('Setting reminder for email:', emailId);
        // Implementation for reminders
    }, []);

    const handleMarkAllDone = useCallback((groupTitle: string) => {
        console.log(`Mark all done for group: ${groupTitle}`);
        // Implementation for marking all as done
    }, []);

    const handleProcessEmails = useCallback(async (command: string, emailIds: string[]) => {
        console.log('Processing emails with AI:', { command, emailIds });

        // Simulate AI processing by setting emails to "in-progress"
        setEmailGroups(prevGroups =>
            prevGroups.map(group => ({
                ...group,
                emails: group.emails.map(email =>
                    emailIds.includes(email.id)
                        ? { ...email, status: 'in-progress' as EmailStatus }
                        : email
                )
            }))
        );

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // After processing, mark as completed
        setEmailGroups(prevGroups =>
            prevGroups.map(group => ({
                ...group,
                emails: group.emails.map(email =>
                    emailIds.includes(email.id)
                        ? { ...email, status: 'completed' as EmailStatus }
                        : email
                )
            }))
        );

        // Clear selection
        setSelectedEmails(new Set());
    }, []);

    const handleDeselectEmail = useCallback((emailId: string) => {
        setSelectedEmails(prev => {
            const newSet = new Set(prev);
            newSet.delete(emailId);
            return newSet;
        });
    }, []);

    return (
        <div className="min-h-screen bg-[rgb(50,50,50)] py-8 pb-96">
            <div className="w-full mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Email Management (v2)</h1>
                        <p className="text-gray-400">Select emails and use AI to respond, delegate, or manage them</p>
                    </div>

                    {/* Email Groups */}
                    {emailGroups.map((group) => (
                        <EmailGroup
                            key={group.title}
                            title={group.title}
                            emails={group.emails}
                            selectedEmails={selectedEmails}
                            onMarkAllDone={() => handleMarkAllDone(group.title)}
                            onEmailSelect={handleEmailSelect}
                            onEmailClick={handleEmailClick}
                            onDelegate={handleDelegate}
                            onArchive={handleArchive}
                            onRemindLater={handleRemindLater}
                        />
                    ))}
                </div>
            </div>

            {/* AI Box - Fixed at bottom */}
            <AIBox
                selectedEmails={getSelectedEmailObjects()}
                onProcessEmails={handleProcessEmails}
                onDeselectEmail={handleDeselectEmail}
            />
        </div>
    );
} 