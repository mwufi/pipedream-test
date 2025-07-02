import React, { useState } from 'react';
import Link from 'next/link';
import { Archive, Clock, User, Check, Bot, Loader2 } from 'lucide-react';

interface Label {
    id: string;
    name: string;
    color: string;
}

export type EmailStatus = 'normal' | 'in-progress' | 'completed';

interface EmailItemProps {
    id: string;
    href: string;
    sender: string;
    subject: string;
    preview: string;
    messageCount?: number;
    date: string;
    labels?: Label[];
    status?: EmailStatus;
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    onDelegate?: (id: string) => void;
    onArchive?: (id: string) => void;
    onRemindLater?: (id: string) => void;
    onClick?: () => void;
    className?: string;
}

export function EmailItem({
    id,
    href,
    sender,
    subject,
    preview,
    messageCount,
    date,
    labels = [],
    status = 'normal',
    isSelected = false,
    onSelect,
    onDelegate,
    onArchive,
    onRemindLater,
    onClick,
    className = '',
}: EmailItemProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onSelect?.(id, e.target.checked);
    };

    const handleEmailClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on actions
        if (showActions) {
            return;
        }
        onClick?.();
    };

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        action();
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'in-progress':
                return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
            case 'completed':
                return <Check className="w-4 h-4 text-green-500" />;
            default:
                return null;
        }
    };

    const getStatusBorder = () => {
        return 'border-transparent';
        // switch (status) {    
        //     case 'in-progress':
        //         return 'border-blue-500/30 bg-blue-500/5';
        //     case 'completed':
        //         return 'border-green-500/30 bg-green-500/5';
        //     default:
        //         return 'border-transparent';
        // }
    };

    return (
        <li
            data-element="email-item"
            className={className}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setShowActions(false);
            }}
        >
            <div className="max-w-inbox mx-auto w-full">
                <div
                    className={`block text-md group w-full cursor-pointer px-4 py-2 rounded-lg border text-email-text hover:bg-white/5 transition-all duration-200 ${getStatusBorder()} ${isSelected ? 'bg-blue-500/10 border-blue-500/30' : ''}`}
                    onClick={handleEmailClick}
                    onMouseEnter={() => setShowActions(true)}
                >
                    {/* Main email row */}
                    <div className="flex h-[50px] w-full items-center gap-4">
                        {/* Checkbox */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={handleCheckboxChange}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* Status icon */}
                        <div className="w-5 flex justify-center">
                            {getStatusIcon()}
                        </div>

                        {/* Sender column */}
                        <span className="w-[20%] min-w-[8em] text-md shrink-0 truncate [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]" data-state="closed">
                            {sender}
                        </span>

                        {/* Subject and preview column */}
                        <div className="flex min-w-0 shrink grow gap-2 items-baseline justify-start">
                            <span className="truncate shrink-0 min-w-0 max-w-full font-medium">
                                {subject}
                            </span>
                            <span className="truncate shrink text-sm text-email-text-muted">
                                {preview}
                            </span>
                        </div>

                        {/* Right side: labels, count and date / action buttons */}
                        <div className="flex shrink items-center justify-end relative">
                            {/* Normal state: labels, count, date (hidden on hover) */}
                            <div className={`flex items-center justify-between gap-2 w-full transition-opacity duration-200 ${isHovered && showActions ? 'opacity-0' : 'opacity-100'}`}>
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
                            {isHovered && showActions && (
                                <div className="absolute right-0 top-0 h-full flex items-center gap-1 bg-[rgb(50,50,50)] transition-opacity duration-200">
                                    <button
                                        onClick={(e) => handleActionClick(e, () => onDelegate?.(id))}
                                        className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none transition-all duration-200 active:scale-[.99] hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-1"
                                    >
                                        <User className="w-3 h-3" />
                                        Eleanor
                                    </button>

                                    <button
                                        onClick={(e) => handleActionClick(e, () => onArchive?.(id))}
                                        className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none transition-all duration-200 active:scale-[.99] hover:bg-gray-500/20 border border-gray-500/30 text-gray-300 px-2 py-1"
                                    >
                                        <Archive className="w-3 h-3" />
                                        Archive
                                    </button>

                                    <button
                                        onClick={(e) => handleActionClick(e, () => onRemindLater?.(id))}
                                        className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none transition-all duration-200 active:scale-[.99] hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 px-2 py-1"
                                    >
                                        <Clock className="w-3 h-3" />
                                        Later
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
} 