"use client";

import React from 'react';
import { ThreadGroup } from '@/components/ThreadGroup';

// Sample thread data grouped by time periods
const threadGroups = [
    {
        title: "Today",
        threads: [
            {
                id: 'cttN4bFhXiN55bGio9W7e3',
                href: '/inbox/cttN4bFhXiN55bGio9W7e3',
                sender: 'Avis Chan, me',
                subject: 'Legal Secrets Every Startup & YC Founder Must Know!',
                preview: 'haha thanks, Ms. Professional :) On Tue, May 13, 2025 at 7:16 PM Avis Chan <chanavis@stanford.edu> wrote: > FYI :) > **Avis Chan** > MBA Candidate, Class of 2025',
                messageCount: 2,
                date: '2:30 PM',
                labels: [
                    { id: 'important', name: 'Important', color: 'bg-red-500' }
                ]
            },
            {
                id: 'thread-2',
                href: '/inbox/thread-2',
                sender: 'Sarah Johnson',
                subject: 'Project Update - Q4 Launch Plans',
                preview: 'Hi team, I wanted to provide an update on our Q4 launch plans. We\'re making great progress and should be on track for the December release...',
                messageCount: 5,
                date: '11:45 AM',
                labels: [
                    { id: 'work', name: 'Work', color: 'bg-blue-500' }
                ]
            }
        ]
    },
    {
        title: "Yesterday",
        threads: [
            {
                id: 'thread-3',
                href: '/inbox/thread-3',
                sender: 'GitHub',
                subject: '[GitHub] New pull request: Fix authentication bug',
                preview: 'A new pull request has been opened for repository fluffymail/core. The pull request includes fixes for the authentication bug we discussed...',
                messageCount: 1,
                date: '6:22 PM',
                labels: [
                    { id: 'development', name: 'Development', color: 'bg-green-500' }
                ]
            },
            {
                id: 'thread-4',
                href: '/inbox/thread-4',
                sender: 'Alex Chen, Michael Davis',
                subject: 'Weekly Team Sync - Action Items',
                preview: 'Thanks everyone for a productive sync today! Here are the key action items we discussed: 1. Complete API documentation by Friday...',
                messageCount: 8,
                date: '3:15 PM',
                labels: [
                    { id: 'meeting', name: 'Meeting', color: 'bg-indigo-500' },
                    { id: 'urgent', name: 'Urgent', color: 'bg-orange-500' }
                ]
            }
        ]
    },
    {
        title: "This Week",
        threads: [
            {
                id: 'thread-5',
                href: '/inbox/thread-5',
                sender: 'Stripe',
                subject: 'Your payment has been processed',
                preview: 'Your monthly subscription payment of $29.00 has been successfully processed. Receipt #inv_1234567890...',
                messageCount: 1,
                date: 'May 10',
                labels: [
                    { id: 'finance', name: 'Finance', color: 'bg-green-600' }
                ]
            },
            {
                id: 'thread-6',
                href: '/inbox/thread-6',
                sender: 'Mom',
                subject: 'Dinner this weekend?',
                preview: 'Hi honey! Hope you\'re doing well. Your dad and I were wondering if you\'d like to come over for dinner this weekend. We haven\'t seen you in a while...',
                messageCount: 3,
                date: 'May 9',
                labels: [
                    { id: 'personal', name: 'Personal', color: 'bg-pink-500' }
                ]
            }
        ]
    }
];

/*
Custom CSS variables needed:
- text-email-text
- text-email-text-muted  
- text-email-background
- button-bg-ghost
- card-border-muted
- surface-icon
- max-w-inbox
- px-md, gap-md, gap-sm, gap-xs, gap-min
- px-sm, py-min
*/

export default function ThreadsPage() {
    const handleMarkAllDone = (groupTitle: string) => {
        console.log(`Mark all done for group: ${groupTitle}`);
    };

    const handleThreadClick = (threadId: string) => {
        console.log('Clicked thread:', threadId);
    };

    return (
        <div className="min-h-screen bg-[rgb(50,50,50)] py-8">
            <div className="w-full mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    {threadGroups.map((group) => (
                        <ThreadGroup
                            key={group.title}
                            title={group.title}
                            threads={group.threads}
                            onMarkAllDone={() => handleMarkAllDone(group.title)}
                            onThreadClick={handleThreadClick}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
} 