import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  ChargerSummary,
  ChargerDetailData,
  AlertItem,
  FleetOverviewData,
  ThemeMode,
  FaultType,
  TelemetryHistoryPoint
} from '../types';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socketService';
import { generateTelemetryHistory } from '../services/mockData';

interface FleetContextType {
  chargers: ChargerSummary[];
  overview: FleetOverviewData | null;
  alerts: AlertItem[];
  selectedChargerId: string | null;
  selectedChargerDetail: ChargerDetailData | null;
  activeTab: 'map' | 'fleet' | 'detail' | 'alerts';
  theme: ThemeMode;
  isWsConnected: boolean;
  isFaultModalOpen: boolean;
  faultModalChargerId: string | null;
  telemetryHistory: TelemetryHistoryPoint[];
  lastUpdated: Date;
  setActiveTab: (tab: 'map' | 'fleet' | 'detail' | 'alerts') => void;
  setTheme: (theme: ThemeMode) => void;
  selectCharger: (chargerId: string) => Promise<void>;
  clearSelectedCharger: () => void;
  openFaultModal: (chargerId?: string) => void;
  closeFaultModal: () => void;
  injectFault: (chargerId: string, faultType: FaultType) => Promise<void>;
  acknowledgeAlert: (alertId: string) => void;
  refreshData: () => Promise<void>;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chargers, setChargers] = useState<ChargerSummary[]>([]);
  const [overview, setOverview] = useState<FleetOverviewData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedChargerId, setSelectedChargerId] = useState<string | null>(null);
  const [selectedChargerDetail, setSelectedChargerDetail] = useState<ChargerDetailData | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'fleet' | 'detail' | 'alerts'>('map');
  const [theme, setTheme] = useState<ThemeMode>('black');
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [isFaultModalOpen, setIsFaultModalOpen] = useState<boolean>(false);
  const [faultModalChargerId, setFaultModalChargerId] = useState<string | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistoryPoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const refreshData = useCallback(async () => {
    try {
      const [chargersRes, overviewRes, alertsRes] = await Promise.all([
        apiService.getChargers(),
        apiService.getFleetOverview(),
        apiService.getAlerts()
      ]);

      setChargers(chargersRes.chargers);
      setOverview(overviewRes);
      setAlerts(alertsRes.alerts);
      setLastUpdated(new Date());

      if (selectedChargerId) {
        const detail = await apiService.getChargerById(selectedChargerId);
        setSelectedChargerDetail(detail);
      }
    } catch {
      // Handled by service fallbacks
    }
  }, [selectedChargerId]);

  const selectCharger = useCallback(async (chargerId: string) => {
    setSelectedChargerId(chargerId);
    try {
      const detail = await apiService.getChargerById(chargerId);
      setSelectedChargerDetail(detail);
      
      const found = chargers.find(c => c.charger_id === chargerId);
      if (found) {
        setTelemetryHistory(generateTelemetryHistory(found, 20));
      }
      setActiveTab('detail');
    } catch {
      // Fallback
    }
  }, [chargers]);

  const clearSelectedCharger = useCallback(() => {
    setSelectedChargerId(null);
    setSelectedChargerDetail(null);
    setActiveTab('map');
  }, []);

  const openFaultModal = useCallback((chargerId?: string) => {
    setFaultModalChargerId(chargerId || selectedChargerId || chargers[0]?.charger_id || null);
    setIsFaultModalOpen(true);
  }, [selectedChargerId, chargers]);

  const closeFaultModal = useCallback(() => {
    setIsFaultModalOpen(false);
    setFaultModalChargerId(null);
  }, []);

  const injectFault = useCallback(async (chargerId: string, faultType: FaultType) => {
    await apiService.injectFault(chargerId, faultType);
    await refreshData();
    if (selectedChargerId === chargerId) {
      const detail = await apiService.getChargerById(chargerId);
      setSelectedChargerDetail(detail);
      const found = chargers.find(c => c.charger_id === chargerId);
      if (found) {
        setTelemetryHistory(generateTelemetryHistory(found, 20));
      }
    }
  }, [refreshData, selectedChargerId, chargers]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  useEffect(() => {
    refreshData();
    socketService.init();

    const unsubStatus = socketService.subscribeStatus((connected) => {
      setIsWsConnected(connected);
    });

    const unsubAlerts = socketService.subscribeAlerts((newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
    });

    const unsubFleet = socketService.subscribeFleetUpdate((data) => {
      setChargers(prev => {
        const updated = prev.map(c => {
          if (data.health_scores[c.charger_id] !== undefined) {
            const score = data.health_scores[c.charger_id];
            let risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
            if (score < 30) risk = 'CRITICAL';
            else if (score < 60) risk = 'HIGH';
            else if (score < 75) risk = 'MEDIUM';
            return {
              ...c,
              health_score: score,
              risk_level: risk
            };
          }
          return c;
        });
        return updated;
      });

      setLastUpdated(new Date());

      if (selectedChargerId) {
        const currentCharger = chargers.find(c => c.charger_id === selectedChargerId);
        if (currentCharger) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const noise = (Math.random() - 0.5) * 0.8;
          const temp = Math.round((currentCharger.temperature + noise) * 10) / 10;
          const volt = Math.round((currentCharger.voltage + noise * 1.5) * 10) / 10;
          const curr = currentCharger.state === 'charging' ? Math.max(0, Math.round((currentCharger.current + noise * 4) * 10) / 10) : 0;
          const pwr = Math.round(((volt * curr) / 1000) * 10) / 10;

          const newPoint: TelemetryHistoryPoint = {
            time: timeStr,
            timestamp: now.getTime(),
            temperature: temp,
            voltage: volt,
            current: curr,
            power_kw: pwr,
            safe_temp_limit: 60.0,
            nominal_voltage: 400.0
          };

          setTelemetryHistory(prev => {
            const next = [...prev.slice(-19), newPoint];
            return next;
          });
        }
      }
    });

    return () => {
      unsubStatus();
      unsubAlerts();
      unsubFleet();
    };
  }, [refreshData, selectedChargerId, chargers]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-black', 'theme-dark', 'theme-light');
    if (theme === 'black') {
      root.classList.add('theme-black');
      root.style.colorScheme = 'dark';
    } else if (theme === 'dark') {
      root.classList.add('theme-dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('theme-light');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  return (
    <FleetContext.Provider
      value={{
        chargers,
        overview,
        alerts,
        selectedChargerId,
        selectedChargerDetail,
        activeTab,
        theme,
        isWsConnected,
        isFaultModalOpen,
        faultModalChargerId,
        telemetryHistory,
        lastUpdated,
        setActiveTab,
        setTheme,
        selectCharger,
        clearSelectedCharger,
        openFaultModal,
        closeFaultModal,
        injectFault,
        acknowledgeAlert,
        refreshData
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
