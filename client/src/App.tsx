import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";

import Landing from "@/pages/landing";
import Portal from "@/pages/portal";
import CustomerPortal from "@/pages/customer-portal";
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
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/portal" component={Portal} />
      <Route path="/portal/:customerId" component={CustomerPortal} />

      <Route path="/case/:id">
        <Layout><Overview /></Layout>
      </Route>
      <Route path="/case/:id/briefing">
        <Layout><Briefing /></Layout>
      </Route>
      <Route path="/case/:id/news">
        <Layout><News /></Layout>
      </Route>
      <Route path="/case/:id/emails">
        <Layout><Emails /></Layout>
      </Route>
      <Route path="/case/:id/financials">
        <Layout><Financials /></Layout>
      </Route>
      <Route path="/case/:id/dataroom">
        <Layout><DataRoom /></Layout>
      </Route>
      <Route path="/case/:id/assessment">
        <Layout><Assessment /></Layout>
      </Route>

      <Route path="/overview"><Redirect to="/case/varexia" /></Route>

      <Route component={NotFound} />
    </Switch>
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
