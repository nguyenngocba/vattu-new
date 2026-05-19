import { mobileInlineIcon, mobileTitleIcon, mobileTxnTypeIcon } from './mobile_icons.js';

let deps = {};
let stockStatusFilter = 'all';

function mobileThemeClass() {
    return 'm-wh-theme-' + (localStorage.getItem('steeltrack_mobile_theme') || 'light');
}

function escapeValue(value) {
    const text = String(value ?? '');
    return deps.escapeHtml ? deps.escapeHtml(text) : text;
}

function money(value) {
    return deps.formatMoneyVND ? deps.formatMoneyVND(value || 0) : Number(value || 0).toLocaleString('vi-VN');
}

function data() {
    return deps.state?.data || {};
}

function titleIcon(name, alt) {
    return mobileTitleIcon(name, alt, escapeValue);
}

function inlineIcon(name, alt) {
    return mobileInlineIcon(name, alt, escapeValue);
}

function warningTriangle() {
    return '<span class="m-warning-triangle" aria-label="Sắp hết">!</span>';
}

function renderStockItem(m) {
    const low = Number(m.qty || 0) <= Number(m.low || 0);
    return `
        <div class="m-stock-item"
            data-name="${escapeValue(m.name).toLowerCase()}"
            data-cat="${escapeValue(m.cat || '').toLowerCase()}"
            data-status="${low ? 'low' : 'ok'}"
            onclick="window.showMobileMaterialDetail('${m.id}')">
            <div class="m-stock-info">
                <div class="m-stock-name">${low ? warningTriangle() : ''}${escapeValue(m.name)}</div>
                <div class="m-stock-meta">${escapeValue(m.cat || '')} · ${money(m.cost)}/${escapeValue(m.unit || '')}</div>
            </div>
            <div class="m-stock-qty ${low ? 'm-text-red' : ''}">
                <div class="m-stock-qty-val">${Number(m.qty || 0).toLocaleString('vi-VN')}</div>
                <div class="m-stock-qty-unit">${escapeValue(m.unit || '')}</div>
            </div>
        </div>
    `;
}

function renderLowStockItem(m) {
    return `
        <div class="m-stock-item" onclick="window.showMobileMaterialDetail('${m.id}')">
            <div class="m-stock-info">
                <div class="m-stock-name">${warningTriangle()}${escapeValue(m.name)}</div>
                <div class="m-stock-meta">Cần nhập thêm ${Number(Number(m.low || 0) - Number(m.qty || 0)).toLocaleString('vi-VN')} ${escapeValue(m.unit || '')}</div>
            </div>
            <div class="m-stock-qty m-text-red">
                <div class="m-stock-qty-val">${Number(m.qty || 0).toLocaleString('vi-VN')}</div>
                <div class="m-stock-qty-unit">${escapeValue(m.unit || '')}</div>
            </div>
        </div>
    `;
}

function renderMaterialTxnRows(materialId, material) {
    const txns = (data().transactions || [])
        .filter(t => String(t.mid) === String(materialId))
        .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));

    return txns.slice(0, 25).map(t => {
        const project = (data().projects || []).find(p => p.id === t.projectId);
        const supplier = (data().suppliers || []).find(s => s.id === t.supplierId);
        const isImport = t.type === 'purchase';
        const isReturn = t.type === 'return';
        const time = new Date(t.datetime || t.date).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });
        const place = isImport ? supplier?.name : project?.name;

        return `
            <div class="m-material-txn">
                <div class="m-txn-icon ${isImport ? 'success' : isReturn ? 'info' : 'danger'}">${mobileTxnTypeIcon(t.type, isImport ? 'Nhập kho' : isReturn ? 'Trả hàng' : 'Xuất kho', escapeValue)}</div>
                <div>
                    <strong>${isImport ? 'Nhập kho' : isReturn ? 'Trả hàng' : 'Xuất kho'}</strong>
                    <small>${time} · ${escapeValue(place || 'N/A')} · ${Number(t.qty || 0).toLocaleString('vi-VN')} ${escapeValue(material.unit || '')}</small>
                </div>
                <span class="${isImport || isReturn ? 'success' : 'danger'}">${isImport || isReturn ? '+' : '-'}${money(t.totalAmount || 0)}</span>
            </div>
        `;
    }).join('') || '<div class="m-empty">Chưa có giao dịch</div>';
}

