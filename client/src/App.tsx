import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

// Pages
import Home from "@/pages/Home";
import Membership from "@/pages/Membership";
import Events from "@/pages/Events";
import Meetings from "@/pages/Meetings";
import Officers from "@/pages/Officers";
import Join from "@/pages/Join";
import Champions from "@/pages/Champions";
import FAQ from "@/pages/FAQ";
import Resources from "@/pages/Resources";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/membership" component={Membership} />
      <Route path="/events" component={Events} />
      <Route path="/meetings" component={Meetings} />
      <Route path="/officers" component={Officers} />
      <Route path="/join" component={Join} />
      <Route path="/faqs" component={FAQ} />
      <Route path="/resources" component={Resources} />
      <Route path="/champions" component={Champions} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex min-h-screen flex-col font-sans">
          <ScrollToTop />
          <Navigation />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
