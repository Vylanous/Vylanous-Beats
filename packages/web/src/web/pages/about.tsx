/** Vylanous about page: rendered from the Site Builder configuration.
    The builder page lives under the beats home section, so the short
    /about URL renders the page stored at /home/beats/about. */
import { ManagedPage } from "../components/managed-page";

export default function About() {
  return <ManagedPage path="/home/beats/about" />;
}
