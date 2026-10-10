import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Sliders,
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  Eye,
  Calendar,
  Building2,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  PriceSpikeAlert,
  AlertSettings,
  ItemCategory,
  TrackedItem,
} from '../types/inventory';

interface PriceAlertsCenterProps {
  alerts: PriceSpikeAlert[];
  settings: AlertSettings;
  trackedItems: TrackedItem[];
  onUpdateSettings: (newSettings: AlertSettings) => void;
  onDismissAlert: (alertId: string) => void;
  onRestoreAlerts: () => void;
  onSelectItem: (item: TrackedItem) => void;
  onSelectInvoiceNumber: (invoiceNumber: string) => void;
}

export const PriceAlertsCenter: React.FC<PriceAlertsCenterProps> = ({
  alerts,
  settings,
  trackedItems,
  onUpdateSettings,
  onDismissAlert,
  onRestoreAlerts,
  onSelectItem,
  onSelectInvoiceNumber,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [showDismissed, setShowDismissed] = useState(false);

  // Active vs Dismissed alerts
  const visibleAlerts = alerts.filter(a => {
    if (!showDismissed && a.dismissed) return false;
    if (showDismissed && !a.dismissed) return false;

    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.itemName.toLowerCase().includes(q) ||
        a.vendorName.toLowerCase().includes(q) ||
        a.invoiceNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const totalExcessCost = activeAlerts.reduce((sum, a) => sum + a.estimatedExcessCost, 0);
  const totalMonthlyImpact = activeAlerts.reduce((sum, a) => sum + a.projectedMonthlyImpact, 0);

  const categories: ItemCategory[] = [
    'Produce',
    'Proteins',
    'Dairy & Eggs',
    'Pantry & Dry Goods',
    'Beverages',
    'Disposables',
  ];

  return (
    <div className="space-y-6">
      {/* Configuration & Threshold Adjustment Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
              <Sliders className="w-4 h-4" />
              <span>MARGIN VARIANCE CONTROLS</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Predefined Margin & Spike Alert Rules
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Define the percentage cost surge that triggers operational alerts against historical baselines.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
            {[10, 15, 20, 25, 30].map(pct => (
              <button
                key={pct}
                onClick={() => onUpdateSettings({ ...settings, marginThresholdPct: pct })}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                  settings.marginThresholdPct === pct
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                +{pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Live Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
          {/* Threshold Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-200">Alert Trigger Threshold:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                +{settings.marginThresholdPct}% Surge
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={settings.marginThresholdPct}
              onChange={e =>
                onUpdateSettings({ ...settings, marginThresholdPct: Number(e.target.value) })
              }
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>+5% (Sensitive)</span>
              <span>+25% (Standard)</span>
              <span>+50% (Extreme)</span>
            </div>
          </div>

          {/* Baseline Type Selector */}
          <div>
            <span className="font-semibold text-slate-200 block mb-1.5">Comparison Baseline:</span>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => onUpdateSettings({ ...settings, compareBaseline: 'historical_avg' })}
                className={`px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer text-center ${
                  settings.compareBaseline === 'historical_avg'
                    ? 'bg-slate-800 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Historical Average
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, compareBaseline: 'prior_price' })}
                className={`px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer text-center ${
                  settings.compareBaseline === 'prior_price'
                    ? 'bg-slate-800 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Last Prior Purchase
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {settings.compareBaseline === 'historical_avg'
                ? 'Flags items exceeding the cumulative weighted mean across all deliveries.'
                : 'Flags items jumping directly against the immediate previous order price.'}
            </p>
          </div>

          {/* Summary Stat in config */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <span className="text-slate-400 block mb-1">Impact of Current Rule:</span>
            <div className="text-sm text-slate-200">
              <span className="font-mono font-bold text-rose-400 text-base">{activeAlerts.length}</span> items breached threshold
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">
              Total excess invoice cost: <span className="text-white font-bold">${totalExcessCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ingredient, vendor, or invoice #..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
          />
        </div>

        {/* Severity Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs overflow-x-auto shrink-0">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
              severityFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Alerts ({activeAlerts.length})
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
              severityFilter === 'critical'
                ? 'bg-rose-500/20 text-rose-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Critical &ge;25% ({criticalCount})
          </button>
          <button
            onClick={() => setSeverityFilter('warning')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
              severityFilter === 'warning'
                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Moderate ({activeAlerts.length - criticalCount})
          </button>
        </div>

        {/* Dismissed toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDismissed(!showDismissed)}
            className={`px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${
              showDismissed
                ? 'bg-slate-800 border-amber-400/50 text-amber-300 font-medium'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showDismissed ? 'Viewing Dismissed' : 'Show Dismissed'}
          </button>
          {showDismissed && (
            <button
              onClick={onRestoreAlerts}
              className="p-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              title="Restore all dismissed alerts"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills / Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-amber-400 text-slate-950 font-semibold'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Categories
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-amber-400 text-slate-950 font-semibold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Alerts Stream List */}
      {visibleAlerts.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Price Margin Breaches Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            {showDismissed
              ? 'There are currently no dismissed alerts.'
              : `All recent delivery prices are within your +${settings.marginThresholdPct}% margin threshold.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleAlerts.map(alert => {
            const isCritical = alert.severity === 'critical';
            const matchingItem = trackedItems.find(it => it.id === alert.itemId);

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-4.5 transition-all ${
                  isCritical
                    ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-700/80'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Item & Context */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        +{alert.variancePct}% PRICE SPIKE
                      </span>
                      <span className="text-slate-400">{alert.category}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-300 font-medium">{alert.vendorName}</span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">
                      {alert.itemName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{alert.invoiceDate}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Invoice:{' '}
                        <button
                          onClick={() => onSelectInvoiceNumber(alert.invoiceNumber)}
                          className="font-mono text-amber-400 hover:underline cursor-pointer font-medium"
                        >
                          #{alert.invoiceNumber}
                        </button>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        Qty on order: {alert.quantity} {alert.unit}
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Price Difference Numbers */}
                  <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg text-xs shrink-0 lg:min-w-[320px]">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Paid Unit Price</span>
                      <div className="font-mono text-sm font-bold text-white">
                        ${alert.currentPrice.toFixed(2)}
                        <span className="text-[10px] text-slate-400 font-sans font-normal ml-0.5">/{alert.unit}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">
                        {alert.baselineType === 'prior_price' ? 'Prior Price' : 'Historical Avg'}
                      </span>
                      <div className="font-mono text-sm text-slate-300">
                        ${alert.baselinePrice.toFixed(2)}
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block mb-0.5">Price Difference</span>
                      <div className="font-mono text-sm font-bold text-rose-400">
                        +${alert.priceDifference.toFixed(2)}
                        <span className="text-[11px] font-sans font-normal ml-1">
                          (+{alert.variancePct}%)
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Immediate Order Excess:</span>
                      <span className="font-mono font-bold text-rose-300">
                        +${alert.estimatedExcessCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions (Mobile full-width buttons) */}
                  <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-between lg:justify-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (matchingItem) onSelectItem(matchingItem);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Price Trend</span>
                    </button>

                    {!alert.dismissed ? (
                      <button
                        onClick={() => onDismissAlert(alert.id)}
                        className="w-full sm:w-auto px-3 py-2 min-h-[38px] text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Acknowledge / Dismiss
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 italic text-center py-1">Dismissed</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
