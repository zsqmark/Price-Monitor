import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Receipt,
  DollarSign,
  FolderSync,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  InvoiceRecord,
  TrackedItem,
  PriceSpikeAlert,
  AlertSettings,
  ItemCategory,
} from '../types/inventory';

interface DashboardOverviewProps {
  invoices: InvoiceRecord[];
  trackedItems: TrackedItem[];
  alerts: PriceSpikeAlert[];
  settings: AlertSettings;
  folderName: string;
  isMonitoring: boolean;
  onNavigateToTab: (tab: 'alerts' | 'items' | 'vendors' | 'folder') => void;
  onSelectItem: (item: TrackedItem) => void;
  onSelectInvoice: (invoice: InvoiceRecord) => void;
  onOpenFolderPicker: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  invoices,
  trackedItems,
  alerts,
  settings,
  folderName,
  isMonitoring,
  onNavigateToTab,
  onSelectItem,
  onSelectInvoice,
  onOpenFolderPicker,
}) => {
  // Aggregate KPIs
  const totalSpend = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const activeAlerts = alerts.filter(a => !a.dismissed);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  const totalExcessCost = activeAlerts.reduce((sum, a) => sum + a.estimatedExcessCost, 0);
  const totalMonthlyImpact = activeAlerts.reduce((sum, a) => sum + a.projectedMonthlyImpact, 0);

  // Top price surges
  const topSurges = [...trackedItems]
    .filter(it => it.varianceFromAvgPct > 0)
    .sort((a, b) => b.varianceFromAvgPct - a.varianceFromAvgPct)
    .slice(0, 5);

  // Recent Invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // Category Spend breakdown
  const categorySpend = new Map<ItemCategory, number>();
  for (const inv of invoices) {
    for (const line of inv.items) {
      categorySpend.set(line.category, (categorySpend.get(line.category) || 0) + line.totalPrice);
    }
  }

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner if there are active price spikes */}
      {activeAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-800/60 rounded-xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-rose-300 font-medium">
                <span>MARGIN SPIKE ALERT</span>
                <span aria-hidden="true">·</span>
                <span>Threshold: &ge;{settings.marginThresholdPct}% over {settings.compareBaseline === 'prior_price' ? 'prior invoice' : 'historical average'}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {activeAlerts.length} ingredients exceeded cost margins ({criticalAlerts.length} critical surges)
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Estimated excess cost on recent invoices:{' '}
                <span className="font-mono font-bold text-rose-300">${totalExcessCost.toFixed(2)}</span>
                {' '}(projected <span className="font-mono font-bold text-amber-300">${totalMonthlyImpact.toFixed(2)}/mo</span> if current pricing holds).
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('alerts')}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-900 bg-rose-300 hover:bg-rose-200 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer flex items-center justify-center self-stretch sm:self-center"
          >
            Review {activeAlerts.length} Price Spikes &rarr;
          </button>
        </div>
      )}

      {/* Primary KPI Strip (2 columns on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Monitored Folder Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-1.5 sm:mb-2">
              <span className="truncate">Folder Ingest</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium text-[10px] sm:text-xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="hidden sm:inline">Active</span>
              </span>
            </div>
            <div className="text-base sm:text-xl font-bold font-mono text-white truncate" title={folderName}>
              {invoices.length} <span className="text-[11px] sm:text-xs font-normal text-slate-400 font-sans">invoices</span>
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-between">
            <span className="truncate max-w-[80px] sm:max-w-none">{folderName.split('/')[1] || 'Folder'}</span>
            <button
              onClick={() => onNavigateToTab('folder')}
              className="text-amber-400 hover:underline shrink-0 font-medium cursor-pointer"
            >
              Status Board &rarr;
            </button>
          </div>
        </div>

        {/* Total Invoiced Spend */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-1.5 sm:mb-2">
              <span className="truncate">Food Spend</span>
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
            </div>
            <div className="text-base sm:text-2xl font-bold font-mono tabular-nums text-white truncate">
              ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-2 pt-1 border-t border-slate-800/60 truncate">
            <span>{new Set(invoices.map(i => i.vendorName)).size} active vendors</span>
          </div>
        </div>

        {/* Active Cost Alerts */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-1.5 sm:mb-2">
              <span className="truncate">Cost Spikes</span>
              <AlertTriangle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeAlerts.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
            </div>
            <div className="text-base sm:text-2xl font-bold font-mono tabular-nums text-white flex items-baseline gap-1.5">
              <span className={activeAlerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {activeAlerts.length}
              </span>
              <span className="text-[10px] sm:text-xs font-normal text-slate-400 font-sans truncate">
                ({criticalAlerts.length} crit.)
              </span>
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-between">
            <span>&ge;{settings.marginThresholdPct}%</span>
            <button
              onClick={() => onNavigateToTab('alerts')}
              className="text-amber-400 hover:underline shrink-0 font-medium cursor-pointer"
            >
              Alerts &rarr;
            </button>
          </div>
        </div>

        {/* Ingredients Tracked */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-1.5 sm:mb-2">
              <span className="truncate">Item Catalog</span>
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
            </div>
            <div className="text-base sm:text-2xl font-bold font-mono tabular-nums text-white">
              {trackedItems.length} <span className="text-[11px] sm:text-xs font-normal text-slate-400 font-sans">items</span>
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-between">
            <span className="truncate">Price trends</span>
            <button
              onClick={() => onNavigateToTab('items')}
              className="text-amber-400 hover:underline shrink-0 font-medium cursor-pointer"
            >
              Items &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Top Surges & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Cost Surges & Price Differences */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Top Price Surges vs. Historical Baseline
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingredients with highest percentage price increase on recent deliveries
              </p>
            </div>
            {topSurges.length > 0 && (
              <button
                onClick={() => onNavigateToTab('items')}
                className="text-xs text-amber-400 hover:underline font-medium cursor-pointer"
              >
                View all &rarr;
              </button>
            )}
          </div>

          {topSurges.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-lg border border-slate-800/60 text-xs text-slate-400">
              <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No price surges recorded</p>
              <p className="text-slate-500 mt-1">Upload invoices to automatically track unit costs and detect margin spikes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topSurges.map((item, idx) => {
                const diffDollars = item.currentPrice - item.historicalAvgPrice;
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>{item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.lastVendor}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors mt-0.5 flex items-center gap-1">
                          <span>{item.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1 font-mono font-bold text-sm text-rose-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>+{item.varianceFromAvgPct}%</span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          +${diffDollars.toFixed(2)} / {item.unit}
                        </div>
                      </div>
                    </div>

                    {/* Price Comparison Sub-bar */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <div>
                        <span>Current: </span>
                        <span className="font-mono font-bold text-white">${item.currentPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span>Historical Avg: </span>
                        <span className="font-mono text-slate-300">${item.historicalAvgPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span>Prior: </span>
                        <span className="font-mono text-slate-300">${item.priorPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Recent Invoices Activity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Recent Purchase Invoices
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest deliveries indexed from monitored purchase folder
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('folder')}
              className="text-xs text-amber-400 hover:underline font-medium cursor-pointer"
            >
              {invoices.length > 0 ? 'Folder Status \u2192' : 'Upload Invoices \u2192'}
            </button>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-lg border border-slate-800/60 text-xs text-slate-400">
              <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No invoices ingested yet</p>
              <p className="text-slate-500 mt-1 mb-3">Sync your folder or drop PDF / CSV invoices to audit ingredients.</p>
              <button
                onClick={() => onNavigateToTab('folder')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                Upload Invoices &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono">{inv.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{inv.vendorCategory}</span>
                        {inv.status === 'flagged' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-rose-400 font-semibold">Spike Flagged</span>
                          </>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors mt-0.5 flex items-center gap-1.5">
                        <span>{inv.vendorName}</span>
                        <span className="text-xs font-normal text-slate-400 font-mono">
                          (#{inv.invoiceNumber})
                        </span>
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-sm text-white">
                        ${inv.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {inv.items.length} line items
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                    <span className="truncate max-w-[260px] text-slate-400">File: {inv.fileName}</span>
                    <span className="text-amber-400/90 group-hover:underline text-[11px] font-medium">
                      Inspect details &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Spend Distribution Strip */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white tracking-tight mb-3">
          Spend Distribution by Ingredient Category
        </h3>
        {categorySpend.size === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/60">
            Ingredient category spend distribution will appear here once invoices are ingested.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from(categorySpend.entries()).map(([cat, amount]) => {
              const pct = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
              return (
                <div key={cat} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                  <span className="text-xs text-slate-400 block truncate">{cat}</span>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    ${amount.toFixed(0)}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {pct.toFixed(1)}% of budget
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
