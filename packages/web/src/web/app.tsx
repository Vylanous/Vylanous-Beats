import { lazy, Suspense } from "react";
import { Route, Switch, Redirect, useLocation } from "wouter";
import Index from "./pages/index";
import { Provider } from "./components/provider";
import { ManagedPage } from "./components/managed-page";
import { useSiteSettings } from "./lib/site-settings";
import {
  MANAGED_PAGE_FALLBACK_ROUTE,
  builderPagePath,
  normalizeManagedPath,
} from "./lib/page-routes";

const BeatsPage = lazy(() => import("./pages/beats"));
const BeatDetail = lazy(() => import("./pages/beat-detail"));
const Licensing = lazy(() => import("./pages/licensing"));
const CartPage = lazy(() => import("./pages/cart"));
const SuccessPage = lazy(() => import("./pages/success"));
const About = lazy(() => import("./pages/about"));
const AdminPage = lazy(() => import("./pages/admin"));
const BuilderPage = lazy(() => import("./pages/builder-page"));
const LoginPage = lazy(() => import("./pages/login"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const VerifyEmailPage = lazy(() => import("./pages/verify-email"));
const PrivacyPage = lazy(() =>
  import("./pages/legal").then(({ PrivacyPage }) => ({ default: PrivacyPage })),
);
const TermsPage = lazy(() =>
  import("./pages/legal").then(({ TermsPage }) => ({ default: TermsPage })),
);
const AgentFeedback = import.meta.env.DEV
  ? lazy(() =>
      import("@runablehq/website-runtime").then(({ AgentFeedback }) => ({
        default: AgentFeedback,
      })),
    )
  : null;

const OLD_BEATS_HOME = "/home/vylanous-beats";
const NEW_BEATS_HOME = "/home/beats";

function BeatsHomeRoute() {
  const [location] = useLocation();
  const { pages } = useSiteSettings();
  const current = normalizeManagedPath(location);
  const live = (path: string) =>
    pages.some((p) => p.published && builderPagePath(p) === path);
  const renamed = pages.length > 0 && !live(OLD_BEATS_HOME) && live(NEW_BEATS_HOME);
  if (renamed && current === OLD_BEATS_HOME) {
    return <Redirect to={NEW_BEATS_HOME} />;
  }
  if (current === NEW_BEATS_HOME && !renamed) {
    // Page still lives at the old path: serve it here too.
    return <ManagedPage path={OLD_BEATS_HOME} />;
  }
  return <BuilderPage />;
}

function App() {
  return (
    <Provider>
      <Suspense
        fallback={
          <div className="min-h-screen grid place-items-center bg-vb-black">
            <output
              aria-live="polite"
              className="font-sub uppercase tracking-wider text-vb-purple-bright"
            >
              Loading page…
            </output>
          </div>
        }
      >
        <Switch>
          <Route path="/" component={Index} />
          <Route path="/beats" component={BeatsPage} />
          {/* Builder pages under /beats/ must match before /beats/:slug,
              or "featured"/"dark" are treated as beat slugs and the pages
              render "Beat not found" instead of their content. */}
          <Route path="/beats/featured" component={BuilderPage} />
          <Route path="/beats/dark" component={BuilderPage} />
          <Route path="/beats/:slug" component={BeatDetail} />
          <Route path="/licensing" component={Licensing} />
          <Route path="/cart" component={CartPage} />
          <Route path="/success" component={SuccessPage} />
          <Route path="/about" component={About} />
          <Route path="/login" component={LoginPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/verify-email" component={VerifyEmailPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/admin" component={AdminPage} />
          {/* Beats home URL migration: the managed page is moving from
              /home/vylanous-beats to /home/beats (page path edited in Admin
              Studio). This keeps both URLs working no matter which change
              lands first: before the rename /home/beats aliases the live
              page; after the rename /home/vylanous-beats redirects to it. */}
          <Route path="/home/vylanous-beats" component={BeatsHomeRoute} />
          <Route path="/home/beats" component={BeatsHomeRoute} />
          <Route path={MANAGED_PAGE_FALLBACK_ROUTE} component={BuilderPage} />
          <Route>
            <div className="min-h-screen grid place-items-center bg-vb-black">
              <div className="text-center">
                <h1 className="font-display uppercase text-7xl text-chrome">404</h1>
                <a href="/" className="font-sub uppercase tracking-wider text-vb-purple-bright">
                  ← Home
                </a>
              </div>
            </div>
          </Route>
        </Switch>
      </Suspense>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {AgentFeedback && <AgentFeedback />}
    </Provider>
  );
}

export default App;
