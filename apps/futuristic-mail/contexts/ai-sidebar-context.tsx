"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AISidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const AISidebarContext = createContext<AISidebarContextType | undefined>(undefined);

export function AISidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AISidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </AISidebarContext.Provider>
  );
}

export function useAISidebar() {
  const context = useContext(AISidebarContext);
  if (context === undefined) {
    throw new Error("useAISidebar must be used within an AISidebarProvider");
  }
  return context;
}