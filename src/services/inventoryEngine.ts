import {
  InvoiceRecord,
  InvoiceLineItem,
  TrackedItem,
  PricePoint,
  VendorProfile,
  PriceSpikeAlert,
  AlertSettings,
  ItemCategory,
} from '../types/inventory';

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  marginThresholdPct: 15, // Alert when cost increases by 15% or more
  compareBaseline: 'historical_avg',
  autoNotifyHighSpikes: true,
  notifyOnPriceDrop: true,
};

/**
 * Normalizes item names for grouping (removes minor punctuation differences).
 */
export function normalizeItemKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Aggregates all line items across all invoices to construct tracked items with
 * comprehensive price history, averages, variance, and volatility metrics.
 */
export function buildTrackedItems(
  invoices: InvoiceRecord[],
  settings: AlertSettings = DEFAULT_ALERT_SETTINGS
): TrackedItem[] {
  // Sort invoices chronologically ascending for accurate time series
  const sortedInvoices = [...invoices].sort((a, b) => a.date.localeCompare(b.date));

  const itemsMap = new Map<
    string,
    {
      name: string;
      category: ItemCategory;
      unit: string;
      pricePoints: PricePoint[];
      vendors: Set<string>;
    }
  >();

  for (const inv of sortedInvoices) {
    for (const item of inv.items) {
      const key = normalizeItemKey(item.name);
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          name: item.name,
          category: item.category,
          unit: item.unit || 'unit',
          pricePoints: [],
          vendors: new Set(),
        });
      }

      const entry = itemsMap.get(key)!;
      entry.vendors.add(inv.vendorName);
      entry.pricePoints.push({
        date: inv.date,
        invoiceNumber: inv.invoiceNumber,
        vendorName: inv.vendorName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      });
    }
  }

  const trackedItems: TrackedItem[] = [];

  for (const [key, data] of itemsMap.entries()) {
    const points = data.pricePoints;
    if (points.length === 0) continue;

    const prices = points.map(p => p.unitPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Latest price point is the most recent
    const latest = points[points.length - 1];
    const currentPrice = latest.unitPrice;

    // Prior price is the purchase immediately before the latest (if exists)
    const prior = points.length > 1 ? points[points.length - 2] : latest;
    const priorPrice = prior.unitPrice;

    // Weighted historical average price (or simple average if quantities vary wildly)
    const totalQty = points.reduce((acc, p) => acc + p.quantity, 0);
    const totalSpend = points.reduce((acc, p) => acc + p.totalPrice, 0);
    const historicalAvgPrice = totalQty > 0 ? totalSpend / totalQty : prices.reduce((a, b) => a + b, 0) / prices.length;

    // Variance calculations
    const varianceFromAvgPct = historicalAvgPrice > 0 ? ((currentPrice - historicalAvgPrice) / historicalAvgPrice) * 100 : 0;
    const varianceFromPriorPct = priorPrice > 0 ? ((currentPrice - priorPrice) / priorPrice) * 100 : 0;

    // Determine baseline according to user settings
    let comparisonVariance = varianceFromAvgPct;
    if (settings.compareBaseline === 'prior_price') {
      comparisonVariance = varianceFromPriorPct;
    } else if (settings.compareBaseline === 'higher_of_both') {
      comparisonVariance = Math.max(varianceFromAvgPct, varianceFromPriorPct);
    }

    const isSpike = comparisonVariance >= settings.marginThresholdPct;
    let alertSeverity: 'critical' | 'warning' | 'nominal' = 'nominal';
    if (comparisonVariance >= Math.max(25, settings.marginThresholdPct * 1.5)) {
      alertSeverity = 'critical';
    } else if (comparisonVariance >= settings.marginThresholdPct) {
      alertSeverity = 'warning';
    }

    trackedItems.push({
      id: `item-${key.replace(/[^a-z0-9]/g, '-')}`,
      name: data.name,
      category: data.category,
      unit: data.unit,
      currentPrice: Number(currentPrice.toFixed(2)),
      priorPrice: Number(priorPrice.toFixed(2)),
      historicalAvgPrice: Number(historicalAvgPrice.toFixed(2)),
      minPrice: Number(minPrice.toFixed(2)),
      maxPrice: Number(maxPrice.toFixed(2)),
      lastPurchasedDate: latest.date,
      lastVendor: latest.vendorName,
      purchaseCount: points.length,
      totalQuantity: totalQty,
      totalSpend: Number(totalSpend.toFixed(2)),
      priceHistory: points,
      varianceFromAvgPct: Number(varianceFromAvgPct.toFixed(1)),
      varianceFromPriorPct: Number(varianceFromPriorPct.toFixed(1)),
      isSpike,
      alertSeverity,
      vendorsUsed: Array.from(data.vendors),
    });
  }

  // Sort by highest price variance descending by default
  return trackedItems.sort((a, b) => b.varianceFromAvgPct - a.varianceFromAvgPct);
}

/**
 * Generates active price spike alerts based on current user margin thresholds.
 */
