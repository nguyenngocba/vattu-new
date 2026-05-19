import { state, formatMoney, escapeHtml } from './state.js';
import { getStructureStats, renderStructureKPIs, renderStructureInventory, renderStructureDashboardCharts } from './structure_dashboard.js';
import { formatMoneyVND } from './utils.js?v=1777963068';
import { loadForecast, loadForecastProjects, loadForecastStructures, renderForecastTable } from './dashboard/forecast.js';

let stockChart = null;
let monthlyChart = null;
let categoryPieChart = null;
let topProjectsChart = null;
let topSuppliersChart = null;
let trendChart = null;
let desktopPopupChart = null;

function applyDashboardChartTheme() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.color = '#cbd5e1';
    Chart.defaults.borderColor = 'rgba(148, 163, 184, .14)';
    Chart.defaults.plugins.legend.labels.color = '#cbd5e1';
}

function formatDateVN(value, includeTime = false) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    if (!includeTime) return `${dd}/${mm}/${yyyy}`;
    return `${dd}/${mm}/${yyyy} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateInputDisplay(value) {
    if (!value) return '';
    const iso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    return formatDateVN(value);
}

function padDatePart(value) {
    return String(value).padStart(2, '0');
}

function toInputDate(date) {
    return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function currentOverviewPeriod() {
    return getDashboardFilterPeriod('overview');
}

function defaultDashboardPeriod() {
    const now = new Date();
    return {
        start: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: toInputDate(now)
    };
}

function periodButtonLabel(period = currentOverviewPeriod()) {
    const [startYear, startMonth, startDay] = String(period.start || '').split('-').map(Number);
    const [endYear, endMonth, endDay] = String(period.end || '').split('-').map(Number);
    if (!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay) return 'Chọn kỳ';
    const today = new Date();
    const isCurrentMonth = startYear === today.getFullYear()
        && startMonth === today.getMonth() + 1
        && startDay === 1
        && endYear === today.getFullYear()
        && endMonth === today.getMonth() + 1
        && endDay === today.getDate();
    if (isCurrentMonth) return 'Tháng này';
    const monthEnd = new Date(startYear, startMonth, 0).getDate();
    if (startYear === endYear && startMonth === endMonth && startDay === 1 && endDay === monthEnd) {
        return `T${padDatePart(startMonth)}/${String(startYear).slice(2)}`;
    }
    return `${padDatePart(startDay)}/${padDatePart(startMonth)} - ${padDatePart(endDay)}/${padDatePart(endMonth)}`;
}

function periodLabel(period = currentOverviewPeriod()) {
    return `${formatDateInputDisplay(period.start)} - ${formatDateInputDisplay(period.end)}`;
}

function recentMonths(limit = 12) {
    const now = new Date();
    return Array.from({ length: limit }, (_, index) => {
        const d = new Date(now.getFullYear(), now.getMonth() - index, 1);
        return `${d.getFullYear()}-${padDatePart(d.getMonth() + 1)}`;
    });
}

function monthDisplay(value) {
    const [year, month] = String(value || '').split('-');
    return month && year ? `T${month}/${String(year).slice(2)}` : value;
}

function availableDashboardYears() {
    const years = new Set([new Date().getFullYear()]);
    (state.data.transactions || []).forEach(t => {
        const d = new Date(t.datetime || t.date);
        if (!isNaN(d.getTime())) years.add(d.getFullYear());
    });
    return [...years].sort((a, b) => b - a);
}

function monthsOfYear(year) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const maxMonth = Number(year) === currentYear ? today.getMonth() + 1 : 12;
    return Array.from({ length: maxMonth }, (_, index) => `${year}-${padDatePart(index + 1)}`);
}

function parseDateInputVN(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return text;
    const vn = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (!vn) return '';
    const dd = String(vn[1]).padStart(2, '0');
    const mm = String(vn[2]).padStart(2, '0');
    return `${vn[3]}-${mm}-${dd}`;
}

function formatCompactMoney(value) {
    const n = Number(value || 0);
    const abs = Math.abs(n);
    if (abs >= 1000000000) return `${(n / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
    if (abs >= 1000000) return `${(n / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`;
    return formatMoneyVND(n);
}

function formatCompactNumber(value, unit = '') {
    const n = Number(value || 0);
    const text = n.toLocaleString('vi-VN', { maximumFractionDigits: n >= 1000 ? 0 : 1 });
    return unit ? `${text} ${unit}` : text;
}

function formatTrend(current, previous, invert = false) {
    const c = Number(current || 0);
    const p = Number(previous || 0);
    if (p <= 0) return { value: 0, text: '0%', className: 'neutral', arrow: '→' };
    const raw = ((c - p) / p) * 100;
    const good = invert ? raw <= 0 : raw >= 0;
    return {
        value: raw,
        text: `${Math.abs(raw).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`,
        className: good ? 'up' : 'down',
        arrow: raw >= 0 ? '↑' : '↓'
    };
}

function renderSparkline(values, color = '#1f7aff') {
    const nums = values.map(v => Number(v || 0));
    const max = Math.max(...nums, 1);
    const min = Math.min(...nums, 0);
    const range = Math.max(max - min, 1);
    const points = nums.map((v, i) => {
        const x = (i / Math.max(nums.length - 1, 1)) * 92 + 2;
        const y = 34 - ((v - min) / range) * 28;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<svg class="desktop-kpi-spark" viewBox="0 0 96 38" aria-hidden="true"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 36 H94" stroke="rgba(148,163,184,.12)" stroke-width="1"/></svg>`;
}

function renderMiniBars(values, color = '#1f7aff') {
    const nums = values.map(v => Math.max(0, Number(v || 0)));
    const max = Math.max(...nums, 1);
    return `<div class="desktop-module-bars" aria-hidden="true" style="--bar-color:${color}">${nums.map(value => {
        const height = Math.max(18, Math.round((value / max) * 100));
        return `<span style="height:${height}%"></span>`;
    }).join('')}</div>`;
}

function renderModuleAreaChart(values, color = '#1f7aff') {
    const nums = values.map(v => Number(v || 0));
    const max = Math.max(...nums, 1);
    const min = Math.min(...nums, 0);
    const range = Math.max(max - min, 1);
    const points = nums.map((v, i) => {
        const x = (i / Math.max(nums.length - 1, 1)) * 196 + 2;
        const y = 46 - ((v - min) / range) * 26;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const area = `2,54 ${points.join(' ')} 198,54`;
    const id = `moduleArea${Math.random().toString(36).slice(2)}`;
    return `<svg class="desktop-module-area" viewBox="0 0 200 58" aria-hidden="true" style="--area-color:${color}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".24"/><stop offset="100%" stop-color="${color}" stop-opacity=".03"/></linearGradient></defs><polygon points="${area}" fill="url(#${id})"/><polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 55 H198" stroke="rgba(125,211,252,.14)" stroke-width="1"/></svg>`;
}

function renderYearMiniChart(values, color = '#1f7aff', selectedIndex = 0, className = 'desktop-year-mini-chart') {
    const nums = values.map(v => Number(v || 0));
    const max = Math.max(...nums, 1);
    const min = Math.min(...nums, 0);
    const range = Math.max(max - min, 1);
    const isModuleChart = String(className).includes('module');
    const isTabChart = String(className).includes('tab');
    const chartWidth = isModuleChart ? 420 : 220;
    const leftPad = isTabChart ? 0 : 8;
    const rightPad = isTabChart ? 0 : 8;
    const usableWidth = chartWidth - leftPad - rightPad;
    const linePoints = nums.map((value, index) => {
        const x = leftPad + (index / Math.max(nums.length - 1, 1)) * usableWidth;
        const y = 48 - ((value - min) / range) * 34;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const dots = linePoints.map((point, index) => {
        const [x, y] = point.split(',');
        const active = index === selectedIndex;
        return `<circle cx="${x}" cy="${y}" r="${active ? '4.2' : '2.6'}" fill="${active ? '#fff' : color}" stroke="${color}" stroke-width="${active ? '2.2' : '0'}" opacity="${active ? '1' : '.9'}"/>`;
    }).join('');
    const area = `${leftPad},54 ${linePoints.join(' ')} ${chartWidth - rightPad},54`;
    const aspect = isTabChart ? ' preserveAspectRatio="none"' : '';
    return `<svg class="${className}" viewBox="0 0 ${chartWidth} 58"${aspect} aria-hidden="true" style="--mini-color:${color}"><polygon points="${area}" fill="${color}" opacity=".08"/><polyline points="${linePoints.join(' ')}" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>${dots}<path d="M${leftPad} 55 H${chartWidth - rightPad}" stroke="rgba(125,211,252,.12)" stroke-width="1"/></svg>`;
}

function getTransactionQtyTotal(transactions, types) {
    return transactions
        .filter(t => types.includes(t.type))
        .reduce((sum, t) => sum + Number(t.qty || 0), 0);
}

let advancedFilters = {
    dateFrom: '',
    dateTo: '',
    materialCategory: 'all',
    projectId: 'all',
    supplierId: 'all',
    transactionType: 'all'
};

let currentDashboardTab = 'overview';
const DASHBOARD_PAGE_SIZES = [10, 50, 100, 200];

let dashboardPaging = {
    recentTxns: { page: 1, size: 10 },
    projects: { page: 1, size: 10 },
    suppliers: { page: 1, size: 10 },
    structures: { page: 1, size: 10 },
    forecastProjects: { page: 1, size: 10 },
    forecastStructures: { page: 1, size: 10 }
};

function getPagedData(key, rows) {
    const paging = dashboardPaging[key] || { page: 1, size: 10 };
    const size = Number(paging.size) || 10;
    const totalItems = rows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / size));
    const page = Math.min(Math.max(1, Number(paging.page) || 1), totalPages);
    paging.page = page;

    const start = (page - 1) * size;
    return {
        rows: rows.slice(start, start + size),
        page,
        size,
        totalItems,
        totalPages
    };
}

function renderDashboardPageSize(key, pageData) {
    const sizeOptions = DASHBOARD_PAGE_SIZES.map(size =>
        `<option value="${size}" ${pageData.size === size ? 'selected' : ''}>${size}</option>`
    ).join('');

    return `
        <div style="display:flex;align-items:center;gap:8px;margin-left:auto;">
            <span class="metric-sub">Hiển thị:</span>
            <select onchange="window.setDashboardPageSize('${key}', this.value)" style="width:80px;">
                ${sizeOptions}
            </select>
        </div>
    `;
}

function renderDashboardPager(key, pageData, label) {
    return `
        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-top:12px;padding:8px 0;">
            <div style="text-align:left;">
                <button class="sm" onclick="window.setDashboardPage('${key}', ${pageData.page - 1})" ${pageData.page <= 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>◀ Trang trước</button>
            </div>
            <span class="metric-sub" style="text-align:center;">Trang ${pageData.page} / ${pageData.totalPages} (${pageData.totalItems} ${label})</span>
            <div style="text-align:right;">
                <button class="sm" onclick="window.setDashboardPage('${key}', ${pageData.page + 1})" ${pageData.page >= pageData.totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Trang sau ▶</button>
            </div>
        </div>
    `;
}


window.setDashboardPageSize = function(key, size) {
    if (!dashboardPaging[key]) dashboardPaging[key] = { page: 1, size: 10 };
    dashboardPaging[key].size = Number(size) || 10;
    dashboardPaging[key].page = 1;
    clearDashboardCache();
    updateDashboardContent();
};

window.setDashboardPage = function(key, page) {
    if (!dashboardPaging[key]) dashboardPaging[key] = { page: 1, size: 10 };
    dashboardPaging[key].page = Number(page) || 1;
    clearDashboardCache();
    updateDashboardContent();
};

window.renderDashboardPager = renderDashboardPager;
window.getPagedData = getPagedData;
window.dashboardPaging = dashboardPaging;

// Filter riêng cho tab Công trình
let filterProjects = { dateFrom: '', dateTo: '', projectId: 'all' };
let filterSuppliers = { dateFrom: '', dateTo: '', supplierId: 'all' };
let filterStructures = { dateFrom: '', dateTo: '' };
let filterOverview = { dateFrom: '', dateTo: '', transactionType: 'all' };
let filterForecast = { dateFrom: '', dateTo: '' };

function getDashboardFilterState(scope = 'overview') {
    if (scope === 'projects') return filterProjects;
    if (scope === 'suppliers') return filterSuppliers;
    if (scope === 'structures') return filterStructures;
    if (scope === 'forecast') return filterForecast;
    return filterOverview;
}

function getDashboardFilterPeriod(scope = 'overview') {
    const defaults = defaultDashboardPeriod();
    const filter = getDashboardFilterState(scope);
    return {
        start: filter.dateFrom || defaults.start,
        end: filter.dateTo || defaults.end
    };
}

function setDashboardFilterPeriod(scope = 'overview', start = '', end = '') {
    const filter = getDashboardFilterState(scope);
    filter.dateFrom = start;
    filter.dateTo = end;
    advancedFilters.dateFrom = start;
    advancedFilters.dateTo = end;
}

function syncAdvancedFiltersForTab(scope = currentDashboardTab) {
    const period = getDashboardFilterPeriod(scope);
    advancedFilters.dateFrom = period.start;
    advancedFilters.dateTo = period.end;
    advancedFilters.projectId = scope === 'projects' ? filterProjects.projectId : 'all';
    advancedFilters.supplierId = scope === 'suppliers' ? filterSuppliers.supplierId : 'all';
    advancedFilters.transactionType = scope === 'overview' ? filterOverview.transactionType : 'all';
}
// ========== CACHE CHO DASHBOARD ==========
let dashboardCache = {
    html_cache: null,
    data_cache: null,
    timestamp: 0,
    ttl: 60000 // 60 giây cache
};

let transactionsCache = {
    data: null,
    filters: null,
    timestamp: 0,
    ttl: 30000 // 30 giây
};

// Hàm lấy cached transactions
function getCachedTransactions(filters) {
    const filterKey = JSON.stringify(filters);
    if (transactionsCache.data && transactionsCache.filters === filterKey && 
        (Date.now() - transactionsCache.timestamp) < transactionsCache.ttl) {
        return transactionsCache.data;
    }
    return null;
}

function setCachedTransactions(filters, data) {
    transactionsCache.data = data;
    transactionsCache.filters = JSON.stringify(filters);
    transactionsCache.timestamp = Date.now();
}

// Hàm lấy cached dashboard HTML
function getCachedDashboardHTML() {
    if (dashboardCache.html_cache && (Date.now() - dashboardCache.timestamp) < dashboardCache.ttl) {
        return dashboardCache.html_cache;
    }
    return null;
}

function setCachedDashboardHTML(html) {
    dashboardCache.html_cache = html;
    dashboardCache.timestamp = Date.now();
}

// Clear cache
function clearDashboardCache() {
    dashboardCache.html_cache = null;
    dashboardCache.data_cache = null;
    dashboardCache.timestamp = 0;
    transactionsCache.data = null;
    transactionsCache.filters = null;
    console.log('🗑️ Đã xóa cache dashboard');
}

// ========== HELPER FUNCTIONS ==========

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getLastMonth() {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthName(monthKey) {
    const [year, month] = monthKey.split('-');
    return `T${parseInt(month)}/${year}`;
}

function getFilteredTransactions(useCache = true) {
    const currentFilters = {
        dateFrom: advancedFilters.dateFrom,
        dateTo: advancedFilters.dateTo,
        transactionType: advancedFilters.transactionType,
        materialCategory: advancedFilters.materialCategory,
        projectId: advancedFilters.projectId,
        supplierId: advancedFilters.supplierId
    };
    
    if (useCache) {
        const cached = getCachedTransactions(currentFilters);
        if (cached) return cached;
    }
    
    let transactions = [...state.data.transactions];
    
    if (advancedFilters.dateFrom) {
        const fromDate = new Date(advancedFilters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        transactions = transactions.filter(t => new Date(t.datetime || t.date) >= fromDate);
    }
    if (advancedFilters.dateTo) {
        const toDate = new Date(advancedFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        transactions = transactions.filter(t => new Date(t.datetime || t.date) <= toDate);
    }
    if (advancedFilters.transactionType !== 'all') {
        transactions = transactions.filter(t => t.type === advancedFilters.transactionType);
    }
    if (advancedFilters.materialCategory !== 'all') {
        transactions = transactions.filter(t => {
            const mat = state.data.materials.find(m => m.id === t.mid);
            return mat && mat.cat === advancedFilters.materialCategory;
        });
    }
    if (advancedFilters.projectId !== 'all') {
        transactions = transactions.filter(t => t.projectId === advancedFilters.projectId);
    }
    if (advancedFilters.supplierId !== 'all') {
        transactions = transactions.filter(t => t.supplierId === advancedFilters.supplierId);
    }
    
    setCachedTransactions(currentFilters, transactions);
    return transactions;
}

function transactionNetValue(t) {
    const amount = Number(t.totalAmount || 0);
    if (t.type === 'purchase' || t.type === 'return') return amount;
    if (t.type === 'usage' || t.type === 'structure_export') return -amount;
    return 0;
}

function transactionNetQty(t) {
    const qty = Number(t.qty || 0);
    if (t.type === 'purchase' || t.type === 'return') return qty;
    if (t.type === 'usage' || t.type === 'structure_export') return -qty;
    return 0;
}

function getMaterialSnapshotsAt(dateTo = advancedFilters.dateTo) {
    const snapshots = (state.data.materials || []).map(m => ({
        ...m,
        snapshotQty: Number(m.qty || 0)
    }));
    if (!dateTo) return snapshots;

    const byId = new Map(snapshots.map(m => [String(m.id), m]));
    const endDate = new Date(`${dateTo}T23:59:59.999`);
    if (isNaN(endDate.getTime())) return snapshots;

    (state.data.transactions || []).forEach(t => {
        const d = new Date(t.datetime || t.date);
        if (isNaN(d.getTime()) || d <= endDate) return;
        const mat = byId.get(String(t.mid));
        if (!mat) return;
        mat.snapshotQty = Math.max(0, Number(mat.snapshotQty || 0) - transactionNetQty(t));
    });
    return snapshots;
}

function getInventorySnapshot(dateTo = advancedFilters.dateTo) {
    const materials = getMaterialSnapshotsAt(dateTo);
    return {
        value: materials.reduce((s, m) => s + (Number(m.snapshotQty || 0) * Number(m.cost || 0)), 0),
        qty: materials.reduce((s, m) => s + Number(m.snapshotQty || 0), 0),
        lowCount: materials.filter(m => Number(m.snapshotQty || 0) <= Number(m.low || 0)).length
    };
}

function transactionNetStructureQty(t) {
    const qty = Number(t.qty || 0);
    if (t.type === 'produce' || t.type === 'structure_return') return qty;
    if (t.type === 'structure_export') return -qty;
    return 0;
}

function getStructureSnapshotsAt(dateTo = advancedFilters.dateTo) {
    const snapshots = (state.data.structures || []).map(s => ({
        ...s,
        snapshotQty: Number(s.qty || 0)
    }));
    if (!dateTo) return snapshots;

    const byId = new Map(snapshots.map(s => [String(s.id), s]));
    const endDate = new Date(`${dateTo}T23:59:59.999`);
    if (isNaN(endDate.getTime())) return snapshots;

    (state.data.transactions || []).forEach(t => {
        const d = new Date(t.datetime || t.date);
        if (isNaN(d.getTime()) || d <= endDate) return;
        const structure = byId.get(String(t.mid));
        if (!structure) return;
        structure.snapshotQty = Math.max(0, Number(structure.snapshotQty || 0) - transactionNetStructureQty(t));
    });
    return snapshots;
}

function getStructureInventorySnapshot(dateTo = advancedFilters.dateTo) {
    const rows = getStructureSnapshotsAt(dateTo).map(s => ({
        id: s.id,
        name: s.name,
        unit: s.unit,
        qty: Number(s.snapshotQty || 0),
        cost: Number(s.cost || 0),
        totalValue: Number(s.snapshotQty || 0) * Number(s.cost || 0)
    })).sort((a, b) => b.totalValue - a.totalValue);
    return {
        rows,
        qty: rows.reduce((sum, s) => sum + Number(s.qty || 0), 0),
        value: rows.reduce((sum, s) => sum + Number(s.totalValue || 0), 0),
        lowCount: rows.filter(s => Number(s.qty || 0) < 10).length
    };
}

function getSelectedOverviewMonth(scope = 'overview') {
    const period = getDashboardFilterPeriod(scope);
    const source = period.end || period.start || toInputDate(new Date());
    const [year, month] = String(source).split('-').map(Number);
    const safeDate = new Date();
    return {
        year: year || safeDate.getFullYear(),
        month: month || safeDate.getMonth() + 1,
        index: Math.max(0, Math.min(11, (month || safeDate.getMonth() + 1) - 1))
    };
}

function txInMonth(t, year, month) {
    const d = new Date(t.datetime || t.date);
    return !isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() + 1 === month;
}

function previousMonth(year, month) {
    const d = new Date(year, month - 2, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function monthEndDate(year, month) {
    const end = new Date(year, month, 0);
    const today = new Date();
    if (year === today.getFullYear() && month === today.getMonth() + 1 && today < end) return today;
    return end;
}

function getMonthTransactions(year, month, scope = 'overview') {
    let txns = (state.data.transactions || []).filter(t => txInMonth(t, year, month));
    if (scope === 'projects' && filterProjects.projectId !== 'all') {
        txns = txns.filter(t => t.projectId === filterProjects.projectId);
    }
    if (scope === 'suppliers' && filterSuppliers.supplierId !== 'all') {
        txns = txns.filter(t => t.supplierId === filterSuppliers.supplierId);
    }
    if (scope === 'overview' && filterOverview.transactionType !== 'all') {
        txns = txns.filter(t => t.type === filterOverview.transactionType);
    }
    return txns;
}

function getComparisonContext(scope = 'overview') {
    const selected = getSelectedOverviewMonth(scope);
    const prev = previousMonth(selected.year, selected.month);
    return {
        selected,
        previous: prev,
        previousEnd: toInputDate(monthEndDate(prev.year, prev.month)),
        previousTxns: getMonthTransactions(prev.year, prev.month, scope)
    };
}

function getYearlyOverviewData(year = getSelectedOverviewMonth().year) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const maxMonth = Number(year) === currentYear ? today.getMonth() + 1 : 12;
    return Array.from({ length: maxMonth }, (_, index) => {
        const month = index + 1;
        const txns = (state.data.transactions || []).filter(t => txInMonth(t, year, month));
        const end = toInputDate(monthEndDate(year, month));
        const snapshot = getInventorySnapshot(end);
        const importValue = txns.filter(t => t.type === 'purchase').reduce((s, t) => s + Number(t.totalAmount || 0), 0);
        const exportValue = txns.filter(t => t.type === 'usage' || t.type === 'structure_export').reduce((s, t) => s + Number(t.totalAmount || 0), 0);
        const supplierActive = new Set(txns.filter(t => t.type === 'purchase' && t.supplierId).map(t => t.supplierId)).size;
        const projectActive = new Set(txns.filter(t => (t.type === 'usage' || t.type === 'structure_export') && t.projectId).map(t => t.projectId)).size;
        const structureProduced = txns.filter(t => t.type === 'produce').reduce((s, t) => s + Number(t.qty || 0), 0);
        const structureExported = txns.filter(t => t.type === 'structure_export').reduce((s, t) => s + Number(t.qty || 0), 0);
        const structureReturned = txns.filter(t => t.type === 'structure_return').reduce((s, t) => s + Number(t.qty || 0), 0);
        const structureSnapshot = getStructureInventorySnapshot(end);
        return {
            month,
            label: `T${month}`,
            importValue,
            exportValue,
            stockValue: snapshot.value,
            stockQty: snapshot.qty,
            lowCount: snapshot.lowCount,
            supplierActive,
            projectActive,
            structureProduced,
            structureExported,
            structureReturned,
            structureLowCount: structureSnapshot.lowCount
        };
    });
}

function monthHighlightColors(baseColor, selectedIndex, alpha = '.26', length = 12) {
    return Array.from({ length }, (_, index) => index === selectedIndex ? baseColor : baseColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
}

function makeYearBarChart(label, data, color, valueType = 'money') {
    const selected = getSelectedOverviewMonth();
    return {
        type: 'bar',
        valueType,
        labels: data.map(row => row.label),
        selectedIndex: selected.index,
        datasets: [{
            label,
            data: data.map(row => row.value),
            backgroundColor: monthHighlightColors(color, selected.index, '.26', data.length),
            borderColor: monthHighlightColors(color, selected.index, '.42', data.length),
            borderWidth: 1,
            borderRadius: 8
        }]
    };
}

function renderDesktopTabKpi({ panel = 'inventoryValue', icon = 'logo-baocao.png', label = '', value = '', sub = '', series = [], color = '#1f7aff', trend = null, scope = currentDashboardTab }) {
    const selected = getSelectedOverviewMonth(scope);
    const trendHtml = trend
        ? `<div class="desktop-kpi-trend ${trend.className}"><span>${trend.arrow}</span> ${trend.text} <small>so với tháng trước</small></div>`
        : '';
    return `
        <div class="kpi-card desktop-click-card desktop-tab-kpi-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('${panel}')">
            <div class="kpi-icon"><img src="/images/mobile-icons/${icon}" alt=""></div>
            <div class="kpi-info">
                <div class="kpi-label">${escapeHtml(label)}</div>
                <div class="kpi-value">${value}</div>
                ${trendHtml}
                <div class="kpi-sub">${escapeHtml(sub)}</div>
            </div>
            ${renderYearMiniChart(series, color, selected.index, 'desktop-tab-kpi-chart')}
        </div>
    `;
}

function getMonthlyData() {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months[key] = { month: key, label: `T${d.getMonth()+1}/${d.getFullYear()}`, import: 0, export: 0, return: 0, stock: 0 };
    }
    
    getFilteredTransactions().forEach(t => {
        const d = new Date(t.datetime || t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (months[key]) {
            if (t.type === 'purchase') months[key].import += (parseFloat(parseFloat(t.totalAmount))||0);
            if (t.type === 'usage') months[key].export += (parseFloat(parseFloat(t.totalAmount))||0);
            if (t.type === 'return') months[key].return += (parseFloat(parseFloat(t.totalAmount))||0);
        }
    });
    
    const monthRows = Object.values(months);
    const currentInventoryValue = state.data.materials.reduce((s, m) => s + (Number(m.qty || 0) * Number(m.cost || 0)), 0);
    const periodNet = monthRows.reduce((sum, m) => sum + Number(m.import || 0) - Number(m.export || 0) + Number(m.return || 0), 0);
    let runningStock = Math.max(0, currentInventoryValue - periodNet);
    return monthRows.map(function(m) {
        runningStock += m.import - m.export + m.return;
        return { ...m, stock: Math.max(0, runningStock) };
    });
}

function getDailyMovementData() {
    const today = new Date();
    const start = advancedFilters.dateFrom
        ? new Date(`${advancedFilters.dateFrom}T00:00:00`)
        : new Date(today.getFullYear(), today.getMonth(), 1);
    const end = advancedFilters.dateTo
        ? new Date(`${advancedFilters.dateTo}T00:00:00`)
        : new Date(today.getFullYear(), today.getMonth() + 1, 0);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        days.push({ key, label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, import: 0, export: 0, return: 0, stock: 0 });
    }

    const byDay = Object.fromEntries(days.map(day => [day.key, day]));
    getFilteredTransactions().forEach(t => {
        const d = new Date(t.datetime || t.date);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const row = byDay[key];
        if (!row) return;
        const amount = Number(t.totalAmount || 0);
        if (t.type === 'purchase') row.import += amount;
        if (t.type === 'usage' || t.type === 'structure_export') row.export += amount;
        if (t.type === 'return') row.return += amount;
    });

    const currentInventoryValue = state.data.materials.reduce((s, m) => s + (Number(m.qty || 0) * Number(m.cost || 0)), 0);
    const periodNet = days.reduce((sum, d) => sum + d.import - d.export + d.return, 0);
    let runningStock = Math.max(0, currentInventoryValue - periodNet);
    return days.map(day => {
        runningStock += day.import - day.export + day.return;
        return { ...day, stock: Math.max(0, runningStock) };
    });
}

function getTotalsForPeriod(transactions) {
    let totalImport = 0, totalExport = 0, totalReturn = 0;
    transactions.forEach(t => {
        if (t.type === 'purchase') totalImport += (parseFloat(parseFloat(t.totalAmount))||0);
        if (t.type === 'usage' || t.type === 'structure_export') totalExport += (parseFloat(parseFloat(t.totalAmount))||0);
        if (t.type === 'return' || t.type === 'structure_return' || t.type === 'return_from_sw') totalReturn += (parseFloat(parseFloat(t.totalAmount))||0);
    });
    return { totalImport, totalExport, totalReturn, netSpent: totalExport - totalReturn };
}

// ========== CHECK FUNCTIONS ==========

export function checkAutoBackup() {
    const lastBackupKey = 'steeltrack_last_backup_date';
    const today = new Date().toISOString().split('T')[0];
    const lastBackup = localStorage.getItem(lastBackupKey);
    
    if (lastBackup !== today) {
        const backupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                materials: state.data.materials,
                transactions: state.data.transactions,
                projects: state.data.projects,
                suppliers: state.data.suppliers,
                logs: state.data.logs.slice(0, 100),
                categories: state.data.categories,
                units: state.data.units,
                nextId: { nextMid: state.data.nextMid, nextTid: state.data.nextTid, nextPid: state.data.nextPid, nextSid: state.data.nextSid, nextLogId: state.data.nextLogId }
            }
        };
        localStorage.setItem(lastBackupKey, today);
    }
}

export function checkLowStockNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const lowStockItems = state.data.materials.filter(m => m.qty <= parseFloat(m.low));
    if (lowStockItems.length > 0) {
        new Notification('⚠️ Cảnh báo tồn kho thấp', {
            body: `${lowStockItems.length} vật tư sắp hết: ${lowStockItems.slice(0,3).map(m=>m.name).join(', ')}`,
        });
    }
}

export function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification('TRIVIETSTEEL Pro', { body: 'Thông báo đã được bật! 🏭' });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('TRIVIETSTEEL Pro', { body: 'Bạn sẽ nhận cảnh báo khi hàng sắp hết!' });
                }
            });
        }
    }
}

