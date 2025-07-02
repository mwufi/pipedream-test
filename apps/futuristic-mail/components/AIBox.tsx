import React, { useState } from 'react';
import { Bot, Send, X } from 'lucide-react';

interface Email {
    id: string;
    sender: string;
    subject: string;
    preview: string;
}

interface AIBoxProps {
    selectedEmails: Email[];
    onProcessEmails: (command: string, emailIds: string[]) => void;
    onDeselectEmail: (emailId: string) => void;
    className?: string;
}

export function AIBox({ selectedEmails, onProcessEmails, onDeselectEmail, className = '' }: AIBoxProps) {
    const [command, setCommand] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim() || selectedEmails.length === 0 || isProcessing) return;

        setIsProcessing(true);
        try {
            await onProcessEmails(command, selectedEmails.map(email => email.id));
            setCommand('');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    if (selectedEmails.length === 0) {
        return null;
    }

    return (
        <div className={`fixed bottom-0 left-0 right-0 bg-[rgb(40,40,40)] border-t border-white/10 p-4 ${className}`}>
            <div className="max-w-5xl mx-auto">
                {/* Selected emails context */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">
                            Selected emails ({selectedEmails.length})
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {selectedEmails.map((email) => (
                            <div
                                key={email.id}
                                className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2 text-sm flex items-center gap-2 group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-blue-200 truncate">
                                        {email.subject}
                                    </div>
                                    <div className="text-xs text-blue-300/70 truncate">
                                        From: {email.sender}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDeselectEmail(email.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-500/30 rounded"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI command input */}
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your AI command... (e.g., 'respond to all these emails', 'summarize these emails', 'draft replies')"
                            className="w-full bg-[rgb(60,60,60)] border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[80px]"
                            disabled={isProcessing}
                            rows={2}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                            Press Enter to send, Shift+Enter for new line
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={!command.trim() || selectedEmails.length === 0 || isProcessing}
                        className="self-end px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send to AI
                            </>
                        )}
                    </button>
                </form>

                {/* Quick action buttons */}
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={() => handleSubmit({ preventDefault: () => { } } as React.FormEvent)}
                        disabled={isProcessing}
                        className="px-3 py-1 text-xs bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded hover:bg-purple-600/30 transition-colors disabled:opacity-50"
                        onMouseDown={() => setCommand('respond to all these emails')}
                    >
                        Respond to all
                    </button>
                    <button
                        onClick={() => handleSubmit({ preventDefault: () => { } } as React.FormEvent)}
                        disabled={isProcessing}
                        className="px-3 py-1 text-xs bg-green-600/20 border border-green-500/30 text-green-300 rounded hover:bg-green-600/30 transition-colors disabled:opacity-50"
                        onMouseDown={() => setCommand('summarize these emails')}
                    >
                        Summarize
                    </button>
                    <button
                        onClick={() => handleSubmit({ preventDefault: () => { } } as React.FormEvent)}
                        disabled={isProcessing}
                        className="px-3 py-1 text-xs bg-yellow-600/20 border border-yellow-500/30 text-yellow-300 rounded hover:bg-yellow-600/30 transition-colors disabled:opacity-50"
                        onMouseDown={() => setCommand('draft replies for these emails')}
                    >
                        Draft replies
                    </button>
                </div>
            </div>
        </div>
    );
} 