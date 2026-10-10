# Restaurant Inventory & Invoice Price Variance Monitor

A dedicated restaurant inventory intelligence platform that monitors purchase folders, ingests invoices (PDF, image receipt, CSV), extracts purchased items and vendor data, tracks item price fluctuations across time, and flags cost surges that exceed configurable margins or historical averages.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were aligned during Phase 1 clarification:
> - **Ingestion Pipeline**: Browser folder picker (File System Directory API & drag-and-drop batch directory scanning) with simulated continuous sync and upload status.
> - **Invoice OCR & Extraction**: Multimodal AI extraction via Gemini 3.8 Flash (`@google/genai` server-side Express proxy) supporting invoices in PDF, PNG/JPEG photos, and CSV ledger tables.
> - **Cost Anomaly & Alert Engine**: Configurable margin surge percentage (e.g. 10%, 15%, 25%) evaluated against both the item's historical moving average and the immediate prior purchase price, highlighting unit cost differences and financial impact.

---

## 1. Overview & Core Concept

### What It Does
1. **Purchase Folder Monitoring & Ingestion**:
   - Allows restaurant managers to select an invoices folder or drag-and-drop multi-file batches.
   - Automatically parses new purchase records, invoices, and delivery slips.
   - Provides bundled sample restaurant invoices (produce, meats, dairy, dry goods, beverages) to test and run right out of the box.

2. **Catalog & Vendor Intelligence**:
   - **Purchased Items Directory**: Aggregates all purchased ingredients/supplies (e.g., Ribeye AAA, Hass Avocados, Whole Milk, Extra Virgin Olive Oil), showing category, primary vendors, standard purchase units (kg, lb, case, bunch), current price, historical average, 30/90-day price trend, and last purchase date.
   - **Vendor Roster**: Profiles every supplier (e.g., Green Valley Farms, Prime Cut Meats, Coastal Seafood, Metro Dairy), their active order volume, spend breakdown, reliability score, and price stability index.

3. **Price Variance Tracker & Spike Alert System**:
   - Monitors unit cost differences invoice-by-invoice and across historical timelines.
   - Computes variance: `((Current Price - Historical Avg) / Historical Avg) * 100` and `((Current Price - Prior Price) / Prior Price) * 100`.
   - Surfaces real-time alerts when variance breaches the user's configured threshold (e.g., +12.5% increase on Hass Avocados due to seasonal shifts).
   - Shows financial impact: estimated monthly excess spend if prices stay elevated.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Folder Sync & Ingestion Flow**:
   - Manager opens the app, sees folder connection status ("Invoices & Receipts Folder: 18 invoices indexed").
   - Manager clicks "Select Folder" or drops a folder of invoices.
   - The system scans files, dispatches documents to the extraction pipeline, and shows extraction progress with real-time extracted item tags.
2. **Alerts & Variance Review Flow**:
   - The top banner and dedicated Alerts view display active price surge notifications categorized by urgency (High Spike $\ge 20\%$, Moderate Spike $\ge 10\%$, Margin Warning).
   - Clicking an alert opens the detailed Item Price History modal with interactive sparkline/trend charts, comparing quotes across vendors and past invoice dates.
3. **Item & Vendor Explorer Flow**:
   - Manager filters ingredients by category (Produce, Protein, Dairy, Dry Goods, Beverage, Paper/Disposables).
   - Manager sorts by price increase %, total spend, or volatility.
   - Manager inspects invoice detail showing original receipt preview, parsed line items, vendor tax ID, and delivery notes.

### Visual Identity & Theme
- **Aesthetic Direction**: High-density restaurant culinary operations and kitchen analytics workstation. Clean, professional, utilitarian.
- **Palette**:
  - Dominant neutral canvas: Slate-950 dark tone or clean Crisp Slate-50 / White workspace with warm amber/emerald culinary accents.
  - Accent colors: Emerald `#059669` (price savings/stable), Amber `#D97706` (moderate variance), Rose/Crimson `#E11D48` (spike alert / margin breach).
  - Background surface: `#0F172A` (deep slate) or `#F8FAFC` (subtle cool canvas).
- **Typography & Hierarchy**:
  - Display face: `Plus Jakarta Sans` for headers, navigation, and modal titles.
  - Body: `DM Sans` for readable tables and metadata.
  - Numerical data: `font-mono tabular-nums` for unit costs, price differences, percentages, invoice amounts, and date stamps.
- **Top Bar Contract**:
  - Left: Clean single brand wordmark: **LarderTrack** (Restaurant Inventory & Cost Monitor).
  - Center: Clean single-line navigation links (`Dashboard`, `Price Alerts`, `Purchased Items`, `Vendors`, `Folder Ingest`).
  - Right: Quick Action (`+ Scan Invoices`).

---