// ========== FILTERS ==========

function renderAdvancedFilters() {
    const categories = ['all', ...state.data.categories];
    const projects = [{ id: 'all', name: 'Tất cả công trình' }, ...state.data.projects];
    const suppliers = [{ id: 'all', name: 'Tất cả nhà cung cấp' }, ...state.data.suppliers];
    
    return `
        <div class="card" style="margin-bottom: 16px; padding: 12px 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="window.toggleAdvancedFilters()">
                <span class="sec-title" style="margin-bottom: 0;">🔧 BỘ LỌC NÂNG CAO</span>
                <span id="filter-toggle-icon" style="font-size: 14px;">▶</span>
            </div>
            <div id="advanced-filters-content" style="display: none; margin-top: 12px;">
                <div class="grid2" style="margin-bottom: 10px;">
                    <div class="form-group"><label class="form-label">Từ ngày</label><input type="date" id="filter-date-from" value="${advancedFilters.dateFrom}"></div>
                    <div class="form-group"><label class="form-label">Đến ngày</label><input type="date" id="filter-date-to" value="${advancedFilters.dateTo}"></div>
                </div>
                <div class="grid2" style="margin-bottom: 10px;">
                    <div class="form-group"><label class="form-label">Loại giao dịch</label>
                        <select id="filter-transaction-type">
                            <option value="all">Tất cả</option>
                            <option value="purchase" ${advancedFilters.transactionType==='purchase'?'selected':''}>📥 Nhập kho</option>
                            <option value="usage" ${advancedFilters.transactionType==='usage'?'selected':''}>📤 Xuất kho</option>
                            <option value="return" ${advancedFilters.transactionType==='return'?'selected':''}>🔄 Trả hàng</option>
                        </select>
                    </div>
                    <div class="form-group"><label class="form-label">Danh mục</label>
                        <select id="filter-material-category">${categories.map(c=>`<option value="${c}" ${advancedFilters.materialCategory===c?'selected':''}>${c==='all'?'Tất cả':c}</option>`).join('')}</select>
                    </div>
                </div>
                <div class="grid2" style="margin-bottom: 10px;">
                    <div class="form-group"><label class="form-label">Công trình</label>
                        <select id="filter-project">${projects.map(p=>`<option value="${p.id}" ${advancedFilters.projectId===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select>
                    </div>
                    <div class="form-group"><label class="form-label">Nhà cung cấp</label>
                        <select id="filter-supplier">${suppliers.map(s=>`<option value="${s.id}" ${advancedFilters.supplierId===s.id?'selected':''}>${escapeHtml(s.name)}</option>`).join('')}</select>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="filter-apply" class="sm primary">🔍 Áp dụng</button>
                    <button id="filter-reset" class="sm">🗑️ Đặt lại</button>
                </div>
            </div>
        </div>
    `;
}

window.toggleAdvancedFilters = function() {
    const content = document.getElementById('advanced-filters-content');
    const icon = document.getElementById('filter-toggle-icon');
    if (content && icon) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.innerHTML = '▼';
        } else {
            content.style.display = 'none';
            icon.innerHTML = '▶';
        }
    }
};

function applyFilters() {
    advancedFilters.dateFrom = document.getElementById('filter-date-from')?.value || '';
    advancedFilters.dateTo = document.getElementById('filter-date-to')?.value || '';
    advancedFilters.transactionType = document.getElementById('filter-transaction-type')?.value || 'all';
    advancedFilters.materialCategory = document.getElementById('filter-material-category')?.value || 'all';
    advancedFilters.projectId = document.getElementById('filter-project')?.value || 'all';
    advancedFilters.supplierId = document.getElementById('filter-supplier')?.value || 'all';
    clearDashboardCache();
    updateDashboardContent();
}

function resetFilters() {
    advancedFilters = { dateFrom: '', dateTo: '', materialCategory: 'all', projectId: 'all', supplierId: 'all', transactionType: 'all' };
    ['filter-date-from','filter-date-to','filter-transaction-type','filter-material-category','filter-project','filter-supplier'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = 'all';
    });
    clearDashboardCache();
    updateDashboardContent();
}

function updateDashboardContent() {
    syncAdvancedFiltersForTab(currentDashboardTab);
    const pane = document.getElementById('pane-dashboard');
    if (pane) {
        if (currentDashboardTab === 'projects' || currentDashboardTab === 'suppliers' || currentDashboardTab === 'structures' || currentDashboardTab === 'forecast') {
            pane.innerHTML = renderTabContent(currentDashboardTab);
        } else {
            pane.innerHTML = renderDashboard();
        }
        setTimeout(() => { 
            renderDashboardChart(); 
            bindDashboardFilterEvents();
            // RENDER LẠI CHART SAU KHI FILTER
            if (currentDashboardTab === 'projects' || currentDashboardTab === 'suppliers' || currentDashboardTab === 'structures' || currentDashboardTab === 'forecast') {
                window.switchDashboardTab(currentDashboardTab);
            }
        }, 200);
    }
}

// ========== KPI CARDS ==========

function getLowStockHTML() {
    const lowStockItems = state.data.materials.filter(m => parseFloat(m.qty) <= parseFloat(m.low || 0));
    if (lowStockItems.length === 0) return '';
    return `<div class="card desktop-low-stock-card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('alerts')">
        <div class="desktop-card-head">
            <div class="sec-title">Cảnh báo</div>
            <button class="sm" onclick="event.stopPropagation(); window.showDesktopLowStockMaterials && window.showDesktopLowStockMaterials()">Xem tất cả ›</button>
        </div>
        <div class="desktop-alert-list">
            ${lowStockItems.slice(0,5).map(m => {
                const need = Math.max(0, parseFloat(m.low || 0) - parseFloat(m.qty || 0));
                return '<button type="button" class="desktop-alert-row" onclick="event.stopPropagation(); window.showMaterialDetail(\''+m.id+'\')"><span class="desktop-alert-mark">!</span><span><strong>'+escapeHtml(m.name)+'</strong><small>Cần nhập thêm '+Number(need).toLocaleString('vi-VN')+' '+escapeHtml(m.unit || '')+'</small></span><em>›</em></button>';
            }).join('')}
        </div>
        ${lowStockItems.length > 5 ? '<div class="metric-sub" style="text-align:center;">Còn '+(lowStockItems.length-5)+' mặt hàng khác...</div>' : ''}
    </div>`;
}

function dashboardTable(headers, rows) {
    return `<div class="desktop-popup-table"><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function getDashboardPanelContent(kind) {
    const allTxns = getFilteredTransactions();
    const monthlyData = getMonthlyData();
    const selectedMonth = getSelectedOverviewMonth(currentDashboardTab);
    const yearRows = getYearlyOverviewData(selectedMonth.year);
    const inventorySnapshot = getInventorySnapshot();
    const totalInventory = inventorySnapshot.value;
    const totalStockQty = inventorySnapshot.qty;
    const totalImport = allTxns.filter(t => t.type === 'purchase').reduce((s, t) => s + Number(t.totalAmount || 0), 0);
    const totalExport = allTxns.filter(t => t.type === 'usage' || t.type === 'structure_export').reduce((s, t) => s + Number(t.totalAmount || 0), 0);
    const lowStock = state.data.materials.filter(m => Number(m.qty || 0) <= Number(m.low || 0)).sort((a, b) => Number(a.qty || 0) - Number(b.qty || 0));
    const topMaterials = [...state.data.materials].sort((a, b) => (Number(b.qty || 0) * Number(b.cost || 0)) - (Number(a.qty || 0) * Number(a.cost || 0))).slice(0, 12);
    const structureStats = getStructureStats();

    const supplierStats = state.data.suppliers.map(s => {
        const txns = allTxns.filter(t => t.type === 'purchase' && t.supplierId === s.id);
        const total = txns.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
        return { ...s, total, count: txns.length };
    }).sort((a, b) => b.total - a.total);

    const projectStats = state.data.projects.map(p => {
        const used = allTxns.filter(t => t.type === 'usage' && t.projectId === p.id).reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
        const returned = allTxns.filter(t => t.type === 'return' && t.projectId === p.id).reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
        const spent = used - returned;
        const budget = Number(p.budget || 0);
        return { ...p, spent, budget, pct: budget > 0 ? spent / budget * 100 : 0 };
    }).sort((a, b) => b.spent - a.spent);

    const recentTxns = [...allTxns].sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date)).slice(0, 12);
    const categoryStats = {};
    state.data.materials.forEach(m => {
        const key = m.cat || 'Khác';
        if (!categoryStats[key]) categoryStats[key] = { qty: 0, value: 0, count: 0 };
        categoryStats[key].qty += Number(m.qty || 0);
        categoryStats[key].value += Number(m.qty || 0) * Number(m.cost || 0);
        categoryStats[key].count += 1;
    });

    const panels = {
        inventoryValue: {
            title: 'Tổng giá trị tồn kho',
            summary: `${formatMoneyVND(totalInventory)} · ${state.data.materials.length} chủng loại`,
            chart: makeYearBarChart('Giá trị tồn kho', yearRows.map(row => ({ label: row.label, value: row.stockValue })), 'rgb(31,122,255)'),
            body: dashboardTable(['Vật tư', 'Nhóm', 'Tồn kho', 'Đơn giá', 'Thành tiền'], topMaterials.map(m => `<tr><td><strong>${escapeHtml(m.name)}</strong></td><td>${escapeHtml(m.cat || 'Khác')}</td><td>${Number(m.qty || 0).toLocaleString('vi-VN')} ${escapeHtml(m.unit || '')}</td><td>${formatMoneyVND(m.cost || 0)}</td><td>${formatMoneyVND(Number(m.qty || 0) * Number(m.cost || 0))}</td></tr>`))
        },
        stockQty: {
            title: 'Tổng tồn kho',
            summary: `${Number(totalStockQty).toLocaleString('vi-VN')} đơn vị tồn`,
            chart: makeYearBarChart('Tồn kho', yearRows.map(row => ({ label: row.label, value: row.stockQty })), 'rgb(16,185,129)', 'number'),
            body: dashboardTable(['Nhóm vật tư', 'Chủng loại', 'Tồn kho', 'Giá trị'], Object.entries(categoryStats).sort((a, b) => b[1].value - a[1].value).map(([cat, item]) => `<tr><td><strong>${escapeHtml(cat)}</strong></td><td>${item.count}</td><td>${Number(item.qty).toLocaleString('vi-VN')}</td><td>${formatMoneyVND(item.value)}</td></tr>`))
        },
        alerts: {
            title: 'Vật tư sắp hết',
            summary: `${lowStock.length} mặt hàng cần theo dõi`,
            chart: makeYearBarChart('Vật tư sắp hết', yearRows.map(row => ({ label: row.label, value: row.lowCount })), 'rgb(239,68,68)', 'number'),
            body: dashboardTable(['Vật tư', 'Tồn kho', 'Ngưỡng', 'Cần nhập'], lowStock.slice(0, 20).map(m => `<tr><td><strong>${escapeHtml(m.name)}</strong></td><td>${Number(m.qty || 0).toLocaleString('vi-VN')} ${escapeHtml(m.unit || '')}</td><td>${Number(m.low || 0).toLocaleString('vi-VN')} ${escapeHtml(m.unit || '')}</td><td>${Number(Math.max(0, Number(m.low || 0) - Number(m.qty || 0))).toLocaleString('vi-VN')} ${escapeHtml(m.unit || '')}</td></tr>`))
        },
        imports: {
            title: 'Nhập trong kỳ',
            summary: `${formatMoneyVND(totalImport)}`,
            chart: makeYearBarChart('Nhập kho', yearRows.map(row => ({ label: row.label, value: row.importValue })), 'rgb(139,92,246)'),
            body: dashboardTable(['Thời gian', 'Vật tư', 'Nhà cung cấp', 'Số lượng', 'Thành tiền'], allTxns.filter(t => t.type === 'purchase').slice(0, 20).map(t => {
                const mat = state.data.materials.find(m => m.id === t.mid);
                const sup = state.data.suppliers.find(s => s.id === t.supplierId);
                return `<tr><td>${formatDateVN(t.datetime || t.date)}</td><td><strong>${escapeHtml(mat?.name || 'N/A')}</strong></td><td>${escapeHtml(sup?.name || '')}</td><td>${Number(t.qty || 0).toLocaleString('vi-VN')} ${escapeHtml(mat?.unit || '')}</td><td>${formatMoneyVND(t.totalAmount || 0)}</td></tr>`;
            }))
        },
        exports: {
            title: 'Xuất trong kỳ',
            summary: `${formatMoneyVND(totalExport)}`,
            chart: makeYearBarChart('Xuất kho', yearRows.map(row => ({ label: row.label, value: row.exportValue })), 'rgb(245,158,11)'),
            body: dashboardTable(['Thời gian', 'Vật tư', 'Công trình', 'Số lượng', 'Thành tiền'], allTxns.filter(t => t.type === 'usage' || t.type === 'structure_export').slice(0, 20).map(t => {
                const mat = state.data.materials.find(m => m.id === t.mid) || (state.data.structures || []).find(s => s.id === t.mid);
                const project = state.data.projects.find(p => p.id === t.projectId);
                return `<tr><td>${formatDateVN(t.datetime || t.date)}</td><td><strong>${escapeHtml(mat?.name || 'N/A')}</strong></td><td>${escapeHtml(project?.name || '')}</td><td>${Number(t.qty || 0).toLocaleString('vi-VN')} ${escapeHtml(mat?.unit || '')}</td><td>${formatMoneyVND(t.totalAmount || 0)}</td></tr>`;
            }))
        },
        movement: {
            title: 'Biến động nhập - xuất - tồn kho',
            summary: 'Tổng hợp theo kỳ lọc hiện tại',
            chart: { type: 'bar', labels: yearRows.map(row => row.label), selectedIndex: selectedMonth.index, datasets: [
                { label: 'Nhập kho', data: yearRows.map(row => row.importValue), backgroundColor: monthHighlightColors('rgb(16,185,129)', selectedMonth.index, '.18', yearRows.length), borderRadius: 8 },
                { label: 'Xuất kho', data: yearRows.map(row => row.exportValue), backgroundColor: monthHighlightColors('rgb(37,99,235)', selectedMonth.index, '.18', yearRows.length), borderRadius: 8 },
                { label: 'Tồn kho', data: yearRows.map(row => row.stockValue), backgroundColor: monthHighlightColors('rgb(245,158,11)', selectedMonth.index, '.18', yearRows.length), borderRadius: 8 }
            ] },
            body: dashboardTable(['Chỉ tiêu', 'Giá trị'], [`<tr><td>Nhập trong kỳ</td><td><strong>${formatMoneyVND(totalImport)}</strong></td></tr>`, `<tr><td>Xuất trong kỳ</td><td><strong>${formatMoneyVND(totalExport)}</strong></td></tr>`, `<tr><td>Giá trị tồn kho hiện tại</td><td><strong>${formatMoneyVND(totalInventory)}</strong></td></tr>`])
        },
        categories: {
            title: 'Tồn kho theo nhóm vật tư',
            summary: `${Object.keys(categoryStats).length} nhóm vật tư`,
            chart: { type: 'doughnut', labels: Object.keys(categoryStats), datasets: [{ label: 'Giá trị', data: Object.values(categoryStats).map(item => item.value), backgroundColor: ['#1f7aff', '#10b981', '#f59e0b', '#ef4444', '#94a3b8', '#8b5cf6'] }] },
            body: dashboardTable(['Nhóm', 'Chủng loại', 'Tồn kho', 'Giá trị'], Object.entries(categoryStats).sort((a, b) => b[1].value - a[1].value).map(([cat, item]) => `<tr><td><strong>${escapeHtml(cat)}</strong></td><td>${item.count}</td><td>${Number(item.qty).toLocaleString('vi-VN')}</td><td>${formatMoneyVND(item.value)}</td></tr>`))
        },
        materials: {
            title: 'Vật tư',
            summary: `${state.data.materials.length} chủng loại · ${formatMoneyVND(totalInventory)}`,
            chart: makeYearBarChart('Giá trị vật tư tồn kho', yearRows.map(row => ({ label: row.label, value: row.stockValue })), 'rgb(31,122,255)'),
            body: dashboardTable(['Vật tư', 'Nhóm', 'Tồn kho', 'Cảnh báo', 'Giá trị'], topMaterials.map(m => `<tr><td><strong>${escapeHtml(m.name)}</strong></td><td>${escapeHtml(m.cat || 'Khác')}</td><td>${Number(m.qty || 0).toLocaleString('vi-VN')} ${escapeHtml(m.unit || '')}</td><td>${Number(m.low || 0).toLocaleString('vi-VN')}</td><td>${formatMoneyVND(Number(m.qty || 0) * Number(m.cost || 0))}</td></tr>`))
        },
        suppliers: {
            title: 'Nhà cung cấp',
            summary: `${state.data.suppliers.length} nhà cung cấp · ${formatMoneyVND(supplierStats.reduce((s, x) => s + x.total, 0))}`,
            chart: makeYearBarChart('Nhà cung cấp phát sinh', yearRows.map(row => ({ label: row.label, value: row.supplierActive })), 'rgb(16,185,129)', 'number'),
            body: dashboardTable(['Nhà cung cấp', 'SĐT', 'Số lần nhập', 'Tổng giá trị', 'TB/Lần'], supplierStats.slice(0, 20).map(s => `<tr><td><strong>${escapeHtml(s.name)}</strong></td><td>${escapeHtml(s.phone || '')}</td><td>${s.count}</td><td>${formatMoneyVND(s.total)}</td><td>${s.count ? formatMoneyVND(s.total / s.count) : '0 đ'}</td></tr>`))
        },
        projects: {
            title: 'Công trình',
            summary: `${state.data.projects.length} công trình đang quản lý`,
            chart: makeYearBarChart('Công trình phát sinh xuất', yearRows.map(row => ({ label: row.label, value: row.projectActive })), 'rgb(139,92,246)', 'number'),
            body: dashboardTable(['Công trình', 'Ngân sách', 'Đã sử dụng', 'Còn lại', 'Tỷ lệ'], projectStats.slice(0, 20).map(p => `<tr><td><strong>${escapeHtml(p.name)}</strong></td><td>${formatMoneyVND(p.budget)}</td><td>${formatMoneyVND(p.spent)}</td><td>${formatMoneyVND(p.budget - p.spent)}</td><td>${p.pct.toFixed(1)}%</td></tr>`))
        },
        structures: {
            title: 'Cấu kiện',
            summary: `${structureStats.totalStructures || 0} loại · ${Number(structureStats.totalProduced || 0).toLocaleString('vi-VN')} đã sản xuất`,
            chart: makeYearBarChart('Sản lượng cấu kiện', yearRows.map(row => ({ label: row.label, value: row.structureProduced })), 'rgb(245,158,11)', 'number'),
            body: dashboardTable(['Cấu kiện', 'Tồn kho', 'Đơn vị', 'Đơn giá', 'Thành tiền'], (structureStats.stockStats || []).slice(0, 20).map(s => `<tr><td><strong>${escapeHtml(s.name)}</strong></td><td>${Number(s.qty || 0).toLocaleString('vi-VN')}</td><td>${escapeHtml(s.unit || '')}</td><td>${formatMoneyVND(s.cost || 0)}</td><td>${formatMoneyVND(s.totalValue || 0)}</td></tr>`))
        },
        recent: {
            title: 'Hoạt động gần đây',
            summary: `${recentTxns.length} giao dịch mới nhất`,
            body: dashboardTable(['Thời gian', 'Loại', 'Vật tư', 'Số lượng', 'Giá trị'], recentTxns.map(t => {
                const mat = state.data.materials.find(m => m.id === t.mid) || (state.data.structures || []).find(s => s.id === t.mid);
                return `<tr><td>${formatDateVN(t.datetime || t.date, true)}</td><td>${escapeHtml(t.type || '')}</td><td><strong>${escapeHtml(mat?.name || 'N/A')}</strong></td><td>${Number(t.qty || 0).toLocaleString('vi-VN')} ${escapeHtml(mat?.unit || '')}</td><td>${formatMoneyVND(t.totalAmount || 0)}</td></tr>`;
            }))
        },
        period: {
            title: 'Giá trị nhập - xuất trong kỳ',
            summary: `Nhập ${formatMoneyVND(totalImport)} · Xuất ${formatMoneyVND(totalExport)}`,
            chart: { type: 'bar', labels: yearRows.map(row => row.label), selectedIndex: selectedMonth.index, datasets: [
                { label: 'Nhập trong kỳ', data: yearRows.map(row => row.importValue), backgroundColor: monthHighlightColors('rgb(16,185,129)', selectedMonth.index, '.18', yearRows.length), borderRadius: 8 },
                { label: 'Xuất trong kỳ', data: yearRows.map(row => row.exportValue), backgroundColor: monthHighlightColors('rgb(37,99,235)', selectedMonth.index, '.18', yearRows.length), borderRadius: 8 }
            ] },
            body: dashboardTable(['Chỉ tiêu', 'Giá trị', 'Ghi chú'], [`<tr><td>Nhập trong kỳ</td><td><strong>${formatMoneyVND(totalImport)}</strong></td><td>Theo bộ lọc hiện tại</td></tr>`, `<tr><td>Xuất trong kỳ</td><td><strong>${formatMoneyVND(totalExport)}</strong></td><td>Bao gồm xuất vật tư/cấu kiện</td></tr>`, `<tr><td>Chênh lệch</td><td><strong>${formatMoneyVND(totalImport - totalExport)}</strong></td><td>Nhập trừ xuất</td></tr>`])
        }
    };

    return panels[kind] || panels.inventoryValue;
}

