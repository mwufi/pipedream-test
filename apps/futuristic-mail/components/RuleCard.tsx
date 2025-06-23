'use client';

import { useState, useEffect, useRef } from 'react';
import { Paperclip, Check, X, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RuleCardProps {
    id: string;
    initialContent: string;
    initialIsEditing?: boolean;
    onSave: (content: string) => void;
    onDelete: () => void;
}

export default function RuleCard({ id, initialContent, initialIsEditing = false, onSave, onDelete }: RuleCardProps) {
    const [isEditing, setIsEditing] = useState(initialIsEditing);
    const [content, setContent] = useState(initialContent);
    const [tempContent, setTempContent] = useState(initialContent);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleEdit = () => {
        setTempContent(content);
        setIsEditing(true);
    };

    const handleSave = () => {
        setContent(tempContent);
        onSave(tempContent);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempContent(content);
        setIsEditing(false);
    };

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.max(40, textarea.scrollHeight) + 'px';
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [tempContent, content, isEditing]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isEditing]);

    return (
        <div id={id} className="bg-neutral-800/50 rounded-lg overflow-hidden transition-all duration-200">
            <div className="px-4 py-3 space-y-2">
                <div className="flex flex-col gap-xs">
                    <textarea
                        ref={textareaRef}
                        name="content"
                        placeholder={isEditing ? "Enter your rule here..." : ""}
                        className={cn("w-full text-md bg-transparent text-input-text placeholder:text-input-text-placeholder resize-none outline-none rounded-input px-3 py-2.5 overflow-hidden cursor-default", isEditing && "bg-input-background rounded-lg")}
                        style={{ minHeight: '40px' }}
                        value={isEditing ? tempContent : content}
                        onChange={(e) => {
                            setTempContent(e.target.value);
                            adjustTextareaHeight();
                        }}
                        readOnly={!isEditing}
                    />
                    <div className="flex justify-between items-center pt-2">
                        {isEditing ? (
                            <>
                                <div></div>
                                <div className="flex gap-xs">
                                    <button
                                        onClick={handleSave}
                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] hover:bg-button-bg-ghost h-8 w-8 text-green-500 hover:text-green-400"
                                    >
                                        <Check className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-xs h-icon-xs" />
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[.99] hover:bg-button-bg-ghost h-8 w-8 text-icon-light-gray hover:text-icon-light-gray/80 transition-opacity duration-150 opacity-100"
                                    >
                                        <X className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-xs h-icon-xs" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div></div>
                                <div className="flex gap-xs">
                                    <button
                                        onClick={handleEdit}
                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] hover:bg-button-bg-ghost h-8 w-8 text-icon-light-gray hover:text-icon-light-gray/80"
                                    >
                                        <Pencil className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-xs h-icon-xs" />
                                    </button>
                                    <button
                                        onClick={onDelete}
                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] hover:bg-button-bg-ghost h-8 w-8 text-icon-light-gray/60 hover:text-icon-light-gray/40"
                                    >
                                        <Trash2 className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-xs h-icon-xs" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 