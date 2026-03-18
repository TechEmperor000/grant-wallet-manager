import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import TawkToWidget from "@/components/TawkToWidget";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import ApplyPage from "./pages/ApplyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/apply" element={<ProtectedRoute><ApplyPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <TawkToWidget />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
