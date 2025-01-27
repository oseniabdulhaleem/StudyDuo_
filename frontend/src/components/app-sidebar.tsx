import { usePathname } from "next/navigation";
import { BookOpen, List, Plus, Settings } from "lucide-react";

import Link from "next/link";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <Sidebar closeOnClick={true} className={cn("w-64", className)}>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xl font-semibold"
        >
          <BookOpen className="h-6 w-6" />
          <span>StudyDuo</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="All Revisions"
                  className={cn(
                    "transition-all duration-300 ease-in-out h-12",
                    pathname === "/dashboard" &&
                      "border-l-2 border-primary bg-base-800 h-16"
                  )}
                >
                  <Link href="/dashboard" className="flex items-center">
                    <List className="ml-2 h-6 w-6 font-semibold" />
                    <span className="font-semibold"> All Revisions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/new-revision"}
                  tooltip="New Revision"
                  className={cn(
                    "transition-all duration-300 ease-in-out h-12",
                    pathname === "/dashboard/new-revision" &&
                      "border-l-2 border-primary bg-base-800 h-16"
                  )}
                >
                  <Link
                    href="/dashboard/new-revision"
                    className="flex items-center"
                  >
                    <Plus className="ml-2 h-6 w-6" />
                    <span className="font-semibold"> New Revision</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/settings"}
                  tooltip="Settings"
                  className={cn(
                    "transition-all duration-300 ease-in-out h-12",
                    pathname === "/dashboard/settings" &&
                      "border-l-2 border-primary bg-base-800 h-16"
                  )}
                >
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center"
                  >
                    <Settings className="ml-2 h-4 w-4" />
                    <span className="font-semibold"> Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
