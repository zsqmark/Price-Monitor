import React, { useState, useEffect, useMemo } from 'react';
import {
  InvoiceRecord,
  TrackedItem,
  AlertSettings,
  FolderMonitoringState,
} from './types/inventory';
import {
  buildTrackedItems,
  generatePriceAlerts,
  buildVendorProfiles,
  DEFAULT_ALERT_SETTINGS,
} from './services/inventoryEngine';
import { Header, ActiveTab } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { PriceAlertsCenter } from './components/PriceAlertsCenter';
import { ItemCatalog } from './components/ItemCatalog';
import { VendorRoster } from './components/VendorRoster';
import { FolderIngestMonitor } from './components/FolderIngestMonitor';
import { ItemPriceModal } from './components/ItemPriceModal';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { ChatAssistant } from './components/ChatAssistant';

export default function App() {
  // Invoices state with localStorage persistence - purged of all demo data
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    try {
      // One-time purge of legacy demo fixtures stored in client browser
      const isPurged = localStorage.getItem('lardertrack_demo_purged_v2');
      if (!isPurged) {
        localStorage.removeItem('lardertrack_invoices');
        localStorage.removeItem('lardertrack_dismissed_alerts');
        localStorage.setItem('lardertrack_demo_purged_v2', 'true');
        return [];
      }
      const saved = localStorage.getItem('lardertrack_invoices');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved invoices:', e);
    }
    return [];
  });

  // Alert settings state with localStorage persistence
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(() => {
    try {
      const saved = localStorage.getItem('lardertrack_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved settings:', e);
    }
    return DEFAULT_ALERT_SETTINGS;
  });

  // Dismissed alert IDs
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lardertrack_dismissed_alerts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load dismissed alerts:', e);
    }
    return [];
  });

  // Folder monitoring state
  const [monitoringState, setMonitoringState] = useState<FolderMonitoringState>({
    isMonitoring: false,
    folderName: 'No folder linked',
    lastScannedAt: 'Never',
    totalFilesTracked: 0,
    monitoredFileNames: [],
    isScanning: false,
    autoSyncIntervalMinutes: 15,
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modal inspection states
  const [selectedItem, setSelectedItem] = useState<TrackedItem | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lardertrack_invoices', JSON.stringify(invoices));
    } catch (e) {
      console.warn('Failed to save invoices to storage:', e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem('lardertrack_settings', JSON.stringify(alertSettings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }, [alertSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('lardertrack_dismissed_alerts', JSON.stringify(dismissedAlertIds));
    } catch (e) {
      console.warn('Failed to save dismissed alerts:', e);
    }
  }, [dismissedAlertIds]);

  // Derived intelligence calculations
  const trackedItems = useMemo(() => {
    return buildTrackedItems(invoices, alertSettings);
  }, [invoices, alertSettings]);

  const priceAlerts = useMemo(() => {
    return generatePriceAlerts(invoices, trackedItems, alertSettings, dismissedAlertIds);
  }, [invoices, trackedItems, alertSettings, dismissedAlertIds]);

  const vendorProfiles = useMemo(() => {
    return buildVendorProfiles(invoices, trackedItems);
  }, [invoices, trackedItems]);

  const activeAlerts = priceAlerts.filter(a => !a.dismissed);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  // Handlers
  const handleDismissAlert = (alertId: string) => {
    setDismissedAlertIds(prev => [...prev, alertId]);
  };

  const handleRestoreAlerts = () => {
    setDismissedAlertIds([]);
  };

  const handleAddInvoices = (newInvoices: InvoiceRecord[]) => {
    setInvoices(prev => {
      // deduplicate by invoiceNumber
      const existingNumbers = new Set(prev.map(i => i.invoiceNumber));
      const filteredNew = newInvoices.filter(i => !existingNumbers.has(i.invoiceNumber));
      return [...prev, ...filteredNew];
    });
  };

  const handleClearAllInvoices = () => {
    setInvoices([]);
    setDismissedAlertIds([]);
    setAlertSettings(DEFAULT_ALERT_SETTINGS);
    setMonitoringState(prev => ({
      ...prev,
      isMonitoring: false,
      folderName: 'No folder linked',
      lastScannedAt: 'Never',
      totalFilesTracked: 0,
      monitoredFileNames: [],
    }));
    try {
      localStorage.removeItem('lardertrack_invoices');
      localStorage.removeItem('lardertrack_dismissed_alerts');
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  };

  const handleSelectInvoiceByNumber = (invoiceNumber: string) => {
    const found = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (found) {
      setSelectedInvoice(found);
    }
  };

  const handleSelectItemByName = (itemName: string) => {
    const found = trackedItems.find(it => it.name.toLowerCase() === itemName.toLowerCase());
    if (found) {
      setSelectedItem(found);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-900">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertsCount={activeAlerts.length}
        criticalAlertsCount={criticalAlerts.length}
        isMonitoring={monitoringState.isMonitoring}
        onOpenFolderPicker={() => setActiveTab('folder')}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 md:pb-8">
        {activeTab === 'overview' && (
          <DashboardOverview
            invoices={invoices}
            trackedItems={trackedItems}
            alerts={priceAlerts}
            settings={alertSettings}
            folderName={monitoringState.folderName}
            isMonitoring={monitoringState.isMonitoring}
            onNavigateToTab={setActiveTab}
            onSelectItem={setSelectedItem}
            onSelectInvoice={setSelectedInvoice}
            onOpenFolderPicker={() => setActiveTab('folder')}
          />
        )}

        {activeTab === 'alerts' && (
          <PriceAlertsCenter
            alerts={priceAlerts}
            settings={alertSettings}
            trackedItems={trackedItems}
            onUpdateSettings={setAlertSettings}
            onDismissAlert={handleDismissAlert}
            onRestoreAlerts={handleRestoreAlerts}
            onSelectItem={setSelectedItem}
            onSelectInvoiceNumber={handleSelectInvoiceByNumber}
          />
        )}

        {activeTab === 'items' && (
          <ItemCatalog
            items={trackedItems}
            onSelectItem={setSelectedItem}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorRoster
            vendors={vendorProfiles}
            invoices={invoices}
            trackedItems={trackedItems}
            onSelectInvoice={setSelectedInvoice}
            onSelectItem={setSelectedItem}
          />
        )}

        {activeTab === 'folder' && (
          <FolderIngestMonitor
            invoices={invoices}
            monitoringState={monitoringState}
            onUpdateMonitoringState={setMonitoringState}
            onAddInvoices={handleAddInvoices}
            onSelectInvoice={setSelectedInvoice}
            onClearAllInvoices={handleClearAllInvoices}
          />
        )}

        {activeTab === 'chat' && (
          <div className="max-w-5xl mx-auto w-full">
            <ChatAssistant
              trackedItems={trackedItems}
              invoices={invoices}
              alerts={priceAlerts}
              vendors={vendorProfiles}
              settings={alertSettings}
              onSelectItem={setSelectedItem}
              onSelectInvoiceNumber={handleSelectInvoiceByNumber}
              onCloseDrawer={() => setActiveTab('overview')}
            />
          </div>
        )}
      </main>

      {/* Floating Quick AI Auditor Widget */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-30">
        {activeTab !== 'chat' ? (
          <button
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:brightness-105 active:scale-95 text-slate-950 font-bold text-xs rounded-full shadow-2xl transition-all hover:scale-105 cursor-pointer border border-amber-300/80 group"
            title="Open AI Cost Auditor"
          >
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
            <span>Ask LarderBot AI</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/95 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs rounded-full shadow-2xl transition-all cursor-pointer border border-slate-700 backdrop-blur-md"
            title="Return to Dashboard Overview"
          >
            <span>&larr; Exit AI Auditor</span>
          </button>
        )}
      </div>

      {/* Modals */}
      <ItemPriceModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSelectInvoice={handleSelectInvoiceByNumber}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        trackedItems={trackedItems}
        onClose={() => setSelectedInvoice(null)}
        onSelectItem={handleSelectItemByName}
      />
    </div>
  );
}
