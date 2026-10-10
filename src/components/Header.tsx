import React from 'react';
import { ChefHat, FolderSync, AlertTriangle, Bot, Layers, Building2 } from 'lucide-react';

export type ActiveTab = 'overview' | 'alerts' | 'items' | 'vendors' | 'folder' | 'chat';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  isMonitoring: boolean;
  onOpenFolderPicker: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeAlertsCount,
  criticalAlertsCount,
  isMonitoring,
  onOpenFolderPicker,
}) => {
  return (
    <>
      {/* Top App Bar - Fixed top bar spanning viewport with aligned content container */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-white">
        {/* CSS Selector 1: div#root > div > header > div:nth-of-type(1) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* Zone 1: Brand Wordmark (Single text element / button) */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer text-left focus:outline-hidden"
              aria-label="LarderTrack Home"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/25 to-amber-500/10 border border-amber-400/35 flex items-center justify-center text-amber-400 shadow-xs shadow-amber-500/10 group-hover:bg-amber-400/30 transition-colors shrink-0">
                <ChefHat className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white group-hover:text-amber-300 transition-colors leading-tight">
                  LarderTrack
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-none hidden sm:inline-block">
                  Kitchen Cost Intelligence
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Segmented pill container for tablets/desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 backdrop-blur-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>Price Alerts</span>
              {activeAlertsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    criticalAlertsCount > 0
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {activeAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'items'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Purchased Items
            </button>

            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'vendors'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Vendors & Distributors
            </button>

            <button
              onClick={() => setActiveTab('folder')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'folder'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FolderSync className="w-3.5 h-3.5 text-slate-400" />
              <span>Folder & Status Board</span>
              {isMonitoring && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Monitoring Active" />
              )}
            </button>
          </nav>

          {/* Zone 3: Primary Action Container (CSS Selector 2: div:nth-of-type(2) > button:nth-of-type(1)) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenFolderPicker}
              className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg shadow-sm border border-amber-300/80 transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'folder' ? 'ring-2 ring-amber-300 shadow-md shadow-amber-500/20' : ''
              }`}
              title="Sync purchase invoices folder"
            >
              <FolderSync className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span>
                <span className="sm:hidden">Sync</span>
                <span className="hidden sm:inline">Sync Invoices</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Ergonomic Mobile Fixed Bottom Navigation Bar (Thumb Zone) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 px-1 py-1"
        style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
      >
        <div className="grid grid-cols-5 items-center h-14">
          {/* 1. Overview */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span className="text-[10px] mt-1 tracking-tight">Overview</span>
          </button>

          {/* 2. Price Alerts */}
          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative flex flex-col items-center justify-center min-h-[44px] py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'alerts'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <AlertTriangle className="w-4 h-4" />
              {activeAlertsCount > 0 && (
                <span
                  className={`absolute -top-1 -right-2 text-[8px] font-mono font-bold px-1 rounded-full ${
                    criticalAlertsCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {activeAlertsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Alerts</span>
          </button>

          {/* 3. Items */}
          <button
            onClick={() => setActiveTab('items')}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'items'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] mt-1 tracking-tight">Items</span>
          </button>

          {/* 4. Vendors */}
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'vendors'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="text-[10px] mt-1 tracking-tight">Vendors</span>
          </button>

          {/* 5. Status Board & Folder */}
          <button
            onClick={() => setActiveTab('folder')}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'folder'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderSync className="w-4 h-4" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Status Board</span>
          </button>
        </div>
      </nav>
    </>
  );
};