## 3. Key Product Decisions & Trade-Offs

- **Server-Side Gemini API Proxy with Structured Schema**:
  - *Chosen Approach*: Express endpoint `/api/extract-invoice` that accepts base64 files and invokes `@google/genai` with `gemini-3.8-flash` using `responseMimeType: "application/json"` and strict typed extraction schema.
  - *Why*: Meets security guidelines, securely handles multi-page receipts and PDFs, and yields clean JSON line items (vendor, date, line items with unit price, quantity, unit, total).
- **Hybrid Folder Monitoring Engine**:
  - *Chosen Approach*: Supports modern `window.showDirectoryPicker()` (File System Access API) where supported, alongside drag-and-drop folder scanning (`webkitGetAsEntry` recursive tree traversal) and full preloaded restaurant demo datasets.
  - *Why*: Works seamlessly across all browser sandboxes without requiring external OS file permissions while giving the authentic folder monitoring workflow.
- **Local Persistence & Export**:
  - *Chosen Approach*: In-memory and `localStorage` synchronization with instant CSV/JSON report exports. Changes and uploaded invoices persist across page reloads.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram
```
┌────────────────────────────────────────────────────────────────────────┐
│                        LarderTrack Web Client                          │
│                                                                        │
│  ┌──────────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │ Folder Ingestion &   │  │ Price Variance  │  │ Item & Vendor     │  │
│  │ Directory Scanner    │  │ Alert Engine    │  │ Catalogs          │  │
│  └──────────┬───────────┘  └────────▲────────┘  └─────────▲─────────┘  │
│             │                       │                     │            │
│             ▼                       │                     │            │
│  ┌──────────────────────────────────┴─────────────────────┴─────────┐  │
│  │         Inventory & Price Store (React State + LocalStorage)     │  │
│  │    • Invoices    • Line Items    • Price History    • Alerts     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ Upload raw invoice (PDF/Image/CSV)
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Express Full-Stack Server Backend                   │
│                                                                        │
│   POST /api/extract-invoice ──────► Gemini 3.8 Flash SDK Proxy         │
│                                     (@google/genai with User-Agent)     │
│                                     Structured Invoice Extraction      │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Data Entities
```ts
interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  vendorCategory: string;
  date: string;
  fileName: string;
  fileSize: number;
  totalAmount: number;
  taxAmount?: number;
  items: InvoiceLineItem[];
  status: 'processed' | 'flagged' | 'pending';
}

interface InvoiceLineItem {
  id: string;
  name: string;
  category: 'Produce' | 'Proteins' | 'Dairy & Eggs' | 'Dry Goods & Pantry' | 'Beverages' | 'Disposables';
  quantity: number;
  unit: string; // 'kg', 'lb', 'case', 'bunch', 'bottle', etc.
  unitPrice: number;
  totalPrice: number;
  priorPrice?: number;
  historicalAvgPrice?: number;
  variancePct?: number; // % delta from historical average
  isAlertTriggered?: boolean;
}

interface PriceAlert {
  id: string;
  itemId: string;
  itemName: string;
  vendorName: string;
  invoiceId: string;
  invoiceDate: string;
  unit: string;
  currentPrice: number;
  historicalAvg: number;
  priorPrice: number;
  variancePct: number;
  projectedMonthlyImpact: number;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface AlertSettings {
  marginThresholdPct: number; // default e.g. 15%
  compareBaseline: 'historical_avg' | 'prior_purchase' | 'higher_of_both';
  notifyOnPriceDrop: boolean;
}
```

### Interactive Implementation Plan
1. **Full-stack Express backend setup**:
   - `server.ts` with `/api/extract-invoice` using `@google/genai` `gemini-3.8-flash`.
   - Update `package.json` dev/start scripts for full-stack execution.
2. **Folder Ingestion & Directory Picker**:
   - Folder picker button & drag-and-drop folder dropzone.
   - Batch parsing with extraction indicator and line item preview.
   - Realistic restaurant starter bundle (12 invoices spanning 6 months from 4 key suppliers with historical price jumps on avocados, ribeye, butter, and olive oil).
3. **Price Variance & Alert Engine**:
   - Historical calculation algorithm tracking unit prices over time.
   - Configurable margin threshold slider/stepper (5% to 50%).
   - Impact calculation estimating excess monthly food cost.
4. **Visual Dashboard & Explorers**:
   - Top metrics bar: Monitored Folders, Total Invoices, Total Spend, Active Price Alerts, Cost Variance Trend.
   - Price Variance Alert Center with filterable urgency and direct invoice jump.
   - Items Price Comparison Table with trend indicators, min/max/avg price, and visual price difference column.
   - Vendor Comparison Matrix showing who charges less for identical supplies.
   - Interactive Item Price History modal with SVG price trend graphs over time.