function renderDesktopPopupChart(chartConfig) {
    const canvas = document.getElementById('desktop-popup-chart');
    if (!canvas || typeof Chart === 'undefined' || !chartConfig) return;
    applyDashboardChartTheme();
    if (desktopPopupChart) desktopPopupChart.destroy();
    const datasets = (chartConfig.datasets || []).map((dataset, index) => ({
        ...dataset,
        borderWidth: dataset.borderWidth || 2.5,
        pointRadius: dataset.pointRadius ?? 2,
        pointHoverRadius: 5,
        fill: dataset.fill ?? chartConfig.type === 'line',
        tension: dataset.tension ?? .35,
        backgroundColor: dataset.backgroundColor || ['rgba(31,122,255,.35)', 'rgba(16,185,129,.35)', 'rgba(245,158,11,.35)'][index % 3],
        borderColor: dataset.borderColor || ['#1f7aff', '#10b981', '#f59e0b'][index % 3]
    }));
    desktopPopupChart = new Chart(canvas, {
        type: chartConfig.type || 'line',
        data: {
            labels: chartConfig.labels || [],
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: datasets.length > 1, labels: { usePointStyle: true, boxWidth: 8 } },
                tooltip: {
                    callbacks: {
                        label: context => {
                            const raw = typeof context.parsed === 'number' ? context.parsed : context.parsed?.y;
                            const formatted = chartConfig.valueType === 'number'
                                ? Number(raw || 0).toLocaleString('vi-VN')
                                : formatMoneyVND(raw || 0);
                            return `${context.dataset.label || ''}: ${formatted}`;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(148,163,184,.08)' } },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148,163,184,.10)' },
                    ticks: {
                        callback: value => chartConfig.valueType === 'number' ? Number(value).toLocaleString('vi-VN') : formatMoneyVND(value)
                    }
                }
            }
        }
    });
}

