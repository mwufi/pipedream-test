import React from 'react';
import { CheckCheck } from 'lucide-react';
import { EmailItem, EmailStatus } from './EmailItem';

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

interface EmailGroupHeaderProps {
    title: string;
    onMarkAllDone?: () => void;
}

interface EmailGroupProps {
    title: string;
    emails: Email[];
    selectedEmails: Set<string>;
    onMarkAllDone?: () => void;
    onEmailSelect?: (emailId: string, selected: boolean) => void;
    onEmailClick?: (emailId: string) => void;
    onDelegate?: (emailId: string) => void;
    onArchive?: (emailId: string) => void;
    onRemindLater?: (emailId: string) => void;
}

export function EmailGroupHeader({ title, onMarkAllDone }: EmailGroupHeaderProps) {
    return (
        <div className="text-email-text-highlighted py-xl border-border text-sm font-medium group mt-xl">
            <div className="max-w-inbox mx-auto px-md flex items-center justify-between">
                <span>{title}</span>
                <button
                    className="inline-flex items-center justify-center gap-2 border whitespace-nowrap rounded-md font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 duration-200 active:scale-[.99] border-transparent hover:border-[rgba(255,255,255,0.02)] text-sm [&_svg]:size-3 h-6 w-6 p-0 hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    data-state="closed"
                    onClick={onMarkAllDone}
                >
                    <CheckCheck className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-4 h-4" />
                    <span className="sr-only">Mark all as done</span>
                </button>
            </div>
        </div>
    );
}

export function EmailGroup({
    title,
    emails,
    selectedEmails,
    onMarkAllDone,
    onEmailSelect,
    onEmailClick,
    onDelegate,
    onArchive,
    onRemindLater
}: EmailGroupProps) {
    return (
        <div className="email-group">
            <EmailGroupHeader
                title={title}
                onMarkAllDone={onMarkAllDone}
            />
            <ul className="">
                {emails.map((email) => (
                    <EmailItem
                        key={email.id}
                        id={email.id}
                        href={email.href}
                        sender={email.sender}
                        subject={email.subject}
                        preview={email.preview}
                        messageCount={email.messageCount}
                        date={email.date}
                        labels={email.labels}
                        status={email.status}
                        isSelected={selectedEmails.has(email.id)}
                        onSelect={onEmailSelect}
                        onDelegate={onDelegate}
                        onArchive={onArchive}
                        onRemindLater={onRemindLater}
                        onClick={() => onEmailClick?.(email.id)}
                    />
                ))}
            </ul>
        </div>
    );
} 