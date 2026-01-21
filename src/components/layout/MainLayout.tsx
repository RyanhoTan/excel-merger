// src/components/layout/MainLayout.tsx

import type { FC, ReactNode } from "react";
import { Bot, Combine, GraduationCap, Home, Sparkles } from "lucide-react";

export type RouteKey = "dashboard" | "merging" | "students" | "ai";

export interface MainLayoutProps {
  // Children renders the page body inside the right workspace area.
  children: ReactNode;
  activeRoute: RouteKey;
  onNavigate: (next: RouteKey) => void;
}

const MainLayout: FC<MainLayoutProps> = ({
  children,
  activeRoute,
  onNavigate,
}) => {
  const navItems: Array<{
    key: RouteKey;
    label: string;
    icon: ReactNode;
    disabled?: boolean;
    badge?: string;
  }> = [
    { key: "dashboard", label: "首页", icon: <Home size={16} /> },
    { key: "merging", label: "数据合并", icon: <Combine size={16} /> },
    {
      key: "students",
      label: "学生档案",
      icon: <GraduationCap size={16} />,
      badge: "Soon",
    },
    {
      key: "ai",
      label: "AI评语",
      icon: <Bot size={16} />,
      disabled: true,
      badge: "Coming Soon",
    },
  ];

  return (
    <div className="main-layout">
      <aside className="sidebar" aria-label="侧边导航">
        <div className="sidebar__card">
          <div className="sidebar__brand">
            <div className="sidebar__logo">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="sidebar__title">Class Manager</div>
              <div className="sidebar__subtitle">Optical Clean Workspace</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sidebar-nav__item ${
                  activeRoute === item.key ? "is-active" : ""
                } ${item.disabled ? "is-disabled" : ""}`}
                onClick={() => {
                  if (item.disabled) return;
                  onNavigate(item.key);
                }}
                aria-current={activeRoute === item.key ? "page" : undefined}
                aria-disabled={item.disabled ? true : undefined}
                disabled={item.disabled}
              >
                <span className="sidebar-nav__icon">{item.icon}</span>
                <span className="sidebar-nav__label">{item.label}</span>
                {item.badge ? (
                  <span className="sidebar-nav__badge">{item.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="workspace" aria-label="工作区">
        <div className="workspace__inner">{children}</div>
      </main>
    </div>
  );
};

export default MainLayout;
