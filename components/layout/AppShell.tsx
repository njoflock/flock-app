"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    avatar: string | null;
    initials: string;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarW = collapsed ? 64 : 228;

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", `${sidebarW}px`);
  }, [sidebarW]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#ffffff" }}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        user={user}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar user={user} />

        <main
          className="flex-1 overflow-y-auto"
          style={{ background: "#ffffff" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
