import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FleetProvider } from './context/FleetContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { MapPage } from './pages/dashboard/MapPage';
import { FleetPage } from './pages/dashboard/FleetPage';
import { AlertsPage } from './pages/dashboard/AlertsPage';
import { ChargerDetailPage } from './pages/dashboard/ChargerDetailPage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { ExplainabilityPage } from './pages/dashboard/ExplainabilityPage';
import { ComparePage } from './pages/dashboard/ComparePage';
import { TimelinePage } from './pages/dashboard/TimelinePage';
import { DataReplayPage } from './pages/dashboard/DataReplayPage';
import { RevenueImpactPage } from './pages/dashboard/RevenueImpactPage';
import { MaintenancePage } from './pages/dashboard/MaintenancePage';
import { AlertRulesPage } from './pages/dashboard/AlertRulesPage';
import { SLAPage } from './pages/dashboard/SLAPage';
import { ExportPage } from './pages/dashboard/ExportPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard (Protected) */}
        <Route path="/dashboard" element={
          <FleetProvider>
            <DashboardLayout />
          </FleetProvider>
        }>
          <Route index element={<OverviewPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="charger/:chargerId" element={<ChargerDetailPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="explainability" element={<ExplainabilityPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="replay" element={<DataReplayPage />} />
          <Route path="revenue" element={<RevenueImpactPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="rules" element={<AlertRulesPage />} />
          <Route path="sla" element={<SLAPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