window.closeDesktopDashboardPanel = function() {
    if (desktopPopupChart) {
        desktopPopupChart.destroy();
        desktopPopupChart = null;
    }
    document.getElementById('desktop-dashboard-popup')?.remove();
};

function renderStructureTabCharts() {
    if (typeof Chart === 'undefined') return;
    applyDashboardChartTheme();
    const selected = getSelectedOverviewMonth('structures');
    const rows = getYearlyOverviewData(selected.year);
    const ctx = document.getElementById('structure-trend-chart');
    if (ctx) {
        if (window._structureTrendChart) window._structureTrendChart.destroy();
        window._structureTrendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: rows.map(r => r.label),
                datasets: [
                    { label: 'Sản xuất', data: rows.map(r => r.structureProduced), backgroundColor: monthHighlightColors('rgb(16,185,129)', selected.index, '.22', rows.length), borderRadius: 7 },
                    { label: 'Xuất CT', data: rows.map(r => r.structureExported), backgroundColor: monthHighlightColors('rgb(139,92,246)', selected.index, '.18', rows.length), borderRadius: 7 },
                    { label: 'Trả về', data: rows.map(r => r.structureReturned), backgroundColor: monthHighlightColors('rgb(96,165,250)', selected.index, '.18', rows.length), borderRadius: 7 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8 } } },
                scales: {
                    x: { grid: { color: 'rgba(148,163,184,.08)' } },
                    y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.10)' }, ticks: { callback: v => Number(v).toLocaleString('vi-VN') } }
                }
            }
        });
    }
}

window.openDesktopDashboardPanel = function(kind) {
    const panel = getDashboardPanelContent(kind);
    window.closeDesktopDashboardPanel();
    const overlay = document.createElement('div');
    overlay.id = 'desktop-dashboard-popup';
    overlay.className = 'desktop-dashboard-popup';
    const chartHtml = panel.chart ? '<div class="desktop-popup-chart"><canvas id="desktop-popup-chart"></canvas></div>' : '';
    overlay.innerHTML = `
        <div class="desktop-dashboard-popup-backdrop" onclick="window.closeDesktopDashboardPanel()"></div>
        <section class="desktop-dashboard-popup-card" role="dialog" aria-modal="true">
            <div class="desktop-dashboard-popup-head">
                <button type="button" onclick="window.closeDesktopDashboardPanel()">‹ Quay lại</button>
                <div><h2>${escapeHtml(panel.title)}</h2><p>${escapeHtml(panel.summary)}</p></div>
                <button type="button" class="desktop-popup-close" onclick="window.closeDesktopDashboardPanel()">×</button>
            </div>
            <div class="desktop-dashboard-popup-body">${chartHtml}${panel.body}</div>
        </section>
    `;
    document.body.appendChild(overlay);
    if (panel.chart) setTimeout(() => renderDesktopPopupChart(panel.chart), 0);
};

function renderKPICards() {
    const allTxns = getFilteredTransactions();
    const selectedYearMonth = getSelectedOverviewMonth('overview');
    const comparison = getComparisonContext('overview');
    const kpiYearRows = getYearlyOverviewData(selectedYearMonth.year);
    const { totalImport, totalExport } = getTotalsForPeriod(allTxns);
    const inventorySnapshot = getInventorySnapshot();
    const totalInventory = inventorySnapshot.value;
    const lowStockCount = inventorySnapshot.lowCount;
    const totalStockQty = inventorySnapshot.qty;
    const importCount = allTxns.filter(t => t.type === 'purchase').length;
    const exportCount = allTxns.filter(t => t.type === 'usage' || t.type === 'structure_export').length;
    
    const lastMonthTxns = comparison.previousTxns;
    const lastMonth = getTotalsForPeriod(lastMonthTxns);
    const previousInventorySnapshot = getInventorySnapshot(comparison.previousEnd);
    const inventoryTrend = formatTrend(totalInventory, previousInventorySnapshot.value);
    const stockTrend = formatTrend(totalStockQty, previousInventorySnapshot.qty);
    const importTrend = formatTrend(totalImport, lastMonth.totalImport);
    const exportTrend = formatTrend(totalExport, lastMonth.totalExport);
    const lowStockTrend = formatTrend(lowStockCount, previousInventorySnapshot.lowCount);
    const inventorySeries = kpiYearRows.map(row => row.stockValue);
    const stockSeries = kpiYearRows.map(row => row.stockQty);
    const importSeries = kpiYearRows.map(row => row.importValue);
    const exportSeries = kpiYearRows.map(row => row.exportValue);
    const lowStockSeries = kpiYearRows.map(row => row.lowCount);
    
    return `
        <div class="kpi-grid">
            <div class="kpi-card kpi-materials desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('inventoryValue')">
                <div class="kpi-icon"><img src="/images/mobile-icons/logo-tongquan.png" alt=""></div>
                <div class="kpi-info">
                    <div class="kpi-label">TỔNG GIÁ TRỊ TỒN KHO</div>
                    <div class="kpi-value">${formatCompactMoney(totalInventory)}</div>
                    <div class="desktop-kpi-trend ${inventoryTrend.className}"><span>${inventoryTrend.arrow}</span> ${inventoryTrend.text} <small>so với tháng trước</small></div>
                </div>
                ${renderYearMiniChart(inventorySeries, '#1f7aff', selectedYearMonth.index, 'desktop-kpi-year-chart')}
            </div>
            <div class="kpi-card kpi-inventory desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('stockQty')">
                <div class="kpi-icon"><img src="/images/mobile-icons/logo-tongquanlykho.png" alt=""></div>
                <div class="kpi-info">
                    <div class="kpi-label">TỔNG TỒN KHO</div>
                    <div class="kpi-value">${formatCompactNumber(totalStockQty)}</div>
                    <div class="desktop-kpi-trend ${stockTrend.className}"><span>${stockTrend.arrow}</span> ${stockTrend.text} <small>so với tháng trước</small></div>
                </div>
                ${renderYearMiniChart(stockSeries, '#10b981', selectedYearMonth.index, 'desktop-kpi-year-chart')}
            </div>
            <div class="kpi-card kpi-import desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('imports')">
                <div class="kpi-icon"><img src="/images/mobile-icons/logo-nhapkho.png" alt=""></div>
                <div class="kpi-info">
                    <div class="kpi-label">NHẬP TRONG KỲ</div>
                    <div class="kpi-value">${formatCompactMoney(totalImport)}</div>
                    <div class="desktop-kpi-trend ${importTrend.className}"><span>${importTrend.arrow}</span> ${importTrend.text} <small>so với tháng trước</small></div>
                </div>
                ${renderYearMiniChart(importSeries, '#8b5cf6', selectedYearMonth.index, 'desktop-kpi-year-chart')}
            </div>
            <div class="kpi-card kpi-export desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('exports')">
                <div class="kpi-icon"><img src="/images/mobile-icons/logo-xuatkho.png" alt=""></div>
                <div class="kpi-info">
                    <div class="kpi-label">XUẤT TRONG KỲ</div>
                    <div class="kpi-value">${formatCompactMoney(totalExport)}</div>
                    <div class="desktop-kpi-trend ${exportTrend.className}"><span>${exportTrend.arrow}</span> ${exportTrend.text} <small>so với tháng trước</small></div>
                </div>
                ${renderYearMiniChart(exportSeries, '#f59e0b', selectedYearMonth.index, 'desktop-kpi-year-chart')}
            </div>
            <div class="kpi-card kpi-warning desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('alerts')">
                <div class="kpi-icon"><img src="/images/mobile-icons/logo-chuongthongbao.png" alt=""></div>
                <div class="kpi-info">
                    <div class="kpi-label">SẮP HẾT HÀNG</div>
                    <div class="kpi-value" style="color: ${lowStockCount > 0 ? 'var(--danger-text)' : 'var(--success-text)'};">${lowStockCount}</div>
                    <div class="desktop-kpi-trend ${lowStockTrend.className}"><span>${lowStockTrend.arrow}</span> ${lowStockTrend.text} <small>so với tháng trước</small></div>
                </div>
                ${renderYearMiniChart(lowStockSeries, '#ef4444', selectedYearMonth.index, 'desktop-kpi-year-chart')}
            </div>
        </div>
    `;
}

// ========== RENDER DASHBOARD ==========

