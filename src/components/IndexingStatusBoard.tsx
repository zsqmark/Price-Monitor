import React, { useState } from 'react';
import {
  FolderSync,
  FileText,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Clock,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
  Search,
  UploadCloud,
  FileCheck,
  Cpu,
  ShieldAlert,
  Sliders,
  Check,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import { FileIndexTask, FileIndexStage, InvoiceRecord } from '../types/inventory';

interface IndexingStatusBoardProps {
  tasks: FileIndexTask[];
  onSelectInvoice?: (invoice: InvoiceRecord) => void;
  onSimulateBatch: () => void;
  onSimulateSingle: (type: 'spike' | 'nominal') => void;
  onBrowseFiles: () => void;
  isScanning: boolean;
  monitoredFolderName: string;
}

export const IndexingStatusBoard: React.FC<IndexingStatusBoardProps> = ({
  tasks,
  onSelectInvoice,
  onSimulateBatch,
  onSimulateSingle,
  onBrowseFiles,
  isScanning,
  monitoredFolderName,
}) => {
  const [filterStage, setFilterStage] = useState<'all' | 'in_progress' | 'completed' | 'spikes'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts
  const activeCount = tasks.filter(t => t.stage !== 'completed' && t.stage !== 'failed').length;
  const completedCount = tasks.filter(t => t.stage === 'completed').length;
  const spikeCount = tasks.filter(t => t.spikeDetected).length;
  const failedCount = tasks.filter(t => t.stage === 'failed').length;

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterStage === 'in_progress') {
      if (task.stage === 'completed' || task.stage === 'failed') return false;
    } else if (filterStage === 'completed') {
      if (task.stage !== 'completed') return false;
    } else if (filterStage === 'spikes') {
      if (!task.spikeDetected) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = task.fileName.toLowerCase().includes(q);
      const matchesVendor = task.vendorName?.toLowerCase().includes(q);
      const matchesInv = task.invoiceNumber?.toLowerCase().includes(q);
      const matchesSpike = task.spikeItemName?.toLowerCase().includes(q);
      return matchesName || matchesVendor || matchesInv || matchesSpike;
    }

    return true;
  });

  const getStageBadge = (task: FileIndexTask) => {
    switch (task.stage) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Queued</span>
          </span>
        );
      case 'uploading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-mono animate-pulse">
            <UploadCloud className="w-3 h-3 text-sky-400" />
            <span>Uploading ({task.progressPct}%)</span>
          </span>
        );
      case 'parsing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono animate-pulse">
            <Cpu className="w-3 h-3 text-amber-400" />
            <span>OCR & Parsing ({task.progressPct}%)</span>
          </span>
        );
      case 'auditing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-mono animate-pulse">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Margin Audit ({task.progressPct}%)</span>
          </span>
        );
      case 'completed':
        if (task.spikeDetected) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-semibold">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Spike Flagged (+{task.spikeVariancePct}%)</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>Indexed</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-900/40 text-rose-300 border border-rose-800 text-[10px]">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Failed</span>
          </span>
        );
    }
  };

  const getFormatBadge = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
    let color = 'bg-slate-800 text-slate-300 border-slate-700';
    if (ext === 'PDF') color = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    if (ext === 'CSV') color = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (ext === 'PNG' || ext === 'JPG' || ext === 'JPEG') color = 'bg-sky-500/15 text-sky-300 border-sky-500/30';

    return (
      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${color}`}>
        {ext}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Status Board Hero Banner & Pipeline Visualizer */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
              <FolderSync className="w-4 h-4 animate-spin-slow" />
              <span>LIVE FILE INGESTION & OCR INDEXING BOARD</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Invoice Ingest & Indexing Progress
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Real-time monitoring of purchase documents arriving in <code className="text-slate-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{monitoredFolderName}</code>. Follows files from upload through OCR extraction, price audit, and catalog indexing.
            </p>
          </div>

          {/* Quick Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onBrowseFiles}
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Invoices</span>
            </button>

            <button
              onClick={onSimulateBatch}
              disabled={isScanning}
              className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-slate-700/80"
              title="Watch a live batch of 3 invoices travel through all pipeline stages"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Batch Ingest (3 Files)</span>
            </button>
          </div>
        </div>

        {/* 4-Stage Ingestion Pipeline Diagram */}
        <div className="pt-5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Active Processing Pipeline Architecture
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Step 1: File Detection & Upload */}
            <div className={`p-3 rounded-lg border transition-all ${
              activeCount > 0
                ? 'bg-sky-950/20 border-sky-800/60 shadow-xs shadow-sky-500/10'
                : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono text-slate-400">01 / Detect</span>
                <span className="w-2 h-2 rounded-full bg-sky-400" />
              </div>
              <h4 className="text-xs font-bold text-white">Folder Ingest & Validation</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                Detects PDF, receipt scans & CSVs in monitored kitchen directory.
              </p>
            </div>

            {/* Step 2: Gemini OCR & Extraction */}
            <div className={`p-3 rounded-lg border transition-all ${
              activeCount > 0
                ? 'bg-amber-950/20 border-amber-800/60 shadow-xs shadow-amber-500/10'
                : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono text-slate-400">02 / Extract</span>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <h4 className="text-xs font-bold text-white">Multimodal AI OCR</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                Parses vendor headers, invoice numbers, items, quantities & unit costs.
              </p>
            </div>

            {/* Step 3: Cost Variance Audit */}
            <div className={`p-3 rounded-lg border transition-all ${
              activeCount > 0
                ? 'bg-purple-950/20 border-purple-800/60 shadow-xs shadow-purple-500/10'
                : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono text-slate-400">03 / Audit</span>
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <h4 className="text-xs font-bold text-white">Price Variance Analysis</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                Calculates unit price deltas vs historical avg and flags margin breaches.
              </p>
            </div>

            {/* Step 4: Catalog Indexing */}
            <div className="p-3 rounded-lg border bg-slate-950/60 border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono text-slate-400">04 / Index</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <h4 className="text-xs font-bold text-white">Inventory Catalog Sync</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                Updates price trends, vendor spend roster, and triggers high-margin alerts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Total Processed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Tracked Documents</span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {tasks.length} <span className="text-xs font-sans text-slate-400 font-normal">files</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-800/60">
            Monitored from folder
          </div>
        </div>

        {/* Metric 2: In-Flight Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>In-Flight Processing</span>
            <Sparkles className={`w-4 h-4 ${activeCount > 0 ? 'text-amber-400 animate-spin' : 'text-slate-500'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white flex items-baseline gap-2">
            <span className={activeCount > 0 ? 'text-amber-400' : 'text-slate-200'}>
              {activeCount}
            </span>
            {activeCount > 0 && (
              <span className="text-[11px] font-sans font-medium text-amber-400 animate-pulse">
                active now
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-800/60 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${activeCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>{activeCount > 0 ? 'Parsing line items...' : 'Queue idle'}</span>
          </div>
        </div>

        {/* Metric 3: Indexed Successfully */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Indexed Successfully</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {completedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-800/60">
            {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 100}% parse success rate
          </div>
        </div>

        {/* Metric 4: Price Spikes Flagged */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Price Spikes Flagged</span>
            <AlertTriangle className={`w-4 h-4 ${spikeCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            {spikeCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-800/60">
            Exceeded margin thresholds
          </div>
        </div>
      </div>

      {/* Main Status Board Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {/* Table & Filtering Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Ingestion Queue & Status Logs
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredTasks.length} items
            </span>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by file, vendor, invoice..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setFilterStage('all')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterStage === 'all'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setFilterStage('in_progress')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterStage === 'in_progress'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                In Progress ({activeCount})
              </button>
              <button
                onClick={() => setFilterStage('completed')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterStage === 'completed'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Indexed ({completedCount})
              </button>
              <button
                onClick={() => setFilterStage('spikes')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterStage === 'spikes'
                    ? 'bg-rose-500/20 text-rose-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Spikes ({spikeCount})
              </button>
            </div>
          </div>
        </div>

        {/* Task List: Empty state */}
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <CheckCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">No documents found matching this filter.</p>
            <p className="text-slate-500 mt-1">Try switching tabs or resetting your search term.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {filteredTasks.map(task => {
              const isFinished = task.stage === 'completed' || task.stage === 'failed';
              const isInFlight = !isFinished;

              return (
                <div
                  key={task.id}
                  className={`p-3.5 sm:p-4.5 transition-colors ${
                    isInFlight ? 'bg-amber-950/10' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* File & Identity */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="mt-0.5 shrink-0">
                        {getFormatBadge(task.fileName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-white font-mono truncate max-w-[280px] sm:max-w-md">
                            {task.fileName}
                          </h4>
                          {getStageBadge(task)}
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                          {task.vendorName && (
                            <>
                              <span className="text-slate-300 font-medium">{task.vendorName}</span>
                              <span aria-hidden="true" className="text-slate-600">·</span>
                            </>
                          )}
                          {task.invoiceNumber && (
                            <>
                              <span className="font-mono text-amber-400/90">#{task.invoiceNumber}</span>
                              <span aria-hidden="true" className="text-slate-600">·</span>
                            </>
                          )}
                          {task.itemsCount !== undefined && (
                            <>
                              <span className="font-mono">{task.itemsCount} lines parsed</span>
                              <span aria-hidden="true" className="text-slate-600">·</span>
                            </>
                          )}
                          {task.totalAmount !== undefined && (
                            <>
                              <span className="font-mono font-bold text-white">${task.totalAmount.toFixed(2)}</span>
                              <span aria-hidden="true" className="text-slate-600">·</span>
                            </>
                          )}
                          <span className="font-mono text-slate-500">{task.startedAt}</span>
                        </div>

                        {/* Price Spike Description if applicable */}
                        {task.spikeDetected && task.spikeItemName && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>
                              Cost breach detected: <strong>{task.spikeItemName}</strong> (+{task.spikeVariancePct}% over historical baseline)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Action / Progress Column */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      {/* Active Progress Bar for in-flight tasks */}
                      {isInFlight && (
                        <div className="w-36 sm:w-44 text-right">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span className="font-mono text-amber-300 font-medium">Processing...</span>
                            <span className="font-mono font-bold text-amber-400">{task.progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300"
                              style={{ width: `${task.progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Inspect Button for completed tasks */}
                      {task.invoiceRecord && onSelectInvoice && (
                        <button
                          onClick={() => onSelectInvoice(task.invoiceRecord!)}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 border border-slate-800"
                        >
                          <span>Inspect Invoice</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Delivery Simulation Row */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Simulate Incoming Supplier Invoices</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Test how the indexer handles price changes: inject a price surge or a nominal delivery into the board.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSimulateSingle('spike')}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Avocado Surge (+48%)</span>
          </button>

          <button
            onClick={() => onSimulateSingle('nominal')}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate Regular Restock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
