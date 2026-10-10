import React from 'react';
import { X, FileText, Calendar, Building2, DollarSign, AlertCircle, ArrowUpRight } from 'lucide-react';
import { InvoiceRecord, TrackedItem } from '../types/inventory';

interface InvoiceDetailModalProps {
  invoice: InvoiceRecord | null;
  trackedItems: TrackedItem[];
  onClose: () => void;
  onSelectItem?: (itemName: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  trackedItems,
  onClose,
  onSelectItem,
}) => {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden my-0 sm:my-8 max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
        {/* Mobile Grab Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-700/80 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-400">
                <span>{invoice.vendorCategory}</span>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-[140px] sm:max-w-none">File: {invoice.fileName}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Invoice #{invoice.invoiceNumber}</span>
                {invoice.status === 'flagged' && (
                  <span className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Spike Flagged
                  </span>
                )}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Metadata bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Vendor</span>
              <span className="font-semibold text-white truncate block">{invoice.vendorName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Invoice Date</span>
              <span className="font-mono text-slate-200">{invoice.date}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Tax & Surcharges</span>
              <span className="font-mono text-slate-200">${(invoice.taxAmount || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Total Amount</span>
              <span className="font-mono text-base font-bold text-amber-400">${invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3 text-xs text-slate-300">
              <span className="font-semibold text-slate-400 block mb-0.5">Delivery Notes & Market Context:</span>
              <p>{invoice.notes}</p>
            </div>
          )}

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Extracted Line Items ({invoice.items.length})
              </h4>
              <span className="text-[11px] text-slate-400">Click item for trend</span>
            </div>

            {/* Mobile Line Items View (< sm:) */}
            <div className="sm:hidden space-y-2">
              {invoice.items.map((line, idx) => {
                const tracked = trackedItems.find(
                  t => t.name.toLowerCase() === line.name.toLowerCase()
                );
                const avg = tracked?.historicalAvgPrice || line.unitPrice;
                const diffPct = avg > 0 ? ((line.unitPrice - avg) / avg) * 100 : 0;
                const isSpike = diffPct >= 15;

                return (
                  <div
                    key={idx}
                    onClick={() => onSelectItem && onSelectItem(line.name)}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors active:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-slate-400">{line.category}</div>
                        <h5 className="font-semibold text-slate-100 text-xs mt-0.5">{line.name}</h5>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-xs">
                          ${line.totalPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {line.quantity} {line.unit} @ ${line.unitPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {isSpike && (
                      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-rose-400 font-medium">
                        <span>Spike vs Hist. Avg (${avg.toFixed(2)}):</span>
                        <span>+{diffPct.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Line Items Table (sm:) */}
            <div className="hidden sm:block border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Historical Avg</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {invoice.items.map((line, idx) => {
                    const tracked = trackedItems.find(
                      t => t.name.toLowerCase() === line.name.toLowerCase()
                    );
                    const avg = tracked?.historicalAvgPrice || line.unitPrice;
                    const diffPct = avg > 0 ? ((line.unitPrice - avg) / avg) * 100 : 0;
                    const isSpike = diffPct >= 15;

                    return (
                      <tr
                        key={idx}
                        onClick={() => onSelectItem && onSelectItem(line.name)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-100 flex items-center gap-1 group-hover:text-amber-300">
                            <span>{line.name}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{line.category}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                          {line.quantity} {line.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-white">
                          <div className="flex items-center justify-end gap-1.5">
                            <span>${line.unitPrice.toFixed(2)}</span>
                            {isSpike && (
                              <span className="text-[10px] text-rose-400 font-bold">
                                (+{diffPct.toFixed(0)}%)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-400">
                          ${avg.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-200">
                          ${line.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-950/80 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