export function renderDashboard() {
    // Kiểm tra cache
    const cachedHtml = getCachedDashboardHTML();
    if (cachedHtml) {
        return cachedHtml;
    }
    
    const allTxns = getFilteredTransactions();
    const selectedModuleMonth = getSelectedOverviewMonth();
    const moduleYearRows = getYearlyOverviewData(selectedModuleMonth.year);
    const inventorySnapshot = getInventorySnapshot();
    const totalInventory = inventorySnapshot.value;
    
    // Category stats
    const catStats = {};
    allTxns.forEach(t => {
        const mat = state.data.materials.find(m => m.id === t.mid);
        if (mat) {
            if (!catStats[mat.cat]) catStats[mat.cat] = { import: 0, export: 0, qty: 0 };
            if (t.type === 'purchase') catStats[mat.cat].import += (parseFloat(parseFloat(t.totalAmount))||0);
            if (t.type === 'usage') catStats[mat.cat].export += (parseFloat(parseFloat(t.totalAmount))||0);
        }
    });
    
    // Top projects
    const projectStats = {};
    allTxns.filter(t => t.type === 'usage' && t.projectId).forEach(t => {
        if (!projectStats[t.projectId]) projectStats[t.projectId] = 0;
        projectStats[t.projectId] += (parseFloat(parseFloat(t.totalAmount))||0);
    });
    const topProjects = Object.entries(projectStats)
        .map(([id, total]) => ({ name: state.data.projects.find(p=>p.id===id)?.name||'Khác', total, id }))
        .sort((a,b) => b.total - a.total).slice(0, 5);
    const maxProject = topProjects[0]?.total || 1;
    
    // Top suppliers
    const supplierStats = {};
    allTxns.filter(t => t.type === 'purchase' && t.supplierId).forEach(t => {
        if (!supplierStats[t.supplierId]) supplierStats[t.supplierId] = 0;
        supplierStats[t.supplierId] += (parseFloat(parseFloat(t.totalAmount))||0);
    });
    const topSuppliers = Object.entries(supplierStats)
        .map(([id, total]) => ({ name: state.data.suppliers.find(s=>s.id===id)?.name||'Khác', total, id }))
        .sort((a,b) => b.total - a.total).slice(0, 5);
    const maxSupplier = topSuppliers[0]?.total || 1;
    const structureStats = getStructureStats();
    const projectCount = state.data.projects.length;
    const activeProjects = state.data.projects.filter(p => String(p.status || '').toLowerCase().includes('thi') || String(p.status || '').toLowerCase().includes('active')).length || Math.min(projectCount, topProjects.length);
    const totalProjectSpent = topProjects.reduce((s, p) => s + Number(p.total || 0), 0);
    const supplierTotal = topSuppliers.reduce((s, p) => s + Number(p.total || 0), 0);
    const totalImport = allTxns.filter(t => t.type === 'purchase').reduce((s, t) => s + Number(t.totalAmount || 0), 0);
    const totalExport = allTxns.filter(t => t.type === 'usage' || t.type === 'structure_export').reduce((s, t) => s + Number(t.totalAmount || 0), 0);
    const totalStockQty = inventorySnapshot.qty;
    const moduleStockSeries = moduleYearRows.map(row => row.stockValue);
    const supplierSeries = moduleYearRows.map(row => row.supplierActive);
    const projectSeries = moduleYearRows.map(row => row.projectActive);
    const structureSeries = moduleYearRows.map(row => row.structureProduced);
    const categoryColors = ['#1f7aff', '#10b981', '#f59e0b', '#fb7185', '#94a3b8', '#8b5cf6'];
    const inventoryCategoryStats = {};
    state.data.materials.forEach(m => {
        const key = m.cat || 'Khác';
        if (!inventoryCategoryStats[key]) inventoryCategoryStats[key] = { qty: 0, value: 0, count: 0 };
        inventoryCategoryStats[key].qty += Number(m.qty || 0);
        inventoryCategoryStats[key].value += Number(m.qty || 0) * Number(m.cost || 0);
        inventoryCategoryStats[key].count += 1;
    });
    const allCategoryRows = Object.entries(inventoryCategoryStats)
        .map(([name, item]) => ({ name, ...item }))
        .sort((a, b) => b.value - a.value);
    const categoryTotalValue = allCategoryRows.reduce((sum, item) => sum + item.value, 0);
    const categoryRows = allCategoryRows.slice(0, 6);
    
    // Recent transactions
    const recentAllTxns = allTxns.sort((a,b) => new Date(b.datetime||b.date) - new Date(a.datetime||a.date));
const recentPage = getPagedData('recentTxns', recentAllTxns);
const recentTxns = recentPage.rows;

    
    const html = `
        ${renderFiltersAndTabs()}
        ${renderKPICards()}
        
        <div class="desktop-overview-main">
            <div class="card desktop-chart-card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('movement')">
                <div class="desktop-card-head"><div class="sec-title">Biến động nhập - xuất - tồn kho</div></div>
                <div class="chart-container" style="height: 300px;"><canvas id="monthly-chart"></canvas></div>
            </div>
            <div class="card desktop-chart-card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('categories')">
                <div class="desktop-card-head"><div class="sec-title">Tồn kho theo nhóm vật tư</div><button class="sm" onclick="event.stopPropagation(); window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('categories')">Xem chi tiết ›</button></div>
                <div class="desktop-category-card-body">
                    <div class="desktop-category-donut">
                        <canvas id="category-pie-chart"></canvas>
                        <div class="desktop-category-center"><strong>${formatCompactMoney(categoryTotalValue)}</strong><span>tồn kho</span></div>
                    </div>
                    <div class="desktop-category-legend">
                        ${categoryRows.map((item, index) => {
                            const pct = categoryTotalValue ? item.value / categoryTotalValue * 100 : 0;
                            return `<div class="desktop-category-row"><span class="desktop-category-dot" style="background:${categoryColors[index % categoryColors.length]}"></span><strong>${escapeHtml(item.name)}</strong><em>${pct.toFixed(1)}%</em><small>${formatCompactMoney(item.value)}</small></div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
            ${getLowStockHTML() || '<div class="card desktop-low-stock-card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel(\'alerts\')"><div class="desktop-card-head"><div class="sec-title">Cảnh báo</div></div><div class="metric-sub" style="padding:20px;text-align:center;">Không có vật tư chạm ngưỡng cảnh báo</div></div>'}
        </div>
        
        <div class="desktop-module-grid">
            <div class="desktop-module-card desktop-module-materials desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('materials')">
                <div class="desktop-card-head"><div class="sec-title">Vật tư</div><button class="sm" onclick="event.stopPropagation(); window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('materials')">Xem chi tiết ›</button></div>
                <div class="desktop-module-icon"><img src="/images/mobile-icons/logo-vattu.png" alt=""></div>
                <p>Quản lý toàn bộ vật tư trong kho</p>
                <div class="desktop-module-stat-row">
                    <div class="desktop-module-stats"><strong>${formatCompactNumber(totalStockQty)}</strong><span>Tổng tồn kho</span></div>
                    <div class="desktop-module-stats"><strong>${state.data.materials.length}</strong><span>Chủng loại</span></div>
                    <div class="desktop-module-stats"><strong>${formatCompactMoney(totalInventory)}</strong><span>Giá trị tồn</span></div>
                </div>
                ${renderYearMiniChart(moduleStockSeries, '#1f7aff', selectedModuleMonth.index, 'desktop-module-year-chart')}
            </div>
            <div class="desktop-module-card desktop-module-suppliers desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('suppliers')">
                <div class="desktop-card-head"><div class="sec-title">Nhà cung cấp</div><button class="sm" onclick="event.stopPropagation(); window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('suppliers')">Xem chi tiết ›</button></div>
                <div class="desktop-module-icon"><img src="/images/mobile-icons/logo-tongnhacungcap.png" alt=""></div>
                <p>Theo dõi nhập hàng và đánh giá nhà cung cấp</p>
                <div class="desktop-module-stat-row">
                    <div class="desktop-module-stats"><strong>${state.data.suppliers.length}</strong><span>Nhà cung cấp</span></div>
                    <div class="desktop-module-stats"><strong>${topSuppliers.length ? topSuppliers.length : 0}</strong><span>Có phát sinh</span></div>
                    <div class="desktop-module-stats"><strong>${formatCompactMoney(supplierTotal)}</strong><span>Giá trị nhập</span></div>
                </div>
                ${renderYearMiniChart(supplierSeries, '#10b981', selectedModuleMonth.index, 'desktop-module-year-chart')}
            </div>
            <div class="desktop-module-card desktop-module-projects desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('projects')">
                <div class="desktop-card-head"><div class="sec-title">Công trình</div><button class="sm" onclick="event.stopPropagation(); window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('projects')">Xem chi tiết ›</button></div>
                <div class="desktop-module-icon"><img src="/images/mobile-icons/logo-tongcongtrinh.png" alt=""></div>
                <p>Quản lý vật tư theo công trình</p>
                <div class="desktop-module-stat-row">
                    <div class="desktop-module-stats"><strong>${projectCount}</strong><span>Công trình</span></div>
                    <div class="desktop-module-stats"><strong>${activeProjects}</strong><span>Đang thi công</span></div>
                    <div class="desktop-module-stats"><strong>${formatCompactMoney(totalProjectSpent)}</strong><span>Giá trị xuất</span></div>
                </div>
                ${renderYearMiniChart(projectSeries, '#8b5cf6', selectedModuleMonth.index, 'desktop-module-year-chart')}
            </div>
            <div class="desktop-module-card desktop-module-structures desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('structures')">
                <div class="desktop-card-head"><div class="sec-title">Cấu kiện</div><button class="sm" onclick="event.stopPropagation(); window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('structures')">Xem chi tiết ›</button></div>
                <div class="desktop-module-icon"><img src="/images/mobile-icons/logo-tongcaukien.png" alt=""></div>
                <p>Quản lý sản xuất và tồn kho cấu kiện</p>
                <div class="desktop-module-stat-row">
                    <div class="desktop-module-stats"><strong>${formatCompactNumber(structureStats.totalProduced || 0)}</strong><span>Tổng sản lượng</span></div>
                    <div class="desktop-module-stats"><strong>${structureStats.totalStructures || 0}</strong><span>Loại cấu kiện</span></div>
                    <div class="desktop-module-stats"><strong>${structureStats.lowStockCount || 0}</strong><span>Tồn thấp</span></div>
                </div>
                ${renderYearMiniChart(structureSeries, '#f59e0b', selectedModuleMonth.index, 'desktop-module-year-chart')}
            </div>
        </div>
        
        <div class="desktop-bottom-grid">
        <div class="card desktop-recent-card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('recent')">
            <div class="desktop-card-head">
    <span class="sec-title">Giao dịch gần đây</span>
    ${renderDashboardPageSize('recentTxns', recentPage)}
</div>

            <div class="desktop-table-wrap" onclick="event.stopPropagation()">
                <table class="dashboard-table">
                    <thead><tr><th>Thời gian</th><th>Loại</th><th>Vật tư</th><th style="text-align:right;">SL</th><th style="text-align:right;">Thành tiền</th><th>Đối tượng</th></tr></thead>
                    <tbody>
                                                ${recentTxns.map(t => {
                            const mat = state.data.materials.find(m=>m.id===t.mid) || (state.data.structures||[]).find(s=>s.id===t.mid);
                            const dt = formatDateVN(t.datetime || t.date, true);
                            let icon = '📥', label = 'Nhập kho', target = '';
                            if (t.type === 'usage') { icon = '📤'; label = 'Xuất kho'; target = state.data.projects.find(p=>p.id===t.projectId)?.name || ''; }
                            else if (t.type === 'return') { icon = '🔄'; label = 'Trả hàng'; target = state.data.projects.find(p=>p.id===t.projectId)?.name || ''; }
                            else if (t.type === 'structure_export') { icon = '🏗️'; label = 'Xuất CK'; target = state.data.projects.find(p=>p.id===t.projectId)?.name || ''; }
                            else if (t.type === 'structure_return') { icon = '🔄'; label = 'Trả CK'; target = state.data.projects.find(p=>p.id===t.projectId)?.name || ''; }
                            else if (t.type === 'produce') { icon = '🏭'; label = 'Sản xuất'; target = ''; }
                            else if (t.type === 'transfer_sw') { icon = '📦'; label = 'Chuyển CK'; target = ''; }
                            else if (t.type === 'return_from_sw') { icon = '🔄'; label = 'Trả CK'; target = ''; }
                            else { target = state.data.suppliers.find(s=>s.id===t.supplierId)?.name || ''; }
                            
                            let badgeClass = 'status-good';
                            if (t.type === 'usage' || t.type === 'structure_export') badgeClass = 'status-warn';
                            else if (t.type === 'return' || t.type === 'structure_return' || t.type === 'return_from_sw') badgeClass = 'status-danger';
                            else if (t.type === 'produce') badgeClass = 'status-good';
                            
                            return `<tr>
                                <td style="white-space:nowrap;">${dt}</td>
                                <td><span class="status-badge ${badgeClass}" style="font-size:11px;">${icon} ${label}</span></td>
                                <td>${escapeHtml(mat?.name||'N/A')}</td>
                                <td style="text-align:right;">${Number(t.qty||0).toLocaleString('vi-VN', {minimumFractionDigits:0, maximumFractionDigits:3})} ${mat?.unit||''}</td>
                                <td style="text-align:right;font-weight:500;">${formatMoneyVND(parseFloat(parseFloat(t.totalAmount)))}</td>
                                <td>${escapeHtml(target)}</td>
                            </tr>`;
                        }).join('')}
                        ${recentTxns.length === 0 ? '<tr><td colspan="6" style="text-align:center;">📭 Chưa có giao dịch</td>' : ''}
                        
                    </tbody>
                </table>
            </div>
            <div onclick="event.stopPropagation()">${renderDashboardPager('recentTxns', recentPage, 'giao dịch')}</div>
        </div>
        <div class="card desktop-period-value-card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('period')">
            <div class="desktop-card-head"><span class="sec-title">Giá trị nhập - xuất trong kỳ</span><button class="sm" onclick="event.stopPropagation(); window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('period')">Xem chi tiết ›</button></div>
            <div class="desktop-period-row">
                <div><strong>Nhập trong kỳ</strong><span>${formatMoneyVND(totalImport)}</span></div>
                <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, totalImport / Math.max(totalImport, totalExport, 1) * 100)}%;"></div></div>
            </div>
            <div class="desktop-period-row">
                <div><strong>Xuất trong kỳ</strong><span>${formatMoneyVND(totalExport)}</span></div>
                <div class="progress-bar"><div class="progress-fill desktop-export-fill" style="width:${Math.min(100, totalExport / Math.max(totalImport, totalExport, 1) * 100)}%;"></div></div>
            </div>
            <div class="metric-sub">Dữ liệu đang theo bộ lọc thời gian hiện tại</div>
        </div>
        </div>
    `;
    
    // Lưu vào cache
    setCachedDashboardHTML(html);
    
    return html;
}

function renderFiltersAndTabs() {
    return `
        <div class="dashboard-tabs">
            <div class="dashboard-tab ${currentDashboardTab==='overview'?'active':''}" onclick="window.switchDashboardTab('overview')">Tổng quan</div>
            <div class="dashboard-tab ${currentDashboardTab==='projects'?'active':''}" onclick="window.switchDashboardTab('projects')">Công trình</div>
            <div class="dashboard-tab ${currentDashboardTab==='suppliers'?'active':''}" onclick="window.switchDashboardTab('suppliers')">Nhà cung cấp</div>
            <div class="dashboard-tab ${currentDashboardTab==='structures'?'active':''}" onclick="window.switchDashboardTab('structures')">Cấu kiện</div>
            <div class="dashboard-tab ${currentDashboardTab==='forecast'?'active':''}" onclick="window.switchDashboardTab('forecast')">Dự báo</div>
        </div>
        ${currentDashboardTab === 'projects' ? renderFilterProjects() : currentDashboardTab === 'suppliers' ? renderFilterSuppliers() : currentDashboardTab === 'structures' ? renderFilterStructures() : currentDashboardTab === 'overview' ? renderFilterOverview() : currentDashboardTab === 'forecast' ? renderFilterForecast() : ''}
    `;
}

        window.switchDashboardTab = function(tab) {
    applyDashboardChartTheme();
    currentDashboardTab = tab;
    syncAdvancedFiltersForTab(tab);
    clearDashboardCache();   
 if (tab === 'projects' || tab === 'suppliers' || tab === 'structures' || tab === 'forecast') {
        document.getElementById('pane-dashboard').innerHTML = renderTabContent(tab);
        setTimeout(function(){
            if (tab === 'projects') {
                var ctx1 = document.getElementById('top-projects-chart');
                var ctx2 = document.getElementById('budget-pie-chart');
                if (ctx1 && ctx2) {
                    if (topProjectsChart) topProjectsChart.destroy();
                    if (window._bp) window._bp.destroy();
                                        // LỌC THEO CÔNG TRÌNH
                    var filteredProjs = state.data.projects;
                    if (filterProjects.projectId !== 'all') {
                        filteredProjs = filteredProjs.filter(function(p) { return p.id === filterProjects.projectId; });
                    }
                    var chartTxns = getFilteredTransactions(false);
                    var pdata = filteredProjs.map(function(p){
                        var u = chartTxns.filter(function(t){return t.projectId===p.id&&(t.type==='usage'||t.type==='structure_export')}).reduce(function(s,t){return s+Number(t.totalAmount||0)},0);
                        var r = chartTxns.filter(function(t){return t.projectId===p.id&&(t.type==='return'||t.type==='structure_return')}).reduce(function(s,t){return s+Number(t.totalAmount||0)},0);
                        return { name: p.name.length>20?p.name.substring(0,20):p.name, spent: u-r };
                    }).sort(function(a,b){return b.spent-a.spent}).slice(0,5);
                    topProjectsChart = new Chart(ctx1, { type:'bar', data:{ labels:pdata.map(function(p){return p.name}), datasets:[{ label:'Chi', data:pdata.map(function(p){return p.spent}), backgroundColor:['#378ADD','#97C459','#FAC775','#F09595','#85B7EB'], borderRadius:6 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} } } });
                    var tu = pdata.reduce(function(s,p){return s+p.spent},0);
                    var tb = filteredProjs.reduce(function(s,p){return s+Number(p.budget||0)},0);
                    window._bp = new Chart(ctx2, { type:'doughnut', data:{ labels:['Đã sử dụng','Còn lại'], datasets:[{ data:[tu, Math.max(0,tb-tu)], backgroundColor:['#f59e0b','#10b981'], borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} } } });
                }
            }
            if (tab === 'suppliers') {
                var ctx1 = document.getElementById('top-suppliers-chart');
                var ctx2 = document.getElementById('supplier-pie-chart');
                if (ctx1 && ctx2) {
                    if (topSuppliersChart) topSuppliersChart.destroy();
                    if (window._sp) window._sp.destroy();
                    var filteredSups = state.data.suppliers;
                    if (filterSuppliers.supplierId !== 'all') {
                        filteredSups = filteredSups.filter(function(s) { return s.id === filterSuppliers.supplierId; });
                    }
                    var chartTxns = getFilteredTransactions(false);
                    var sdata = filteredSups.map(function(s){
                        var t = chartTxns.filter(function(x){return x.type==='purchase'&&x.supplierId===s.id}).reduce(function(a,x){return a+Number(x.totalAmount||0)},0);
                        return { name: s.name.length>20?s.name.substring(0,20):s.name, total: t };
                    }).sort(function(a,b){return b.total-a.total}).slice(0,5);
                    topSuppliersChart = new Chart(ctx1, { type:'bar', data:{ labels:sdata.map(function(s){return s.name}), datasets:[{ label:'Tong chi', data:sdata.map(function(s){return s.total}), backgroundColor:['#378ADD','#97C459','#FAC775','#F09595','#85B7EB'], borderRadius:6 }] }, options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} } } });
                    var t5 = sdata.reduce(function(s,p){return s+p.total},0);
                    var at = filteredSups.reduce(function(s,p){ var t=chartTxns.filter(function(x){return x.type==='purchase'&&x.supplierId===p.id}).reduce(function(a,x){return a+Number(x.totalAmount||0)},0); return s+t; },0);
                    window._sp = new Chart(ctx2, { type:'doughnut', data:{ labels:sdata.map(function(s){return s.name}).concat(['Khác']), datasets:[{ data:sdata.map(function(s){return s.total}).concat([Math.max(0,at-t5)]), backgroundColor:['#10b981','#1f7aff','#f59e0b','#8b5cf6','#94a3b8','#64748b'], borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} } } });
                }
            }	    if (tab === 'structures') {
                renderStructureTabCharts();            
		}
		if (tab === 'forecast') {
		 loadForecast();
         loadForecastProjects();
         loadForecastStructures();

            }
        }, 500);
    } else {
        updateDashboardContent();
    }
};

function renderTabContent(tab) {
    const filters = renderFiltersAndTabs();
    const tabTxns = getFilteredTransactions();
    const selectedMonth = getSelectedOverviewMonth(tab);
    const yearRows = getYearlyOverviewData(selectedMonth.year);
    const comparison = getComparisonContext(tab);
    const prevTxns = comparison.previousTxns;
   
    if (tab === 'projects') {
                // LỌC THEO CÔNG TRÌNH ĐƯỢC CHỌN
        var filteredProjects = state.data.projects;
        if (filterProjects.projectId !== 'all') {
            filteredProjects = filteredProjects.filter(function(p) { return p.id === filterProjects.projectId; });
        }
        const projects = filteredProjects.map(p => {
            const u = tabTxns.filter(t=>t.projectId===p.id&&(t.type==='usage'||t.type==='structure_export')).reduce((s,t)=>s+(parseFloat(parseFloat(t.totalAmount))||0),0);
            const r = tabTxns.filter(t=>t.projectId===p.id&&(t.type==='return'||t.type==='structure_return')).reduce((s,t)=>s+(parseFloat(parseFloat(t.totalAmount))||0),0);
            return { ...p, spent: u-r, pct: p.budget>0?(u-r)/p.budget*100:0 };
        }).sort((a,b)=>b.spent-a.spent);
        const projectPage = getPagedData('projects', projects);
        const displayProjects = projectPage.rows;

        
        const totalProjects = projects.length;
        const totalBudget = projects.reduce((s, p) => s + Number(p.budget||0), 0);
        const totalSpentAll = projects.reduce((s, p) => s + Number(p.spent||0), 0);
        const totalReturnedAll = tabTxns.filter(t => t.type === 'return' || t.type === 'structure_return').reduce((s, t) => s + Number(t.totalAmount || 0), 0);
        const projectIds = new Set(filteredProjects.map(p => p.id));
        const activeProjects = new Set(tabTxns.filter(t => projectIds.has(t.projectId) && (t.type === 'usage' || t.type === 'structure_export')).map(t => t.projectId)).size;
        const prevActiveProjects = new Set(prevTxns.filter(t => projectIds.has(t.projectId) && (t.type === 'usage' || t.type === 'structure_export')).map(t => t.projectId)).size;
        const prevSpentAll = filteredProjects.reduce((sum, p) => {
            const used = prevTxns.filter(t => t.projectId === p.id && (t.type === 'usage' || t.type === 'structure_export')).reduce((s, t) => s + Number(t.totalAmount || 0), 0);
            const returned = prevTxns.filter(t => t.projectId === p.id && (t.type === 'return' || t.type === 'structure_return')).reduce((s, t) => s + Number(t.totalAmount || 0), 0);
            return sum + used - returned;
        }, 0);
        const prevReturnedAll = prevTxns.filter(t => t.type === 'return' || t.type === 'structure_return').reduce((s, t) => s + Number(t.totalAmount || 0), 0);
        const avgPct = totalBudget > 0 ? (totalSpentAll / totalBudget * 100) : 0;
        const budgetRemain = Math.max(0, totalBudget - totalSpentAll);
        const prevBudgetRemain = Math.max(0, totalBudget - prevSpentAll);
        const budgetRows = [
            { name: 'Đã sử dụng', value: totalSpentAll, color: '#f59e0b' },
            { name: 'Còn lại', value: budgetRemain, color: '#10b981' },
            { name: 'Đã trả về', value: totalReturnedAll, color: '#1f7aff' }
        ].filter(item => item.value > 0 || totalBudget === 0);
        const budgetTotal = Math.max(totalBudget, budgetRows.reduce((sum, item) => sum + item.value, 0), 1);
        const projectKPIs = `<div class="kpi-grid" style="margin-bottom:16px;">
            ${renderDesktopTabKpi({ scope: 'projects', panel: 'projects', icon: 'logo-tongcongtrinh.png', label: 'TỔNG CÔNG TRÌNH', value: totalProjects, sub: `${activeProjects} có phát sinh`, series: yearRows.map(r => r.projectActive), color: '#8b5cf6', trend: formatTrend(activeProjects, prevActiveProjects) })}
            ${renderDesktopTabKpi({ scope: 'projects', panel: 'projects', icon: 'logo-baocao.png', label: 'TỔNG NGÂN SÁCH', value: formatCompactMoney(totalBudget), sub: 'Tất cả công trình', series: yearRows.map(r => totalBudget), color: '#1f7aff', trend: formatTrend(totalBudget, totalBudget) })}
            ${renderDesktopTabKpi({ scope: 'projects', panel: 'projects', icon: 'logo-xuatkho.png', label: 'ĐÃ SỬ DỤNG', value: formatCompactMoney(totalSpentAll), sub: `${avgPct.toFixed(1)}% ngân sách`, series: yearRows.map(r => r.exportValue), color: '#f59e0b', trend: formatTrend(totalSpentAll, prevSpentAll) })}
            ${renderDesktopTabKpi({ scope: 'projects', panel: 'projects', icon: 'logo-tongquan.png', label: 'CÒN LẠI', value: formatCompactMoney(totalBudget - totalSpentAll), sub: `${Math.max(0, 100 - avgPct).toFixed(1)}% còn lại`, series: yearRows.map(r => Math.max(0, totalBudget - r.exportValue)), color: '#10b981', trend: formatTrend(budgetRemain, prevBudgetRemain) })}
            ${renderDesktopTabKpi({ scope: 'projects', panel: 'projects', icon: 'logo-trahang.png', label: 'ĐÃ TRẢ', value: formatCompactMoney(totalReturnedAll), sub: 'Vật tư/cấu kiện trả', series: yearRows.map(r => r.exportValue * .08), color: '#60a5fa', trend: formatTrend(totalReturnedAll, prevReturnedAll) })}
        </div>`;
        return filters + projectKPIs + `
    <div class="desktop-dashboard-grid" style="margin-bottom:18px;">
        <div class="card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('projects')">
            <div class="desktop-card-head"><div class="sec-title">Top 5 công trình</div></div>
            <div class="chart-container" style="height:280px;"><canvas id="top-projects-chart"></canvas></div>
        </div>
        <div class="card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('projects')">
            <div class="desktop-card-head"><div class="sec-title">Cơ cấu ngân sách</div></div>
            <div class="desktop-category-card-body">
                <div class="desktop-category-donut">
                    <canvas id="budget-pie-chart"></canvas>
                    <div class="desktop-category-center"><strong>${formatCompactMoney(totalBudget)}</strong><span>ngân sách</span></div>
                </div>
                <div class="desktop-category-legend">
                    ${budgetRows.map(item => {
                        const pct = budgetTotal ? item.value / budgetTotal * 100 : 0;
                        return `<div class="desktop-category-row"><span class="desktop-category-dot" style="background:${item.color}"></span><strong>${escapeHtml(item.name)}</strong><em>${pct.toFixed(1)}%</em><small>${formatCompactMoney(item.value)}</small></div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    </div>

    <div class="card">

            <div class="desktop-card-head">
    <span class="sec-title">Chi tiết công trình</span>
    ${renderDashboardPageSize('projects', projectPage)}
</div>

                <div class="desktop-table-wrap">
                    <table class="dashboard-table" style="min-width:900px;">
                        <thead><tr><th style="text-align:left;">Tên</th><th style="text-align:right;white-space:nowrap;">Ngân sách</th><th style="text-align:right;white-space:nowrap;">Đã chi</th><th style="text-align:right;white-space:nowrap;">Còn lại</th><th style="text-align:center;white-space:nowrap;">%</th><th>Tiến độ</th></tr></thead>
                        <tbody>
                            ${displayProjects.map(p => `
                                <tr style="cursor:pointer;" onclick="window.showProjectDetail('${p.id}')">
                                    <td style="text-align:left;white-space:nowrap;"><strong>${escapeHtml(p.name)}</strong></td>
                                    <td style="text-align:right;white-space:nowrap;">${formatMoneyVND(parseFloat(p.budget))}</td>
                                    <td style="text-align:right;white-space:nowrap;" class="text-warning">${formatMoneyVND(parseFloat(p.spent))}</td>
                                    <td style="text-align:right;white-space:nowrap;"><span class="${(parseFloat(p.budget)-parseFloat(p.spent))<0?'status-danger':'status-good'}" style="font-weight:500;">${formatMoneyVND(parseFloat(p.budget)-parseFloat(p.spent))}</span></td>
                                    <td style="text-align:center;"><span class="status-badge ${p.pct>90?'status-danger':p.pct>70?'status-warn':'status-good'}">${parseFloat(p.pct).toFixed(1)}%</span></td>
                                    <td><div class="progress-bar" style="width:120px;"><div class="progress-fill" style="width:${Math.max(0, Math.min(p.pct, 100))}%;background:${p.pct>90?'#A32D2D':'#378ADD'};"></div></div></td>
                                </tr>
                            `).join('')}
                            
                        </tbody>
                    </table>
                </div>
                ${renderDashboardPager('projects', projectPage, 'công trình')}
            </div>
        `;
    }
                               
    if (tab === 'suppliers') {
        var filteredSuppliers = state.data.suppliers;
        if (filterSuppliers.supplierId !== 'all') {
            filteredSuppliers = filteredSuppliers.filter(function(s) { return s.id === filterSuppliers.supplierId; });
        }
        const suppliers = filteredSuppliers.map(s => {            const txns = tabTxns.filter(t=>t.type==='purchase'&&t.supplierId===s.id);
            return { ...s, total: txns.reduce((sum,t)=>sum+(parseFloat(parseFloat(t.totalAmount))||0),0), count: txns.length };
        }).sort((a,b)=>b.total-a.total);
        const supplierPage = getPagedData('suppliers', suppliers);
        const displaySuppliers = supplierPage.rows;

        
        const totalSuppliers = suppliers.length;
        const totalSpentAll = suppliers.reduce((s, p) => s + Number(p.total||0), 0);
        const totalOrders = suppliers.reduce((s, p) => s + Number(p.count||0), 0);
        const avgOrderValue = totalOrders > 0 ? totalSpentAll / totalOrders : 0;
        const topSup = suppliers[0];
        const supplierIds = new Set(filteredSuppliers.map(s => s.id));
        const prevSupplierTxns = prevTxns.filter(t => t.type === 'purchase' && supplierIds.has(t.supplierId));
        const activeSuppliers = new Set(tabTxns.filter(t => t.type === 'purchase' && supplierIds.has(t.supplierId)).map(t => t.supplierId)).size;
        const prevActiveSuppliers = new Set(prevSupplierTxns.map(t => t.supplierId)).size;
        const prevSpentAll = prevSupplierTxns.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
        const prevOrders = prevSupplierTxns.length;
        const prevAvgOrderValue = prevOrders > 0 ? prevSpentAll / prevOrders : 0;
        const prevTopSupTotal = Math.max(0, ...filteredSuppliers.map(s => prevSupplierTxns.filter(t => t.supplierId === s.id).reduce((sum, t) => sum + Number(t.totalAmount || 0), 0)));
        const supplierShareRows = suppliers.slice(0, 5).map((s, index) => ({
            name: s.name,
            value: Number(s.total || 0),
            color: ['#10b981', '#1f7aff', '#f59e0b', '#8b5cf6', '#94a3b8'][index]
        })).filter(item => item.value > 0);
        const otherSupplierValue = Math.max(0, totalSpentAll - supplierShareRows.reduce((sum, item) => sum + item.value, 0));
        if (otherSupplierValue > 0) supplierShareRows.push({ name: 'Khác', value: otherSupplierValue, color: '#64748b' });
        const supplierShareTotal = Math.max(totalSpentAll, 1);
        const supplierKPIs = `<div class="kpi-grid" style="margin-bottom:16px;">
            ${renderDesktopTabKpi({ scope: 'suppliers', panel: 'suppliers', icon: 'logo-tongnhacungcap.png', label: 'TỔNG NHÀ CUNG CẤP', value: totalSuppliers, sub: `${activeSuppliers} có phát sinh`, series: yearRows.map(r => r.supplierActive), color: '#10b981', trend: formatTrend(activeSuppliers, prevActiveSuppliers) })}
            ${renderDesktopTabKpi({ scope: 'suppliers', panel: 'suppliers', icon: 'logo-nhapkho.png', label: 'TỔNG CHI TIÊU', value: formatCompactMoney(totalSpentAll), sub: 'Theo kỳ đang chọn', series: yearRows.map(r => r.importValue), color: '#1f7aff', trend: formatTrend(totalSpentAll, prevSpentAll) })}
            ${renderDesktopTabKpi({ scope: 'suppliers', panel: 'suppliers', icon: 'logo-taophieunhap.png', label: 'SỐ LẦN NHẬP', value: totalOrders, sub: 'Tổng giao dịch', series: yearRows.map(r => r.importValue), color: '#8b5cf6', trend: formatTrend(totalOrders, prevOrders) })}
            ${renderDesktopTabKpi({ scope: 'suppliers', panel: 'suppliers', icon: 'logo-baocao.png', label: 'NCC LỚN NHẤT', value: topSup?.name || '—', sub: topSup ? formatCompactMoney(topSup.total) : '0 đ', series: yearRows.map(r => r.supplierActive), color: '#f59e0b', trend: formatTrend(Number(topSup?.total || 0), prevTopSupTotal) })}
            ${renderDesktopTabKpi({ scope: 'suppliers', panel: 'suppliers', icon: 'logo-tongquan.png', label: 'TB/LẦN NHẬP', value: formatCompactMoney(avgOrderValue), sub: 'Giá trị trung bình', series: yearRows.map(r => r.importValue), color: '#60a5fa', trend: formatTrend(avgOrderValue, prevAvgOrderValue) })}
        </div>`;
        return filters + supplierKPIs + `
    <div class="desktop-dashboard-grid" style="margin-bottom:18px;">
        <div class="card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('suppliers')">
            <div class="desktop-card-head"><div class="sec-title">Top 5 nhà cung cấp</div></div>
            <div class="chart-container" style="height:280px;"><canvas id="top-suppliers-chart"></canvas></div>
        </div>
        <div class="card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('suppliers')">
            <div class="desktop-card-head"><div class="sec-title">Tỷ lệ chi tiêu</div></div>
            <div class="desktop-category-card-body">
                <div class="desktop-category-donut">
                    <canvas id="supplier-pie-chart"></canvas>
                    <div class="desktop-category-center"><strong>${formatCompactMoney(totalSpentAll)}</strong><span>chi tiêu</span></div>
                </div>
                <div class="desktop-category-legend">
                    ${supplierShareRows.map(item => {
                        const pct = supplierShareTotal ? item.value / supplierShareTotal * 100 : 0;
                        return `<div class="desktop-category-row"><span class="desktop-category-dot" style="background:${item.color}"></span><strong>${escapeHtml(item.name)}</strong><em>${pct.toFixed(1)}%</em><small>${formatCompactMoney(item.value)}</small></div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    </div>

    <div class="card">

            <div class="desktop-card-head">
    <span class="sec-title">Chi tiết nhà cung cấp</span>
    ${renderDashboardPageSize('suppliers', supplierPage)}
</div>


                <div class="desktop-table-wrap">
                    <table class="dashboard-table" style="min-width:800px;">
                        <thead><tr><th style="text-align:left;">Tên</th><th style="text-align:left;">SĐT</th><th style="text-align:left;">Email</th><th style="text-align:right;">Tổng chi</th><th style="text-align:center;">Số lần</th><th style="text-align:right;">TB/Lần</th></tr></thead>
                        <tbody>
                            ${displaySuppliers.map(s => `
                                <tr style="cursor:pointer;" onclick="window.showSupplierDetail('${s.id}')">
                                    <td style="text-align:left;"><strong>${escapeHtml(s.name)}</strong></td>
                                    <td style="text-align:left;">${s.phone||'—'}</td>
                                    <td style="text-align:left;">${s.email||'—'}</td>
                                    <td style="text-align:right;white-space:nowrap;"><span style="font-weight:600;color:${suppliers.indexOf(s)<3?'var(--accent)':'var(--text)'};">${formatMoneyVND(s.total)}</span></td>
                                    <td style="text-align:center;">${s.count}</td>
                                    <td style="text-align:right;white-space:nowrap;">${s.count>0?formatMoneyVND(s.total/s.count):'0 ₫'}</td>
                                </tr>
                            `).join('')}
                            
                        </tbody>
                    </table>
                </div>
                ${renderDashboardPager('suppliers', supplierPage, 'nhà cung cấp')}
            </div>
        `;
    }
if (tab === 'structures') {
    const stats = getStructureStats();
    const structureSnapshot = getStructureInventorySnapshot(advancedFilters.dateTo);
    const prevStructureSnapshot = getStructureInventorySnapshot(comparison.previousEnd);
    const producedInPeriod = tabTxns.filter(t => t.type === 'produce').reduce((sum, t) => sum + Number(t.qty || 0), 0);
    const exportedInPeriod = tabTxns.filter(t => t.type === 'structure_export').reduce((sum, t) => sum + Number(t.qty || 0), 0);
    const exportedValueInPeriod = tabTxns.filter(t => t.type === 'structure_export').reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
    const structureReturnedInPeriod = tabTxns.filter(t => t.type === 'structure_return' || t.type === 'return_from_sw').reduce((sum, t) => sum + Number(t.qty || 0), 0);
    const prevProducedInPeriod = prevTxns.filter(t => t.type === 'produce').reduce((sum, t) => sum + Number(t.qty || 0), 0);
    const prevExportedInPeriod = prevTxns.filter(t => t.type === 'structure_export').reduce((sum, t) => sum + Number(t.qty || 0), 0);
    const prevStructureReturnedInPeriod = prevTxns.filter(t => t.type === 'structure_return' || t.type === 'return_from_sw').reduce((sum, t) => sum + Number(t.qty || 0), 0);
    
    // KPI Cards riêng cho tab Cấu kiện
    const structureKPIs = `
        <div class="kpi-grid" style="margin-bottom:16px;">
            ${renderDesktopTabKpi({ scope: 'structures', panel: 'structures', icon: 'logo-tongcaukien.png', label: 'TỔNG CẤU KIỆN', value: stats.totalStructures || 0, sub: 'Loại cấu kiện', series: yearRows.map(r => r.structureProduced), color: '#f59e0b', trend: formatTrend(stats.totalStructures || 0, stats.totalStructures || 0) })}
            ${renderDesktopTabKpi({ scope: 'structures', panel: 'structures', icon: 'logo-kiemkekho.png', label: 'SẢN XUẤT TRONG KỲ', value: formatCompactNumber(producedInPeriod), sub: `${stats.totalProductionRuns || 0} đợt sản xuất`, series: yearRows.map(r => r.structureProduced), color: '#10b981', trend: formatTrend(producedInPeriod, prevProducedInPeriod) })}
            ${renderDesktopTabKpi({ scope: 'structures', panel: 'structures', icon: 'logo-xuatkho.png', label: 'XUẤT CT TRONG KỲ', value: formatCompactNumber(exportedInPeriod), sub: formatCompactMoney(exportedValueInPeriod), series: yearRows.map(r => r.structureExported), color: '#8b5cf6', trend: formatTrend(exportedInPeriod, prevExportedInPeriod) })}
            ${renderDesktopTabKpi({ scope: 'structures', panel: 'structures', icon: 'logo-chuongthongbao.png', label: 'TỒN THẤP', value: structureSnapshot.lowCount || 0, sub: structureSnapshot.lowCount > 0 ? 'Cần sản xuất thêm' : 'Tất cả ổn', series: yearRows.map(r => r.structureLowCount), color: '#ef4444', trend: formatTrend(structureSnapshot.lowCount || 0, prevStructureSnapshot.lowCount || 0) })}
            ${renderDesktopTabKpi({ scope: 'structures', panel: 'structures', icon: 'logo-trahang.png', label: 'TRẢ TỪ CT', value: formatCompactNumber(structureReturnedInPeriod), sub: 'Cấu kiện trả về', series: yearRows.map(r => r.structureReturned), color: '#60a5fa', trend: formatTrend(structureReturnedInPeriod, prevStructureReturnedInPeriod) })}
        </div>
    `;
    
    // Tạo bảng top cấu kiện
    let topListHtml = '<div class="metric-sub" style="text-align:center;padding:20px;">Chưa có dữ liệu sản xuất</div>';
    let topProducedRows = [];
    const producedMap = new Map();
    tabTxns.filter(t => t.type === 'produce').forEach(t => {
        const structure = (state.data.structures || []).find(s => String(s.id) === String(t.mid));
        const key = String(t.mid || structure?.id || '');
        if (!key) return;
        if (!producedMap.has(key)) producedMap.set(key, { name: structure?.name || t.mid, qty: 0, unit: structure?.unit || '' });
        producedMap.get(key).qty += Number(t.qty || 0);
    });
    topProducedRows = [...producedMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
    if (topProducedRows && topProducedRows.length > 0) {
        topListHtml = `
            <div class="desktop-table-wrap">
                <table style="min-width: 300px;">
                    <thead>
                        <tr>
                            <th>Tên cấu kiện</th>
                            <th style="text-align:right;">Số lượng</th>
                            <th>ĐVT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topProducedRows.map(p => `
                            <tr>
                                <td><strong>${escapeHtml(p.name)}</strong></td>
                                <td style="text-align:right;font-weight:bold;color:var(--accent);">${Number(p.qty).toLocaleString('vi-VN')}</td>
                                <td>${p.unit || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Bảng tồn kho cấu kiện có phân trang
    const stockStats = structureSnapshot.rows || [];
    const structurePage = getPagedData('structures', stockStats);
    const paginatedData = structurePage.rows;

    
    const inventoryHtml = stockStats.length > 0 ? `
        <div class="card">
            <div class="desktop-card-head">
    <span class="sec-title">Tồn kho cấu kiện chi tiết</span>
    ${renderDashboardPageSize('structures', structurePage)}
</div>


            <div class="desktop-table-wrap">
                <table style="min-width: 700px;">
                    <thead>
                        <tr>
                            <th>Tên cấu kiện</th>
                            <th style="text-align:right;">Tồn kho</th>
                            <th>ĐVT</th>
                            <th style="text-align:right;">Đơn giá</th>
                            <th style="text-align:right;">Thành tiền</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paginatedData.map(s => {
                            const statusClass = s.qty < 10 ? 'status-danger' : s.qty < 30 ? 'status-warn' : 'status-good';
                            const statusText = s.qty < 10 ? 'Sắp hết' : s.qty < 30 ? 'Trung bình' : 'Tốt';
                            return `<tr style="cursor:pointer;" onclick="window.showStructureDetail('${s.id}')">
                                <td><strong style="color:var(--accent);">${escapeHtml(s.name)}</strong></td>
                                <td style="text-align:right; ${s.qty < 10 ? 'color:var(--danger-text);font-weight:bold;' : ''}">${Number(s.qty || 0).toLocaleString('vi-VN')} ${s.unit}</td>
                                <td>${s.unit}</td>
                                <td style="text-align:right;">${formatMoneyVND(s.cost || 0)}</td>
                                <td style="text-align:right;color:var(--accent);font-weight:500;">${formatMoneyVND(s.totalValue || 0)}</td>
                                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ${renderDashboardPager('structures', structurePage, 'cấu kiện')}
        </div>
    ` : '<div class="card"><div class="metric-sub" style="text-align:center;padding:20px;">Chưa có cấu kiện nào</div></div>';
    
    return filters + structureKPIs + `
        <div class="desktop-dashboard-grid" style="margin-bottom:18px;">
            <div class="card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('structures')">
                <div class="desktop-card-head"><div class="sec-title">Xu hướng sản xuất 6 tháng</div></div>
                <div class="chart-container" style="height:280px;"><canvas id="structure-trend-chart"></canvas></div>
            </div>
            <div class="card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('structures')">
                <div class="desktop-card-head"><div class="sec-title">Top cấu kiện sản xuất nhiều nhất</div></div>
                ${topListHtml}
            </div>
        </div>
        ${inventoryHtml}
    `;
}
if (tab === 'forecast') {
    const snapshot = getInventorySnapshot();
    const urgentCount = (getMaterialSnapshotsAt(advancedFilters.dateTo) || []).filter(m => Number(m.snapshotQty || 0) <= Number(m.low || 0)).length;
    const warningCount = (getMaterialSnapshotsAt(advancedFilters.dateTo) || []).filter(m => Number(m.snapshotQty || 0) > Number(m.low || 0) && Number(m.snapshotQty || 0) <= Number(m.low || 0) * 1.5).length;
    const goodCount = Math.max(0, state.data.materials.length - urgentCount - warningCount);
    const returnedItems = new Set(tabTxns.filter(t => ['return', 'structure_return', 'return_from_sw'].includes(t.type)).map(t => String(t.mid || t.materialId || ''))).size;
    const returnedValue = tabTxns.filter(t => ['return', 'structure_return', 'return_from_sw'].includes(t.type)).reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
    const prevMaterials = getMaterialSnapshotsAt(comparison.previousEnd) || [];
    const prevUrgentCount = prevMaterials.filter(m => Number(m.snapshotQty || 0) <= Number(m.low || 0)).length;
    const prevWarningCount = prevMaterials.filter(m => Number(m.snapshotQty || 0) > Number(m.low || 0) && Number(m.snapshotQty || 0) <= Number(m.low || 0) * 1.5).length;
    const prevGoodCount = Math.max(0, state.data.materials.length - prevUrgentCount - prevWarningCount);
    const prevReturnedItems = new Set(prevTxns.filter(t => ['return', 'structure_return', 'return_from_sw'].includes(t.type)).map(t => String(t.mid || t.materialId || ''))).size;
    return `
        ${renderFiltersAndTabs()}
        <div class="kpi-grid" style="margin-bottom:16px;">
            ${renderDesktopTabKpi({ scope: 'forecast', panel: 'materials', icon: 'logo-tongvattu.png', label: 'TỔNG VẬT TƯ', value: state.data.materials.length, sub: 'Đang theo dõi', series: yearRows.map(r => r.stockQty), color: '#1f7aff', trend: formatTrend(state.data.materials.length, state.data.materials.length) })}
            ${renderDesktopTabKpi({ scope: 'forecast', panel: 'alerts', icon: 'logo-chuongthongbao.png', label: 'CẦN NHẬP GẤP', value: urgentCount, sub: 'Dưới ngưỡng an toàn', series: yearRows.map(r => r.lowCount), color: '#ef4444', trend: formatTrend(urgentCount, prevUrgentCount) })}
            ${renderDesktopTabKpi({ scope: 'forecast', panel: 'alerts', icon: 'logo-dubao.png', label: 'SẮP HẾT', value: warningCount, sub: 'Cần theo dõi', series: yearRows.map(r => r.lowCount), color: '#f59e0b', trend: formatTrend(warningCount, prevWarningCount) })}
            ${renderDesktopTabKpi({ scope: 'forecast', panel: 'stockQty', icon: 'logo-tongquanlykho.png', label: 'ĐỦ HÀNG', value: goodCount, sub: formatCompactNumber(snapshot.qty), series: yearRows.map(r => r.stockQty), color: '#10b981', trend: formatTrend(goodCount, prevGoodCount) })}
            ${renderDesktopTabKpi({ scope: 'forecast', panel: 'recent', icon: 'logo-trahang.png', label: 'HÀNG TRẢ VỀ', value: returnedItems, sub: formatCompactMoney(returnedValue), series: yearRows.map(r => Math.max(0, r.exportValue * .04)), color: '#60a5fa', trend: formatTrend(returnedItems, prevReturnedItems) })}
        </div>
        <div class="card desktop-click-card" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('alerts')">
    <div id="forecast-container">
        <div class="metric-sub" style="text-align:center;">🔄 Đang tải dữ liệu...</div>
    </div>
</div>

<div class="card desktop-click-card" style="margin-top:16px;" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('projects')">
    <div id="forecast-projects-container">
        <div class="metric-sub" style="text-align:center;">🔄 Đang tải...</div>
    </div>
</div>

<div class="card desktop-click-card" style="margin-top:16px;" onclick="window.openDesktopDashboardPanel && window.openDesktopDashboardPanel('structures')">
    <div id="forecast-structures-container">
        <div class="metric-sub" style="text-align:center;">🔄 Đang tải...</div>
    </div>
</div>

    `;
}


    return '';
}



// ========== CHARTS ==========

export function renderDashboardChart() {
    applyDashboardChartTheme();
    const dailyMovementData = getDailyMovementData();
    const chartTextColor = '#cbd5e1';
    const chartGridColor = 'rgba(148, 163, 184, .14)';
    
    const monthlyCtx = document.getElementById('monthly-chart');
    if (monthlyCtx) {
        if (monthlyChart) monthlyChart.destroy();
        monthlyChart = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: dailyMovementData.map(m => m.label),
                datasets: [
                    { label: 'Nhập kho', data: dailyMovementData.map(m => m.import), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.12)', borderWidth: 3, pointRadius: 2, tension: .32, fill: false },
                    { label: 'Xuất kho', data: dailyMovementData.map(m => m.export), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.12)', borderWidth: 3, pointRadius: 2, tension: .32, fill: false },
                    { label: 'Tồn kho', data: dailyMovementData.map(m => m.stock), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.12)', borderWidth: 3, pointRadius: 2, tension: .32, fill: false }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'bottom', labels: { color: chartTextColor, usePointStyle: true } },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(3,13,26,.92)',
                        borderColor: 'rgba(96,165,250,.32)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            title: items => items?.[0]?.label || '',
                            label: ctx => `${ctx.dataset.label}: ${formatMoneyVND(ctx.raw)}`
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: chartTextColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { color: chartGridColor } },
                    y: { ticks: { color: chartTextColor, callback: (v) => formatMoneyVND(v) }, grid: { color: chartGridColor } }
                }
            }
        });
    }
    
    const catCtx = document.getElementById('category-pie-chart');
    if (catCtx) {
        if (categoryPieChart) categoryPieChart.destroy();
        
        const catInventory = {};
        state.data.materials.forEach(m => {
            if (!catInventory[m.cat]) catInventory[m.cat] = 0;
            catInventory[m.cat] += m.qty * m.cost;
        });
        
        const labels = Object.keys(catInventory);
        const data = Object.values(catInventory);
        
        if (labels.length > 0) {
            categoryPieChart = new Chart(catCtx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: ['#1f7aff', '#10b981', '#f59e0b', '#fb7185', '#94a3b8', '#8b5cf6', '#14b8a6', '#ef4444'],
                        borderWidth: 2,
                        borderColor: 'rgba(3,13,26,.94)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatMoneyVND(ctx.raw)}` } }
                    }
                }
            });
        }
    }
}

