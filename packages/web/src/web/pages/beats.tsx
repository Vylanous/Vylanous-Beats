/** Vylanous beat catalog: rendered from the Site Builder while retaining live catalog controls.
    The builder page lives under the beats home section, so the short
    /beats URL renders the page stored at /home/beats/beats. */
import { ManagedPage } from "../components/managed-page";

export default function BeatsPage() {
  return <ManagedPage path="/home/beats/beats" />;
}
