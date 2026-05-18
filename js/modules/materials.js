import { state, saveState, addLog, formatMoney, escapeHtml, showModal, closeModal, genMid, matById, hasPermission, projectById, supplierById } from './state.js';
import { 
    handleIntegerInput, getNumberFromInput, formatMoneyVND, setupNumberInput,
    getColumnConfig, saveColumnConfig, updateColumnWidth, toggleColumnVisibility, setSortConfig,
    getSortedData, DEFAULT_COLUMNS, getFavorites, toggleFavorite, isFavorite,
    renderAttachmentLinks
} from './utils.js?v=1777963068';
let materialFilters = { keyword: '', category: '', minStock: '', maxStock: '', status: 'all', showFavoritesOnly: false, lowStockOnly: false };
let materialListContainer = null;
const MATERIAL_PAGE_SIZES = [10, 50, 100, 200];
const INVENTORY_DENSITY_KEY = 'steeltrack_inventory_density';
const INVENTORY_ACTIVITY_KEY = 'steeltrack_inventory_activity_open';
let inventoryDensity = localStorage.getItem(INVENTORY_DENSITY_KEY) || 'comfortable';
let inventoryActivityOpen = localStorage.getItem(INVENTORY_ACTIVITY_KEY) !== 'false';

window.materialPaging = window.materialPaging || { page: 1, size: 10 };

function getMaterialPage(rows) {
    const paging = window.materialPaging;
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

function renderMaterialPageSize(pageData) {
    return `
        <div style="display:flex;align-items:center;gap:8px;margin-left:auto;">
            <span class="metric-sub">Hiển thị:</span>
            <select onchange="window.setMaterialPageSize(this.value)" style="width:80px;">
                ${MATERIAL_PAGE_SIZES.map(size => `<option value="${size}" ${pageData.size === size ? 'selected' : ''}>${size}</option>`).join('')}
            </select>
        </div>
    `;
}

function renderMaterialPager(pageData) {
    return `
        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-top:12px;padding:8px 0;">
            <div style="text-align:left;">
                <button class="sm" onclick="window.setMaterialPage(${pageData.page - 1})" ${pageData.page <= 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>◀ Trang trước</button>
            </div>
            <span class="metric-sub" style="text-align:center;">Trang ${pageData.page} / ${pageData.totalPages} (${pageData.totalItems} vật tư)</span>
            <div style="text-align:right;">
                <button class="sm" onclick="window.setMaterialPage(${pageData.page + 1})" ${pageData.page >= pageData.totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Trang sau ▶</button>
            </div>
        </div>
    `;
}

window.setMaterialPageSize = function(size) {
    window.materialPaging.size = Number(size) || 10;
    window.materialPaging.page = 1;
    updateMaterialList();
};
const MATERIAL_DETAIL_PAGE_SIZES = [10, 50, 100, 200];

window.materialDetailPaging = window.materialDetailPaging || {};

function getMaterialDetailPaging(key) {
    if (!window.materialDetailPaging[key]) {
        window.materialDetailPaging[key] = { page: 1, size: 10 };
    }
    return window.materialDetailPaging[key];
}

function getMaterialDetailPage(key, rows) {
    const paging = getMaterialDetailPaging(key);
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

function renderMaterialDetailPageSize(key, pageData, mid) {
    return `
        <div style="display:flex;align-items:center;gap:8px;margin-left:auto;">
            <span class="metric-sub">Hiển thị:</span>
            <select onchange="window.setMaterialDetailPageSize('${key}', '${mid}', this.value)" style="width:80px;">
                ${MATERIAL_DETAIL_PAGE_SIZES.map(size => `<option value="${size}" ${pageData.size === size ? 'selected' : ''}>${size}</option>`).join('')}
            </select>
        </div>
    `;
}

function renderMaterialDetailPager(key, pageData, mid, label) {
    return `
        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-top:12px;padding:8px 0;">
            <div style="text-align:left;">
                <button class="sm" onclick="window.setMaterialDetailPage('${key}', '${mid}', ${pageData.page - 1})" ${pageData.page <= 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>◀ Trang trước</button>
            </div>
            <span class="metric-sub" style="text-align:center;">Trang ${pageData.page} / ${pageData.totalPages} (${pageData.totalItems} ${label})</span>
            <div style="text-align:right;">
                <button class="sm" onclick="window.setMaterialDetailPage('${key}', '${mid}', ${pageData.page + 1})" ${pageData.page >= pageData.totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Trang sau ▶</button>
            </div>
        </div>
    `;
}

window.setMaterialDetailPageSize = function(key, mid, size) {
    const paging = getMaterialDetailPaging(key);
    paging.size = Number(size) || 10;
    paging.page = 1;
    window.showMaterialDetail(mid);
};

window.setMaterialDetailPage = function(key, mid, page) {
    const paging = getMaterialDetailPaging(key);
    paging.page = Number(page) || 1;
    window.showMaterialDetail(mid);
};
window.setMaterialPage = function(page) {
    window.materialPaging.page = Number(page) || 1;
    updateMaterialList();
};

window.focusDesktopMaterialSearch = function() {
    materialFilters.lowStockOnly = false;
    if (window.switchPane) window.switchPane('entry');
    setTimeout(function() {
        const input = document.getElementById('mat-search-keyword');
        if (input) input.focus();
    }, 80);
};

window.showDesktopLowStockMaterials = function() {
    if (window.switchPane) window.switchPane('entry');
    setTimeout(function() {
        materialFilters = { keyword: '', category: '', minStock: '', maxStock: '', status: 'low', showFavoritesOnly: false, lowStockOnly: true };
        const keywordInput = document.getElementById('mat-search-keyword');
        const categorySelect = document.getElementById('mat-search-category');
        const minInput = document.getElementById('mat-search-min');
        const maxInput = document.getElementById('mat-search-max');
        if (keywordInput) keywordInput.value = '';
        if (categorySelect) categorySelect.value = 'all';
        if (minInput) minInput.value = '';
        if (maxInput) maxInput.value = '';
        if (keywordInput) keywordInput.focus();
        window.materialPaging.page = 1;
        updateMaterialList();
    }, 80);
};


function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    return new Date(dateTimeStr).toLocaleString('vi-VN', {hour:'2-digit',minute:'2-digit',second:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'});
}

function escapeAttr(value) {
    return String(value ?? '').replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[m]);
}

function normalizeAttachmentFile(file) {
    if (!file) return null;
    if (typeof file === 'string') {
        return {
            path: file,
            name: String(file).split('/').pop() || 'file'
        };
    }
    const path = file.path || file.url || file.href || file.file || '';
    if (!path) return null;
    return {
        path: String(path),
        name: String(file.name || file.filename || path).split('/').pop() || 'file'
    };
}

function parseAttachmentFiles(attachment) {
    if (!attachment) return [];
    if (Array.isArray(attachment)) return attachment.map(normalizeAttachmentFile).filter(Boolean);
    try {
        const parsed = JSON.parse(attachment);
        if (Array.isArray(parsed)) return parsed.map(normalizeAttachmentFile).filter(Boolean);
        const normalized = normalizeAttachmentFile(parsed);
        return normalized ? [normalized] : [];
    } catch(e) {
        const normalized = normalizeAttachmentFile(attachment);
        return normalized ? [normalized] : [];
    }
}

function materialTxnLabel(t) {
    if (t.type === 'purchase') return 'Nhập kho';
    if (t.type === 'return' || t.type === 'return_from_sw') return 'Trả hàng';
    if (t.type === 'transfer_sw') return 'Chuyển kho CK';
    if (t.type === 'produce') return 'Sản xuất';
    return 'Xuất kho';
}

function materialTxnTarget(t) {
    if (t.supplierId) return supplierById(t.supplierId)?.name || t.supplierId;
    if (t.projectId) return projectById(t.projectId)?.name || t.projectId;
    if (t.type === 'transfer_sw') return 'Kho cấu kiện';
    if (t.type === 'return_from_sw') return 'Kho chính';
    return 'Kho chính';
}

function num(value) {
    return Number(value || 0);
}

function daysBetween(from, to = new Date()) {
    const d = new Date(from);
    if (isNaN(d.getTime())) return null;
    return Math.floor((to - d) / 86400000);
}

function materialTxns(mid) {
    return (state.data.transactions || [])
        .filter(t => String(t.mid) === String(mid))
        .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));
}

function txnsInLastDays(txns, days, offsetDays = 0) {
    const now = new Date();
    const end = new Date(now.getTime() - offsetDays * 86400000);
    const start = new Date(end.getTime() - days * 86400000);
    return txns.filter(t => {
        const d = new Date(t.datetime || t.date);
        return !isNaN(d.getTime()) && d >= start && d < end;
    });
}

function materialInsights(m) {
    const txns = materialTxns(m.id);
    const usageTxns = txns.filter(t => ['usage', 'transfer_sw'].includes(t.type));
    const purchaseTxns = txns.filter(t => t.type === 'purchase');
    const returnTxns = txns.filter(t => ['return', 'return_from_sw'].includes(t.type));
    const qty = num(m.qty);
    const low = num(m.low);
    const value = qty * num(m.cost);
    const lastUsage = usageTxns[0];
    const lastPurchase = purchaseTxns[0];
    const daysNoUsage = lastUsage ? daysBetween(lastUsage.datetime || lastUsage.date) : null;
    const usage7 = txnsInLastDays(usageTxns, 7).reduce((sum, t) => sum + num(t.qty), 0);
    const prevUsage7 = txnsInLastDays(usageTxns, 7, 7).reduce((sum, t) => sum + num(t.qty), 0);
    const usage30 = txnsInLastDays(usageTxns, 30).reduce((sum, t) => sum + num(t.qty), 0);
    const dailyUsage = usage30 / 30;
    const daysLeft = dailyUsage > 0 ? Math.floor(Math.max(0, qty - low) / dailyUsage) : null;
    const turnover = qty > 0 ? usage30 / qty : 0;
    const priceChange = purchaseTxns.length >= 2 && num(purchaseTxns[1].unitPrice) > 0
        ? ((num(purchaseTxns[0].unitPrice) - num(purchaseTxns[1].unitPrice)) / num(purchaseTxns[1].unitPrice)) * 100
        : 0;
    const trendPct = prevUsage7 > 0 ? ((usage7 - prevUsage7) / prevUsage7) * 100 : (usage7 > 0 ? 100 : 0);
    const status = qty <= 0 ? 'out' : qty <= low ? 'low' : daysNoUsage !== null && daysNoUsage >= 90 ? 'slow' : 'ok';
    return {
        txns,
        usageTxns,
        purchaseTxns,
        returnTxns,
        qty,
        low,
        value,
        lastUsage,
        lastPurchase,
        daysNoUsage,
        usage7,
        prevUsage7,
        usage30,
        dailyUsage,
        daysLeft,
        turnover,
        priceChange,
        trendPct,
        status
    };
}

