"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChartBarIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "全般", href: "/account/settings", icon: UsersIcon },
  { name: "認証", href: "/account/auth", icon: ChartBarIcon },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 w-64 hidden lg:block mr-0 lg:mr-12">
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive ? "bg-accent text-foreground" : "text-muted-foreground"
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-150",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
