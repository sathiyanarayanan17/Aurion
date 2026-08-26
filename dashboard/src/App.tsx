import React from 'react';
import { FleetProvider, useFleet } from './context/FleetContext';
import { Header } from './components/common/Header';
import { MapView } from './components/map/MapView';
import { FleetOverview } from './components/fleet/FleetOverview';
import { ChargerDetail } from './components/detail/ChargerDetail';
import { AlertsFeed } from './components/alerts/AlertsFeed';
import { FaultModal } from './components/common/FaultModal';

const DashboardContent: React.FC = () => {
  const { activeTab, theme } = useFleet();

  return (
    <div className={`min-h-screen font-sans transition-colors ${
      theme === 'black'
        ? 'bg-black text-slate-100'
        : theme === 'dark'
        ? 'bg-slate-950 text-slate-100'
        : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Header */}
      <Header />

      {/* Main View Area */}
      <main className="transition-all duration-300">
        {activeTab === 'map' && <MapView />}
        {activeTab === 'fleet' && <FleetOverview />}
        {activeTab === 'detail' && <ChargerDetail />}
        {activeTab === 'alerts' && <AlertsFeed />}
      </main>

      {/* Global Fault Injection Sandbox Modal */}
      <FaultModal />
    </div>
  );
};

export function App() {
  return (
    <FleetProvider>
      <DashboardContent />
    </FleetProvider>
  );
}

export default App;
