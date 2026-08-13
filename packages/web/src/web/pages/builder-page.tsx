/** Vylanous custom pages: dynamic paths rendered from the Site Builder configuration. */
import { useRoute } from "wouter";
import { ManagedPage } from "../components/managed-page";

export default function BuilderPage() {
  const [, params] = useRoute("/:slug");
  return <ManagedPage path={`/${params?.slug || ""}`} />;
}
