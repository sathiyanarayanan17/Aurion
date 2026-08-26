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
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
