"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { useUser } from "@clerk/nextjs";
import { useAISidebar } from "@/contexts/ai-sidebar-context";

export default function EmailAgent() {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hoverTimeoutRef = useRef<number | undefined>(undefined);
  const { user } = useUser();
  const { isOpen: isAISidebarOpen } = useAISidebar();

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm your email assistant. How can I help you today?"
      }
    ]
  });

  const lastAssistantMessage = messages.filter(m => m.role === "assistant").pop();

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleMouseEnter = () => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }

    setIsHovered(true);
    // Delay expansion slightly to prevent rapid state changes
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsExpanded(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }

    setIsHovered(false);
    // Delay collapse to give user time to move between elements
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsExpanded(false);
    }, 300);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`fixed bottom-6 z-50 transition-all duration-300 ${
        isAISidebarOpen ? "hidden" : "right-6"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Chat Interface */}
      <div
        className={`absolute bottom-0 ${isAISidebarOpen ? "left-0" : "right-0"} transition-all duration-300 ${isExpanded
          ? "w-80 h-96 mb-20 opacity-100 translate-y-0"
          : "w-16 h-16 opacity-0 translate-y-4 pointer-events-none"
          }`}
      >
        <div className="w-full h-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-gray-800">Email Assistant</h3>
            <p className="text-xs text-gray-600">
              {user ? `Hey ${user.firstName || "there"}!` : "How can I help?"}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${message.role === "user"
                    ? "bg-blue-500/20 text-blue-900"
                    : "bg-gray-100/50 text-gray-800"
                    }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100/50 px-3 py-2 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about your emails..."
              className="w-full px-4 py-2 bg-white/50 backdrop-blur rounded-full text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </form>
        </div>
      </div>

      {/* Agent Character */}
      <div className={`relative transition-all duration-300 ${isHovered ? "scale-110" : "scale-100"}`}>
        {/* Gradient Circle Character */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-400 via-purple-500 to-blue-500 rounded-full animate-pulse animation-delay-1000 mix-blend-multiply" />
          <div className="absolute inset-1 bg-white/20 backdrop-blur-sm rounded-full" />

          {/* Eyes */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-blink" />
              <div className="w-2 h-2 bg-white rounded-full animate-blink animation-delay-200" />
            </div>
          </div>
        </div>

        {/* Speech Bubble */}
        {!isHovered && !isExpanded && lastAssistantMessage && (
          <div className="absolute bottom-full right-0 mb-2 animate-fade-in">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg max-w-xs">
              <p className="text-xs text-gray-700 line-clamp-2">
                {lastAssistantMessage.content}
              </p>
              <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white/90" />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0.1; }
        }
        
        .animate-blink {
          animation: blink 4s infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .delay-100 {
          animation-delay: 100ms;
        }
        
        .delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
}