function materialStatusMeta(m, insights = materialInsights(m)) {
    if (insights.status === 'out') return { label: 'Hết hàng', className: 'danger', icon: '!' };
    if (insights.status === 'low') return { label: 'Sắp hết', className: 'warn', icon: '▲' };
    if (insights.status === 'slow') return { label: 'Chậm luân chuyển', className: 'purple', icon: '↺' };
    return { label: 'Tốt', className: 'good', icon: '✓' };
}

function materialMiniInsight(m, insights = materialInsights(m)) {
    if (insights.status === 'out') return 'Cần nhập bổ sung ngay';
    if (insights.status === 'low') return `Dưới ngưỡng ${num(m.low).toLocaleString('vi-VN')} ${m.unit || ''}`;
    if (insights.daysNoUsage !== null && insights.daysNoUsage >= 90) return `${insights.daysNoUsage} ngày chưa xuất`;
    if (Math.abs(insights.priceChange) >= 5) return `${insights.priceChange > 0 ? '↑' : '↓'} Giá ${Math.abs(insights.priceChange).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
    if (Math.abs(insights.trendPct) > 0) return `${insights.trendPct >= 0 ? '↑' : '↓'} ${Math.abs(insights.trendPct).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}% tuần này`;
    return 'Ổn định';
}

function renderInventoryKpis() {
    const materials = state.data.materials || [];
    const txns = state.data.transactions || [];
    const totalValue = materials.reduce((sum, m) => sum + num(m.qty) * num(m.cost), 0);
    const totalQty = materials.reduce((sum, m) => sum + num(m.qty), 0);
    const lowCount = materials.filter(m => num(m.qty) > 0 && num(m.qty) <= num(m.low)).length;
    const outCount = materials.filter(m => num(m.qty) <= 0).length;
    const slowCount = materials.filter(m => materialInsights(m).status === 'slow').length;
    const monthKey = new Date().toISOString().slice(0, 7);
    const importThisMonth = txns.filter(t => t.type === 'purchase' && String(t.date || t.datetime || '').slice(0, 7) === monthKey).reduce((sum, t) => sum + num(t.totalAmount), 0);
    const kpis = [
        { label: 'Tổng giá trị tồn kho', value: formatMoneyVND(totalValue), sub: `${materials.length} chủng loại`, tone: 'blue', action: "window.setMaterialStatusFilter && window.setMaterialStatusFilter('all')" },
        { label: 'Tổng số vật tư', value: totalQty.toLocaleString('vi-VN', { maximumFractionDigits: 1 }), sub: 'Khối lượng/số lượng', tone: 'green', action: "window.setMaterialStatusFilter && window.setMaterialStatusFilter('all')" },
        { label: 'Sắp hết hàng', value: lowCount, sub: `${outCount} hết hàng`, tone: 'red', action: "window.setMaterialStatusFilter && window.setMaterialStatusFilter('low')" },
        { label: 'Chậm luân chuyển', value: slowCount, sub: 'Trên 90 ngày', tone: 'purple', action: "window.setMaterialStatusFilter && window.setMaterialStatusFilter('slow')" },
        { label: 'Nhập tháng này', value: formatMoneyVND(importThisMonth), sub: 'Giá trị nhập', tone: 'cyan', action: "window.switchPane && window.switchPane('logs')" }
    ];
    return `<section class="inventory-kpi-strip">${kpis.map(k => `
        <button type="button" class="inventory-kpi-card ${k.tone}" onclick="${k.action}">
            <span class="inventory-kpi-icon"></span>
            <div>
                <small>${escapeHtml(k.label)}</small>
                <strong>${k.value}</strong>
                <em>${escapeHtml(k.sub)}</em>
            </div>
        </button>
    `).join('')}</section>`;
}

function renderInventoryActivityFeed() {
    const rows = [...(state.data.transactions || [])]
        .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date))
        .slice(0, 6);
    const typeMeta = {
        purchase: ['Nhập kho', 'good'],
        usage: ['Xuất kho', 'warn'],
        return: ['Trả hàng', 'cyan'],
        transfer_sw: ['Chuyển kho CK', 'purple'],
        return_from_sw: ['Trả về kho chính', 'cyan']
    };
    return `<section class="inventory-activity-feed ${inventoryActivityOpen ? 'open' : 'collapsed'}">
        <div class="inventory-feed-head">
            <div>
                <strong>Hoạt động kho gần đây</strong>
                <small>${rows.length} giao dịch mới nhất</small>
            </div>
            <div class="inventory-feed-actions">
                <button class="sm" onclick="window.switchPane && window.switchPane('logs')">Xem tất cả</button>
                <button class="sm" onclick="window.toggleInventoryActivityFeed()">${inventoryActivityOpen ? 'Ẩn' : 'Hiện'}</button>
            </div>
        </div>
        <div class="inventory-feed-list">
            ${rows.length ? rows.map(t => {
                const mat = matById(t.mid);
                const [label, tone] = typeMeta[t.type] || [t.type || 'Giao dịch', 'blue'];
                return `<div class="inventory-feed-item ${tone}">
                    <b></b>
                    <span><strong>${label}</strong><small>${formatDateTime(t.datetime || t.date)}</small></span>
                    <em>${escapeHtml(mat?.name || t.mid || 'N/A')} · ${num(t.qty).toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${escapeHtml(mat?.unit || '')}</em>
                </div>`;
            }).join('') : '<div class="metric-sub">Chưa có hoạt động</div>'}
        </div>
    </section>`;
}

function renderInventorySparkline(m, days = 30) {
    const txns = materialTxns(m.id);
    const rows = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        rows.push({ key, qty: num(m.qty) });
    }
    rows.forEach(row => {
        const futureDelta = txns.filter(t => {
            const key = String(t.date || t.datetime || '').slice(0, 10);
            return key > row.key;
        }).reduce((sum, t) => {
            if (t.type === 'purchase' || t.type === 'return' || t.type === 'return_from_sw') return sum - num(t.qty);
            if (t.type === 'usage' || t.type === 'transfer_sw') return sum + num(t.qty);
            return sum;
        }, 0);
        row.qty = Math.max(0, num(m.qty) + futureDelta);
    });
    const max = Math.max(...rows.map(r => r.qty), 1);
    const min = Math.min(...rows.map(r => r.qty), 0);
    const range = Math.max(max - min, 1);
    const points = rows.map((r, i) => {
        const x = (i / Math.max(rows.length - 1, 1)) * 100;
        const y = 36 - ((r.qty - min) / range) * 30;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<svg class="inventory-sparkline" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><polygon points="0,40 ${points} 100,40" opacity=".16" fill="currentColor"/></svg>`;
}

function getFilteredMaterials() {
    let result = [...state.data.materials];
    const f = materialFilters;
    
    if (f.showFavoritesOnly) {
        const favorites = getFavorites();
        result = result.filter(m => favorites.includes(m.id));
    }
    if (f.lowStockOnly) {
        result = result.filter(m => Number(m.qty || 0) <= Number(m.low || 0));
    }
    if (f.status && f.status !== 'all') {
        result = result.filter(m => {
            const status = materialInsights(m).status;
            return f.status === 'low' ? ['low', 'out'].includes(status) : status === f.status;
        });
    }
    
    if (f.keyword) {
        const kw = f.keyword.toLowerCase();
        result = result.filter(m => m.name.toLowerCase().includes(kw) || m.id.toLowerCase().includes(kw));
    }
    if (f.category && f.category !== 'all') {
        result = result.filter(m => m.cat === f.category);
    }
    if (f.minStock !== '' && f.minStock !== null && f.minStock !== undefined) {
        const min = Number(f.minStock);
        if (!isNaN(min)) result = result.filter(m => m.qty >= min);
    }
    if (f.maxStock !== '' && f.maxStock !== null && f.maxStock !== undefined) {
        const max = Number(f.maxStock);
        if (!isNaN(max)) result = result.filter(m => m.qty <= max);
    }
    return result;
}

