import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AddExpense from "@/pages/AddExpense";
import Reports from "@/pages/Reports";
import Categories from "@/pages/Categories";
import SettingsPage from "@/pages/SettingsPage";
import AdminPanel from "@/pages/AdminPanel";
import ExtraFunds from "@/pages/ExtraFunds";
import Diary from "@/pages/Diary";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AuthGate() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-heading text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddExpense />} />
        <Route path="/funds" element={<ExtraFunds />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AuthGate />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
