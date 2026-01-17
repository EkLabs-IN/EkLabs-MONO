import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { RoleDashboard } from '@/components/dashboard/RoleDashboard';
import { QueryInterface } from '@/components/query/QueryInterface';
import { ROLE_CONFIGS } from '@/types/roles';

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Role-specific overview and compliance status' },
  query: { title: 'Query Interface', subtitle: 'Ask questions about your accessible data' },
  documents: { title: 'Document Traceability', subtitle: 'Browse and trace source documents' },
  history: { title: 'Query History', subtitle: 'Review past queries and responses' },
  notifications: { title: 'Notifications', subtitle: 'Alerts and compliance updates' }
};

export function MainApp() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  if (!user) return null;

  const roleConfig = ROLE_CONFIGS[user.role];
  const viewInfo = VIEW_TITLES[activeView] || VIEW_TITLES.dashboard;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar activeView={activeView} onNavigate={setActiveView} />
      
      <div className="ml-64 min-h-screen flex flex-col">
        <AppHeader 
          title={viewInfo.title} 
          subtitle={viewInfo.subtitle} 
        />
        
        <main className="flex-1">
          {activeView === 'dashboard' && <RoleDashboard />}
          {activeView === 'query' && <QueryInterface />}
          {activeView === 'documents' && (
            <div className="p-6">
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-muted-foreground">Document traceability panel - Coming soon</p>
              </div>
            </div>
          )}
          {activeView === 'history' && (
            <div className="p-6">
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-muted-foreground">Query history - Coming soon</p>
              </div>
            </div>
          )}
          {activeView === 'notifications' && (
            <div className="p-6">
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-muted-foreground">Notifications panel - Coming soon</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