function updateMaterialList() {
    if (!materialListContainer) return;
    const filtered = getFilteredMaterials();
    const config = getColumnConfig();
    const allSorted = getSortedData(filtered, config.sortColumn, config.sortDirection);
    const pageData = getMaterialPage(allSorted);
    const sorted = pageData.rows;
    const pageSizeHolder = document.getElementById('material-page-size-holder');
    if (pageSizeHolder) pageSizeHolder.innerHTML = renderMaterialPageSize(pageData);
    const favorites = getFavorites();
        if (sorted.length === 0) {
        materialListContainer.innerHTML = '<div class="metric-sub">📭 Không tìm thấy vật tư phù hợp</div>';
        return;
    }
    
    const visibleColumns = config.columns.filter(col => col.visible);
    
    materialListContainer.innerHTML = `
        <div class="tbl-wrap resizable-table inventory-table-density-${inventoryDensity}">
            <table style="min-width: 600px; width: 100%; table-layout: fixed;">
                <thead>
                    <tr>
                        ${visibleColumns.map(col => `
                            <th style="width: ${col.width}px; position: relative;">
                                ${col.sortable ? `
                                    <div class="sortable-header" data-sort="${col.key}">
                                        ${col.label}
                                        <span class="sort-icon ${config.sortColumn === col.key ? config.sortDirection : ''}">▼</span>
                                    </div>
                                ` : col.label}
                                <div class="resize-handle" data-col="${col.key}"></div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(m => {
                        const displayQty = typeof m.qty === 'number' ? parseFloat(m.qty).toLocaleString('vi-VN', {minimumFractionDigits:0, maximumFractionDigits:3}) : parseFloat(m.qty || 0).toLocaleString('vi-VN', {minimumFractionDigits:0, maximumFractionDigits:3});
                        const displayCost = formatMoneyVND(m.cost);
                        const totalValue = (typeof m.qty === 'number' ? m.qty : parseFloat(m.qty || 0)) * (typeof m.cost === 'number' ? m.cost : parseFloat(m.cost || 0));
                        const displayTotal = formatMoneyVND(totalValue);
                        const insights = materialInsights(m);
                        const status = materialStatusMeta(m, insights);
                        const miniInsight = materialMiniInsight(m, insights);
                        
                        return `
                        <tr data-id="${m.id}" class="inventory-row ${status.className}" onclick="window.openMaterialDrawer('${m.id}')">
                            ${visibleColumns.map(col => {
                                if (col.key === 'actions') {
                                    return `<td style="width: ${col.width}px; white-space: nowrap;">
                                        ${hasPermission('canEditMaterial') ? `<button class="sm" onclick="event.stopPropagation();editMaterial('${m.id}')">✏️ Sửa</button>` : ''}
                                        ${hasPermission('canDeleteMaterial') ? `<button class="sm danger-btn" onclick="event.stopPropagation();deleteMaterial('${m.id}')">🗑️ Xóa</button>` : ''}
                                       </td>`;
                                }
                                if (col.key === 'stt') {
                                    const sttIndex = ((pageData.page - 1) * pageData.size) + sorted.findIndex(function(x){return x.id===m.id;}) + 1;
                                    return `<td style="width: ${col.width}px; text-align:center; font-weight:bold;">${sttIndex}</td>`;
                                }
                                if (col.key === 'id') {
                                    return `<td style="width: ${col.width}px; font-family:mono">
                                        <button class="favorite-btn ${favorites.includes(m.id) ? 'active' : ''}" onclick="event.stopPropagation();toggleFavoriteItem('${m.id}')">★</button>
                                        ${m.id}
                                       </td>`;
                                }
                                if (col.key === 'name') {
                                    return `<td style="width: ${col.width}px; cursor:pointer;">
                                        <strong class="inventory-material-name">${escapeHtml(m.name)}</strong>
                                        <small class="inventory-mini-insight">${escapeHtml(miniInsight)}</small>
                                       </td>`;
                                }
                                if (col.key === 'qty') {
                                    return `<td style="width: ${col.width}px;">${displayQty} ${m.unit}</td>`;
                                }
                                if (col.key === 'cost') {
                                    return `<td style="width: ${col.width}px;">${displayCost}</td>`;
                                }
                                if (col.key === 'totalValue') {
                                    return `<td style="width: ${col.width}px; color: var(--accent); font-weight: 500;">${displayTotal}</td>`;
                                }
                                if (col.key === 'status') {
                                    return `<td style="width: ${col.width}px;"><span class="inventory-status-badge ${status.className}"><b>${status.icon}</b>${status.label}</span></td>`;
                                }
                                if (col.key === 'note') {
                                    return `<td style="width: ${col.width}px; word-break: break-word;">${escapeHtml(m.note || '—')}</td>`;
                                }
                                return `<td style="width: ${col.width}px;">${m[col.key] !== undefined ? m[col.key] : '—'}</td>`;
                            }).join('')}
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        ${renderMaterialPager(pageData)}
    `;
    
    attachResizeEvents();
    attachSortEvents();
}

function attachResizeEvents() {
    const handles = document.querySelectorAll('.resize-handle');
    let currentHandle = null, startX = 0, startWidth = 0, currentTh = null;
    
    const onMouseMove = (e) => {
        if (!currentHandle) return;
        const diff = e.clientX - startX;
        const newWidth = Math.max(50, Math.min(400, startWidth + diff));
        if (currentTh) {
            currentTh.style.width = newWidth + 'px';
            updateColumnWidth(currentHandle.dataset.col, newWidth);
        }
    };
    
    const onMouseUp = () => {
        if (currentHandle) currentHandle.classList.remove('active');
        currentHandle = null; currentTh = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
    
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault(); e.stopPropagation();
            currentHandle = handle;
            currentTh = handle.closest('th');
            if (currentTh) {
                startWidth = currentTh.offsetWidth;
                startX = e.clientX;
                handle.classList.add('active');
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
        });
    });
}

function attachSortEvents() {
    document.querySelectorAll('.sortable-header').forEach(header => {
        header.removeEventListener('click', handleSortClick);
        header.addEventListener('click', handleSortClick);
    });
}

function handleSortClick(e) {
    const colKey = e.currentTarget.dataset.sort;
    if (colKey) { setSortConfig(colKey); updateMaterialList(); }
}

function renderMaterialSearchBar() {
    const categories = ['all', ...state.data.categories];
    const favorites = getFavorites();
    const favoritesCount = favorites.filter(id => state.data.materials.some(m => m.id === id)).length;
    const statusCounts = (state.data.materials || []).reduce((acc, m) => {
        const status = materialInsights(m).status;
        acc.all += 1;
        acc[status] = (acc[status] || 0) + 1;
        if (status === 'out') acc.low += 1;
        return acc;
    }, { all: 0, ok: 0, low: 0, out: 0, slow: 0 });
    const statusOptions = [
        ['all', 'Tất cả', statusCounts.all],
        ['ok', 'Tốt', statusCounts.ok],
        ['low', 'Sắp hết', statusCounts.low],
        ['out', 'Hết hàng', statusCounts.out],
        ['slow', 'Chậm luân chuyển', statusCounts.slow]
    ];
    
    return `
        <div class="card inventory-filter-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div class="sec-title">🔍 TÌM KIẾM NÂNG CAO</div>
                <div style="display: flex; gap: 10px;">
                    <div class="inventory-density-control">
                        ${['compact', 'comfortable', 'spacious'].map(mode => `<button class="${inventoryDensity === mode ? 'active' : ''}" onclick="window.setInventoryDensity('${mode}')" title="${mode}"></button>`).join('')}
                    </div>
                    <div class="favorite-filter">
                        <span class="star-icon ${materialFilters.showFavoritesOnly ? 'active' : ''}" onclick="toggleFavoriteFilter()">★</span>
                        <span style="font-size: 12px;">Yêu thích (${favoritesCount})</span>
                    </div>
                    <button class="sm" onclick="resetColumnConfig()" style="font-size: 11px;">🔄 Đặt lại cột</button>
                    <div class="column-toggle-panel">
                        <button class="column-toggle-btn" onclick="toggleColumnPanel()">📋 Ẩn/hiện cột</button>
                        <div id="column-toggle-dropdown" class="column-toggle-dropdown">
                            <div class="dropdown-header">Chọn cột hiển thị</div>
                            ${DEFAULT_COLUMNS.map(col => `
                                <div class="dropdown-item" onclick="toggleColumn('${col.key}')">
                                    <input type="checkbox" ${getColumnConfig().columns.find(c => c.key === col.key)?.visible !== false ? 'checked' : ''}>
                                    <label>${col.label}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                <input type="text" id="mat-search-keyword" placeholder="Tên hoặc mã..." value="${escapeHtml(materialFilters.keyword)}" style="flex: 2; min-width: 150px;">
                <select id="mat-search-category" style="flex: 1; min-width: 120px;">
                    ${categories.map(c => `<option value="${c}" ${materialFilters.category === c ? 'selected' : ''}>${c === 'all' ? '📂 Tất cả' : c}</option>`).join('')}
                </select>
                <input type="text" id="mat-search-min" placeholder="Tồn ≥" value="${materialFilters.minStock || ''}" style="width: 100px;" dir="ltr">
                <input type="text" id="mat-search-max" placeholder="Tồn ≤" value="${materialFilters.maxStock || ''}" style="width: 100px;" dir="ltr">
                <button id="mat-clear-filters" class="sm">🗑️ Xóa bộ lọc</button>
            </div>
            <div class="inventory-status-filter">
                ${statusOptions.map(([key, label, count]) => `<button data-status="${key}" class="${materialFilters.status === key ? 'active' : ''}" onclick="window.setMaterialStatusFilter('${key}')"><span>${escapeHtml(label)}</span><b>${count}</b></button>`).join('')}
            </div>
        </div>
    `;
}

function syncMaterialStatusFilterUi() {
    document.querySelectorAll('.inventory-status-filter button').forEach(button => {
        button.classList.toggle('active', button.dataset.status === materialFilters.status);
    });
}

function bindMaterialSearchEvents() {
    const keywordInput = document.getElementById('mat-search-keyword');
    const categorySelect = document.getElementById('mat-search-category');
    const minInput = document.getElementById('mat-search-min');
    const maxInput = document.getElementById('mat-search-max');
    const clearBtn = document.getElementById('mat-clear-filters');
    const updateFilters = () => {
        materialFilters.keyword = keywordInput?.value || '';
        materialFilters.category = categorySelect?.value || '';
        materialFilters.minStock = minInput?.value.replace(/[^0-9]/g, '') || '';
        materialFilters.maxStock = maxInput?.value.replace(/[^0-9]/g, '') || '';
        materialFilters.lowStockOnly = false;
        if (materialFilters.status === 'low' && materialFilters.lowStockOnly) materialFilters.status = 'all';
        window.materialPaging.page = 1;
        updateMaterialList();
    };
    
    if (keywordInput) { let t; keywordInput.oninput = function() { clearTimeout(t); t = setTimeout(updateFilters, 300); }; }
    if (categorySelect) categorySelect.onchange = updateFilters;
    if (minInput) { minInput.addEventListener('input', updateFilters); }
    if (maxInput) { maxInput.addEventListener('input', updateFilters); }
    if (clearBtn) clearBtn.onclick = () => {
        materialFilters = { keyword: '', category: '', minStock: '', maxStock: '', status: 'all', showFavoritesOnly: false, lowStockOnly: false };
        if (keywordInput) keywordInput.value = '';
        if (categorySelect) categorySelect.value = 'all';
        if (minInput) minInput.value = '';
        if (maxInput) maxInput.value = '';
        window.materialPaging.page = 1;
        updateMaterialList();
        syncMaterialStatusFilterUi();
        const starIcon = document.querySelector('.favorite-filter .star-icon');
        if (starIcon) starIcon.classList.remove('active');
    };
}

window.toggleColumnPanel = function() {
    const dropdown = document.getElementById('column-toggle-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target) && !e.target.closest('.column-toggle-btn')) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 0);
    }
};

window.toggleColumn = function(colKey) { toggleColumnVisibility(colKey); updateMaterialList(); };
window.toggleFavoriteItem = function(itemId) { toggleFavorite(itemId); updateMaterialList(); };
window.toggleFavoriteFilter = function() {
    materialFilters.showFavoritesOnly = !materialFilters.showFavoritesOnly;
    const starIcon = document.querySelector('.favorite-filter .star-icon');
    if (starIcon) starIcon.classList.toggle('active', materialFilters.showFavoritesOnly);
    window.materialPaging.page = 1;
    updateMaterialList();
};

window.setMaterialStatusFilter = function(status) {
    materialFilters.status = ['all', 'ok', 'low', 'out', 'slow'].includes(status) ? status : 'all';
    materialFilters.lowStockOnly = false;
    window.materialPaging.page = 1;
    updateMaterialList();
    syncMaterialStatusFilterUi();
};

window.setInventoryDensity = function(mode) {
    inventoryDensity = ['compact', 'comfortable', 'spacious'].includes(mode) ? mode : 'comfortable';
    localStorage.setItem(INVENTORY_DENSITY_KEY, inventoryDensity);
    const root = document.querySelector('.inventory-workbench');
    if (root) {
        root.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
        root.classList.add('density-' + inventoryDensity);
    }
    updateMaterialList();
    const buttons = document.querySelectorAll('.inventory-density-control button');
    buttons.forEach((button, index) => button.classList.toggle('active', ['compact', 'comfortable', 'spacious'][index] === inventoryDensity));
};

window.toggleInventoryActivityFeed = function() {
    inventoryActivityOpen = !inventoryActivityOpen;
    localStorage.setItem(INVENTORY_ACTIVITY_KEY, inventoryActivityOpen ? 'true' : 'false');
    const feed = document.querySelector('.inventory-activity-feed');
    if (feed) feed.outerHTML = renderInventoryActivityFeed();
};

// ========== RENDER ==========
export function renderMaterials() {
    const result = `<div class="inventory-workbench density-${inventoryDensity}">${renderInventoryKpis()}${renderMaterialSearchBar()}<div class="card inventory-table-card">
    <div class="sec-title" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
    <span>📋 DANH SÁCH VẬT TƯ TỒN KHO</span>
    <div id="material-page-size-holder" style="margin-left:auto;"></div>
</div>


    <div id="material-list-container"></div>
  </div></div>`;
  
    setTimeout(() => {
        bindMaterialSearchEvents();
        materialListContainer = document.getElementById('material-list-container');
        updateMaterialList();
    }, 50);
    return result;
}

window.resetColumnConfig = function() {
    const config = getColumnConfig();
    config.columns = JSON.parse(JSON.stringify(DEFAULT_COLUMNS));
    config.sortColumn = 'name'; config.sortDirection = 'asc';
    saveColumnConfig(config); updateMaterialList();
};

window.closeMaterialDrawer = function() {
    document.getElementById('material-detail-drawer')?.remove();
};

window.showAppToast = function(title, message = '', tone = 'info') {
    let stack = document.getElementById('app-toast-stack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'app-toast-stack';
        stack.className = 'app-toast-stack';
        document.body.appendChild(stack);
    }
    const toast = document.createElement('div');
    toast.className = `app-toast ${tone}`;
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong>${message ? `<small>${escapeHtml(message)}</small>` : ''}`;
    stack.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 20);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 220);
    }, 3200);
};

