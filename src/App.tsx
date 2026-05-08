import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Financeiro from "./pages/Financeiro";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PendingApproval from "./pages/PendingApproval";
import AdminUsers from "./pages/AdminUsers";
import MonthlyDashboard from "./pages/MonthlyDashboard";
import AnnualDashboard from "./pages/AnnualDashboard";
import Alunas from "./pages/Alunas";
import PersonalNutri from "./pages/PersonalNutri";
import CollaboratorArea from "./pages/CollaboratorArea";
import PageTest from "./pages/PageTest";
import Rotator from "./pages/Rotator";
import RedirectPage from "./pages/RedirectPage";
import NotFound from "./pages/NotFound";
import AgendarPublic from "./pages/Agendar";
import TesteAgendamento from "./pages/TesteAgendamento";
import WebinarVenda from "./pages/WebinarVenda";
import WebinarAvaliacao from "./pages/WebinarAvaliacao";
import WebinarDebug from "./pages/WebinarDebug";
import WebinarHub from "./pages/WebinarHub";
import WebinarSala from "./pages/WebinarSala";
import WebinarAnalytics from "./pages/WebinarAnalytics";
import GatewayDashboard from "./pages/GatewayDashboard";
import GatewayCobrancas from "./pages/GatewayCobrancas";
import GatewayLinks from "./pages/GatewayLinks";
import GatewayEmBreve from "./pages/GatewayEmBreve";
import GatewayTransacoes from "./pages/GatewayTransacoes";
import GatewayFinanceiro from "./pages/GatewayFinanceiro";
import GatewayApi from "./pages/GatewayApi";
import GatewayConfig from "./pages/GatewayConfig";
import CheckoutPublic from "./pages/CheckoutPublic";
import VendasFunil from "./pages/VendasFunil";
import CRM from "./pages/CRM";
import Disponibilidade from "./pages/Disponibilidade";
import InstallPWABanner from "./components/InstallPWABanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/agendar" element={<AgendarPublic />} />
            <Route path="/teste-agendamento" element={<TesteAgendamento />} />
            <Route path="/webinar" element={<ProtectedRoute><WebinarHub /></ProtectedRoute>} />
            <Route path="/webinar/sala" element={<WebinarSala />} />
            <Route path="/webinar/analytics" element={<ProtectedRoute><WebinarAnalytics /></ProtectedRoute>} />
            <Route path="/webinar/venda" element={<WebinarVenda />} />
            <Route path="/webinar/avaliacao" element={<WebinarAvaliacao />} />
            <Route path="/webinar/debug" element={<WebinarDebug />} />
            <Route path="/checkout/:linkId" element={<CheckoutPublic />} />
            <Route path="/gateway/dashboard" element={<ProtectedRoute requireAdmin><GatewayDashboard /></ProtectedRoute>} />
            <Route path="/gateway/cobrancas" element={<ProtectedRoute requireAdmin><GatewayCobrancas /></ProtectedRoute>} />
            <Route path="/gateway/links" element={<ProtectedRoute requireAdmin><GatewayLinks /></ProtectedRoute>} />
            <Route path="/gateway/transacoes" element={<ProtectedRoute requireAdmin><GatewayTransacoes /></ProtectedRoute>} />
            <Route path="/gateway/financeiro" element={<ProtectedRoute requireAdmin><GatewayFinanceiro /></ProtectedRoute>} />
            <Route path="/gateway/api" element={<ProtectedRoute requireAdmin><GatewayApi /></ProtectedRoute>} />
            <Route path="/gateway/configuracoes" element={<ProtectedRoute requireAdmin><GatewayConfig /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pending" element={<PendingApproval />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/vendas" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/vendas/funil" element={<ProtectedRoute><VendasFunil /></ProtectedRoute>} />
            <Route path="/balanco-mensal" element={<ProtectedRoute><MonthlyDashboard /></ProtectedRoute>} />
            <Route path="/anual" element={<ProtectedRoute><AnnualDashboard /></ProtectedRoute>} />
            <Route path="/alunas" element={<ProtectedRoute><Alunas /></ProtectedRoute>} />
            <Route path="/alunas/personal-nutri" element={<ProtectedRoute><PersonalNutri /></ProtectedRoute>} />
            <Route path="/colaborador" element={<ProtectedRoute><CollaboratorArea /></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
            <Route path="/disponibilidade" element={<ProtectedRoute><Disponibilidade /></ProtectedRoute>} />
            <Route path="/teste" element={<ProtectedRoute><PageTest /></ProtectedRoute>} />
            <Route path="/rotator" element={<ProtectedRoute><Rotator /></ProtectedRoute>} />
            <Route path="/r/:slug" element={<RedirectPage />} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <InstallPWABanner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
