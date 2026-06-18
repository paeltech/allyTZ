import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardOrRedirectAdmin from "@/components/auth/DashboardOrRedirectAdmin";
import DashboardFeature from "./pages/DashboardFeature";
import TradeWithAllyTZ from "./pages/TradeWithAllyTZ";
import Signals from "./pages/Signals";
import EventsPage from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Enquiry from "./pages/Enquiry";
import Collaborations from "./pages/Collaborations";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TradeAnalysis from "./pages/TradeAnalysis";
import NotificationPreferences from "./pages/NotificationPreferences";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Privacy from "./pages/Privacy";
import DeleteAccount from "./pages/DeleteAccount";
import SupabaseSessionProvider from "@/components/auth/SupabaseSessionProvider";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireAdmin from "@/components/auth/RequireAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import AdminCollaborations from "./pages/admin/AdminCollaborations";
import AdminTradeAnalyses from "./pages/admin/AdminTradeAnalyses";
import AdminPurchases from "./pages/admin/AdminPurchases";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminSignals from "./pages/admin/AdminSignals";
import AdminTips from "./pages/admin/AdminTips";
import AdminDocuments from "./pages/admin/AdminDocuments";
import Documents from "./pages/Documents";
import DebugAdmin from "./pages/DebugAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SupabaseSessionProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/dashboard" element={<RequireAuth><DashboardOrRedirectAdmin /></RequireAuth>} />
            <Route path="/dashboard/trade-with-allytz" element={<RequireAuth><TradeWithAllyTZ /></RequireAuth>} />
            <Route path="/dashboard/signals" element={<RequireAuth><Signals /></RequireAuth>} />
            <Route path="/dashboard/events" element={<RequireAuth><EventsPage /></RequireAuth>} />
            <Route path="/dashboard/events/:eventId" element={<RequireAuth><EventDetails /></RequireAuth>} />
            <Route path="/dashboard/enquiry" element={<RequireAuth><Enquiry /></RequireAuth>} />
            <Route path="/dashboard/collaborations" element={<RequireAuth><Collaborations /></RequireAuth>} />
            <Route path="/dashboard/trade-analysis" element={<RequireAuth><TradeAnalysis /></RequireAuth>} />
            <Route path="/dashboard/documents" element={<RequireAuth><Documents /></RequireAuth>} />
            <Route path="/dashboard/resources" element={<RequireAuth><Documents /></RequireAuth>} />
            <Route path="/dashboard/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
            <Route path="/dashboard/notification-preferences" element={<RequireAuth><NotificationPreferences /></RequireAuth>} />
            <Route path="/dashboard/delete-account" element={<RequireAuth><DeleteAccount /></RequireAuth>} />
            <Route path="/dashboard/:section" element={<RequireAuth><DashboardFeature /></RequireAuth>} />
            {/* Admin Routes */}
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/admin/enquiries" element={<RequireAdmin><AdminEnquiries /></RequireAdmin>} />
            <Route path="/admin/collaborations" element={<RequireAdmin><AdminCollaborations /></RequireAdmin>} />
            <Route path="/admin/trade-analyses" element={<RequireAdmin><AdminTradeAnalyses /></RequireAdmin>} />
            <Route path="/admin/purchases" element={<RequireAdmin><AdminPurchases /></RequireAdmin>} />
            <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
            <Route path="/admin/events" element={<RequireAdmin><AdminEvents /></RequireAdmin>} />
            <Route path="/admin/signals" element={<RequireAdmin><AdminSignals /></RequireAdmin>} />
            <Route path="/admin/tips" element={<RequireAdmin><AdminTips /></RequireAdmin>} />
            <Route path="/admin/documents" element={<RequireAdmin><AdminDocuments /></RequireAdmin>} />
            <Route path="/debug-admin" element={<RequireAuth><DebugAdmin /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SupabaseSessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;