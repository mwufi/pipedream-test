"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import {
  AudioWaveform,
  Bell,
  Bot,
  Hash,
  Home,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Settings,
  Users,
  Zap,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Slack-like data structure
const data = {
  teams: [
    {
      name: "Futuristic Mail",
      logo: Zap,
      plan: "Pro",
    }
  ],
  // Main navigation items (like Home, DMs, Activity)
  mainNav: [
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: false,
    },
    {
      title: "DMs",
      url: "/dms",
      icon: MessageCircle,
      isActive: false,
    },
    {
      title: "Activity",
      url: "/activity",
      icon: Bell,
      isActive: false,
    },
  ],
  // Channels section
  channels: [
    {
      name: "general",
      url: "/channels/general",
      isPrivate: false,
      unreadCount: 0,
    },
    {
      name: "announcements",
      url: "/channels/announcements",
      isPrivate: false,
      unreadCount: 2,
    },
    {
      name: "ai-agents",
      url: "/channels/ai-agents",
      isPrivate: false,
      unreadCount: 0,
    },
    {
      name: "private-team",
      url: "/channels/private-team",
      isPrivate: true,
      unreadCount: 1,
    },
  ],
  // Direct messages
  directMessages: [
    {
      name: "AI Assistant",
      url: "/dm/ai-assistant",
      isOnline: true,
      unreadCount: 3,
    },
    {
      name: "Team Bot",
      url: "/dm/team-bot",
      isOnline: false,
      unreadCount: 0,
    },
  ],
  // Apps section
  apps: [
    {
      name: "Reply Agent",
      url: "/apps/reply-agent",
      icon: Bot,
      unreadCount: 1,
    },
    {
      name: "Summarizer",
      url: "/apps/summarizer",
      icon: AudioWaveform,
      unreadCount: 0,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()
  const [channelsOpen, setChannelsOpen] = React.useState(true)
  const [dmsOpen, setDmsOpen] = React.useState(true)
  const [appsOpen, setAppsOpen] = React.useState(true)

  const userData = user
    ? {
      name: user.fullName || "Anonymous",
      email: user.primaryEmailAddress?.emailAddress || "",
      avatar: user.imageUrl || "",
    }
    : {
      name: "Anonymous",
      email: "",
      avatar: "",
    }

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Channels Section */}
        <Collapsible open={channelsOpen} onOpenChange={setChannelsOpen}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="group/collapsible w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <span>Channels</span>
                <div className="flex items-center gap-1">
                  <Plus className="h-3 w-3 opacity-0 group-hover/collapsible:opacity-100" />
                  <MoreHorizontal className="h-3 w-3" />
                </div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {data.channels.map((channel) => (
                    <SidebarMenuItem key={channel.name}>
                      <SidebarMenuButton asChild>
                        <a href={channel.url} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {channel.isPrivate ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <Hash className="h-3 w-3" />
                            )}
                            <span className={`text-sm ${channel.unreadCount > 0 ? 'font-bold' : ''}`}>
                              {channel.name}
                            </span>
                          </div>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-muted-foreground hover:text-foreground">
                      <Plus className="h-3 w-3" />
                      <span className="text-sm">Add channels</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Direct Messages Section */}
        <Collapsible open={dmsOpen} onOpenChange={setDmsOpen}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="group/collapsible w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <span>Direct messages</span>
                <div className="flex items-center gap-1">
                  <Plus className="h-3 w-3 opacity-0 group-hover/collapsible:opacity-100" />
                  <MoreHorizontal className="h-3 w-3" />
                </div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {data.directMessages.map((dm) => (
                    <SidebarMenuItem key={dm.name}>
                      <SidebarMenuButton asChild>
                        <a href={dm.url} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className="h-2 w-2 rounded-full bg-gray-400" />
                              {dm.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-1 ring-white" />
                              )}
                            </div>
                            <span className={`text-sm ${dm.unreadCount > 0 ? 'font-bold' : ''}`}>
                              {dm.name}
                            </span>
                          </div>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-muted-foreground hover:text-foreground">
                      <Plus className="h-3 w-3" />
                      <span className="text-sm">Invite people</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Apps Section */}
        <Collapsible open={appsOpen} onOpenChange={setAppsOpen}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="group/collapsible w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <span>Apps</span>
                <div className="flex items-center gap-1">
                  <Plus className="h-3 w-3 opacity-0 group-hover/collapsible:opacity-100" />
                  <MoreHorizontal className="h-3 w-3" />
                </div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {data.apps.map((app) => (
                    <SidebarMenuItem key={app.name}>
                      <SidebarMenuButton asChild>
                        <a href={app.url} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <app.icon className="h-4 w-4" />
                            <span className={`text-sm ${app.unreadCount > 0 ? 'font-bold' : ''}`}>
                              {app.name}
                            </span>
                          </div>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-muted-foreground hover:text-foreground">
                      <Plus className="h-3 w-3" />
                      <span className="text-sm">Add apps</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
