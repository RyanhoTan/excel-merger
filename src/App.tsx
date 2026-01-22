// src/App.tsx

import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import MainLayout, { type RouteKey } from "./components/layout/MainLayout";
import DashboardPage from "./views/Dashboard/index";
import MergingPage from "./views/Merging";
import StudentsPage from "./views/Students";

import typographyStyles from "./components/ui/Typography.module.css";

const App: FC = () => {
  const getRouteFromHash = useCallback((): RouteKey => {
    // App routing: This project uses hash-based routing (e.g. #/dashboard, #/merging).
    // Keep backward compatibility with old hashes like #dashboard.
    const raw = window.location.hash.replace("#", "");
    const normalized = raw.startsWith("/") ? raw.slice(1) : raw;
    const route = normalized || "dashboard";
    if (route === "dashboard") return "dashboard";
    if (route === "merging") return "merging";
    if (route === "students") return "students";
    if (route === "ai") return "ai";
    return "dashboard";
  }, []);

  const [route, setRoute] = useState<RouteKey>(() => getRouteFromHash());

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [getRouteFromHash]);

  const navigate = useCallback((next: RouteKey) => {
    window.location.hash = `/${next}`;
  }, []);

  const page = useMemo(() => {
    if (route === "dashboard") {
      return <DashboardPage onNavigateToMerging={() => navigate("merging")} />;
    }

    if (route === "merging") {
      return <MergingPage />;
    }

    if (route === "students") {
      return <StudentsPage />;
    }

    return (
      <div>
        <h1 className={typographyStyles.pageTitle}>AI评语</h1>
        <p className={typographyStyles.pageSubtitle}>Coming Soon</p>
      </div>
    );
  }, [navigate, route]);

  return (
    <MainLayout activeRoute={route} onNavigate={navigate}>
      {page}
    </MainLayout>
  );
};

export default App;
