"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { AISidebar } from "@/components/ai-sidebar"
import { useAISidebar } from "@/contexts/ai-sidebar-context"

import './variables.css';
import './keyframes.css';
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Page() {
  const { isOpen: isAISidebarOpen, setIsOpen: setIsAISidebarOpen } = useAISidebar();
  return (
    <>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="flex flex-row gap-2 bg-transparent shadow-none!">
          <div className="flex flex-1 flex-col bg-background rounded-xl shadow-sm">
            <SiteHeader />
            <div className="@container/main flex flex-1 gap-2 h-[90vh]">
              <div className="flex-1 overflow-y-auto">
                <SimpleEditor />
              </div>

            </div>
          </div>

          <AISidebar
            isOpen={isAISidebarOpen}
            onClose={() => setIsAISidebarOpen(false)}
          />
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
