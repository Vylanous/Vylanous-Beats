import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import Index from "./pages/index";
import { Provider } from "./components/provider";

const BeatsPage = lazy(() => import("./pages/beats"));
const BeatDetail = lazy(() => import("./pages/beat-detail"));
const Licensing = lazy(() => import("./pages/licensing"));
const CartPage = lazy(() => import("./pages/cart"));
const SuccessPage = lazy(() => import("./pages/success"));
const About = lazy(() => import("./pages/about"));
const AdminPage = lazy(() => import("./pages/admin"));
const BuilderPage = lazy(() => import("./pages/builder-page"));
const AgentFeedback = import.meta.env.DEV
  ? lazy(() =>
      import("@runablehq/website-runtime").then(({ AgentFeedback }) => ({
        default: AgentFeedback,
      })),
    )
  : null;

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
          <Route path="/beats/:slug" component={BeatDetail} />
          <Route path="/licensing" component={Licensing} />
          <Route path="/cart" component={CartPage} />
          <Route path="/success" component={SuccessPage} />
          <Route path="/about" component={About} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/:slug" component={BuilderPage} />
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
