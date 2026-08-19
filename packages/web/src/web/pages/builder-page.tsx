/** Vylanous custom pages: dynamic paths rendered from the Site Builder configuration. */
import { useLocation } from "wouter";
import { ManagedPage } from "../components/managed-page";
import { normalizeManagedPath } from "../lib/page-routes";

export default function BuilderPage() {
  const [location] = useLocation();
  return <ManagedPage path={normalizeManagedPath(location)} />;
}
