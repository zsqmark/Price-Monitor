import React, { useState } from 'react';
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  Filter,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { TrackedItem, ItemCategory } from '../types/inventory';

interface ItemCatalogProps {
  items: TrackedItem[];
  onSelectItem: (item: TrackedItem) => void;
}

type SortField = 'variance' | 'currentPrice' | 'totalSpend' | 'purchaseCount' | 'name';

export const ItemCatalog: React.FC<ItemCatalogProps> = ({
  items,
  onSelectItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('variance');
  const [sortAsc, setSortAsc] = useState(false);

  const categories: ItemCategory[] = [
    'Produce',
    'Proteins',
    'Dairy & Eggs',
    'Pantry & Dry Goods',
    'Beverages',
    'Disposables',
  ];

  // Filtering
  const filteredItems = items.filter(it => {
    if (selectedCategory !== 'All' && it.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        it.name.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.lastVendor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    let comp = 0;
    if (sortField === 'variance') {
      comp = b.varianceFromAvgPct - a.varianceFromAvgPct;
    } else if (sortField === 'currentPrice') {
      comp = b.currentPrice - a.currentPrice;
    } else if (sortField === 'totalSpend') {
      comp = b.totalSpend - a.totalSpend;
    } else if (sortField === 'purchaseCount') {
      comp = b.purchaseCount - a.purchaseCount;
    } else if (sortField === 'name') {
      comp = a.name.localeCompare(b.name);
    }
    return sortAsc ? -comp : comp;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
              <Layers className="w-4 h-4" />
              <span>PURCHASED INGREDIENTS & SUPPLIES</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Purchased Items Directory & Unit Price Monitor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 sm:mt-1">
              Live audit of every ingredient purchased across invoices, tracking unit price changes, historical averages, and variance.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-950 px-3 py-1.5 sm:py-2 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Total Unique Items:</span>
            <span className="font-mono font-bold text-white">{items.length}</span>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-800">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ingredient (Avocado, Ribeye, Butter)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 min-h-[42px]"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 sm:py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-amber-400 cursor-pointer min-h-[42px]"
            >
              <option value="All">All Categories ({items.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick mobile sort pills */}
        <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-slate-800/80 text-[11px] mt-3">
          <span className="text-slate-400 shrink-0">Sort:</span>
          <button
            onClick={() => handleSort('variance')}
            className={`px-2.5 py-1 rounded-md shrink-0 transition-colors cursor-pointer ${sortField === 'variance' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300'}`}
          >
            Spike %
          </button>
          <button
            onClick={() => handleSort('currentPrice')}
            className={`px-2.5 py-1 rounded-md shrink-0 transition-colors cursor-pointer ${sortField === 'currentPrice' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300'}`}
          >
            Price
          </button>
          <button
            onClick={() => handleSort('totalSpend')}
            className={`px-2.5 py-1 rounded-md shrink-0 transition-colors cursor-pointer ${sortField === 'totalSpend' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300'}`}
          >
            Spend
          </button>
          <button
            onClick={() => handleSort('name')}
            className={`px-2.5 py-1 rounded-md shrink-0 transition-colors cursor-pointer ${sortField === 'name' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300'}`}
          >
            Name
          </button>
        </div>
      </div>

      {/* MOBILE VIEW: Touch-Friendly Tap Card List (< sm:) */}
      <div className="sm:hidden space-y-2.5">
        {sortedItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            No ingredients match your search.
          </div>
        ) : (
          sortedItems.map(item => {
            const isUp = item.varianceFromAvgPct > 0;
            const diffDollars = item.currentPrice - item.historicalAvgPrice;
            const isSevereSpike = item.varianceFromAvgPct >= 20;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:bg-slate-800/80 transition-all cursor-pointer flex flex-col gap-2.5 shadow-xs"
              >
                {/* Top Row: Name & Price Diff Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{item.lastVendor}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight truncate mt-0.5">
                      {item.name}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        isUp
                          ? isSevereSpike
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isUp ? `+${item.varianceFromAvgPct}%` : `${item.varianceFromAvgPct}%`}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Key Pricing Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/70 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Current Price</span>
                    <span className="font-mono font-bold text-white text-sm">
                      ${item.currentPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">/{item.unit}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Hist. Avg</span>
                    <span className="font-mono text-slate-300 text-xs">
                      ${item.historicalAvgPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Range: ${item.minPrice.toFixed(0)}-${item.maxPrice.toFixed(0)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Price Delta</span>
                    <span
                      className={`font-mono font-semibold text-xs ${
                        isUp ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isUp ? `+$${diffDollars.toFixed(2)}` : `-$${Math.abs(diffDollars).toFixed(2)}`}
                    </span>
                    <span className="text-[10px] text-amber-400 flex items-center justify-end gap-0.5 mt-0.5">
                      <span>History &rarr;</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP VIEW: High-Density Table (sm:) */}
      <div className="hidden sm:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Ingredient / Item Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Category</th>
                <th
                  onClick={() => handleSort('currentPrice')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Current Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Historical Avg</th>
                <th className="py-3 px-3 text-right">Prior Price</th>
                <th
                  onClick={() => handleSort('variance')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Price Difference</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Historical Range</th>
                <th
                  onClick={() => handleSort('totalSpend')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total Spend</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No ingredients match the current search filters.
                  </td>
                </tr>
              ) : (
                sortedItems.map(item => {
                  const isUp = item.varianceFromAvgPct > 0;
                  const diffDollars = item.currentPrice - item.historicalAvgPrice;
                  const isSevereSpike = item.varianceFromAvgPct >= 20;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Name & Supplier */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                          <span>{item.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Last bought from: <span className="text-slate-300">{item.lastVendor}</span> ({item.lastPurchasedDate})
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="text-slate-400 font-medium">{item.category}</span>
                      </td>

                      {/* Current Price */}
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                        <div className="font-bold text-white text-sm">
                          ${item.currentPrice.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans font-normal">
                          / {item.unit}
                        </div>
                      </td>

                      {/* Historical Avg */}
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-300">
                        ${item.historicalAvgPrice.toFixed(2)}
                      </td>

                      {/* Prior Price */}
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-400">
                        ${item.priorPrice.toFixed(2)}
                      </td>

                      {/* Price Difference / Variance */}
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                        <div
                          className={`inline-flex items-center gap-1 font-bold ${
                            isUp
                              ? isSevereSpike
                                ? 'text-rose-400'
                                : 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>
                            {isUp ? `+${diffDollars.toFixed(2)}` : `${diffDollars.toFixed(2)}`}
                          </span>
                          <span className="text-[11px] font-sans font-normal ml-0.5">
                            ({isUp ? `+${item.varianceFromAvgPct}%` : `${item.varianceFromAvgPct}%`})
                          </span>
                        </div>
                      </td>

                      {/* Min / Max Range */}
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-400">
                        <span>${item.minPrice.toFixed(2)}</span>
                        <span className="text-slate-600 mx-1">–</span>
                        <span>${item.maxPrice.toFixed(2)}</span>
                      </td>

                      {/* Total Spend */}
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-200 hidden sm:table-cell">
                        ${item.totalSpend.toFixed(2)}
                        <span className="block text-[10px] text-slate-500 font-sans">
                          {item.purchaseCount} orders
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-amber-400 font-medium text-xs flex items-center justify-end gap-1 group-hover:underline">
                          <span>Trend</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
