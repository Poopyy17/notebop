import { type LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavMainItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  badge?: string
  disabled?: boolean
}

interface NavMainProps {
  items: NavMainItem[]
}

export function NavMain({ items }: NavMainProps) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild={!item.disabled}
            isActive={item.isActive}
            className={item.disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
          >
            {item.disabled ? (
              <span className="flex items-center gap-2">
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </span>
            ) : (
              <Link to={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