window.openMaterialDrawer = function(mid) {
    const mat = matById(mid);
    if (!mat) return;
    window.closeMaterialDrawer();
    const insights = materialInsights(mat);
    const status = materialStatusMeta(mat, insights);
    const recent = insights.txns.slice(0, 8);
    const lastSupplier = insights.purchaseTxns[0] ? supplierById(insights.purchaseTxns[0].supplierId) : null;
    const topProjects = {};
    insights.usageTxns.forEach(t => {
        const key = t.projectId || 'unknown';
        if (!topProjects[key]) topProjects[key] = { name: projectById(key)?.name || 'Không rõ', qty: 0 };
        topProjects[key].qty += num(t.qty);
    });
    const projectRows = Object.values(topProjects).sort((a, b) => b.qty - a.qty).slice(0, 4);
    const drawer = document.createElement('aside');
    drawer.id = 'material-detail-drawer';
    drawer.className = 'material-detail-drawer';
    drawer.dataset.mid = mat.id;
    drawer.innerHTML = `
        <div class="material-drawer-head">
            <div>
                <small>${escapeHtml(mat.id)} · ${escapeHtml(mat.cat || 'Chưa phân nhóm')}</small>
                <h2>${escapeHtml(mat.name)}</h2>
                <span class="inventory-status-badge ${status.className}"><b>${status.icon}</b>${status.label}</span>
            </div>
            <div class="material-drawer-actions">
                <button class="sm" title="Mở workspace đầy đủ" onclick="window.openMaterialWorkspace('${mat.id}')">⛶</button>
                <button class="sm" onclick="window.closeMaterialDrawer()">✕</button>
            </div>
        </div>
        <div class="material-drawer-body">
            <section class="material-drawer-metrics">
                <div><small>Tồn hiện tại</small><strong>${num(mat.qty).toLocaleString('vi-VN')} ${escapeHtml(mat.unit || '')}</strong></div>
                <div><small>Giá trị tồn</small><strong>${formatMoneyVND(insights.value)}</strong></div>
                <div><small>Đơn giá TB</small><strong>${formatMoneyVND(mat.cost)}</strong></div>
                <div><small>Tốc độ luân chuyển</small><strong>${insights.turnover.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} lần/tháng</strong></div>
            </section>
            <section class="material-drawer-panel">
                <div class="material-drawer-title"><span>Xu hướng tồn kho 30 ngày</span><em>${insights.daysLeft === null ? 'Chưa đủ dữ liệu dự báo' : `Còn khoảng ${insights.daysLeft} ngày`}</em></div>
                ${renderInventorySparkline(mat, 30)}
            </section>
            <section class="material-drawer-quick">
                <button onclick="window.openPurchaseModal && window.openPurchaseModal('${mat.id}')">📥 Nhập kho</button>
                <button onclick="window.openTxnModal && window.openTxnModal('usage', null, '${mat.id}')">📤 Xuất kho</button>
                <button onclick="window.openTransferToSW && window.openTransferToSW('${mat.id}')">📦 Chuyển kho</button>
                <button onclick="editMaterial('${mat.id}')">✏️ Chỉnh sửa</button>
            </section>
            <section class="material-drawer-panel">
                <div class="material-drawer-title"><span>Insight</span><em>Realtime view</em></div>
                <div class="material-insight-list">
                    <div><b>${status.icon}</b><span>${escapeHtml(materialMiniInsight(mat, insights))}</span></div>
                    <div><b>↺</b><span>${insights.daysNoUsage === null ? 'Chưa có lịch sử xuất' : `${insights.daysNoUsage} ngày từ lần xuất gần nhất`}</span></div>
                    <div><b>🏭</b><span>NCC gần nhất: ${escapeHtml(lastSupplier?.name || 'Chưa có')}</span></div>
                    <div><b>₫</b><span>Biến động giá: ${insights.priceChange.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span></div>
                </div>
            </section>
            <section class="material-drawer-panel">
                <div class="material-drawer-title"><span>Công trình sử dụng</span><em>Top gần đây</em></div>
                ${projectRows.length ? projectRows.map(p => `<div class="material-rank-row"><span>${escapeHtml(p.name)}</span><strong>${p.qty.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${escapeHtml(mat.unit || '')}</strong></div>`).join('') : '<div class="metric-sub">Chưa có xuất cho công trình</div>'}
            </section>
            <section class="material-drawer-panel">
                <div class="material-drawer-title"><span>Hoạt động gần đây</span><em>${recent.length} dòng</em></div>
                <div class="material-activity-list">
                    ${recent.length ? recent.map(t => {
                        const tone = t.type === 'purchase' ? 'good' : ['return', 'return_from_sw'].includes(t.type) ? 'cyan' : 'warn';
                        const label = t.type === 'purchase' ? 'Nhập' : ['return', 'return_from_sw'].includes(t.type) ? 'Trả' : 'Xuất';
                        return `<div class="${tone}"><small>${formatDateTime(t.datetime || t.date)}</small><strong>${label} · ${num(t.qty).toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${escapeHtml(mat.unit || '')}</strong><span>${formatMoneyVND(t.totalAmount || 0)}</span></div>`;
                    }).join('') : '<div class="metric-sub">Chưa có hoạt động</div>'}
                </div>
            </section>
        </div>
    `;
    document.body.appendChild(drawer);
};

window.closeMaterialWorkspace = function() {
    document.getElementById('material-workspace-overlay')?.remove();
};

window.materialWorkspaceFilters = window.materialWorkspaceFilters || {};

window.setMaterialWorkspaceTxnFilter = function(mid, filter) {
    window.materialWorkspaceFilters[mid] = ['all', 'purchase', 'usage', 'return', 'transfer'].includes(filter) ? filter : 'all';
    window.openMaterialWorkspace(mid, 'txns');
};

window.openMaterialWorkspace = function(mid, tab = 'overview') {
    const mat = matById(mid);
    if (!mat) return;
    window.closeMaterialWorkspace();
    const insights = materialInsights(mat);
    const status = materialStatusMeta(mat, insights);
    const tabs = [
        ['overview', 'Tổng quan'],
        ['txns', 'Nhập / Xuất'],
        ['projects', 'Công trình'],
        ['suppliers', 'Nhà cung cấp'],
        ['analytics', 'Phân tích'],
        ['files', 'File đính kèm'],
        ['history', 'Lịch sử thay đổi']
    ];
    const txns = insights.txns;
    const txnFilter = window.materialWorkspaceFilters[mid] || 'all';
    const filteredTxns = txns.filter(t => {
        if (txnFilter === 'all') return true;
        if (txnFilter === 'return') return ['return', 'return_from_sw'].includes(t.type);
        if (txnFilter === 'transfer') return t.type === 'transfer_sw';
        return t.type === txnFilter;
    });
    const files = txns.flatMap(t => {
        return parseAttachmentFiles(t.attachment).map(file => ({ file, txn: t }));
    });
    const renderTxnTable = rows => rows.length ? `
        <div class="desktop-table-wrap"><table style="min-width:760px;">
            <thead><tr><th>Thời gian</th><th>Loại</th><th>Đối tượng</th><th style="text-align:right;">SL</th><th style="text-align:right;">Đơn giá</th><th style="text-align:right;">Thành tiền</th></tr></thead>
            <tbody>${rows.map(t => {
                return `<tr class="material-txn-row" onclick="window.openMaterialTxnDetail && window.openMaterialTxnDetail('${escapeAttr(t.id)}')"><td>${formatDateTime(t.datetime || t.date)}</td><td>${escapeHtml(materialTxnLabel(t))}</td><td>${escapeHtml(materialTxnTarget(t) || '—')}</td><td style="text-align:right;">${num(t.qty).toLocaleString('vi-VN')} ${escapeHtml(mat.unit || '')}</td><td style="text-align:right;">${formatMoneyVND(t.unitPrice || mat.cost)}</td><td style="text-align:right;">${formatMoneyVND(t.totalAmount || 0)}</td></tr>`;
            }).join('')}</tbody>
        </table></div>` : '<div class="metric-sub">Chưa có dữ liệu</div>';
    const projectRows = Object.values(txns.filter(t => t.projectId && ['usage', 'transfer_sw', 'return'].includes(t.type)).reduce((acc, t) => {
        const key = t.projectId;
        if (!acc[key]) acc[key] = { projectId: key, usedQty: 0, returnedQty: 0, usedValue: 0, returnedValue: 0, lastDate: '' };
        if (t.type === 'return') {
            acc[key].returnedQty += num(t.qty);
            acc[key].returnedValue += num(t.totalAmount);
        } else {
            acc[key].usedQty += num(t.qty);
            acc[key].usedValue += num(t.totalAmount);
        }
        const date = t.datetime || t.date || '';
        if (!acc[key].lastDate || new Date(date) > new Date(acc[key].lastDate)) acc[key].lastDate = date;
        return acc;
    }, {})).sort((a, b) => b.usedValue - a.usedValue);
    const supplierRows = Object.values(insights.purchaseTxns.filter(t => t.supplierId).reduce((acc, t) => {
        const key = t.supplierId;
        if (!acc[key]) acc[key] = { supplierId: key, qty: 0, value: 0, count: 0, lastPrice: 0, lastDate: '' };
        acc[key].qty += num(t.qty);
        acc[key].value += num(t.totalAmount);
        acc[key].count += 1;
        const date = t.datetime || t.date || '';
        if (!acc[key].lastDate || new Date(date) > new Date(acc[key].lastDate)) {
            acc[key].lastDate = date;
            acc[key].lastPrice = num(t.unitPrice);
        }
        return acc;
    }, {})).sort((a, b) => b.value - a.value);
    const renderProjectTable = rows => rows.length ? `
        <div class="desktop-table-wrap"><table style="min-width:760px;">
            <thead><tr><th>Công trình</th><th style="text-align:right;">Đã xuất</th><th style="text-align:right;">Đã trả</th><th style="text-align:right;">Giá trị xuất</th><th>Lần cuối</th></tr></thead>
            <tbody>${rows.map(row => {
                const project = projectById(row.projectId);
                return `<tr><td><strong>${escapeHtml(project?.name || row.projectId)}</strong></td><td style="text-align:right;">${row.usedQty.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${escapeHtml(mat.unit || '')}</td><td style="text-align:right;">${row.returnedQty.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${escapeHtml(mat.unit || '')}</td><td style="text-align:right;">${formatMoneyVND(row.usedValue)}</td><td>${formatDateTime(row.lastDate)}</td></tr>`;
            }).join('')}</tbody>
        </table></div>` : '<div class="metric-sub">Chưa có dữ liệu công trình cho vật tư này</div>';
    const renderSupplierTable = rows => rows.length ? `
        <div class="desktop-table-wrap"><table style="min-width:760px;">
            <thead><tr><th>Nhà cung cấp</th><th style="text-align:right;">Số lần nhập</th><th style="text-align:right;">Tổng nhập</th><th style="text-align:right;">Giá nhập gần nhất</th><th style="text-align:right;">Tổng giá trị</th><th>Lần cuối</th></tr></thead>
            <tbody>${rows.map(row => {
                const supplier = supplierById(row.supplierId);
                return `<tr><td><strong>${escapeHtml(supplier?.name || row.supplierId)}</strong></td><td style="text-align:right;">${row.count.toLocaleString('vi-VN')}</td><td style="text-align:right;">${row.qty.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${escapeHtml(mat.unit || '')}</td><td style="text-align:right;">${formatMoneyVND(row.lastPrice)}</td><td style="text-align:right;">${formatMoneyVND(row.value)}</td><td>${formatDateTime(row.lastDate)}</td></tr>`;
            }).join('')}</tbody>
        </table></div>` : '<div class="metric-sub">Chưa có dữ liệu nhà cung cấp cho vật tư này</div>';
    const renderFileCards = rows => rows.length ? `<div class="material-file-grid">${rows.map(({ file, txn }) => `
        <article class="material-file-card">
            <a href="${escapeAttr(file.path)}" target="_blank"><strong>${escapeHtml(file.name)}</strong><small>Mở file đính kèm</small></a>
            <dl>
                <div><dt>Phiếu</dt><dd>${escapeHtml(materialTxnLabel(txn))}</dd></div>
                <div><dt>Ngày</dt><dd>${formatDateTime(txn.datetime || txn.date)}</dd></div>
                <div><dt>Đối tượng</dt><dd>${escapeHtml(materialTxnTarget(txn))}</dd></div>
                <div><dt>Số lượng</dt><dd>${num(txn.qty).toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${escapeHtml(mat.unit || '')}</dd></div>
                <div><dt>Giá trị</dt><dd>${formatMoneyVND(txn.totalAmount || 0)}</dd></div>
                ${txn.note ? `<div><dt>Ghi chú</dt><dd>${escapeHtml(txn.note)}</dd></div>` : ''}
            </dl>
        </article>
    `).join('')}</div>` : '<div class="metric-sub">Chưa có file đính kèm</div>';
    const reorderQty = Math.max(0, Math.ceil((insights.dailyUsage * 15) + insights.low - insights.qty));
    const stockPressure = insights.dailyUsage > 0 ? Math.round(insights.qty / insights.dailyUsage) : null;
    const priceTone = insights.priceChange > 5 ? 'warn' : insights.priceChange < -5 ? 'good' : 'neutral';
    const tabCounts = {
        overview: '',
        txns: txns.length,
        projects: projectRows.length,
        suppliers: supplierRows.length,
        analytics: reorderQty > 0 || insights.status !== 'ok' || (insights.daysNoUsage !== null && insights.daysNoUsage >= 90) ? '!' : '',
        files: files.length,
        history: txns.length
    };
    const analyticsAlerts = [
        {
            label: 'Tồn kho',
            value: insights.status === 'out' ? 'Đã hết hàng' : insights.status === 'low' ? 'Dưới ngưỡng' : 'Trong ngưỡng',
            tone: insights.status === 'out' ? 'danger' : insights.status === 'low' ? 'warn' : 'good',
            note: `Ngưỡng: ${insights.low.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${mat.unit || ''}`
        },
        {
            label: 'Luân chuyển',
            value: insights.daysNoUsage === null ? 'Chưa xuất' : insights.daysNoUsage >= 90 ? 'Chậm' : 'Có phát sinh',
            tone: insights.daysNoUsage !== null && insights.daysNoUsage >= 90 ? 'purple' : 'good',
            note: insights.daysNoUsage === null ? 'Chưa có giao dịch xuất' : `${insights.daysNoUsage} ngày từ lần xuất gần nhất`
        },
        {
            label: 'Giá nhập',
            value: `${insights.priceChange >= 0 ? '+' : ''}${insights.priceChange.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`,
            tone: priceTone,
            note: 'So với lần nhập trước'
        },
        {
            label: 'Đề xuất nhập',
            value: reorderQty > 0 ? `${reorderQty.toLocaleString('vi-VN')} ${mat.unit || ''}` : 'Chưa cần',
            tone: reorderQty > 0 ? 'warn' : 'good',
            note: 'Dựa trên tiêu thụ 30 ngày và buffer 15 ngày'
        }
    ];
    const panels = {
        overview: `
            <div class="material-workspace-grid">
                <section class="material-workspace-card wide">${renderInventorySparkline(mat, 30)}</section>
                <section class="material-workspace-card"><h3>Dự báo</h3><strong>${insights.daysLeft === null ? 'Chưa đủ dữ liệu' : `${insights.daysLeft} ngày`}</strong><small>Ước tính tới ngưỡng cảnh báo</small></section>
                <section class="material-workspace-card"><h3>NCC gần nhất</h3><strong>${escapeHtml(supplierById(insights.purchaseTxns[0]?.supplierId)?.name || 'Chưa có')}</strong><small>${insights.purchaseTxns[0] ? formatDateTime(insights.purchaseTxns[0].datetime || insights.purchaseTxns[0].date) : ''}</small></section>
                <section class="material-workspace-card"><h3>Tốc độ luân chuyển</h3><strong>${insights.turnover.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</strong><small>lần/tháng</small></section>
            </div>`,
        txns: `<div class="material-workspace-toolbar">
                <h3>Giao dịch vật tư</h3>
                <div class="material-workspace-filter">
                    ${[
                        ['all', 'Tất cả'],
                        ['purchase', 'Nhập'],
                        ['usage', 'Xuất'],
                        ['return', 'Trả'],
                        ['transfer', 'Chuyển']
                    ].map(([key, label]) => `<button class="${txnFilter === key ? 'active' : ''}" onclick="window.setMaterialWorkspaceTxnFilter('${mat.id}', '${key}')">${label}</button>`).join('')}
                </div>
            </div>${renderTxnTable(filteredTxns)}`,
        projects: `<h3>Công trình sử dụng vật tư</h3>${renderProjectTable(projectRows)}`,
        suppliers: `<h3>Lịch sử nhập theo nhà cung cấp</h3>${renderSupplierTable(supplierRows)}`,
        analytics: `
            <div class="material-workspace-grid">
                ${analyticsAlerts.map(item => `<section class="material-workspace-card insight-${item.tone}"><h3>${escapeHtml(item.label)}</h3><strong>${escapeHtml(item.value)}</strong><small>${escapeHtml(item.note)}</small></section>`).join('')}
                <section class="material-workspace-card wide">
                    <h3>Khuyến nghị vận hành</h3>
                    <div class="material-recommend-list">
                        <div><span>Mức tiêu thụ 30 ngày</span><strong>${insights.usage30.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${escapeHtml(mat.unit || '')}</strong></div>
                        <div><span>Tốc độ trung bình</span><strong>${insights.dailyUsage.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${escapeHtml(mat.unit || '')}/ngày</strong></div>
                        <div><span>Dự kiến còn dùng được</span><strong>${stockPressure === null ? 'Chưa đủ dữ liệu' : `${stockPressure} ngày`}</strong></div>
                        <div><span>Hành động gợi ý</span><strong>${reorderQty > 0 ? 'Tạo phiếu nhập bổ sung' : insights.daysNoUsage !== null && insights.daysNoUsage >= 90 ? 'Rà soát dead stock' : 'Theo dõi bình thường'}</strong></div>
                    </div>
                </section>
            </div>`,
        files: renderFileCards(files),
        history: `<div class="material-activity-list material-history-list">${txns.slice(0, 20).map(t => `
            <div>
                <small>${formatDateTime(t.datetime || t.date)}</small>
                <strong>${escapeHtml(materialTxnLabel(t))} · ${num(t.qty).toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${escapeHtml(mat.unit || '')}</strong>
                <span>${escapeHtml(materialTxnTarget(t))} · ${formatMoneyVND(t.totalAmount || 0)}${t.note ? ` · ${escapeHtml(t.note)}` : ''}</span>
            </div>
        `).join('') || '<div class="metric-sub">Chưa có lịch sử</div>'}</div>`
    };
    const overlay = document.createElement('div');
    overlay.id = 'material-workspace-overlay';
    overlay.className = 'material-workspace-overlay';
    overlay.dataset.mid = mat.id;
    overlay.dataset.tab = tab;
    overlay.innerHTML = `
        <div class="material-workspace-backdrop" onclick="window.closeMaterialWorkspace()"></div>
        <section class="material-workspace">
            <header class="material-workspace-head">
                <div>
                    <small>${escapeHtml(mat.id)} · ${escapeHtml(mat.cat || '')}</small>
                    <h2>${escapeHtml(mat.name)}</h2>
                    <span class="inventory-status-badge ${status.className}"><b>${status.icon}</b>${status.label}</span>
                </div>
                <div class="material-workspace-actions">
                    <button class="sm" onclick="window.openPurchaseModal && window.openPurchaseModal('${mat.id}')">Nhập kho</button>
                    <button class="sm" onclick="window.openTxnModal && window.openTxnModal('usage', null, '${mat.id}')">Xuất kho</button>
                    <button class="sm" onclick="window.openTransferToSW && window.openTransferToSW('${mat.id}')">Chuyển kho</button>
                    <button class="sm" onclick="editMaterial('${mat.id}')">Chỉnh sửa</button>
                    <button class="sm" onclick="window.closeMaterialWorkspace()">✕</button>
                </div>
            </header>
            <div class="material-workspace-main">
                <nav>${tabs.map(([key, label]) => `<button class="${key === tab ? 'active' : ''}" onclick="window.openMaterialWorkspace('${mat.id}', '${key}')"><span>${label}</span>${tabCounts[key] !== '' ? `<b>${tabCounts[key]}</b>` : ''}</button>`).join('')}</nav>
                <article>${panels[tab] || panels.overview}</article>
            </div>
        </section>
    `;
    document.body.appendChild(overlay);
};

window.refreshMaterialPanels = function(mid) {
    const drawer = document.getElementById('material-detail-drawer');
    const workspace = document.getElementById('material-workspace-overlay');
    const shouldRefreshDrawer = drawer && String(drawer.dataset.mid) === String(mid);
    const shouldRefreshWorkspace = workspace && String(workspace.dataset.mid) === String(mid);
    const activeTab = workspace?.dataset?.tab || 'overview';

    if (shouldRefreshDrawer) window.openMaterialDrawer(mid);
    if (shouldRefreshWorkspace) window.openMaterialWorkspace(mid, activeTab);
};

window.openMaterialTxnDetail = function(tid) {
    const txn = (state.data.transactions || []).find(t => String(t.id) === String(tid));
    if (!txn) return;
    const mat = matById(txn.mid) || {};
    const files = parseAttachmentFiles(txn.attachment);
    showModal(`
        <div class="modal-hd"><span class="modal-title">${escapeHtml(materialTxnLabel(txn))} · ${escapeHtml(mat.name || txn.mid || '')}</span><button class="xbtn" onclick="closeModal()">✕</button></div>
        <div class="modal-bd">
            <div class="smart-preview-grid">
                <div><small>Thời gian</small><strong>${formatDateTime(txn.datetime || txn.date)}</strong></div>
                <div><small>Đối tượng</small><strong>${escapeHtml(materialTxnTarget(txn))}</strong></div>
                <div><small>Số lượng</small><strong>${num(txn.qty).toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${escapeHtml(mat.unit || '')}</strong></div>
                <div><small>Giá trị</small><strong>${formatMoneyVND(txn.totalAmount || 0)}</strong></div>
            </div>
            <div class="material-txn-detail-grid">
                <div><span>Mã phiếu</span><strong>${escapeHtml(txn.id || '—')}</strong></div>
                <div><span>Đơn giá</span><strong>${formatMoneyVND(txn.unitPrice || mat.cost || 0)}</strong></div>
                <div><span>VAT</span><strong>${num(txn.vatRate).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</strong></div>
                <div><span>Ghi chú</span><strong>${escapeHtml(txn.note || '—')}</strong></div>
            </div>
            <h3 style="margin:16px 0 10px;">File đính kèm</h3>
            ${files.length ? `<div class="material-file-grid">${files.map(file => `<article class="material-file-card"><a href="${escapeAttr(file.path)}" target="_blank"><strong>${escapeHtml(file.name)}</strong><small>Mở file</small></a></article>`).join('')}</div>` : '<div class="metric-sub">Giao dịch này chưa có file đính kèm</div>'}
        </div>
        <div class="modal-ft"><button onclick="closeModal()">Đóng</button></div>
    `, null);
};

// ========== CRUD ==========
export function openMatModal() {
    if (!hasPermission('canCreateMaterial')) { alert('Bạn không có quyền thêm vật tư'); return; }
    showModal(`<div class="modal-hd"><span class="modal-title">➕ Thêm vật tư mới</span><button class="xbtn" onclick="closeModal()">✕</button></div>
    <div class="modal-bd"><div class="form-grid2">
      <div class="form-group form-full"><label class="form-label">Tên vật tư *</label><input id="mn-name" placeholder="VD: Thép tấm 12mm"></div>
      <div class="form-group"><label class="form-label">Danh mục</label><select id="mn-cat">${state.data.categories.map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Đơn vị tính</label><select id="mn-unit">${state.data.units.map(u => `<option>${u}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Số lượng nhập đầu</label><input type="text" id="mn-qty" value="0" dir="ltr"></div>
      <div class="form-group"><label class="form-label">Đơn giá (VNĐ)</label><input type="text" id="mn-cost" value="0" dir="ltr"></div>
      <div class="form-group"><label class="form-label">Ngưỡng cảnh báo tồn</label><input type="text" id="mn-low" value="5" dir="ltr"></div>
      <div class="form-group form-full"><label class="form-label">Ghi chú</label><textarea id="mn-note" rows="2" placeholder="Ghi chú thêm về vật tư..."></textarea></div>
    </div></div>
    <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="saveMat()">Lưu vật tư</button></div>`);
  
    setTimeout(() => {
        const qtyInput = document.getElementById('mn-qty');
        const costInput = document.getElementById('mn-cost');
        const lowInput = document.getElementById('mn-low');
        if (qtyInput) setupNumberInput(qtyInput, { isInteger: false, decimals: 3 });
        if (costInput) setupNumberInput(costInput, { isInteger: false, decimals: 2 });
        if (lowInput) setupNumberInput(lowInput, { isInteger: true, decimals: 0 });
    }, 100);
}

export function saveMat() {
    const name = document.getElementById('mn-name')?.value.trim();
    if(!name) return alert('Vui lòng nhập tên vật tư');
  
    const qty = getNumberFromInput(document.getElementById('mn-qty'));
    const cost = getNumberFromInput(document.getElementById('mn-cost'));
    const low = getNumberFromInput(document.getElementById('mn-low'));
  
    const newMat = {
        id: genMid(), name, 
        cat: document.getElementById('mn-cat').value,
        unit: document.getElementById('mn-unit').value,
        qty: qty, cost: Math.round(cost), low: Math.round(low) || 5,
        note: document.getElementById('mn-note')?.value || ''
    };
  
    state.data.materials.push(newMat);
  fetch('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMat) }).catch(function(){});
    addLog('Thêm vật tư', `Đã thêm: ${name} (${newMat.id}) - SL: ${newMat.qty} ${newMat.unit} - Giá: ${formatMoneyVND(newMat.cost)}`);
  saveState();
    saveState(); closeModal(); if(window.render) window.render();
}

export function editMaterial(mid) {
    if (!hasPermission('canEditMaterial')) { alert('Bạn không có quyền sửa vật tư'); return; }
    const mat = matById(mid);
    if (!mat) return;
  
    showModal(`<div class="modal-hd"><span class="modal-title">✏️ Sửa vật tư</span><button class="xbtn" onclick="closeModal()">✕</button></div>
    <div class="modal-bd"><div class="form-grid2">
      <div class="form-group form-full"><label class="form-label">Tên vật tư *</label><input id="mn-name" value="${escapeHtml(mat.name)}"></div>
      <div class="form-group"><label class="form-label">Danh mục</label><select id="mn-cat">${state.data.categories.map(c => `<option ${mat.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Đơn vị tính</label><select id="mn-unit">${state.data.units.map(u => `<option ${mat.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Đơn giá (VNĐ)</label><input type="text" id="mn-cost" value="${parseFloat(mat.cost).toLocaleString('vi-VN', {minimumFractionDigits:0, maximumFractionDigits:2})}" dir="ltr"></div>
      <div class="form-group"><label class="form-label">Ngưỡng cảnh báo tồn</label><input type="text" id="mn-low" value="${parseFloat(mat.low).toLocaleString('vi-VN', {minimumFractionDigits:0, maximumFractionDigits:3})}" dir="ltr"></div>
      <div class="form-group form-full"><label class="form-label">Ghi chú</label><textarea id="mn-note" rows="2">${escapeHtml(mat.note || '')}</textarea></div>
    </div></div>
    <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="updateMaterial('${mid}')">Cập nhật</button></div>`);
  
    setTimeout(() => {
        const costInput = document.getElementById('mn-cost');
        const lowInput = document.getElementById('mn-low');
        if (costInput) setupNumberInput(costInput, { isInteger: false, decimals: 2 });
        if (lowInput) setupNumberInput(lowInput, { isInteger: true, decimals: 0 });
    }, 100);
}

export function updateMaterial(mid) {
    const mat = matById(mid);
    if (!mat) return;
    const name = document.getElementById('mn-name')?.value.trim();
    if (!name) return alert('Vui lòng nhập tên vật tư');
  
    mat.name = name;
    mat.cat = document.getElementById('mn-cat').value;
    mat.unit = document.getElementById('mn-unit').value;
    mat.cost = getNumberFromInput(document.getElementById('mn-cost'));
    mat.low = getNumberFromInput(document.getElementById('mn-low'));
    mat.note = document.getElementById('mn-note')?.value || '';
    fetch('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mat) }).catch(function(){});
  addLog('Sửa vật tư', `Đã cập nhật: ${name} (${mid})`);
  saveState();
    saveState(); closeModal(); if(window.render) window.render();
}

export function deleteMaterial(mid) {
    if (!hasPermission('canDeleteMaterial')) { alert('Bạn không có quyền xóa vật tư'); return; }
    const mat = matById(mid);
    if (!confirm(`⚠️ Xóa vật tư "${mat?.name}"?`)) return;
    state.data.materials = state.data.materials.filter(m => m.id !== mid);
  fetch("/api/materials/" + mid, { method: "DELETE" });
  fetch('/api/materials/' + mid, { method: 'DELETE' }).catch(function(){});
    state.data.transactions = state.data.transactions.filter(t => t.mid !== mid);
    addLog('Xóa vật tư', `Đã xóa: ${mat?.name} (${mid})`);
  saveState();
    saveState(); if(window.render) window.render();
}

// ========== XEM CHI TIẾT VẬT TƯ ==========
window.showMaterialDetail = function(mid, page = 1, limit = 20) {
    const mat = matById(mid);
    if (!mat) return;

    // Lấy giao dịch nhập
    let purchaseTxns = state.data.transactions
        .filter(t => t.mid === mid && t.type === 'purchase')
        .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));
    
    const totalPurchase = purchaseTxns.length;
    const importKey = 'material_import_' + mid;
    const importPage = getMaterialDetailPage(importKey, purchaseTxns);
    const paginatedPurchase = importPage.rows;

    // Lấy giao dịch xuất và trả
    let exportTxns = state.data.transactions
        .filter(t => t.mid === mid && (t.type === 'usage' || t.type === 'return' || t.type === 'produce' || t.type === 'transfer_sw' || t.type === 'return_from_sw'))
        .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));
    
    const totalExport = exportTxns.length;
    const exportKey = 'material_export_' + mid;
    const exportPage = getMaterialDetailPage(exportKey, exportTxns);
    const paginatedExport = exportPage.rows;


    // Tính tổng
    const totalImport = purchaseTxns.reduce((s, t) => s + Number(Number(t.totalAmount || 0)), 0);
    const totalExportSum = exportTxns.filter(t => t.type === 'usage').reduce((s, t) => s + Number(Number(t.totalAmount || 0)), 0);
    const totalReturn = exportTxns.filter(t => t.type === 'return').reduce((s, t) => s + Number(Number(t.totalAmount || 0)), 0);

    // Tạo HTML cho bảng nhập
    let purchaseHtml = '';
    if (paginatedPurchase.length > 0) {
        purchaseHtml = paginatedPurchase.map(t => {
            const sup = state.data.suppliers.find(s => s.id === t.supplierId);
            return `<tr>
                <td style="white-space:nowrap;">${formatDateTime(t.datetime || t.date)}</td>
                <td style="text-align:left;"><strong>${escapeHtml(sup?.name || 'N/A')}</strong></td>
                <td style="text-align:right;">${parseFloat(t.qty||0).toLocaleString('vi-VN', {minimumFractionDigits:0, maximumFractionDigits:3})} ${mat.unit}</td>
                <td style="text-align:right;">${formatMoneyVND(parseFloat(t.unitPrice))}</td>
                <td style="text-align:center;">${parseFloat(t.vatRate||0)}%</td>
                <td style="text-align:right;color:var(--success-text);font-weight:bold;">${formatMoneyVND(t.totalAmount)}</td>
                <td style="text-align:left;">${escapeHtml(t.note || '—')}</td>
                <td style="text-align:left;">${renderAttachmentLinks(t.attachment, escapeHtml)}</td>
            </tr>`;
        }).join('');
    } else {
        purchaseHtml = '<tr><td colspan="8" style="text-align:center;">📭 Chưa có giao dịch nhập</td></tr>';
    }

    // Tạo HTML cho bảng xuất
    let exportHtml = '';
    if (paginatedExport.length > 0) {
        exportHtml = paginatedExport.map(t => {
            const proj = state.data.projects.find(p => p.id === t.projectId);
            const isReturn = t.type === 'return';
            const isTransferSW = t.type === 'transfer_sw';
            const isReturnFromSW = t.type === 'return_from_sw';
            const isProduce = t.type === 'produce';
            return `<tr>
                <td style="white-space:nowrap;">${formatDateTime(t.datetime || t.date)}</td>
                <td style="color:${isProduce?'var(--accent)':isReturn?'var(--success-text)':isTransferSW?'var(--accent-text)':'var(--warn-text)'};font-weight:bold;">
                    ${isProduce ? '🏭 Sản xuất' : isReturn ? '🔄 Trả hàng' : isTransferSW ? (isReturnFromSW ? "🔄 Trả về kho chính" : '📦 Chuyển kho CK') : '📤 Xuất kho'}
                </td>
                <td><strong>${escapeHtml(proj?.name || 'N/A')}</strong></td>
                <td style="text-align:right;">${parseFloat(t.qty||0).toLocaleString('vi-VN', {minimumFractionDigits:0, maximumFractionDigits:3})} ${mat.unit}</td>
                <td style="text-align:right;">${formatMoneyVND(parseFloat(t.unitPrice))}</td>
                <td style="text-align:right;font-weight:bold;color:${isReturn?'var(--success-text)':'var(--warn-text)'};">${isReturn?'- ':''}${formatMoneyVND(t.totalAmount)}</td>
                <td>${escapeHtml(t.note || '—')}</td>
                <td style="text-align:left;">${renderAttachmentLinks(t.attachment, escapeHtml)}</td>
            </tr>`;
        }).join('');
    } else {
        exportHtml = '<tr><td colspan="8" style="text-align:center;">📭 Chưa có giao dịch xuất</td></tr>';
    }

    // Tạo phân trang HTML
    

    const html = `
        <div class="modal-hd" style="background: var(--accent-bg);">
            <span class="modal-title" style="font-size:20px;">📦 Chi tiết: ${escapeHtml(mat.name)}</span>
            <button class="xbtn" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-bd" style="max-height: 70vh; overflow-y: auto;">
            <div class="grid4" style="margin-bottom: 20px;">
                <div class="metric-card"><div class="metric-label">📦 TỒN KHO</div><div class="metric-val">${parseFloat(mat.qty).toLocaleString('vi-VN')} ${mat.unit}</div></div>
                <div class="metric-card"><div class="metric-label">💰 ĐƠN GIÁ</div><div class="metric-val">${formatMoneyVND(mat.cost)}</div></div>
                <div class="metric-card"><div class="metric-label">📥 TỔNG NHẬP</div><div class="metric-val" style="color: var(--success-text);">${formatMoneyVND(totalImport)}</div></div>
                <div class="metric-card"><div class="metric-label">📤 TỔNG XUẤT</div><div class="metric-val" style="color: var(--warn-text);">${formatMoneyVND(totalExportSum - totalReturn)}</div></div>
            </div>

            <div class="sec-title" style="display:flex;align-items:center;justify-content:space-between;">
    <span>📥 LỊCH SỬ NHẬP KHO (${totalPurchase} giao dịch)</span>
    ${renderMaterialDetailPageSize(importKey, importPage, mid)}
</div>
<div class="tbl-wrap"><table style="min-width: 750px;"><thead><tr><th>Thời gian</th><th>Nhà cung cấp</th><th style="text-align:right;">SL</th><th style="text-align:right;">Đơn giá</th><th style="text-align:center;">VAT</th><th style="text-align:right;">Thành tiền</th><th>Ghi chú</th><th>File</th></tr></thead><tbody>${purchaseHtml}</tbody></table></div>
${renderMaterialDetailPager(importKey, importPage, mid, 'giao dịch nhập')}


            <div class="sec-title" style="display:flex;align-items:center;justify-content:space-between;">
    <span>📤 LỊCH SỬ XUẤT KHO (${totalExport} giao dịch)</span>
    ${renderMaterialDetailPageSize(exportKey, exportPage, mid)}
</div>
<div class="tbl-wrap"><table style="min-width: 750px;"><thead><tr><th>Thời gian</th><th style="text-align:center;">Loại</th><th>Công trình</th><th style="text-align:right;">SL</th><th style="text-align:right;">Đơn giá</th><th style="text-align:right;">Thành tiền</th><th>Ghi chú</th><th>File</th></tr></thead><tbody>${exportHtml}</tbody></table></div>
${renderMaterialDetailPager(exportKey, exportPage, mid, 'giao dịch xuất')}

            
        </div>
        <div class="modal-ft">
            <button onclick="closeModal()">Đóng</button>
            <button class="sm" onclick="closeModal();window.exportMaterialDetail('${mid}')">📎 Xuất Excel</button>
        </div>`;

    showModal(html, null);
};
// ========== XUẤT EXCEL CHI TIẾT VẬT TƯ ==========
window.exportMaterialDetail = function(mid) {
    const mat = matById(mid);
    if (!mat) return;

    const purchaseTxns = state.data.transactions.filter(t => t.mid === mid && t.type === 'purchase');
const exportTxns = state.data.transactions
    .filter(t => t.mid === mid && (t.type === 'usage' || t.type === 'return' || t.type === 'produce' || t.type === 'transfer_sw' || t.type === 'return_from_sw'))
    .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));

    const importData = purchaseTxns.map(t => ({
        'Thời gian': formatDateTime(t.datetime || t.date),
        'Nhà cung cấp': state.data.suppliers.find(s => s.id === t.supplierId)?.name || '',
        'Số lượng': t.qty,
        'Đơn vị': mat.unit,
        'Đơn giá': t.unitPrice,
        'VAT': (t.vatRate||0) + '%',
        'Thành tiền': t.totalAmount,
        'Ghi chú': t.note || ''
    }));

    const exportData = exportTxns.map(t => ({
        'Thời gian': formatDateTime(t.datetime || t.date),
        'Loại': t.type === 'produce' ? 'Sản xuất' : t.type === 'return' ? 'Trả hàng' : 'Xuất kho',
        'Công trình': state.data.projects.find(p => p.id === t.projectId)?.name || '',
        'Số lượng': t.qty,
        'Đơn vị': mat.unit,
        'Đơn giá': t.unitPrice,
        'Thành tiền': t.totalAmount,
        'Ghi chú': t.note || ''
    }));

    if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();
        if (importData.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(importData), 'Nhập kho');
        if (exportData.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Xuất kho');
        XLSX.writeFile(wb, `chitiet_${mat.id}_${mat.name.replace(/\s/g,'_')}.xlsx`);
        alert('✅ Đã xuất Excel!');
    } else {
        alert('Đang tải thư viện Excel, thử lại sau...');
    }
};

export const addMaterial = (data) => {
    const newId = genMid();
    const newMat = { id: newId, name: data.name, cat: data.cat || data.category, unit: data.unit, qty: data.qty || 0, cost: data.cost || 0, low: data.low || 5, note: data.note || '' };
    state.data.materials.push(newMat);
  fetch('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMat) }).catch(function(){});
    addLog('Thêm vật tư', `Đã thêm: ${newMat.name} (${newMat.id})`);
  saveState();
    saveState(); if(window.render) window.render();
    return newMat;
};

export const getMaterials = () => state.data.materials;

function renderSWMaterialOptions(preselectedMaterialId = null) {
    return state.data.materials.filter(m => parseFloat(m.qty) > 0).map(m => 
        `<option value="${m.id}" ${preselectedMaterialId === m.id ? 'selected' : ''} data-unit="${escapeHtml(m.unit || '')}" data-cost="${m.cost}" data-stock="${m.qty}">${escapeHtml(m.name)} (Tồn: ${Number(m.qty).toLocaleString('vi-VN')} ${escapeHtml(m.unit || '')})</option>`
    ).join('');
}

window.updateSWPreview = function() {
    const rows = Array.from(document.querySelectorAll('.sw-row'));
    const preview = document.getElementById('sw-preview');
    if (!preview) return;
    let totalQty = 0;
    let totalValue = 0;
    const warnings = [];
    rows.forEach(row => {
        const sel = row.querySelector('.sw-mat');
        const qty = getNumberFromInput(row.querySelector('.sw-qty'));
        const opt = sel?.selectedOptions?.[0];
        const mat = state.data.materials.find(m => m.id === sel?.value);
        const stock = Number(opt?.dataset?.stock || mat?.qty || 0);
        const cost = Number(opt?.dataset?.cost || mat?.cost || 0);
        totalQty += qty;
        totalValue += qty * cost;
        if (qty > stock) warnings.push(`${mat?.name || sel?.value}: vượt tồn ${stock.toLocaleString('vi-VN')}`);
        if (mat && stock - qty <= Number(mat.low || 0)) warnings.push(`${mat.name}: sau chuyển dưới ngưỡng`);
    });
    preview.innerHTML = `
        <div class="smart-preview-grid">
            <div><small>Số dòng chuyển</small><strong>${rows.length.toLocaleString('vi-VN')}</strong></div>
            <div><small>Tổng số lượng</small><strong>${totalQty.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}</strong></div>
            <div><small>Giá trị tạm tính</small><strong>${formatMoneyVND(totalValue)}</strong></div>
            <div><small>Trạng thái</small><strong>${warnings.length ? 'Cần kiểm tra' : 'Hợp lệ'}</strong></div>
        </div>
        <div class="smart-preview-note ${warnings.length ? 'warn' : 'good'}">${warnings.length ? escapeHtml(warnings.slice(0, 3).join(' · ')) : 'Các dòng chuyển hiện còn trong tồn khả dụng.'}</div>
    `;
};

window.openTransferToSW = function(preselectedMaterialId = null) {
    const matOpts = state.data.materials.filter(m => parseFloat(m.qty) > 0).map(m => 
        `<option value="${m.id}" ${preselectedMaterialId === m.id ? 'selected' : ''} data-unit="${escapeHtml(m.unit || '')}" data-cost="${m.cost}" data-stock="${m.qty}">${escapeHtml(m.name)} (Tồn: ${Number(m.qty).toLocaleString('vi-VN')} ${escapeHtml(m.unit || '')})</option>`
    ).join('');
    const now = new Date();
const dt = now.getFullYear() + '-' +
  String(now.getMonth() + 1).padStart(2, '0') + '-' +
  String(now.getDate()).padStart(2, '0') + 'T' +
  String(now.getHours()).padStart(2, '0') + ':' +
  String(now.getMinutes()).padStart(2, '0');

    
    showModal(`
        <div class="modal-hd"><span class="modal-title">📦 Chuyển vật tư sang KHO CẤU KIỆN</span><button class="xbtn" onclick="closeModal()">✕</button></div>
        <div class="modal-bd">
            <div class="form-group">
                <label class="form-label">📅 Thời gian nhập kho CK</label>
                <input type="datetime-local" id="sw-datetime" value="${dt}">
            </div>
            <div id="sw-items">
                <div class="sw-row" style="display:flex;gap:8px;margin-bottom:8px;">
                    <select class="sw-mat" style="flex:2;" onchange="window.updateSWPreview()">${matOpts}</select>
                    <input type="text" class="sw-qty" value="1" style="width:100px;" dir="ltr" placeholder="SL">
                    <button class="sm danger-btn" onclick="this.parentElement.remove();window.updateSWPreview()">✕</button>
                </div>
            </div>
            <button class="sm" onclick="window.addSWRow()">+ Thêm vật tư</button>
            <div id="sw-preview" class="smart-workflow-preview"></div>
            <div class="form-group" style="margin-top:12px;"><label class="form-label">📎 File đính kèm</label><input type="file" id="sw-files" multiple onchange="window.upFiles(this,'transfer_sw')"><div id="transfer_sw-file-list" style="margin-top:4px;font-size:11px;"></div></div>
            <div class="form-group"><label class="form-label">Ghi chú</label><input id="sw-note" placeholder="Ghi chú..."></div>
            

        </div>
        <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="window.confirmTransferSW()">Xác nhận chuyển</button></div>
    `);
    setTimeout(function() {
    document.querySelectorAll('.sw-qty').forEach(function(input) {
        setupNumberInput(input, { isInteger: false, decimals: null });
        input.addEventListener('input', window.updateSWPreview);
        input.addEventListener('change', window.updateSWPreview);
    });
    window.updateSWPreview();
}, 100);
};

window.addSWRow = function() {
    const matOpts = renderSWMaterialOptions();
    const div = document.createElement('div');
    div.className = 'sw-row';
    div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
    div.innerHTML = `<select class="sw-mat" style="flex:2;" onchange="window.updateSWPreview()">${matOpts}</select><input type="text" class="sw-qty" value="1" style="width:100px;" dir="ltr"><button class="sm danger-btn" onclick="this.parentElement.remove();window.updateSWPreview()">✕</button>`;
    document.getElementById('sw-items').appendChild(div);
    const qtyInput = div.querySelector('.sw-qty');
if (qtyInput) {
    setupNumberInput(qtyInput, { isInteger: false, decimals: null });
    qtyInput.addEventListener('input', window.updateSWPreview);
    qtyInput.addEventListener('change', window.updateSWPreview);
}
    window.updateSWPreview();

};

window.confirmTransferSW = async function() {
    const items = [];
    const datetime = document.getElementById('sw-datetime')?.value || new Date().toISOString();


    document.querySelectorAll('.sw-row').forEach(row => {
        const sel = row.querySelector('.sw-mat');
        const qty = getNumberFromInput(row.querySelector('.sw-qty'));

        if (sel?.value && qty > 0) {
            const mat = state.data.materials.find(m => m.id === sel.value);
            const stock = Number(mat?.qty || 0);
            if (qty > stock) {
                items.push({ invalid: true, name: mat?.name || sel.value, qty, stock, unit: mat?.unit || '' });
                return;
            }

            items.push({
                mid: sel.value,
                name: mat?.name || '',
                unit: sel.selectedOptions[0]?.dataset?.unit || mat?.unit || '',
                qty,
                cost: parseFloat(sel.selectedOptions[0]?.dataset?.cost || 0) || parseFloat(mat?.cost || 0)
            });
        }
    });

    if (items.length === 0) return alert('Chưa có vật tư nào!');
    const invalid = items.find(i => i.invalid);
    if (invalid) {
        return alert(`Không đủ tồn để chuyển ${invalid.name}. Còn ${invalid.stock.toLocaleString('vi-VN')} ${invalid.unit}, đang chuyển ${invalid.qty.toLocaleString('vi-VN')}.`);
    }

    const note = document.getElementById('sw-note')?.value || '';
    const finalPaths = window.moveUploadedFiles ? await window.moveUploadedFiles('transfer_sw') : [];
    const attachment = JSON.stringify(finalPaths);

    addLog("Chuyển kho CK", items.map(i => `${i.name}: ${i.qty} ${i.unit}`).join(", "));

    fetch('/api/transfer-to-structure-warehouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, note, datetime, attachment })

    })
        .then(r => r.json())
        .then(d => {
            if (d.success) {
                window._upPaths = {};
                alert('✅ Đã chuyển sang kho cấu kiện!');
                closeModal();
                window.loadState().then(() => window.render());
            } else {
                alert('❌ ' + d.error);
            }
        });
};
