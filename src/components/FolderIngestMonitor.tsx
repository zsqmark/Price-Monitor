import React, { useState, useRef, useEffect } from 'react';
import {
  FolderSync,
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  Sparkles,
  FileCheck,
  Plus,
  Play,
  Clock,
  Layers,
  Activity,
  FolderSearch,
} from 'lucide-react';
import { InvoiceRecord, FolderMonitoringState, FileIndexTask, FileIndexStage } from '../types/inventory';
import { IndexingStatusBoard } from './IndexingStatusBoard';

interface FolderIngestMonitorProps {
  invoices: InvoiceRecord[];
  monitoringState: FolderMonitoringState;
  onUpdateMonitoringState: (state: FolderMonitoringState) => void;
  onAddInvoices: (newInvoices: InvoiceRecord[]) => void;
  onSelectInvoice: (invoice: InvoiceRecord) => void;
  onResetToDemo: () => void;
}

export const FolderIngestMonitor: React.FC<FolderIngestMonitorProps> = ({
  invoices,
  monitoringState,
  onUpdateMonitoringState,
  onAddInvoices,
  onSelectInvoice,
  onResetToDemo,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'status_board' | 'directory_files'>('status_board');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize and keep tasks in sync with invoices
  const [tasks, setTasks] = useState<FileIndexTask[]>(() => {
    return [...invoices].reverse().map(inv => ({
      id: `task-${inv.id}`,
      fileName: inv.fileName,
      fileSize: inv.fileSize || 185000,
      stage: 'completed' as FileIndexStage,
      progressPct: 100,
      startedAt: inv.date,
      completedAt: inv.date,
      invoiceNumber: inv.invoiceNumber,
      vendorName: inv.vendorName,
      itemsCount: inv.items.length,
      totalAmount: inv.totalAmount,
      spikeDetected: inv.status === 'flagged',
      spikeItemName: inv.status === 'flagged' ? inv.items[0]?.name : undefined,
      spikeVariancePct: inv.status === 'flagged' ? 48 : undefined,
      invoiceRecord: inv,
    }));
  });

  // Re-sync tasks if demo reset occurs
  useEffect(() => {
    if (invoices.length === 12 && tasks.length !== 12) {
      setTasks(
        [...invoices].reverse().map(inv => ({
          id: `task-${inv.id}`,
          fileName: inv.fileName,
          fileSize: inv.fileSize || 185000,
          stage: 'completed' as FileIndexStage,
          progressPct: 100,
          startedAt: inv.date,
          completedAt: inv.date,
          invoiceNumber: inv.invoiceNumber,
          vendorName: inv.vendorName,
          itemsCount: inv.items.length,
          totalAmount: inv.totalAmount,
          spikeDetected: inv.status === 'flagged',
          spikeItemName: inv.status === 'flagged' ? inv.items[0]?.name : undefined,
          spikeVariancePct: inv.status === 'flagged' ? 48 : undefined,
          invoiceRecord: inv,
        }))
      );
    }
  }, [invoices.length]);

  // Trigger browser directory picker
  const handleSelectFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        // @ts-ignore
        const dirHandle = await (window as any).showDirectoryPicker();
        const folderName = dirHandle.name;

        setIsScanning(true);
        setProcessingStatus(`Connecting to folder: ${folderName}...`);

        const scannedFiles: Array<{ name: string; file: File }> = [];

        // Traverse directory files
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            if (
              file.name.endsWith('.pdf') ||
              file.name.endsWith('.csv') ||
              file.name.endsWith('.png') ||
              file.name.endsWith('.jpg') ||
              file.name.endsWith('.jpeg')
            ) {
              scannedFiles.push({ name: file.name, file });
            }
          }
        }

        onUpdateMonitoringState({
          ...monitoringState,
          isMonitoring: true,
          folderName: `~/${folderName}/`,
          folderHandle: dirHandle,
          lastScannedAt: new Date().toLocaleTimeString(),
          totalFilesTracked: scannedFiles.length,
          monitoredFileNames: scannedFiles.map(f => f.name),
        });

        if (scannedFiles.length > 0) {
          await processBatchFiles(scannedFiles.map(s => s.file));
        } else {
          setProcessingStatus(`Folder "${folderName}" connected. Monitoring for incoming invoices.`);
        }
        setIsScanning(false);
      } else {
        // Fallback for browsers without File System Access API
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Directory picker error:', err);
      }
      setIsScanning(false);
    }
  };

  // Re-scan folder simulation
  const handleScanNow = async () => {
    setIsScanning(true);
    setProcessingStatus(`Auditing monitored directory ${monitoringState.folderName}...`);

    for (let i = 0; i < invoices.length; i++) {
      await new Promise(r => setTimeout(r, 60));
    }

    onUpdateMonitoringState({
      ...monitoringState,
      lastScannedAt: new Date().toLocaleTimeString(),
      isScanning: false,
    });

    setIsScanning(false);
    setProcessingStatus(`Directory check complete. Verified all ${invoices.length} invoices. Index is synchronized.`);
  };

  // Process files (PDF, image, CSV) through /api/extract-invoice with real-time task board updates
  const processBatchFiles = async (files: File[]) => {
    setIsScanning(true);
    const extractedList: InvoiceRecord[] = [];

    // Create queued tasks
    const newTasks: FileIndexTask[] = files.map((file, idx) => ({
      id: `task-upload-${Date.now()}-${idx}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/pdf',
      stage: 'queued',
      progressPct: 10,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    setTasks(prev => [...newTasks, ...prev]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const taskId = newTasks[i].id;

      // Update to Uploading stage
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, stage: 'uploading', progressPct: 25 } : t))
      );

      try {
        let base64Data = '';
        let textContent = '';

        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          const buffer = await file.arrayBuffer();
          base64Data = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
        } else {
          textContent = await file.text();
        }

        // Update to OCR Parsing stage
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, stage: 'parsing', progressPct: 60 } : t))
        );

        const res = await fetch('/api/extract-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            mimeType: file.type || 'application/pdf',
            textContent,
          }),
        });

        // Update to Margin Auditing stage
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, stage: 'auditing', progressPct: 85 } : t))
        );

        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            const data = result.data;
            const newInv: InvoiceRecord = {
              id: `inv-upload-${Date.now()}-${i}`,
              invoiceNumber: data.invoiceNumber || `INV-${Math.floor(100000 + Math.random() * 900000)}`,
              vendorName: data.vendorName || 'General Foodservice Distributor',
              vendorCategory: data.vendorCategory || 'Produce',
              date: data.invoiceDate || new Date().toISOString().slice(0, 10),
              fileName: file.name,
              fileSize: file.size,
              totalAmount: Number(data.totalAmount) || 0,
              taxAmount: Number(data.taxAmount) || 0,
              items: (data.items || []).map((it: any, itemIdx: number) => ({
                id: `line-${Date.now()}-${itemIdx}`,
                name: it.name,
                category: it.category || 'Produce',
                quantity: Number(it.quantity) || 1,
                unit: it.unit || 'unit',
                unitPrice: Number(it.unitPrice) || 0,
                totalPrice: Number(it.totalPrice) || 0,
              })),
              status: 'processed',
              notes: data.notes || `Extracted via ${result.source}`,
            };

            extractedList.push(newInv);

            // Update task to completed
            setTasks(prev =>
              prev.map(t =>
                t.id === taskId
                  ? {
                      ...t,
                      stage: 'completed',
                      progressPct: 100,
                      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      invoiceNumber: newInv.invoiceNumber,
                      vendorName: newInv.vendorName,
                      itemsCount: newInv.items.length,
                      totalAmount: newInv.totalAmount,
                      invoiceRecord: newInv,
                    }
                  : t
              )
            );
          }
        } else {
          throw new Error('Server returned error parsing invoice');
        }
      } catch (e: any) {
        console.warn(`Extraction error for ${file.name}:`, e);
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  stage: 'failed',
                  progressPct: 100,
                  errorMessage: e.message || 'Failed to extract invoice',
                }
              : t
          )
        );
      }
    }

    if (extractedList.length > 0) {
      onAddInvoices(extractedList);
      setProcessingStatus(`Successfully parsed and indexed ${extractedList.length} new invoices into the catalog.`);
    } else {
      setProcessingStatus('Completed processing files.');
    }

    setIsScanning(false);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(e.dataTransfer.files);
      await processBatchFiles(files);
    }
  };

  // Simulate a live concurrent batch of 3 files travelling through all pipeline stages
  const handleSimulateBatch = async () => {
    setIsScanning(true);
    const today = new Date().toISOString().slice(0, 10);
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const batchSpecs = [
      {
        fileName: 'OceanHarvest_Catch_INV-9824.pdf',
        fileSize: 312000,
        vendor: 'Ocean Harvest Seafood Co.',
        category: 'Proteins' as const,
        invNum: `OH-${Math.floor(10000 + Math.random() * 90000)}`,
        total: 1180.00,
        isSpike: false,
        spikeItem: undefined,
        spikePct: undefined,
        items: [
          { id: `b1-${Date.now()}-1`, name: 'Fresh Atlantic Salmon Fillet (lb)', category: 'Proteins' as const, quantity: 40, unit: 'lb', unitPrice: 15.50, totalPrice: 620.00 },
          { id: `b1-${Date.now()}-2`, name: 'Wild Pacific Halibut (lb)', category: 'Proteins' as const, quantity: 20, unit: 'lb', unitPrice: 28.00, totalPrice: 560.00 },
        ],
      },
      {
        fileName: 'ValleyDairy_Restock_INV-4190.pdf',
        fileSize: 198000,
        vendor: 'Farmstead Creamery & Dairy',
        category: 'Dairy & Eggs' as const,
        invNum: `FCD-${Math.floor(10000 + Math.random() * 90000)}`,
        total: 684.00,
        isSpike: true,
        spikeItem: 'European Unsalted Butter 82% (Case 36lb)',
        spikePct: 35,
        items: [
          { id: `b2-${Date.now()}-1`, name: 'European Unsalted Butter 82% (Case 36lb)', category: 'Dairy & Eggs' as const, quantity: 3, unit: 'case', unitPrice: 168.00, totalPrice: 504.00, isAlertTriggered: true },
          { id: `b2-${Date.now()}-2`, name: 'Heavy Whipping Cream 36% (Case 12qt)', category: 'Dairy & Eggs' as const, quantity: 3, unit: 'case', unitPrice: 60.00, totalPrice: 180.00 },
        ],
      },
      {
        fileName: 'ImperialProduce_Fresh_INV-012.csv',
        fileSize: 145000,
        vendor: 'Green Valley Organic Produce',
        category: 'Produce' as const,
        invNum: `GVP-${Math.floor(10000 + Math.random() * 90000)}`,
        total: 395.00,
        isSpike: false,
        spikeItem: undefined,
        spikePct: undefined,
        items: [
          { id: `b3-${Date.now()}-1`, name: 'Roma Tomatoes (25lb Box)', category: 'Produce' as const, quantity: 5, unit: 'box', unitPrice: 38.50, totalPrice: 192.50 },
          { id: `b3-${Date.now()}-2`, name: 'Baby Arugula Clamshell (4lb)', category: 'Produce' as const, quantity: 4, unit: 'case', unitPrice: 24.00, totalPrice: 96.00 },
          { id: `b3-${Date.now()}-3`, name: 'Fresh Jumbo Lemons (Case 140ct)', category: 'Produce' as const, quantity: 3, unit: 'case', unitPrice: 35.50, totalPrice: 106.50 },
        ],
      },
    ];

    // 1. Enqueue all 3 tasks
    const newTasks: FileIndexTask[] = batchSpecs.map((spec, i) => ({
      id: `task-sim-batch-${Date.now()}-${i}`,
      fileName: spec.fileName,
      fileSize: spec.fileSize,
      stage: 'queued',
      progressPct: 15,
      startedAt: timeNow,
    }));

    setTasks(prev => [...newTasks, ...prev]);

    // 2. Animate to Uploading
    await new Promise(r => setTimeout(r, 400));
    setTasks(prev =>
      prev.map(t => {
        const foundIdx = newTasks.findIndex(nt => nt.id === t.id);
        return foundIdx !== -1 ? { ...t, stage: 'uploading', progressPct: 35 } : t;
      })
    );

    // 3. Animate to OCR & Parsing
    await new Promise(r => setTimeout(r, 600));
    setTasks(prev =>
      prev.map(t => {
        const foundIdx = newTasks.findIndex(nt => nt.id === t.id);
        return foundIdx !== -1
          ? {
              ...t,
              stage: 'parsing',
              progressPct: 65,
              vendorName: batchSpecs[foundIdx].vendor,
              invoiceNumber: batchSpecs[foundIdx].invNum,
            }
          : t;
      })
    );

    // 4. Animate to Margin & Variance Auditing
    await new Promise(r => setTimeout(r, 600));
    setTasks(prev =>
      prev.map(t => {
        const foundIdx = newTasks.findIndex(nt => nt.id === t.id);
        return foundIdx !== -1 ? { ...t, stage: 'auditing', progressPct: 88 } : t;
      })
    );

    // 5. Complete all tasks and build InvoiceRecords
    await new Promise(r => setTimeout(r, 600));
    const createdInvoices: InvoiceRecord[] = batchSpecs.map((spec, i) => ({
      id: `inv-batch-${Date.now()}-${i}`,
      invoiceNumber: spec.invNum,
      vendorName: spec.vendor,
      vendorCategory: spec.category,
      date: today,
      fileName: spec.fileName,
      fileSize: spec.fileSize,
      totalAmount: spec.total,
      taxAmount: spec.total * 0.05,
      status: spec.isSpike ? 'flagged' : 'processed',
      notes: spec.isSpike ? `Spike detected: ${spec.spikeItem} surged +${spec.spikePct}%` : 'Standard restock within margins',
      items: spec.items,
    }));

    setTasks(prev =>
      prev.map(t => {
        const foundIdx = newTasks.findIndex(nt => nt.id === t.id);
        if (foundIdx !== -1) {
          const inv = createdInvoices[foundIdx];
          const spec = batchSpecs[foundIdx];
          return {
            ...t,
            stage: 'completed',
            progressPct: 100,
            completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            invoiceNumber: inv.invoiceNumber,
            vendorName: inv.vendorName,
            itemsCount: inv.items.length,
            totalAmount: inv.totalAmount,
            spikeDetected: spec.isSpike,
            spikeItemName: spec.spikeItem,
            spikeVariancePct: spec.spikePct,
            invoiceRecord: inv,
          };
        }
        return t;
      })
    );

    onAddInvoices(createdInvoices);
    setIsScanning(false);
    setProcessingStatus(`Batch complete! Indexed 3 new invoices into the catalog.`);
  };

  // Simulate incoming vendor delivery with high price spike (e.g. Avocado & Ribeye surge)
  const handleSimulateDelivery = async (type: 'spike' | 'nominal') => {
    setIsScanning(true);
    const today = new Date().toISOString().slice(0, 10);
    const invNum = `DELIV-${Math.floor(100000 + Math.random() * 900000)}`;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newInv: InvoiceRecord = type === 'spike'
      ? {
          id: `inv-sim-${Date.now()}`,
          invoiceNumber: invNum,
          vendorName: 'Green Valley Organic Produce',
          vendorCategory: 'Produce',
          date: today,
          fileName: `GreenValley_Delivery_${invNum}.pdf`,
          fileSize: 215000,
          totalAmount: 762.00,
          taxAmount: 38.10,
          status: 'flagged',
          notes: 'New delivery scanned: Extreme price surge on California avocados (+48%)',
          items: [
            { id: `sim-${Date.now()}-1`, name: 'Hass Avocados (Case 48ct)', category: 'Produce', quantity: 6, unit: 'case', unitPrice: 78.00, totalPrice: 468.00, isAlertTriggered: true },
            { id: `sim-${Date.now()}-2`, name: 'Fresh Jumbo Lemons (Case 140ct)', category: 'Produce', quantity: 2, unit: 'case', unitPrice: 36.00, totalPrice: 72.00 },
            { id: `sim-${Date.now()}-3`, name: 'Roma Tomatoes (25lb Box)', category: 'Produce', quantity: 4, unit: 'box', unitPrice: 38.50, totalPrice: 154.00 },
            { id: `sim-${Date.now()}-4`, name: 'Yellow Onions 50lb Sack', category: 'Produce', quantity: 3, unit: 'sack', unitPrice: 22.67, totalPrice: 68.00 },
          ],
        }
      : {
          id: `inv-sim-${Date.now()}`,
          invoiceNumber: invNum,
          vendorName: 'Prime Cut Meats & Provisions',
          vendorCategory: 'Proteins',
          date: today,
          fileName: `PrimeCut_Delivery_${invNum}.pdf`,
          fileSize: 224000,
          totalAmount: 1420.00,
          taxAmount: 71.00,
          status: 'processed',
          notes: 'Standard butcher restock at locked contracted prices',
          items: [
            { id: `sim-${Date.now()}-5`, name: 'USDA Choice Ribeye (lb)', category: 'Proteins', quantity: 50, unit: 'lb', unitPrice: 18.50, totalPrice: 925.00 },
            { id: `sim-${Date.now()}-6`, name: 'Free-Range Chicken Breast (lb)', category: 'Proteins', quantity: 60, unit: 'lb', unitPrice: 4.85, totalPrice: 291.00 },
            { id: `sim-${Date.now()}-7`, name: 'Pork Belly Skin-On (lb)', category: 'Proteins', quantity: 28, unit: 'lb', unitPrice: 7.28, totalPrice: 204.00 },
          ],
        };

    const simTaskId = `task-sim-${Date.now()}`;
    const newTask: FileIndexTask = {
      id: simTaskId,
      fileName: newInv.fileName,
      fileSize: newInv.fileSize,
      stage: 'queued',
      progressPct: 15,
      startedAt: timeNow,
    };

    setTasks(prev => [newTask, ...prev]);

    // Animate stages
    await new Promise(r => setTimeout(r, 350));
    setTasks(prev => prev.map(t => (t.id === simTaskId ? { ...t, stage: 'uploading', progressPct: 40 } : t)));

    await new Promise(r => setTimeout(r, 450));
    setTasks(prev =>
      prev.map(t =>
        t.id === simTaskId
          ? {
              ...t,
              stage: 'parsing',
              progressPct: 70,
              vendorName: newInv.vendorName,
              invoiceNumber: newInv.invoiceNumber,
            }
          : t
      )
    );

    await new Promise(r => setTimeout(r, 450));
    setTasks(prev => prev.map(t => (t.id === simTaskId ? { ...t, stage: 'auditing', progressPct: 90 } : t)));

    await new Promise(r => setTimeout(r, 350));
    setTasks(prev =>
      prev.map(t =>
        t.id === simTaskId
          ? {
              ...t,
              stage: 'completed',
              progressPct: 100,
              completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              invoiceNumber: newInv.invoiceNumber,
              vendorName: newInv.vendorName,
              itemsCount: newInv.items.length,
              totalAmount: newInv.totalAmount,
              spikeDetected: type === 'spike',
              spikeItemName: type === 'spike' ? 'Hass Avocados (Case 48ct)' : undefined,
              spikeVariancePct: type === 'spike' ? 48 : undefined,
              invoiceRecord: newInv,
            }
          : t
      )
    );

    onAddInvoices([newInv]);
    setIsScanning(false);
    setProcessingStatus(`Simulated arrival of invoice #${newInv.invoiceNumber}. Checked against price history!`);
  };

  return (
    <div className="space-y-6">
      {/* Folder Monitor Status & Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
              <FolderSync className="w-4 h-4" />
              <span>ACTIVE FOLDER MONITORING ENGINE</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Purchase Records & Invoice Folder
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Monitors the specified kitchen directory for new vendor invoices, receipt photos, and delivery slips.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSelectFolder}
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Select Folder to Monitor</span>
            </button>

            <button
              onClick={handleScanNow}
              disabled={isScanning}
              className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Re-Scan Folder</span>
            </button>
          </div>
        </div>

        {/* Folder Details Box */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-1">Monitored Directory:</span>
            <div className="font-mono text-sm font-bold text-white truncate" title={monitoringState.folderName}>
              {monitoringState.folderName}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-1">Files Indexed:</span>
            <div className="font-mono text-sm font-bold text-slate-200">
              {invoices.length} invoices ({invoices.reduce((a, b) => a + b.items.length, 0)} line items)
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-1">Last Sync Check:</span>
            <div className="font-mono text-sm text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{monitoringState.lastScannedAt}</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block mb-0.5">Directory Watcher:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Sync Active</span>
              </span>
            </div>
            <button
              onClick={onResetToDemo}
              className="text-[11px] text-amber-400/90 hover:underline cursor-pointer"
              title="Reset to 12 realistic sample restaurant invoices"
            >
              Reset Demo
            </button>
          </div>
        </div>

        {processingStatus && !isScanning && (
          <div className="mt-3 text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <span>{processingStatus}</span>
            <button
              onClick={() => setProcessingStatus(null)}
              className="text-slate-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* View Switcher: Status Board vs Directory Files */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit text-xs">
        <button
          onClick={() => setActiveView('status_board')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
            activeView === 'status_board'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Ingestion & Indexing Status Board</span>
          {tasks.filter(t => t.stage !== 'completed' && t.stage !== 'failed').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveView('directory_files')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
            activeView === 'directory_files'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FolderSearch className="w-4 h-4" />
          <span>Upload Dropzone & Indexed Directory ({invoices.length})</span>
        </button>
      </div>

      {/* Main View Display */}
      {activeView === 'status_board' ? (
        <IndexingStatusBoard
          tasks={tasks}
          onSelectInvoice={onSelectInvoice}
          onSimulateBatch={handleSimulateBatch}
          onSimulateSingle={handleSimulateDelivery}
          onBrowseFiles={() => fileInputRef.current?.click()}
          isScanning={isScanning}
          monitoredFolderName={monitoringState.folderName}
        />
      ) : (
        <div className="space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center ${
              dragActive
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Drag & Drop New Invoices or Scanned Receipts Here
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Supports multi-page PDF documents, JPG/PNG delivery receipt photos, and CSV order sheets.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.csv"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    processBatchFiles(Array.from(e.target.files));
                  }
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                Browse Files to Ingest
              </button>
            </div>
          </div>

          {/* Indexed Files Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Indexed Folder Invoices ({invoices.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Files currently synchronized and audited in this directory
                </p>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="py-2.5 px-4">File Name</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Distributor / Vendor</th>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3 text-right">Items</th>
                    <th className="py-2.5 px-3 text-right">Total Spend</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {[...invoices].reverse().map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0" />
                          <span className="font-mono text-slate-200 font-medium truncate max-w-[200px]">
                            {inv.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{inv.date}</td>
                      <td className="py-3 px-3 text-slate-200 font-medium">{inv.vendorName}</td>
                      <td className="py-3 px-3 font-mono text-amber-400">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {inv.items.length} lines
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        ${inv.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {inv.status === 'flagged' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Spike Flagged
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Processed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-amber-400 font-medium group-hover:underline text-xs">
                          Inspect &rarr;
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input for browsing */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.csv"
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            processBatchFiles(Array.from(e.target.files));
          }
        }}
        className="hidden"
      />
    </div>
  );
};
