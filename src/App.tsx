// App.tsx - Main Application Entry Point
// Byte-Sized Bandits Credit Score Tracker

import { AppProvider, useApp } from './Controllers/AppController';
import LoginPage from './Views/Auth/LoginPage';
import RegisterPage from './Views/Auth/RegisterPage';
import OnboardingPage from './Views/Auth/OnboardingPage';
import Sidebar from './Views/Shared/Sidebar';
import Dashboard from './Views/Home/Dashboard';
import ExpensesPage from './Views/Expenses/ExpensesPage';
import IncomePage from './Views/Income/IncomePage';
import SavingsPage from './Views/Savings/SavingsPage';
import CirclesPage from './Views/Circles/CirclesPage';
import CircleDetailPage from './Views/Circles/CircleDetailPage';
import FraudDetectorPage from './Views/FraudDetector/FraudDetectorPage';
import CashBackPage from './Views/CashBack/CashBackPage';
import SettingsPage from './Views/Settings/SettingsPage';

function AppContent() {
  const { currentPage } = useApp();

  // Auth pages (no sidebar)
  if (currentPage === 'login') return <LoginPage />;
  if (currentPage === 'register') return <RegisterPage />;
  if (currentPage === 'onboarding') return <OnboardingPage />;

  // App pages (with sidebar)
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'expenses': return <ExpensesPage />;
      case 'income': return <IncomePage />;
      case 'savings': return <SavingsPage />;
      case 'circles': return <CirclesPage />;
      case 'circle-detail': return <CircleDetailPage />;
      case 'fraud-detector': return <FraudDetectorPage />;
      case 'cashback': return <CashBackPage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 min-w-0 lg:pl-0 pt-14 lg:pt-0 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
