// src/components/layout/MainLayout.tsx

import type { FC, ReactNode } from "react";
import { Bot, Combine, GraduationCap, Home, Sparkles } from "lucide-react";

import styles from "./MainLayout.module.css";

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
    <div className={styles.mainLayout}>
      <aside className={styles.sidebar} aria-label="侧边导航">
        <div className={styles.sidebarCard}>
          <div className={styles.sidebarBrand}>
            <div className={styles.sidebarLogo}>
              <Sparkles size={16} />
            </div>
            <div>
              <div className={styles.sidebarTitle}>Class Manager</div>
              <div className={styles.sidebarSubtitle}>
                Optical Clean Workspace
              </div>
            </div>
          </div>

          <nav className={styles.sidebarNav}>
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.navItem} ${
                  activeRoute === item.key ? styles.navItemActive : ""
                } ${item.disabled ? styles.navItemDisabled : ""}`}
                onClick={() => {
                  if (item.disabled) return;
                  onNavigate(item.key);
                }}
                aria-current={activeRoute === item.key ? "page" : undefined}
                aria-disabled={item.disabled ? true : undefined}
                disabled={item.disabled}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {item.badge ? (
                  <span className={styles.navBadge}>{item.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className={styles.workspace} aria-label="工作区">
        <div className={styles.workspaceInner}>{children}</div>
      </main>
    </div>
  );
};

export default MainLayout;
