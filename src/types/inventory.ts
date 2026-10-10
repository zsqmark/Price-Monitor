export type ItemCategory =
  | 'Produce'
  | 'Proteins'
  | 'Dairy & Eggs'
  | 'Pantry & Dry Goods'
  | 'Beverages'
  | 'Disposables';

export interface InvoiceLineItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string; // 'case', 'lb', 'kg', 'gal', 'bottle', 'box', etc.
  unitPrice: number;
  totalPrice: number;
  priorPrice?: number;
  historicalAvgPrice?: number;
  variancePct?: number; // % delta from historical average
  isAlertTriggered?: boolean;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  vendorCategory: ItemCategory | 'Multiple';
  date: string; // YYYY-MM-DD
  fileName: string;
  fileSize?: number; // bytes
  totalAmount: number;
  taxAmount?: number;
  items: InvoiceLineItem[];
  status: 'processed' | 'flagged' | 'reviewed';
  notes?: string;
  folderPath?: string;
}

export interface PricePoint {
  date: string;
  invoiceNumber: string;
  vendorName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface TrackedItem {
  id: string;
  name: string;
  category: ItemCategory;
  unit: string;
  currentPrice: number;
  priorPrice: number;
  historicalAvgPrice: number;
  minPrice: number;
  maxPrice: number;
  lastPurchasedDate: string;
  lastVendor: string;
  purchaseCount: number;
  totalQuantity: number;
  totalSpend: number;
  priceHistory: PricePoint[];
  varianceFromAvgPct: number;
  varianceFromPriorPct: number;
  isSpike: boolean;
  alertSeverity?: 'critical' | 'warning' | 'nominal';
  vendorsUsed: string[];
}

export interface VendorProfile {
  id: string;
  name: string;
  category: ItemCategory | 'Full-Line Distributor';
  totalInvoices: number;
  totalSpend: number;
  lastInvoiceDate: string;
  itemsSupplied: string[];
  averageOrderValue: number;
  priceCompetitiveness: 'below_average' | 'average' | 'above_average';
  priceVarianceRating: 'low' | 'moderate' | 'high';
}

export interface PriceSpikeAlert {
  id: string;
  itemId: string;
  itemName: string;
  category: ItemCategory;
  vendorName: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  currentPrice: number;
  baselinePrice: number;
  baselineType: 'historical_avg' | 'prior_price';
  priceDifference: number; // current - baseline
  variancePct: number; // ((current - baseline) / baseline) * 100
  thresholdPct: number;
  unit: string;
  quantity: number;
  estimatedExcessCost: number; // priceDifference * quantity
  projectedMonthlyImpact: number; // estimated excess over 30 days
  severity: 'critical' | 'warning';
  timestamp: string;
  dismissed: boolean;
}

export interface AlertSettings {
  marginThresholdPct: number; // default: 15%
  compareBaseline: 'historical_avg' | 'prior_price' | 'higher_of_both';
  autoNotifyHighSpikes: boolean; // >= 25%
  notifyOnPriceDrop: boolean;
}

export interface FolderMonitoringState {
  isMonitoring: boolean;
  folderName: string;
  folderHandle?: any;
  lastScannedAt: string;
  totalFilesTracked: number;
  monitoredFileNames: string[];
  isScanning: boolean;
  autoSyncIntervalMinutes: number;
}

export type FileIndexStage =
  | 'queued'
  | 'uploading'
  | 'parsing'
  | 'auditing'
  | 'completed'
  | 'failed';

export interface FileIndexTask {
  id: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  stage: FileIndexStage;
  progressPct: number; // 0 to 100
  startedAt: string;
  completedAt?: string;
  invoiceNumber?: string;
  vendorName?: string;
  itemsCount?: number;
  totalAmount?: number;
  spikeDetected?: boolean;
  spikeItemName?: string;
  spikeVariancePct?: number;
  errorMessage?: string;
  invoiceRecord?: InvoiceRecord;
}