setTimeout(() => {
    const projCtx = document.getElementById('top-projects-chart');
    const pieCtx = document.getElementById('budget-pie-chart');
    if (projCtx && pieCtx && projCtx.offsetParent !== null) {
        if (topProjectsChart) topProjectsChart.destroy();
        if (window._budgetPie) window._budgetPie.destroy();
        
        const chartTxns = getFilteredTransactions(false);
        const sourceProjects = filterProjects.projectId === 'all' ? state.data.projects : state.data.projects.filter(p => p.id === filterProjects.projectId);
        const projects2 = sourceProjects.map(p => {
            const u = chartTxns.filter(t=>t.projectId===p.id&&(t.type==='usage'||t.type==='structure_export')).reduce((s,t)=>s+Number(t.totalAmount||0),0);
            const r = chartTxns.filter(t=>t.projectId===p.id&&(t.type==='return'||t.type==='structure_return')).reduce((s,t)=>s+Number(t.totalAmount||0),0);
            return { name: p.name.length>20?p.name.substring(0,20)+'...':p.name, spent: u-r, budget: Number(p.budget||0) };
        }).sort((a,b)=>b.spent-a.spent).slice(0,5);
        
        topProjectsChart = new Chart(projCtx, {
            type: 'bar', data: {
                labels: projects2.map(p=>p.name),
                datasets: [{
                    label: 'Đã chi', data: projects2.map(p=>p.spent),
                    backgroundColor: ['#378ADD','#97C459','#FAC775','#F09595','#85B7EB'],
                    borderRadius: 6, borderWidth: 0
                }]
            },
            options: { responsive:true, maintainAspectRatio:false,
                plugins: { legend:{display:false}, tooltip:{ callbacks:{ label: (ctx) => formatMoneyVND(ctx.raw) } } },
                scales: { y: { ticks: { callback: (v) => formatMoneyVND(v) } } }
            }
        });
        
        const totalUsed = projects2.reduce((s,p)=>s+p.spent,0);
        const totalBud = sourceProjects.reduce((s,p)=>s+Number(p.budget||0),0);
        window._budgetPie = new Chart(pieCtx, {
            type: 'doughnut', data: {
                labels: ['Đã dùng','Còn lại'],
                datasets: [{ data: [totalUsed, Math.max(0,totalBud-totalUsed)], backgroundColor: ['#f59e0b','#10b981'], borderWidth: 0, borderRadius: 4 }]
            },
            options: { responsive:true, maintainAspectRatio:false,
                plugins: { legend:{ display:false } }
            }
        });
    }
    
    const supCtx = document.getElementById('top-suppliers-chart');
    const pieCtx2 = document.getElementById('supplier-pie-chart');
    if (supCtx && pieCtx2 && supCtx.offsetParent !== null) {
        if (topSuppliersChart) topSuppliersChart.destroy();
        if (window._supPie) window._supPie.destroy();
        
        const chartTxns2 = getFilteredTransactions(false);
        const sourceSuppliers = filterSuppliers.supplierId === 'all' ? state.data.suppliers : state.data.suppliers.filter(s => s.id === filterSuppliers.supplierId);
        const sups2 = sourceSuppliers.map(s => {
            const total = chartTxns2.filter(t=>t.type==='purchase'&&t.supplierId===s.id).reduce((a,t)=>a+Number(t.totalAmount||0),0);
            return { name: s.name.length>20?s.name.substring(0,20)+'...':s.name, total };
        }).sort((a,b)=>b.total-a.total).slice(0,5);
        
        topSuppliersChart = new Chart(supCtx, {
            type: 'bar', data: {
                labels: sups2.map(s=>s.name),
                datasets: [{
                    label: 'Tổng chi', data: sups2.map(s=>s.total),
                    backgroundColor: ['#378ADD','#97C459','#FAC775','#F09595','#85B7EB'],
                    borderRadius: 6, borderWidth: 0
                }]
            },
            options: { indexAxis: 'y', responsive:true, maintainAspectRatio:false,
                plugins: { legend:{display:false}, tooltip:{ callbacks:{ label: (ctx) => formatMoneyVND(ctx.raw) } } },
                scales: { x: { ticks: { callback: (v) => formatMoneyVND(v) } } }
            }
        });
        
        const top5Total = sups2.reduce((s,p)=>s+p.total,0);
        const allTotal = sourceSuppliers.reduce((s,p)=>{ const t=chartTxns2.filter(x=>x.type==='purchase'&&x.supplierId===p.id).reduce((a,x)=>a+Number(x.totalAmount||0),0); return s+t; },0);
        window._supPie = new Chart(pieCtx2, {
            type: 'doughnut', data: {
                labels: [...sups2.map(s=>s.name), 'Khác'],
                datasets: [{ data: [...sups2.map(s=>s.total), Math.max(0,allTotal-top5Total)], backgroundColor: ['#10b981','#1f7aff','#f59e0b','#8b5cf6','#94a3b8','#64748b'], borderWidth: 0, borderRadius: 4 }]
            },
            options: { responsive:true, maintainAspectRatio:false,
                plugins: { legend:{ display:false } }
            }
        });
    }
}, 400);

