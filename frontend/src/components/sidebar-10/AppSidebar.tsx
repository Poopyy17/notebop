import * as React from "react"
import {
  Home,
  Inbox,
  Trash2,
  Users,
} from "lucide-react"
import { useUser } from "@stackframe/react"
import { useLocation } from "react-router-dom"

import { PublicBoards } from "@/components/sidebar-10/PublicBoards"
import { PrivateBoards } from "@/components/sidebar-10/PrivateBoards"
import { NavMain } from "@/components/sidebar-10/NavMain"
import { NavSecondary } from "@/components/sidebar-10/NavSecondary"
import { NavUser } from "@/components/sidebar-10/NavUser"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const navSecondary = [
  {
    title: "Trash",
    url: "/trash",
    icon: Trash2,
  },
  // {
  //   title: "Settings",
  //   url: "#",
  //   icon: Settings2,
  // },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useUser()
  const location = useLocation()

  const navMain = [
    // {
    //   title: "Search",
    //   url: "#",
    //   icon: Search,
    // },
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: location.pathname === "/",
    },
    {
      title: "Friends",
      url: "/friends",
      icon: Users,
      isActive: location.pathname === "/friends",
    },
    {
      title: "Inbox (coming soon)",
      url: "#",
      icon: Inbox,
      disabled: true,
    },
  ]

  const userData = {
    name: user?.displayName || user?.primaryEmail?.split('@')[0] || 'User',
    email: user?.primaryEmail || '',
    avatar: user?.profileImageUrl || '',
  }

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <NavUser user={userData} />
        <NavMain items={navMain} />
      </SidebarHeader>
      <SidebarContent>
        <PublicBoards />
        <PrivateBoards />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
