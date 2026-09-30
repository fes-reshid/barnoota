import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./app/AppProvider";
import { FullPageSpinner } from "./components/ui/Spinner";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { OnboardingPage } from "./pages/auth/OnboardingPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { CustomersPage } from "./pages/customers/CustomersPage";
import { CustomerDetailPage } from "./pages/customers/CustomerDetailPage";
import { InvoicesPage } from "./pages/invoices/InvoicesPage";
import { InvoiceEditorPage } from "./pages/invoices/InvoiceEditorPage";
import { InvoiceViewPage } from "./pages/invoices/InvoiceViewPage";
import { QuotesPage } from "./pages/quotes/QuotesPage";
import { QuoteEditorPage } from "./pages/quotes/QuoteEditorPage";
import { QuoteViewPage } from "./pages/quotes/QuoteViewPage";
import { ProductsPage } from "./pages/products/ProductsPage";
import { PaymentsPage } from "./pages/payments/PaymentsPage";
import { ReportsPage } from "./pages/reports/ReportsPage";
import { SettingsPage } from "./pages/settings/SettingsPage";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, authLoading, businessLoading, needsOnboarding } = useApp();
  if (authLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  if (businessLoading) return <FullPageSpinner />;
  return children;
}

function RedirectIfAuthed({ children }: { children: React.ReactElement }) {
  const { user, authLoading, needsOnboarding } = useApp();
  if (authLoading) return <FullPageSpinner />;
  if (user && !needsOnboarding) return <Navigate to="/" replace />;
  if (user && needsOnboarding) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
        <Route path="/signup" element={<RedirectIfAuthed><SignupPage /></RedirectIfAuthed>} />
        <Route path="/forgot-password" element={<RedirectIfAuthed><ForgotPasswordPage /></RedirectIfAuthed>} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/new" element={<InvoiceEditorPage />} />
          <Route path="/invoices/:invoiceId/edit" element={<InvoiceEditorPage />} />
          <Route path="/invoices/:invoiceId" element={<InvoiceViewPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/quotes/new" element={<QuoteEditorPage />} />
          <Route path="/quotes/:quoteId/edit" element={<QuoteEditorPage />} />
          <Route path="/quotes/:quoteId" element={<QuoteViewPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
