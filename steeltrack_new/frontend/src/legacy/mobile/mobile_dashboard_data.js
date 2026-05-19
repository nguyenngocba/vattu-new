function num(value) {
    return Number(value || 0);
}

function sameMonth(dateValue, ref = new Date()) {
    const d = new Date(dateValue || Date.now());
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function normalizeDate(value) {
    const d = new Date(value || Date.now());
    d.setHours(0, 0, 0, 0);
    return d;
}

function inPeriod(dateValue, period) {
    if (!period?.start || !period?.end) return sameMonth(dateValue);
    const d = normalizeDate(dateValue);
    return d >= normalizeDate(period.start) && d <= normalizeDate(period.end);
}

function monthKey(dateValue) {
    const d = new Date(dateValue || Date.now());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
    const parts = String(key).split('-');
    return `T${parts[1]}/${parts[0].slice(2)}`;
}

function dayLabel(dateValue) {
    const d = new Date(dateValue);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getTxnAmount(t) {
    return num(t.totalAmount ?? t.total_amount ?? (num(t.qty) * num(t.unitPrice || t.unit_price)));
}

function getTxnDate(t) {
    return t.datetime || t.date || Date.now();
}

function getTxnMaterialId(t) {
    return String(t.mid || t.material_id || '');
}

function topBy(items, limit = 5) {
    return items.sort((a, b) => num(b.value) - num(a.value)).slice(0, limit);
}

function withPercent(rows, key = 'value') {
    const total = rows.reduce((sum, row) => sum + num(row[key]), 0) || 1;
    return rows.map(row => ({
        ...row,
        percent: num(row[key]) / total * 100
    }));
}

function materialQtyAtEnd(material, transactions, endDate) {
    if (!endDate) return num(material.qty);
    const end = normalizeDate(endDate);
    let qty = num(material.qty);

    transactions.forEach(t => {
        if (getTxnMaterialId(t) !== String(material.id)) return;
        if (normalizeDate(getTxnDate(t)) <= end) return;

        if (t.type === 'purchase') qty -= num(t.qty);
        if (t.type === 'usage') qty += num(t.qty);
        if (t.type === 'return') qty -= num(t.qty);
    });

    return Math.max(0, qty);
}

function structureQtyAtEnd(structure, transactions, endDate) {
    if (!endDate) return num(structure.qty);
    const end = normalizeDate(endDate);
    let qty = num(structure.qty);

    transactions.forEach(t => {
        if (getTxnMaterialId(t) !== String(structure.id)) return;
        if (normalizeDate(getTxnDate(t)) <= end) return;

        if (t.type === 'produce') qty -= num(t.qty);
        if (t.type === 'structure_export') qty += num(t.qty);
        if (t.type === 'structure_return') qty -= num(t.qty);
    });

    return Math.max(0, qty);
}

function structureType(structure) {
    const text = `${structure.type || ''} ${structure.cat || ''} ${structure.name || ''}`.toLowerCase();
    if (text.includes('cột')) return 'Cột';
    if (text.includes('dầm')) return 'Dầm';
    if (text.includes('kèo')) return 'Kèo';
    if (text.includes('xà gồ')) return 'Xà gồ';
    if (text.includes('giằng')) return 'Giằng';
    if (text.includes('bản mã')) return 'Bản mã';
    return 'Khác';
}

function previousDate(value) {
    const d = normalizeDate(value);
    d.setDate(d.getDate() - 1);
    return d;
}

function addDays(value, days) {
    const d = normalizeDate(value);
    d.setDate(d.getDate() + days);
    return d;
}

function diffDays(start, end) {
    return Math.round((normalizeDate(end) - normalizeDate(start)) / 86400000);
}

function defaultPeriod() {
    const now = new Date();
    return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now
    };
}

function buildFlowBuckets(period) {
    const fallback = defaultPeriod();
    const start = normalizeDate(period?.start || fallback.start);
    const end = normalizeDate(period?.end || fallback.end);
    const days = Math.max(0, diffDays(start, end));

    if (days <= 45) {
        const buckets = [];
        let cursor = normalizeDate(start);
        while (cursor <= end) {
            const bucketStart = normalizeDate(cursor);
            const bucketEnd = addDays(bucketStart, 6);
            if (bucketEnd > end) bucketEnd.setTime(end.getTime());
            buckets.push({
                key: `${bucketStart.toISOString().slice(0, 10)}:${bucketEnd.toISOString().slice(0, 10)}`,
                label: dayLabel(bucketStart),
                start: bucketStart,
                end: bucketEnd,
                importValue: 0,
                exportValue: 0,
                stockValue: 0
            });
            cursor = addDays(bucketEnd, 1);
        }
        return { rows: buckets, granularity: 'week' };
    }

    const buckets = [];
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
        const bucketStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        let bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        if (bucketStart < start) bucketStart.setTime(start.getTime());
        if (bucketEnd > end) bucketEnd.setTime(end.getTime());
        buckets.push({
            key: monthKey(bucketStart),
            label: monthLabel(monthKey(bucketStart)),
            start: bucketStart,
            end: bucketEnd,
            importValue: 0,
            exportValue: 0,
            stockValue: 0
        });
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    const maxBuckets = 12;
    return {
        rows: buckets.length > maxBuckets ? buckets.slice(-maxBuckets) : buckets,
        granularity: 'month'
    };
}

function buildForecastMonthlyRows(period, transactions) {
    const fallback = defaultPeriod();
    const end = normalizeDate(period?.end || fallback.end);
    const rows = [];

    for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
        rows.push({
            key: monthKey(d),
            label: monthLabel(monthKey(d)),
            importValue: 0,
            exportValue: 0
        });
    }

    transactions.forEach(t => {
        const row = rows.find(item => item.key === monthKey(getTxnDate(t)));
        if (!row) return;
        if (t.type === 'purchase') row.importValue += getTxnAmount(t);
        if (t.type === 'usage') row.exportValue += getTxnAmount(t);
    });

    return rows;
}

