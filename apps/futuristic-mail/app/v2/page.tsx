"use client";

import { Sidebar, SidebarInset, SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Test() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <main>Hello</main>
            </SidebarInset>
        </SidebarProvider>
    )
}