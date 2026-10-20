/** Vylanous licensing page: rendered from the Site Builder with live license modules.
    The builder page lives under the beats home section, so the short
    /licensing URL renders the page stored at /home/beats/licensing. */
import { ManagedPage } from "../components/managed-page";

export default function Licensing() {
  return <ManagedPage path="/home/beats/licensing" />;
}
