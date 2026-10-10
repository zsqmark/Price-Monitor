import React, { useState } from 'react';
import {
  Building2,
  Receipt,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight,
  Search,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { VendorProfile, InvoiceRecord, TrackedItem } from '../types/inventory';

interface VendorRosterProps {
  vendors: VendorProfile[];
  invoices: InvoiceRecord[];
  trackedItems: TrackedItem[];
  onSelectInvoice: (invoice: InvoiceRecord) => void;
  onSelectItem: (item: TrackedItem) => void;
}

export const VendorRoster: React.FC<VendorRosterProps> = ({
  vendors,
  invoices,
  trackedItems,
  onSelectInvoice,
  onSelectItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);

  const filteredVendors = vendors.filter(v => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.itemsSupplied.some(it => it.toLowerCase().includes(q))
    );
  });

  // Selected vendor invoices
  const vendorInvoices = selectedVendor
    ? invoices.filter(inv => inv.vendorName === selectedVendor.name)
    : [];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
              <Building2 className="w-4 h-4" />
              <span>DISTRIBUTORS & SUPPLIER ROSTER</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Restaurant Vendors & Market Competitiveness
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Detailed tracking of every food service distributor, cumulative order spend, invoice volume, and price stability.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search suppliers or supplied goods..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map(vendor => {
          const isAboveAvg = vendor.priceCompetitiveness === 'above_average';
          const isBelowAvg = vendor.priceCompetitiveness === 'below_average';

          return (
            <div
              key={vendor.id}
              onClick={() => setSelectedVendor(vendor)}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/10 transition-colors">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                        {vendor.name}
                      </h3>
                      <span className="text-xs text-slate-400">{vendor.category}</span>
                    </div>
                  </div>

                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 my-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Total Invoiced</span>
                    <span className="font-mono text-base font-bold text-white">
                      ${vendor.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Orders Indexed</span>
                    <span className="font-mono text-base font-bold text-slate-200">
                      {vendor.totalInvoices} invoices
                    </span>
                  </div>
                </div>

                {/* Price Index / Competitiveness */}
                <div className="flex items-center justify-between text-xs py-1 border-t border-slate-800/60">
                  <span className="text-slate-400">Price Competitiveness:</span>
                  <span
                    className={`font-semibold ${
                      isAboveAvg
                        ? 'text-rose-400'
                        : isBelowAvg
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {isAboveAvg
                      ? 'Above Market (+Premium)'
                      : isBelowAvg
                      ? 'Competitive (-Savings)'
                      : 'Standard Market'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-t border-slate-800/60">
                  <span className="text-slate-400">Average Order Size:</span>
                  <span className="font-mono text-slate-200">${vendor.averageOrderValue.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-t border-slate-800/60">
                  <span className="text-slate-400">Last Invoice:</span>
                  <span className="font-mono text-slate-200">{vendor.lastInvoiceDate}</span>
                </div>
              </div>

              {/* Items sample tags */}
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="font-medium text-slate-300 block mb-1">Supplied Items ({vendor.itemsSupplied.length}):</span>
                <p className="truncate text-slate-400">
                  {vendor.itemsSupplied.slice(0, 3).join(', ')}
                  {vendor.itemsSupplied.length > 3 ? ` +${vendor.itemsSupplied.length - 3} more` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Vendor Drilldown Drawer / Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden my-0 sm:my-8 max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            {/* Mobile Grab Handle */}
            <div className="sm:hidden w-10 h-1.5 bg-slate-700/80 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-800 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1">
                  <span>{selectedVendor.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedVendor.totalInvoices} Invoices Recorded</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{selectedVendor.name}</h2>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="p-2 sm:px-3 sm:py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-1">Total Invoiced Spend</span>
                  <div className="text-lg font-bold font-mono text-white">
                    ${selectedVendor.totalSpend.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Average Order Value</span>
                  <div className="text-lg font-bold font-mono text-slate-200">
                    ${selectedVendor.averageOrderValue.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Price Competitiveness</span>
                  <div className="text-sm font-semibold text-amber-400 pt-1">
                    {selectedVendor.priceCompetitiveness.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Items supplied by this vendor */}
              <div>
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-2">
                  Items Purchased from {selectedVendor.name} ({selectedVendor.itemsSupplied.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedVendor.itemsSupplied.map((itemName, i) => {
                    const tracked = trackedItems.find(
                      t => t.name.toLowerCase() === itemName.toLowerCase()
                    );
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (tracked) {
                            setSelectedVendor(null);
                            onSelectItem(tracked);
                          }
                        }}
                        className="p-2.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-200 truncate">{itemName}</span>
                        {tracked && (
                          <span className="font-mono text-slate-300 shrink-0 ml-2">
                            ${tracked.currentPrice.toFixed(2)}/{tracked.unit}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invoices from this vendor */}
              <div>
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-2">
                  Invoice History ({vendorInvoices.length})
                </h4>
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Invoice #</th>
                        <th className="py-2 px-3">Items</th>
                        <th className="py-2 px-3 text-right">Total</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {vendorInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-mono text-slate-300">{inv.date}</td>
                          <td className="py-2 px-3 font-mono text-amber-400">{inv.invoiceNumber}</td>
                          <td className="py-2 px-3 text-slate-300">{inv.items.length} items</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white">
                            ${inv.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedVendor(null);
                                onSelectInvoice(inv);
                              }}
                              className="text-amber-400 hover:underline cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
