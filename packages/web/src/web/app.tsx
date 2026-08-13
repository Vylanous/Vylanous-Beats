import { Route, Switch } from "wouter";
import Index from "./pages/index";
import BeatsPage from "./pages/beats";
import BeatDetail from "./pages/beat-detail";
import Licensing from "./pages/licensing";
import CartPage from "./pages/cart";
import SuccessPage from "./pages/success";
import About from "./pages/about";
import AdminPage from "./pages/admin";
import { Provider } from "./components/provider";
import { AgentFeedback } from "@runablehq/website-runtime";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/beats" component={BeatsPage} />
        <Route path="/beats/:slug" component={BeatDetail} />
        <Route path="/licensing" component={Licensing} />
        <Route path="/cart" component={CartPage} />
        <Route path="/success" component={SuccessPage} />
        <Route path="/about" component={About} />
        <Route path="/admin" component={AdminPage} />
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
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
    </Provider>
  );
}

export default App;