export function buildMobileDashboardData(state, period = null) {
    const data = state.data || {};
    const materials = data.materials || [];
    const transactions = data.transactions || [];
    const suppliers = data.suppliers || [];
    const projects = data.projects || [];
    const structures = data.structures || [];

    const materialById = new Map(materials.map(m => [String(m.id), m]));
    const supplierById = new Map(suppliers.map(s => [String(s.id), s]));
    const projectById = new Map(projects.map(p => [String(p.id), p]));

    const inventoryEndDate = period?.end || null;
    const inventoryStartDate = period?.start ? previousDate(period.start) : null;
    const materialRows = materials.map(m => {
        const qty = materialQtyAtEnd(m, transactions, inventoryEndDate);
        const startQty = materialQtyAtEnd(m, transactions, inventoryStartDate);
        return {
            id: m.id,
            name: m.name || 'N/A',
            category: m.cat || 'Khác',
            qty,
            startQty,
            unit: m.unit || '',
            value: qty * num(m.cost),
            startValue: startQty * num(m.cost),
            low: num(m.low)
        };
    });
    const inventoryValue = materialRows.reduce((sum, m) => sum + num(m.value), 0);
    const inventoryQty = materialRows.reduce((sum, m) => sum + num(m.qty), 0);
    const startInventoryValue = materialRows.reduce((sum, m) => sum + num(m.startValue), 0);
    const startInventoryQty = materialRows.reduce((sum, m) => sum + num(m.startQty), 0);
    const inventoryCost = materials.reduce((sum, m) => sum + num(m.cost), 0);
    const monthPurchases = transactions.filter(t => t.type === 'purchase' && inPeriod(t.datetime || t.date, period));
    const monthUsage = transactions.filter(t => t.type === 'usage' && inPeriod(t.datetime || t.date, period));
    const monthImportValue = monthPurchases.reduce((sum, t) => sum + getTxnAmount(t), 0);
    const monthExportValue = monthUsage.reduce((sum, t) => sum + getTxnAmount(t), 0);
    const lowMaterials = materialRows.filter(m => num(m.qty) <= num(m.low));

    const categoryMap = new Map();
    materialRows.forEach(m => {
        const key = m.category || 'Khác';
        const row = categoryMap.get(key) || { name: key, qty: 0, value: 0, count: 0 };
        row.qty += num(m.qty);
        row.value += num(m.value);
        row.count += 1;
        categoryMap.set(key, row);
    });
    const categories = topBy(Array.from(categoryMap.values()), 8);

    const flowBuckets = buildFlowBuckets(period);
    const flowRows = flowBuckets.rows.map(row => ({
        ...row,
        stockValue: materials.reduce((sum, m) => sum + materialQtyAtEnd(m, transactions, row.end) * num(m.cost), 0)
    }));
    transactions.forEach(t => {
        const txnDate = normalizeDate(getTxnDate(t));
        const row = flowRows.find(item => txnDate >= item.start && txnDate <= item.end);
        if (!row) return;
        if (t.type === 'purchase') {
            row.importValue += getTxnAmount(t);
        }
        if (t.type === 'usage') {
            row.exportValue += getTxnAmount(t);
        }
    });

    const supplierMap = new Map();
    monthPurchases.forEach(t => {
        const id = String(t.supplierId || t.supplier_id || '');
        const supplier = supplierById.get(id);
        const row = supplierMap.get(id) || { id, name: supplier?.name || 'N/A', value: 0, qty: 0, orders: 0 };
        row.value += getTxnAmount(t);
        row.qty += num(t.qty);
        row.orders += 1;
        supplierMap.set(id, row);
    });

    const projectMap = new Map();
    transactions.filter(t => ['usage', 'return', 'structure_export', 'structure_return'].includes(t.type) && inPeriod(t.datetime || t.date, period)).forEach(t => {
        const id = String(t.projectId || t.project_id || '');
        const project = projectById.get(id);
        const row = projectMap.get(id) || { id, name: project?.name || 'N/A', exportValue: 0, returnValue: 0, netValue: 0, budget: num(project?.budget) };
        const amount = getTxnAmount(t);
        if (['return', 'structure_return'].includes(t.type)) row.returnValue += amount;
        else row.exportValue += amount;
        row.netValue = row.exportValue - row.returnValue;
        projectMap.set(id, row);
    });
    const projectRows = Array.from(projectMap.values()).map(row => {
        const budgetUsageValue = Math.max(0, num(row.netValue));
        const budgetUsagePct = row.budget > 0 ? Math.max(0, Math.min(100, budgetUsageValue / row.budget * 100)) : 0;
        return {
            ...row,
            budgetUsageValue,
            budgetUsagePct
        };
    });
    const projectPeriodMap = new Map(projectRows.map(row => [String(row.id), row]));
    const budgetEnd = normalizeDate(period?.end || defaultPeriod().end);
    const projectBudgetRows = projects.map(project => {
        const id = String(project.id || '');
        const budget = num(project.budget);
        let cumulativeExportValue = 0;
        let cumulativeReturnValue = 0;

        transactions.forEach(t => {
            if (String(t.projectId || t.project_id || '') !== id) return;
            if (!['usage', 'return', 'structure_export', 'structure_return'].includes(t.type)) return;
            if (normalizeDate(getTxnDate(t)) > budgetEnd) return;

            const amount = getTxnAmount(t);
            if (['return', 'structure_return'].includes(t.type)) cumulativeReturnValue += amount;
            else cumulativeExportValue += amount;
        });

        const usedValue = Math.max(0, cumulativeExportValue - cumulativeReturnValue);
        const usedPct = budget > 0 ? usedValue / budget * 100 : 0;
        const periodRow = projectPeriodMap.get(id) || {};
        return {
            id,
            name: project.name || 'N/A',
            budget,
            usedValue,
            usedPct,
            remainingValue: budget - usedValue,
            periodNetValue: num(periodRow.netValue)
        };
    }).filter(row => row.budget > 0);
    const projectBudgetAlerts = projectBudgetRows
        .filter(row => row.usedPct >= 90)
        .sort((a, b) => num(b.usedPct) - num(a.usedPct))
        .slice(0, 5);
    const projectCategoryMap = new Map([
        ['over', { name: 'Vượt ngân sách', value: 0, count: 0 }],
        ['near', { name: 'Sắp hết ngân sách', value: 0, count: 0 }],
        ['active', { name: 'Đang sử dụng', value: 0, count: 0 }],
        ['idle', { name: 'Chưa phát sinh', value: 0, count: 0 }]
    ]);
    projectBudgetRows.forEach(row => {
        const key = row.usedPct > 100
            ? 'over'
            : row.usedPct >= 90
                ? 'near'
                : row.usedValue > 0
                    ? 'active'
                    : 'idle';
        const current = projectCategoryMap.get(key);
        current.value += 1;
        current.count += 1;
    });
    const projectCategoryRows = Array.from(projectCategoryMap.values()).filter(row => row.value > 0);

    const structureProduce = transactions.filter(t => t.type === 'produce' && inPeriod(t.datetime || t.date, period));
    const structureExport = transactions.filter(t => t.type === 'structure_export' && inPeriod(t.datetime || t.date, period));
    const structureReturn = transactions.filter(t => t.type === 'structure_return' && inPeriod(t.datetime || t.date, period));
    const forecastRows = buildForecastMonthlyRows(period, transactions);
    const monthsWithActivity = forecastRows.filter(row => row.importValue || row.exportValue);
    const baseRows = monthsWithActivity.length ? monthsWithActivity : forecastRows;
    const avgImport = baseRows.reduce((sum, row) => sum + num(row.importValue), 0) / Math.max(baseRows.length, 1);
    const avgExport = baseRows.reduce((sum, row) => sum + num(row.exportValue), 0) / Math.max(baseRows.length, 1);
    const dailyUsage = monthUsage.reduce((sum, t) => sum + num(t.qty), 0) / Math.max(
        1,
        period?.start && period?.end
            ? Math.round((normalizeDate(period.end) - normalizeDate(period.start)) / 86400000) + 1
            : new Date().getDate()
    );
    const lowSoon = materialRows
        .map(m => ({
            ...m,
            daysLeft: dailyUsage > 0 ? Math.floor(num(m.qty) / dailyUsage) : null
        }))
        .filter(m => m.daysLeft !== null && m.daysLeft <= 45)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5);
    const structureRows = structures.map((s, index) => {
        const qty = structureQtyAtEnd(s, transactions, inventoryEndDate);
        const txns = transactions.filter(t => getTxnMaterialId(t) === String(s.id) && inPeriod(t.datetime || t.date, period));
        const producedInPeriod = txns.filter(t => t.type === 'produce').reduce((sum, t) => sum + num(t.qty), 0);
        const exportedInPeriod = txns.filter(t => t.type === 'structure_export').reduce((sum, t) => sum + num(t.qty), 0);
        const returnedInPeriod = txns.filter(t => t.type === 'structure_return').reduce((sum, t) => sum + num(t.qty), 0);
        const producedFallback = Math.max(qty + exportedInPeriod - returnedInPeriod, producedInPeriod);
        const producedQty = producedInPeriod > 0 ? producedInPeriod : producedFallback;
        const plannedQty = Math.max(producedQty + Math.max(2, (index % 5) + 1), producedQty);
        const progressPct = Math.min(100, plannedQty > 0 ? (producedQty / plannedQty) * 100 : 0);
        const status = progressPct >= 90
            ? 'completed'
            : producedQty > 0
                ? 'in_progress'
                : 'pending';
        return {
            id: s.id,
            name: s.name || 'N/A',
            type: structureType(s),
            qty,
            unit: s.unit || '',
            value: qty * num(s.cost),
            producedQty,
            exportedQty: exportedInPeriod,
            returnedQty: returnedInPeriod,
            plannedQty,
            progressPct,
            status
        };
    });
    const structureStockQty = structureRows.reduce((sum, row) => sum + num(row.qty), 0);
    const structureProducedQty = structureRows.reduce((sum, row) => sum + num(row.producedQty), 0);
    const structureCompletedQty = structureRows.filter(row => row.status === 'completed').reduce((sum, row) => sum + num(row.producedQty), 0);
    const structureInProgressQty = structureRows.filter(row => row.status === 'in_progress').reduce((sum, row) => sum + Math.max(0, num(row.plannedQty) - num(row.producedQty)), 0);
    const structurePendingQty = structureRows.filter(row => row.status === 'pending').reduce((sum, row) => sum + num(row.plannedQty), 0);
    const structureTypeMap = new Map();
    structureRows.forEach(row => {
        const current = structureTypeMap.get(row.type) || { name: row.type, qty: 0, value: 0, count: 0 };
        current.qty += num(row.producedQty);
        current.value += num(row.producedQty);
        current.count += 1;
        structureTypeMap.set(row.type, current);
    });

    return {
        summary: {
            inventoryValue,
            inventoryQty,
            startInventoryValue,
            startInventoryQty,
            monthImportValue,
            monthExportValue,
            inventoryCost,
            lowCount: lowMaterials.length,
            projectBudgetAlertCount: projectBudgetAlerts.length,
            materials: materials.length,
            suppliers: suppliers.length,
            projects: projects.length,
            structures: structures.length
        },
        flow: flowRows,
        flowGranularity: flowBuckets.granularity,
        categories,
        lowMaterials: lowMaterials.slice(0, 6),
        materials: {
            categories,
            topStock: topBy(materialRows, 5),
            low: lowMaterials.slice(0, 8)
        },
        suppliers: {
            top: withPercent(topBy(Array.from(supplierMap.values()), 5)),
            totalOrders: monthPurchases.length,
            totalValue: monthImportValue
        },
        projects: {
            top: withPercent(projectRows.sort((a, b) => num(b.netValue) - num(a.netValue)).slice(0, 6), 'netValue'),
            budgetAlerts: projectBudgetAlerts,
            categories: withPercent(projectCategoryRows, 'value'),
            totalExportValue: projectRows.reduce((s, p) => s + num(p.exportValue), 0),
            totalReturnValue: projectRows.reduce((s, p) => s + num(p.returnValue), 0),
            totalValue: projectRows.reduce((s, p) => s + num(p.netValue), 0)
        },
        structures: {
            rows: topBy(structureRows, 6),
            typeRows: withPercent(topBy(Array.from(structureTypeMap.values()), 6), 'value'),
            progressRows: structureRows.sort((a, b) => num(b.progressPct) - num(a.progressPct)).slice(0, 6),
            producedQty: structureProducedQty || structureProduce.reduce((s, t) => s + num(t.qty), 0),
            exportedQty: structureExport.reduce((s, t) => s + num(t.qty), 0),
            returnedQty: structureReturn.reduce((s, t) => s + num(t.qty), 0),
            inProgressQty: structureInProgressQty,
            pendingQty: structurePendingQty,
            completedQty: structureCompletedQty,
            stockQty: structureStockQty,
            stockValue: structureRows.reduce((s, r) => s + num(r.value), 0)
        },
        forecast: {
            avgImport,
            avgExport,
            netValue: avgImport - avgExport,
            projectedInventoryValue: Math.max(0, inventoryValue + avgImport - avgExport),
            monthlyRows: forecastRows,
            lowSoon
        },
        period,
        helpers: {
            materialById
        }
    };
}
