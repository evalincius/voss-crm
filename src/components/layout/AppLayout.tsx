import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-bg-app flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed((prev) => !prev)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
