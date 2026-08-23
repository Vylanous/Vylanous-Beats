/** Vylanous custom pages: dynamic paths rendered from the Site Builder configuration. */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { ManagedPage } from "../components/managed-page";
import { normalizeManagedPath } from "../lib/page-routes";

export default function BuilderPage() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);

  return <ManagedPage path={normalizeManagedPath(location)} />;
}
