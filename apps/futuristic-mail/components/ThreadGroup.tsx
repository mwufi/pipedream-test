import React from 'react';
import { CheckCheck } from 'lucide-react';
import { ThreadItem } from './ThreadItem';

interface Label {
    id: string;
    name: string;
    color: string;
}

interface Thread {
    id: string;
    href: string;
    sender: string;
    subject: string;
    preview: string;
    messageCount?: number;
    date: string;
    labels?: Label[];
}

interface ThreadGroupHeaderProps {
    title: string;
    onMarkAllDone?: () => void;
}

interface ThreadGroupProps {
    title: string;
    threads: Thread[];
    onMarkAllDone?: () => void;
    onThreadClick?: (threadId: string) => void;
}

export function ThreadGroupHeader({ title, onMarkAllDone }: ThreadGroupHeaderProps) {
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

export function ThreadGroup({ title, threads, onMarkAllDone, onThreadClick }: ThreadGroupProps) {
    return (
        <div className="thread-group">
            <ThreadGroupHeader
                title={title}
                onMarkAllDone={onMarkAllDone}
            />
            <ul className="">
                {threads.map((thread) => (
                    <ThreadItem
                        key={thread.id}
                        id={thread.id}
                        href={thread.href}
                        sender={thread.sender}
                        subject={thread.subject}
                        preview={thread.preview}
                        messageCount={thread.messageCount}
                        date={thread.date}
                        labels={thread.labels}
                        onClick={() => onThreadClick?.(thread.id)}
                    />
                ))}
            </ul>
        </div>
    );
} 