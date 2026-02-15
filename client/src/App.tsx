import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";

// Pages
import SuiteDashboard from "@/pages/suite-dashboard";
import Overview from "@/pages/overview";
import Briefing from "@/pages/briefing";
import Financials from "@/pages/financials";
import Assessment from "@/pages/assessment";
import DataRoom from "@/pages/dataroom";
import Emails from "@/pages/emails";
import News from "@/pages/news";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        {/* New Suite Home */}
        <Route path="/" component={SuiteDashboard} />
        
        {/* Case Routes - parameterized by ID */}
        <Route path="/case/:id">
          {/* Default to overview if just ID provided */}
          <Overview />
        </Route>
        <Route path="/case/:id/briefing" component={Briefing} />
        <Route path="/case/:id/news" component={News} />
        <Route path="/case/:id/emails" component={Emails} />
        <Route path="/case/:id/financials" component={Financials} />
        <Route path="/case/:id/dataroom" component={DataRoom} />
        <Route path="/case/:id/assessment" component={Assessment} />

        {/* Legacy redirect for old links if any */}
        <Route path="/overview"><Redirect to="/case/varexia" /></Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