export function installMobileStock(options) {
    deps = options || {};

    window.showMobileStock = function() {
        const materials = data().materials || [];
        const html = `
            <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-stock-modal">
                <div class="m-modal-hd">
                    <button class="m-back" onclick="renderMobileViewOnly()">←</button>
                    <span>${titleIcon('logo-vattu.png', 'Vật tư')} TỒN KHO (${materials.length})</span>
                    <div></div>
                </div>
                <div class="m-modal-bd" style="padding:12px;">
                    <input type="text" id="ms-search" class="m-search" placeholder="Tìm vật tư..." oninput="filterMStock()">
                </div>
                <div class="m-stock-filter">
                    <button class="${stockStatusFilter === 'all' ? 'active' : ''}" onclick="filterMobileStockStatus('all')">Tất cả</button>
                    <button class="${stockStatusFilter === 'low' ? 'active' : ''}" onclick="filterMobileStockStatus('low')">Sắp hết</button>
                    <button class="${stockStatusFilter === 'ok' ? 'active' : ''}" onclick="filterMobileStockStatus('ok')">Còn hàng</button>
                </div>
                <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;" id="ms-list">
                    ${materials.map(renderStockItem).join('')}
                </div>
                ${deps.renderMobileActionSheet ? deps.renderMobileActionSheet() : ''}
                ${deps.renderMobileTabBar ? deps.renderMobileTabBar('stock') : ''}
            </div>
        `;

        document.getElementById('root').innerHTML = html;
        deps.fixAllModalHeight?.();
    };

    window.showMobileLowStock = function() {
        const materials = (data().materials || []).filter(m => Number(m.qty || 0) <= Number(m.low || 0));
        const html = `
            <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-low-modal">
                <div class="m-modal-hd">
                    <button class="m-back" onclick="renderMobileViewOnly()">←</button>
                    <span>${titleIcon('logo-chuongthongbao.png', 'Cảnh báo')} SẮP HẾT HÀNG (${materials.length})</span>
                    <div></div>
                </div>
                <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;">
                    ${materials.length ? materials.map(renderLowStockItem).join('') : '<div class="m-empty">✅ Tất cả đều ổn, không có hàng sắp hết!</div>'}
                </div>
                ${deps.renderMobileActionSheet ? deps.renderMobileActionSheet() : ''}
                ${deps.renderMobileTabBar ? deps.renderMobileTabBar('stock') : ''}
            </div>
        `;

        document.getElementById('root').innerHTML = html;
        deps.fixAllModalHeight?.();
    };

    window.showMobileMaterialDetail = function(materialId) {
        const material = (data().materials || []).find(m => String(m.id) === String(materialId));
        if (!material) {
            alert('Không tìm thấy vật tư!');
            return;
        }

        const txns = (data().transactions || []).filter(t => String(t.mid) === String(materialId));
        const totalUsage = txns.filter(t => t.type === 'usage').reduce((s, t) => s + Number(t.qty || 0), 0);
        const totalReturn = txns.filter(t => t.type === 'return').reduce((s, t) => s + Number(t.qty || 0), 0);
        const qty = Number(material.qty || 0);
        const low = Number(material.low || 0);
        const isLow = qty <= low;
        const stockValue = qty * Number(material.cost || 0);

        const html = `
            <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-material-detail-modal">
                <div class="m-modal-hd">
                    <button class="m-back" onclick="showMobileStock()">←</button>
                    <span>${titleIcon('logo-vattu.png', 'Vật tư')} ${escapeValue(material.name)}</span>
                    <div></div>
                </div>

                <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px;">
                    <div class="m-material-hero ${isLow ? 'danger' : 'safe'}">
                        <div>
                            <small>${escapeValue(material.cat || 'Vật tư')}</small>
                            <strong>${Number(qty).toLocaleString('vi-VN')} ${escapeValue(material.unit || '')}</strong>
                            <span>Ngưỡng cảnh báo: ${Number(low).toLocaleString('vi-VN')} ${escapeValue(material.unit || '')}</span>
                        </div>
                        <div class="m-material-status">${isLow ? 'Sắp hết' : 'Ổn'}</div>
                    </div>

                    <div class="m-material-kpis">
                        <div class="usage">
                            <small>Đã xuất</small>
                            <strong>${Number(totalUsage).toLocaleString('vi-VN')} ${escapeValue(material.unit || '')}</strong>
                        </div>
                        <div class="return">
                            <small>Đã trả</small>
                            <strong>${Number(totalReturn).toLocaleString('vi-VN')} ${escapeValue(material.unit || '')}</strong>
                        </div>
                        <div class="net">
                            <small>Giá trị tồn</small>
                            <strong>${money(stockValue)}</strong>
                        </div>
                    </div>

                    <div class="m-project-detail-actions">
                        <button onclick="showMobileImport('${material.id}')">${inlineIcon('logo-nhapkho.png', 'Nhập kho')} Nhập thêm</button>
                        <button onclick="showMobileExport(null, '${material.id}')">${inlineIcon('logo-xuatkho.png', 'Xuất kho')} Xuất kho</button>
                    </div>

                    <div class="m-section-title">🧾 GIAO DỊCH VẬT TƯ</div>
                    <div class="m-project-detail-list">${renderMaterialTxnRows(materialId, material)}</div>
                </div>

                ${deps.renderMobileActionSheet ? deps.renderMobileActionSheet() : ''}
                ${deps.renderMobileTabBar ? deps.renderMobileTabBar('stock') : ''}
            </div>
        `;

        document.getElementById('root').innerHTML = html;
        deps.fixAllModalHeight?.();
    };

    window.filterMStock = function() {
        const kw = document.getElementById('ms-search')?.value?.toLowerCase() || '';

        document.querySelectorAll('#ms-list .m-stock-item').forEach(function(el) {
            const matchName = (el.dataset.name || '').includes(kw);
            const matchCat = (el.dataset.cat || '').includes(kw);
            const matchStatus = stockStatusFilter === 'all' || el.dataset.status === stockStatusFilter;
            el.style.display = (matchName || matchCat) && matchStatus ? '' : 'none';
        });
    };

    window.filterMobileStockStatus = function(status) {
        stockStatusFilter = status || 'all';

        document.querySelectorAll('.m-stock-filter button').forEach(function(btn) {
            btn.classList.remove('active');
        });

        const btn = document.querySelector(`.m-stock-filter button[onclick="filterMobileStockStatus('${stockStatusFilter}')"]`);
        if (btn) btn.classList.add('active');

        window.filterMStock();
    };

    window.showMobileStockByCategory = function(encodedCategory) {
        const category = decodeURIComponent(encodedCategory || '');
        window.showMobileStock();

        setTimeout(function() {
            const search = document.getElementById('ms-search');
            if (search) {
                search.value = category;
                window.filterMStock();
            }
        }, 80);
    };
}