export function generatePriceAlerts(
  invoices: InvoiceRecord[],
  trackedItems: TrackedItem[],
  settings: AlertSettings = DEFAULT_ALERT_SETTINGS,
  dismissedAlertIds: string[] = []
): PriceSpikeAlert[] {
  const alerts: PriceSpikeAlert[] = [];

  for (const item of trackedItems) {
    if (item.priceHistory.length === 0) continue;

    const latestPoint = item.priceHistory[item.priceHistory.length - 1];

    let baselinePrice = item.historicalAvgPrice;
    let baselineType: 'historical_avg' | 'prior_price' = 'historical_avg';
    let variancePct = item.varianceFromAvgPct;

    if (settings.compareBaseline === 'prior_price' && item.priceHistory.length > 1) {
      baselinePrice = item.priorPrice;
      baselineType = 'prior_price';
      variancePct = item.varianceFromPriorPct;
    } else if (settings.compareBaseline === 'higher_of_both') {
      if (item.varianceFromPriorPct > item.varianceFromAvgPct && item.priceHistory.length > 1) {
        baselinePrice = item.priorPrice;
        baselineType = 'prior_price';
        variancePct = item.varianceFromPriorPct;
      }
    }

    if (variancePct >= settings.marginThresholdPct) {
      const priceDifference = item.currentPrice - baselinePrice;
      const latestQuantity = latestPoint.quantity || 1;
      const excessCost = priceDifference * latestQuantity;

      // Estimate monthly impact assuming roughly 3-4 purchase cycles a month
      const monthlyCycles = Math.max(1, Math.min(6, (item.purchaseCount / Math.max(1, 4)) * 3));
      const projectedMonthlyImpact = excessCost * monthlyCycles;

      const alertId = `alert-${item.id}-${latestPoint.invoiceNumber}`;
      const isDismissed = dismissedAlertIds.includes(alertId);

      alerts.push({
        id: alertId,
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        vendorName: latestPoint.vendorName,
        invoiceId: latestPoint.invoiceNumber,
        invoiceNumber: latestPoint.invoiceNumber,
        invoiceDate: latestPoint.date,
        currentPrice: item.currentPrice,
        baselinePrice: Number(baselinePrice.toFixed(2)),
        baselineType,
        priceDifference: Number(priceDifference.toFixed(2)),
        variancePct: Number(variancePct.toFixed(1)),
        thresholdPct: settings.marginThresholdPct,
        unit: item.unit,
        quantity: latestQuantity,
        estimatedExcessCost: Number(excessCost.toFixed(2)),
        projectedMonthlyImpact: Number(projectedMonthlyImpact.toFixed(2)),
        severity: variancePct >= Math.max(25, settings.marginThresholdPct * 1.5) ? 'critical' : 'warning',
        timestamp: latestPoint.date,
        dismissed: isDismissed,
      });
    }
  }

  // Sort critical first, then highest excess impact
  return alerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return b.estimatedExcessCost - a.estimatedExcessCost;
  });
}

/**
 * Builds vendor profiles with invoice volume, spend distribution, and pricing competitiveness.
 */
export function buildVendorProfiles(
  invoices: InvoiceRecord[],
  trackedItems: TrackedItem[]
): VendorProfile[] {
  const vendorMap = new Map<
    string,
    {
      invoices: InvoiceRecord[];
      items: Set<string>;
      category: ItemCategory | 'Full-Line Distributor';
    }
  >();

  for (const inv of invoices) {
    if (!vendorMap.has(inv.vendorName)) {
      vendorMap.set(inv.vendorName, {
        invoices: [],
        items: new Set(),
        category: inv.vendorCategory as any,
      });
    }
    const v = vendorMap.get(inv.vendorName)!;
    v.invoices.push(inv);
    inv.items.forEach(it => v.items.add(it.name));
  }

  const profiles: VendorProfile[] = [];

  for (const [vendorName, data] of vendorMap.entries()) {
    const totalSpend = data.invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const sortedInvs = [...data.invoices].sort((a, b) => b.date.localeCompare(a.date));
    const lastDate = sortedInvs[0]?.date || '2026-10-01';
    const avgOrderValue = data.invoices.length > 0 ? totalSpend / data.invoices.length : 0;

    // Assess price competitiveness
    let higherCount = 0;
    let lowerCount = 0;
    for (const inv of data.invoices) {
      for (const line of inv.items) {
        const tracked = trackedItems.find(t => normalizeItemKey(t.name) === normalizeItemKey(line.name));
        if (tracked && tracked.historicalAvgPrice > 0) {
          if (line.unitPrice > tracked.historicalAvgPrice * 1.05) higherCount++;
          else if (line.unitPrice < tracked.historicalAvgPrice * 0.95) lowerCount++;
        }
      }
    }

    let priceCompetitiveness: 'below_average' | 'average' | 'above_average' = 'average';
    if (lowerCount > higherCount + 2) priceCompetitiveness = 'below_average'; // cheaper
    else if (higherCount > lowerCount + 2) priceCompetitiveness = 'above_average'; // more expensive

    let priceVarianceRating: 'low' | 'moderate' | 'high' = 'moderate';
    if (higherCount >= 4) priceVarianceRating = 'high';
    else if (higherCount <= 1) priceVarianceRating = 'low';

    profiles.push({
      id: `vendor-${vendorName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: vendorName,
      category: data.category,
      totalInvoices: data.invoices.length,
      totalSpend: Number(totalSpend.toFixed(2)),
      lastInvoiceDate: lastDate,
      itemsSupplied: Array.from(data.items),
      averageOrderValue: Number(avgOrderValue.toFixed(2)),
      priceCompetitiveness,
      priceVarianceRating,
    });
  }

  return profiles.sort((a, b) => b.totalSpend - a.totalSpend);
}
