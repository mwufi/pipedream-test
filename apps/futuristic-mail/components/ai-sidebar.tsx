"use client";

import { useEffect, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useChat } from "ai/react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISidebar({ isOpen, onClose }: AISidebarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm your AI assistant. Ask me anything about your CRM, or tell me to create agents, search for people, or help with your workflow."
      }
    ]
  });

  const handleClearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI assistant. Ask me anything about your CRM, or tell me to create agents, search for people, or help with your workflow."
    }]);
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300); // Focus after animation
    }
  }, [isOpen]);

  return (
    <div
      className={cn(
        "h-full bg-background transition-all duration-300 ease-in-out overflow-hidden rounded-xl shadow-sm",
        isOpen ? "w-[400px]" : "w-0"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-2 px-4">
          <h2 className="text-lg font-medium">Neo</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              className="p-1 hover:bg-accent rounded-md transition-colors"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded-md transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 gap-4 h-[calc(100vh-130px)]">
          <div className="flex flex-col space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex whitespace-pre-wrap",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-foreground/50 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-foreground/50 rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-foreground/50 rounded-full animate-pulse delay-150" />
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Create an agent, search, or ask anything..."
            className="w-full px-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
      </div>
    </div>
  );
}