// ========== EVENT BINDING ==========

export function bindDashboardFilterEvents() {
    const applyBtn = document.getElementById('filter-apply');
    const resetBtn = document.getElementById('filter-reset');
    if (applyBtn) { applyBtn.onclick = applyFilters; }
    if (resetBtn) { resetBtn.onclick = resetFilters; }
}

export function bindDashboardSearchEvents() {
    bindDashboardFilterEvents();
}

export function renderCharts() {}
export function renderProjectCharts() {}

// Lắng nghe sự kiện từ socket.io để clear cache
if (typeof window !== 'undefined' && window.socket) {
    window.socket.on('dataChanged', function() {
        clearDashboardCache();
        console.log('🔄 Socket: dataChanged - cache cleared');
    });
}

window.clearDashboardCache = clearDashboardCache;
window.renderDashboardChart = renderDashboardChart;
window.getFilteredTransactions = getFilteredTransactions;
window.topProjectsChart = topProjectsChart;
window.topSuppliersChart = topSuppliersChart;
function renderFilterProjects() {
    var projects = [{ id: 'all', name: 'Tất cả' }].concat(state.data.projects || []);
    var opts = projects.map(function(p) {
        return '<option value="' + p.id + '"' + (filterProjects.projectId===p.id?' selected':'') + '>' + p.name + '</option>';
    }).join('');
    const period = getDashboardFilterPeriod('projects');
    return '<div class="card desktop-overview-filter">' +
        '<div class="desktop-overview-filter-row">' +
        '<span style="font-weight:600;">Lọc công trình:</span>' +
        '<button type="button" class="desktop-period-filter-btn" onclick="openDesktopPeriodSheet(\'projects\')"><span>' + periodButtonLabel(period) + '</span><small>' + periodLabel(period) + '</small></button>' +
        '<select id="fproj-project" style="width:200px;">' + opts + '</select>' +
        '<button class="sm primary" onclick="applyFilterProjects()">Áp dụng</button>' +
        '<button class="sm" onclick="resetFilterProjects()">Bỏ</button>' +
        '</div></div>';
}

