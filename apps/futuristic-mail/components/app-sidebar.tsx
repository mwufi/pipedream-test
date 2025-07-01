"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  teams: [
    {
      name: "Overview",
      logo: GalleryVerticalEnd,
      plan: "Beta",
    }
  ],
  navMain: [
    {
      title: "Your Journey",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Stats",
          url: "#",
        },
        {
          title: "Activity",
          url: "#",
        },
        {
          title: "Personalization",
          url: "#",
        },
      ]
    },
    {
      title: "Inbox Agents",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Reply Agent",
          url: "/v2/reply-agent",
        },
        {
          title: "Categorize",
          url: "#",
        },
        {
          title: "Summarize Agent",
          url: "#",
        }
      ],
      addActions: [
        {
          label: "Add new agent",
          action: () => {
            console.log("Adding new agent to Inbox Agents")
            // Add your logic here to create a new agent
          }
        },
        {
          label: "Import agent",
          action: () => {
            console.log("Importing agent")
            // Add your logic here to import an agent
          }
        }
      ]
    }
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()

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
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
