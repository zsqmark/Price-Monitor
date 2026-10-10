import React from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Calendar, Building2, AlertCircle } from 'lucide-react';
import { TrackedItem, PricePoint } from '../types/inventory';

interface ItemPriceModalProps {
  item: TrackedItem | null;
  onClose: () => void;
  onSelectInvoice?: (invoiceNumber: string) => void;
}

export const ItemPriceModal: React.FC<ItemPriceModalProps> = ({
  item,
  onClose,
  onSelectInvoice,
}) => {
  if (!item) return null;

  const points = item.priceHistory;
  const isUp = item.varianceFromAvgPct > 0;
  const isPriorUp = item.varianceFromPriorPct > 0;

  // Compute SVG chart coordinates
  const chartHeight = 160;
  const chartWidth = 540;
  const paddingX = 40;
  const paddingY = 24;

  const prices = points.map(p => p.unitPrice);
  const minVal = Math.min(...prices) * 0.92;
  const maxVal = Math.max(...prices) * 1.08;
  const valRange = maxVal - minVal || 1;

  const coords = points.map((p, idx) => {
    const x = points.length === 1
      ? chartWidth / 2
      : paddingX + (idx / (points.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((p.unitPrice - minVal) / valRange) * (chartHeight - paddingY * 2);
    return { x, y, point: p };
  });

  const pathD = coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = coords.length > 0
    ? `${pathD} L ${coords[coords.length - 1].x} ${chartHeight - paddingY} L ${coords[0].x} ${chartHeight - paddingY} Z`
    : '';

  // Avg line Y
  const avgY = chartHeight - paddingY - ((item.historicalAvgPrice - minVal) / valRange) * (chartHeight - paddingY * 2);

  // Group by vendor for vendor quote comparison
  const vendorQuotes = new Map<string, PricePoint[]>();
  points.forEach(p => {
    if (!vendorQuotes.has(p.vendorName)) vendorQuotes.set(p.vendorName, []);
    vendorQuotes.get(p.vendorName)!.push(p);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden my-0 sm:my-8 max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
        {/* Mobile Grab Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-700/80 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1">
              <span>{item.category}</span>
              <span aria-hidden="true">·</span>
              <span>Unit: {item.unit}</span>
              <span aria-hidden="true">·</span>
              <span>{item.purchaseCount} purchases tracked</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{item.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 block mb-1">Current Unit Price</span>
              <div className="text-lg font-bold font-mono tabular-nums text-white">
                ${item.currentPrice.toFixed(2)}
                <span className="text-xs text-slate-400 font-sans font-normal ml-1">/ {item.unit}</span>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 block mb-1">Historical Average</span>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-300">
                ${item.historicalAvgPrice.toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 block mb-1">Variance vs Avg</span>
              <div
                className={`text-lg font-bold font-mono tabular-nums flex items-center gap-1 ${
                  isUp ? (item.varianceFromAvgPct >= 15 ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'
                }`}
              >
                {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isUp ? `+${item.varianceFromAvgPct}%` : `${item.varianceFromAvgPct}%`}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 block mb-1">Price Range (Min/Max)</span>
              <div className="text-sm font-semibold font-mono tabular-nums text-slate-300 pt-0.5">
                ${item.minPrice.toFixed(2)} – ${item.maxPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Spike Callout Banner if variance is high */}
          {item.isSpike && (
            <div className="bg-rose-950/30 border border-rose-800/60 rounded-lg p-3.5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-300">Cost Margin Alert Active</h4>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  The latest invoice for {item.name} reflects a{' '}
                  <span className="font-mono font-bold text-white">+{item.varianceFromAvgPct}%</span> surge over historical baseline. Last prior price was{' '}
                  <span className="font-mono font-bold text-white">${item.priorPrice.toFixed(2)}</span>.
                </p>
              </div>
            </div>
          )}

          {/* SVG Price Trend Chart */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium text-slate-300">Historical Unit Price Progression</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
                  <span>Invoice Price</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-slate-500 border-t border-dashed border-slate-400 inline-block" />
                  <span>Average (${item.historicalAvgPrice.toFixed(2)})</span>
                </span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 select-none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#334155" strokeWidth="0.5" />

                {/* Average line */}
                <line
                  x1={paddingX}
                  y1={avgY}
                  x2={chartWidth - paddingX}
                  y2={avgY}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />

                {/* Area under curve */}
                {areaD && <path d={areaD} fill="url(#chartGradient)" />}

                {/* Main line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {coords.map((c, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r="4"
                      className="fill-amber-400 stroke-slate-900 stroke-2 group-hover:r-6 transition-all"
                    />
                    <text
                      x={c.x}
                      y={c.y - 10}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-200 font-mono font-medium"
                    >
                      ${c.point.unitPrice.toFixed(2)}
                    </text>
                    <text
                      x={c.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-400 font-mono"
                    >
                      {c.point.date.slice(5)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Multi-Vendor Comparison (if multiple vendors have supplied it) */}
          {vendorQuotes.size > 1 && (
            <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Cross-Vendor Quote Comparison
              </h4>
              <div className="space-y-2">
                {Array.from(vendorQuotes.entries()).map(([vName, vPoints]) => {
                  const latestVPoint = vPoints[vPoints.length - 1];
                  const diffFromCurrent = latestVPoint.unitPrice - item.currentPrice;
                  return (
                    <div key={vName} className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-200">{vName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400">Last quote: {latestVPoint.date}</span>
                        <span className="font-mono font-bold text-white">${latestVPoint.unitPrice.toFixed(2)} / {item.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historical Purchase Log Table */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Invoice Purchase History
            </h4>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {[...points].reverse().map((p, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-300">{p.date}</td>
                      <td className="py-2 px-3 text-slate-300">{p.vendorName}</td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => {
                            if (onSelectInvoice) onSelectInvoice(p.invoiceNumber);
                          }}
                          className="font-mono text-amber-400 hover:underline cursor-pointer"
                        >
                          {p.invoiceNumber}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-300">
                        {p.quantity} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-white">
                        ${p.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-300">
                        ${p.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
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