window.applyFilterProjects = function() {
    filterProjects.projectId = document.getElementById('fproj-project')?.value || 'all';
    syncAdvancedFiltersForTab('projects');
    clearDashboardCache();
    updateDashboardContent();
};

window.resetFilterProjects = function() {
    filterProjects = { dateFrom: '', dateTo: '', projectId: 'all' };
    advancedFilters.dateFrom = '';
    advancedFilters.dateTo = '';
    advancedFilters.projectId = 'all';
    clearDashboardCache();
    updateDashboardContent();
};

function renderFilterSuppliers() {
    var suppliers = [{ id: 'all', name: 'Tất cả' }].concat(state.data.suppliers || []);
    var opts = suppliers.map(function(s) {
        return '<option value="' + s.id + '"' + (filterSuppliers.supplierId===s.id?' selected':'') + '>' + s.name + '</option>';
    }).join('');
    const period = getDashboardFilterPeriod('suppliers');
    return '<div class="card desktop-overview-filter">' +
        '<div class="desktop-overview-filter-row">' +
        '<span style="font-weight:600;">Lọc nhà cung cấp:</span>' +
        '<button type="button" class="desktop-period-filter-btn" onclick="openDesktopPeriodSheet(\'suppliers\')"><span>' + periodButtonLabel(period) + '</span><small>' + periodLabel(period) + '</small></button>' +
        '<select id="fsup-supplier" style="width:200px;">' + opts + '</select>' +
        '<button class="sm primary" onclick="applyFilterSuppliers()">Áp dụng</button>' +
        '<button class="sm" onclick="resetFilterSuppliers()">Bỏ</button>' +
        '</div></div>';
}

window.applyFilterSuppliers = function() {
    filterSuppliers.supplierId = document.getElementById('fsup-supplier')?.value || 'all';
    syncAdvancedFiltersForTab('suppliers');
    clearDashboardCache();
    updateDashboardContent();
};

window.resetFilterSuppliers = function() {
    filterSuppliers = { dateFrom: '', dateTo: '', supplierId: 'all' };
    advancedFilters.dateFrom = '';
    advancedFilters.dateTo = '';
    advancedFilters.supplierId = 'all';
    clearDashboardCache();
    updateDashboardContent();
};

function renderFilterOverview() {
    const period = getDashboardFilterPeriod('overview');
    return '<div class="card desktop-overview-filter"><div class="desktop-overview-filter-row"><span style="font-weight:600;">Lọc tổng quan:</span><button type="button" class="desktop-period-filter-btn" onclick="openDesktopPeriodSheet(\'overview\')"><span>' + periodButtonLabel(period) + '</span><small>' + periodLabel(period) + '</small></button><select id="fover-type" style="width:140px;"><option value="all">Tất cả</option><option value="purchase"' + (filterOverview.transactionType==='purchase'?' selected':'') + '>Nhập</option><option value="usage"' + (filterOverview.transactionType==='usage'?' selected':'') + '>Xuất</option></select><button class="sm primary" onclick="applyFilterOverview()">Áp dụng</button><button class="sm" onclick="resetFilterOverview()">Bỏ</button></div></div>';
}
window.applyFilterOverview = function() {
    filterOverview.transactionType = document.getElementById('fover-type')?.value || 'all';
    syncAdvancedFiltersForTab('overview');
    clearDashboardCache(); updateDashboardContent();
};
window.resetFilterOverview = function() {
    filterOverview = { dateFrom: '', dateTo: '', transactionType: 'all' };
    advancedFilters.dateFrom = ''; advancedFilters.dateTo = ''; advancedFilters.transactionType = 'all';
    clearDashboardCache(); updateDashboardContent();
};

window.openDesktopPeriodSheet = function(scope = currentDashboardTab || 'overview') {
    document.getElementById('desktop-period-sheet')?.remove();
    const activeScope = ['overview', 'projects', 'suppliers', 'structures', 'forecast'].includes(scope) ? scope : 'overview';
    const period = getDashboardFilterPeriod(activeScope);
    const monthValue = String(period.start || '').slice(0, 7);
    const selectedYear = Number(monthValue.slice(0, 4)) || new Date().getFullYear();
    const yearsHtml = availableDashboardYears().map(year =>
        `<option value="${year}" ${year === selectedYear ? 'selected' : ''}>${year}</option>`
    ).join('');
    const monthsHtml = monthsOfYear(selectedYear).map(month =>
        '<button type="button" class="' + (monthValue === month ? 'active' : '') + '" onclick="setDesktopOverviewMonth(\'' + month + '\')">' + monthDisplay(month) + '</button>'
    ).join('');
    const sheet = document.createElement('div');
    sheet.id = 'desktop-period-sheet';
    sheet.className = 'desktop-period-sheet';
    sheet.dataset.scope = activeScope;
    sheet.innerHTML = `
        <div class="desktop-period-backdrop" onclick="this.parentElement.remove()"></div>
        <section class="desktop-period-panel" onclick="event.stopPropagation()">
            <div class="desktop-period-head">
                <h3>Chọn kỳ dữ liệu</h3>
                <button type="button" onclick="document.getElementById('desktop-period-sheet')?.remove()">×</button>
            </div>
            <label>Năm</label>
            <select id="desktop-period-year" onchange="renderDesktopPeriodMonths(this.value)">
                ${yearsHtml}
            </select>
            <div class="desktop-period-month-list" id="desktop-period-month-list">${monthsHtml}</div>
            <div class="desktop-period-grid">
                <div><label>Từ ngày</label><input type="text" inputmode="numeric" id="desktop-period-start" placeholder="dd/mm/yyyy" value="${formatDateInputDisplay(period.start)}"></div>
                <div><label>Đến ngày</label><input type="text" inputmode="numeric" id="desktop-period-end" placeholder="dd/mm/yyyy" value="${formatDateInputDisplay(period.end)}"></div>
            </div>
            <div class="desktop-period-actions">
                <button type="button" class="primary" onclick="applyDesktopOverviewPeriod()">Áp dụng khoảng ngày</button>
                <button type="button" onclick="document.getElementById('desktop-period-sheet')?.remove()">Đóng</button>
            </div>
        </section>
    `;
    document.body.appendChild(sheet);
};

window.renderDesktopPeriodMonths = function(year) {
    const list = document.getElementById('desktop-period-month-list');
    if (!list) return;
    const scope = document.getElementById('desktop-period-sheet')?.dataset.scope || 'overview';
    const period = getDashboardFilterPeriod(scope);
    const monthValue = String(period.start || '').slice(0, 7);
    list.innerHTML = monthsOfYear(Number(year) || new Date().getFullYear()).map(month =>
        '<button type="button" class="' + (monthValue === month ? 'active' : '') + '" onclick="setDesktopOverviewMonth(\'' + month + '\')">' + monthDisplay(month) + '</button>'
    ).join('');
};

window.setDesktopOverviewMonth = function(value) {
    const [year, month] = value.split('-').map(Number);
    if (!year || !month) return;
    const today = new Date();
    const start = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const end = today.getFullYear() === year && today.getMonth() === month - 1 && today < monthEnd ? today : monthEnd;
    const scope = document.getElementById('desktop-period-sheet')?.dataset.scope || 'overview';
    setDashboardFilterPeriod(scope, toInputDate(start), toInputDate(end));
    syncAdvancedFiltersForTab(scope);
    document.getElementById('desktop-period-sheet')?.remove();
    clearDashboardCache();
    updateDashboardContent();
};

window.applyDesktopOverviewPeriod = function() {
    const scope = document.getElementById('desktop-period-sheet')?.dataset.scope || 'overview';
    setDashboardFilterPeriod(
        scope,
        parseDateInputVN(document.getElementById('desktop-period-start')?.value || ''),
        parseDateInputVN(document.getElementById('desktop-period-end')?.value || '')
    );
    syncAdvancedFiltersForTab(scope);
    document.getElementById('desktop-period-sheet')?.remove();
    clearDashboardCache();
    updateDashboardContent();
};

function renderFilterStructures() {
    const period = getDashboardFilterPeriod('structures');
    return '<div class="card desktop-overview-filter">' +
        '<div class="desktop-overview-filter-row">' +
        '<span style="font-weight:600;">Lọc cấu kiện:</span>' +
        '<button type="button" class="desktop-period-filter-btn" onclick="openDesktopPeriodSheet(\'structures\')"><span>' + periodButtonLabel(period) + '</span><small>' + periodLabel(period) + '</small></button>' +
        '<button class="sm primary" onclick="applyFilterStructures()">Áp dụng</button>' +
        '<button class="sm" onclick="resetFilterStructures()">Bỏ</button>' +
        '</div></div>';
}
window.applyFilterStructures = function() {
    syncAdvancedFiltersForTab('structures');
    clearDashboardCache(); updateDashboardContent();
};
window.resetFilterStructures = function() {
    filterStructures = { dateFrom: '', dateTo: '' };
    advancedFilters.dateFrom = ''; advancedFilters.dateTo = '';
    clearDashboardCache(); updateDashboardContent();
};

function renderFilterForecast() {
    const period = getDashboardFilterPeriod('forecast');
    return '<div class="card desktop-overview-filter">' +
        '<div class="desktop-overview-filter-row">' +
        '<span style="font-weight:600;">Lọc dự báo:</span>' +
        '<button type="button" class="desktop-period-filter-btn" onclick="openDesktopPeriodSheet(\'forecast\')"><span>' + periodButtonLabel(period) + '</span><small>' + periodLabel(period) + '</small></button>' +
        '<button class="sm primary" onclick="applyFilterForecast()">Áp dụng</button>' +
        '<button class="sm" onclick="resetFilterForecast()">Bỏ</button>' +
        '</div></div>';
}
window.applyFilterForecast = function() {
    syncAdvancedFiltersForTab('forecast');
    clearDashboardCache(); updateDashboardContent();
};
window.resetFilterForecast = function() {
    filterForecast = { dateFrom: '', dateTo: '' };
    advancedFilters.dateFrom = ''; advancedFilters.dateTo = '';
    clearDashboardCache(); updateDashboardContent();
};
window.loadForecast = loadForecast;
window.renderForecastTable = renderForecastTable;
