import React from 'react';
import Link from 'next/link';
import { Archive, Clock, Trash2 } from 'lucide-react';

interface Label {
    id: string;
    name: string;
    color: string; // Tailwind color class like 'bg-green-500', 'bg-blue-500', etc.
}

interface ThreadItemProps {
    id: string;
    href: string;
    sender: string;
    subject: string;
    preview: string;
    messageCount?: number;
    date: string;
    labels?: Label[];
    onClick?: () => void;
    className?: string;
}

export function ThreadItem({
    id,
    href,
    sender,
    subject,
    preview,
    messageCount,
    date,
    labels = [],
    onClick,
    className = '',
}: ThreadItemProps) {
    return (
        <li data-element="thread-item" className={className}>
            <Link
                href={href}
                className="flex max-w-inbox mx-auto w-full"
                data-focusid={id}
                onClick={onClick}
            >
                <div className="block h-[50px] text-md group w-full cursor-pointer px-4 rounded-lg border border-transparent text-email-text hover:bg-white/5">
                    <div className="flex h-full w-full items-center gap-4">
                        {/* Sender column */}
                        <span className="w-[20%] min-w-[8em] text-md shrink-0 truncate [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]" data-state="closed">
                            {sender}
                        </span>

                        {/* Subject and preview column */}
                        <div className="flex min-w-0 shrink grow gap-2 items-baseline justify-start">
                            <span className="truncate shrink-0 min-w-0 max-w-full">
                                {subject}
                            </span>
                            <span className="truncate shrink text-sm text-email-text-muted">
                                {preview}
                            </span>
                        </div>

                        {/* Right side: labels, count and date (hidden on hover) */}
                        <div className="flex shrink items-center justify-end">
                            {/* Normal state: labels, count, date */}
                            <div className="flex items-center justify-between gap-2 w-full group-hover:hidden">
                                <div className="flex items-center gap-1 w-full justify-end h-full">
                                    {/* Labels */}
                                    {labels.length > 0 && (
                                        <>
                                            {labels.map((label) => (
                                                <span
                                                    key={label.id}
                                                    className={`transition-colors whitespace-nowrap rounded-md px-2 py-1 text-xs flex items-center text-white ${label.color}`}
                                                    title={label.name}
                                                >
                                                    {label.name}
                                                </span>
                                            ))}
                                        </>
                                    )}
                                    {/* Message count */}
                                    {messageCount && messageCount > 1 && (
                                        <span className="rounded-md px-2 py-1 text-xs uppercase items-center text-email-background bg-white/60 inline-flex">
                                            {messageCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs min-w-[10em] text-right shrink-0 max-w-[10em]">
                                    {date}
                                </span>
                            </div>

                            {/* Hover state: action buttons (shown on hover) */}
                            <div className="items-center gap-1 hidden group-hover:flex">
                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] hover:bg-button-bg-ghost h-8 w-8 border border-transparent hover:border-card-border-muted flex-shrink-0 flex-grow-0 text-surface-icon disabled:cursor-not-allowed disabled:opacity-30"
                                    data-state="closed"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Handle archive action
                                    }}
                                >
                                    <Archive className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-4 h-4" />
                                </button>

                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] hover:bg-button-bg-ghost h-8 w-8 border border-transparent hover:border-card-border-muted flex-shrink-0 flex-grow-0 text-surface-icon disabled:cursor-not-allowed disabled:opacity-30"
                                    data-state="closed"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Handle snooze action
                                    }}
                                >
                                    <Clock className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-4 h-4" />
                                </button>

                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] hover:bg-button-bg-ghost h-8 w-8 border border-transparent hover:border-card-border-muted flex-shrink-0 flex-grow-0 text-surface-icon disabled:cursor-not-allowed disabled:opacity-30"
                                    data-state="closed"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Handle delete action
                                    }}
                                >
                                    <Trash2 className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </li>
    );
} 