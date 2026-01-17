import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/auth/LandingPage';
import { MainApp } from '@/components/MainApp';
import { DataSourceSelection } from '@/components/onboarding/DataSourceSelection';

/**
 * AppContent Component
 * Manages authentication flow and displays appropriate screens:
 * 1. LandingPage (Sign-in/Sign-up) - if not authenticated
 * 2. DataSourceSelection - if authenticated but no data source selected
 * 3. MainApp - if authenticated and data source selected
 */
function AppContent() {
  const { isAuthenticated, hasSelectedDataSource, selectDataSource } = useAuth();

  // Show landing page with sign-in/sign-up if not authenticated
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Show data source selection after successful authentication
  if (!hasSelectedDataSource) {
    return <DataSourceSelection onComplete={selectDataSource} />;
  }

  // Show main application after data source is selected
  return <MainApp />;
}

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
