import { parseAttachmentFiles } from './mobile_files.js';
import { mobileTxnTypeIcon } from './mobile_icons.js';

let deps = {};

const txnState = {
    page: 1,
    limit: 10,
    search: '',
    typeFilter: 'all'
};

function escapeValue(value) {
    const text = String(value ?? '');
    return deps.escapeHtml ? deps.escapeHtml(text) : text;
}

function money(value) {
    return deps.formatMoneyVND ? deps.formatMoneyVND(value || 0) : Number(value || 0).toLocaleString('vi-VN');
}

function getStateData() {
    return deps.state?.data || {};
}

function bindRecentTxnClicks() {
    document.querySelectorAll('.m-txn-item[data-txn-id]').forEach(function(item) {
        item.onclick = function(e) {
            e.preventDefault();
            const txnKey = item.dataset.txnId;
            if (txnKey && window.showMobileTxnDetail) {
                window.showMobileTxnDetail(txnKey);
            }
        };
    });
}

function refreshTxnList(delay = 20) {
    const listEl = document.getElementById('m-txn-list');
    if (!listEl) return;
    listEl.innerHTML = renderRecentTxns(getStateData().transactions || []);
    setTimeout(bindRecentTxnClicks, delay);
}

export function renderRecentTxns(transactions) {
    const data = getStateData();
    const materials = data.materials || [];
    const projects = data.projects || [];
    const suppliers = data.suppliers || [];
    const kw = String(txnState.search || '').trim().toLowerCase();

    let txns = [...transactions].filter(t => {
        if (txnState.typeFilter !== 'all' && t.type !== txnState.typeFilter) return false;
        if (!kw) return true;

        const mat = materials.find(m => m.id === t.mid);
        const project = projects.find(p => p.id === t.projectId);
        const supplier = suppliers.find(s => s.id === t.supplierId);
        const typeText = t.type === 'purchase' ? 'nhập kho nhập' : t.type === 'return' ? 'trả hàng trả' : 'xuất kho xuất';

        return [
            mat?.name,
            mat?.cat,
            project?.name,
            supplier?.name,
            typeText,
            t.note,
            t.date,
            t.datetime
        ].some(v => String(v || '').toLowerCase().includes(kw));
    }).sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));

    const totalItems = txns.length;
    const totalPages = Math.ceil(totalItems / txnState.limit) || 1;
    if (txnState.page > totalPages) txnState.page = totalPages;
    if (txnState.page < 1) txnState.page = 1;

    const start = (txnState.page - 1) * txnState.limit;
    const paginated = txns.slice(start, start + txnState.limit);
    if (paginated.length === 0) return '<div class="m-empty">Chưa có giao dịch</div>';

    let html = '';
    window._mobileTxnDetailMap = {};
    txns.forEach((t, index) => {
        const key = t.id ? String(t.id) : 'txn_all_' + index;
        window._mobileTxnDetailMap[key] = t;
    });

    paginated.forEach((t, index) => {
        const txnKey = t.id ? String(t.id) : 'txn_all_' + (start + index);
        const mat = materials.find(m => m.id === t.mid);
        const isImport = t.type === 'purchase';
        const isReturn = t.type === 'return';
        const txnTone = isImport ? 'success' : isReturn ? 'info' : 'danger';
        const txnIcon = mobileTxnTypeIcon(t.type, isImport ? 'Nhập kho' : isReturn ? 'Trả hàng' : 'Xuất kho', escapeValue);
        const time = new Date(t.datetime || t.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const files = parseAttachmentFiles(t.attachment);

        if (!window._mobileTxnAttachments) window._mobileTxnAttachments = {};
        if (t.id && files.length) window._mobileTxnAttachments[t.id] = t.attachment;

        html += `
            <div class="m-txn-item" data-txn-id="${escapeValue(txnKey)}">
                ${files.length ? `<span class="m-file-badge">${files.length}</span>` : ''}
                <div class="m-txn-icon ${txnTone}">${txnIcon}</div>
                <div class="m-txn-info">
                    <div class="m-txn-name">${escapeValue(mat?.name || 'N/A')}</div>
                    <div class="m-txn-meta">${time} · ${isImport ? 'Nhập' : isReturn ? 'Trả' : 'Xuất'} · ${Number(t.qty || 0).toLocaleString('vi-VN')} ${mat?.unit || ''}</div>
                </div>
                <div class="m-txn-amount ${txnTone}">
                    ${isImport || isReturn ? '+' : '-'}${money(t.totalAmount)}
                </div>
            </div>
        `;
    });

    html += '<div class="m-pagination">';
    html += `<select class="m-page-limit" onchange="changeTxnLimit(this.value)">`;
    html += `<option value="10" ${txnState.limit === 10 ? 'selected' : ''}>10</option>`;
    html += `<option value="20" ${txnState.limit === 20 ? 'selected' : ''}>20</option>`;
    html += `<option value="50" ${txnState.limit === 50 ? 'selected' : ''}>50</option>`;
    html += `</select>`;
    html += '<div class="m-page-btns">';
    html += `<button class="m-page-btn" onclick="changeTxnPage(${txnState.page - 1})" ${txnState.page <= 1 ? 'disabled' : ''}>◀</button>`;
    html += `<span class="m-page-info">${txnState.page}/${totalPages} (${totalItems})</span>`;
    html += `<button class="m-page-btn" onclick="changeTxnPage(${txnState.page + 1})" ${txnState.page >= totalPages ? 'disabled' : ''}>▶</button>`;
    html += '</div></div>';

    return html;
}

export function renderRecentTxnSection(transactions) {
    return `
        <div class="m-section">
            <div class="m-section-title">📋 GIAO DỊCH GẦN ĐÂY</div>

            <input type="text" class="m-search" placeholder="Tìm giao dịch..." value="${escapeValue(txnState.search)}" oninput="filterMobileTxns(this.value)" style="margin-bottom:10px;">

            <div class="m-txn-filter">
                <button class="${txnState.typeFilter === 'all' ? 'active' : ''}" onclick="filterMobileTxnType('all')">Tất cả</button>
                <button class="${txnState.typeFilter === 'purchase' ? 'active' : ''}" onclick="filterMobileTxnType('purchase')">Nhập</button>
                <button class="${txnState.typeFilter === 'usage' ? 'active' : ''}" onclick="filterMobileTxnType('usage')">Xuất</button>
                <button class="${txnState.typeFilter === 'return' ? 'active' : ''}" onclick="filterMobileTxnType('return')">Trả</button>
            </div>

            <div id="m-txn-list">
                ${renderRecentTxns(transactions)}
            </div>
        </div>
    `;
}

export function installMobileTransactions(options) {
    deps = options || {};

    window.changeTxnPage = function(page) {
        txnState.page = page;
        refreshTxnList(20);
    };

    window.changeTxnLimit = function(limit) {
        txnState.limit = parseInt(limit, 10) || 10;
        txnState.page = 1;
        refreshTxnList(20);
    };

    window.filterMobileTxns = function(value) {
        txnState.search = value || '';
        txnState.page = 1;
        refreshTxnList(20);
    };

    window.filterMobileTxnType = function(type) {
        txnState.typeFilter = type || 'all';
        txnState.page = 1;

        const root = document.getElementById('root');
        if (root && deps.renderMobileView) {
            root.innerHTML = deps.renderMobileView();
            setTimeout(bindRecentTxnClicks, 50);
        }
    };

    window.bindRecentTxnClicks = bindRecentTxnClicks;
}

export { bindRecentTxnClicks };
