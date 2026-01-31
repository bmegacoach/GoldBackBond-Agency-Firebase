import { DashboardLayout } from './components/layout/DashboardLayout';
import { Overview } from './components/Overview';
import { LeadsManager } from './components/LeadsManager';
import { CustomersManager } from './components/CustomersManager';
import { InvestmentPackages } from './components/InvestmentPackages';
import { PaymentsManager } from './components/PaymentsManager';
import { TicketsManager } from './components/TicketsManager';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PipelineView } from './components/pipeline/PipelineView';
import { AILeadScoringPanel } from './components/pipeline/AILeadScoringPanel';
import { TreasuryDashboard } from './components/treasury/TreasuryDashboard';
import { UserManagementPanel } from './components/admin/UserManagementPanel';
import { ContractManagementPanel } from './components/contracts/ContractManagementPanel';
import { AutomatedOnboardingPanel } from './components/onboarding/AutomatedOnboardingPanel';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { PaymentResult } from './components/PaymentResult';
import { LandingPage } from './components/LandingPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/firebase/auth-context';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-300 border-t-accent-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="leads" element={<LeadsManager />} />
        <Route path="customers" element={<CustomersManager />} />
        <Route path="packages" element={<InvestmentPackages />} />
        <Route path="payments" element={<PaymentsManager />} />
        <Route path="tickets" element={<TicketsManager />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="pipeline" element={<PipelineView />} />
        <Route path="lead-scoring" element={<AILeadScoringPanel />} />
        <Route path="treasury" element={<TreasuryDashboard />} />
        <Route path="contracts" element={<ContractManagementPanel />} />
        <Route path="onboarding" element={<AutomatedOnboardingPanel />} />
        <Route path="admin/users" element={<UserManagementPanel />} />
      </Routes>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/payment" element={<PaymentResult />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard/*" element={<ProtectedRoutes />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
