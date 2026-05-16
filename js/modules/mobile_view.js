import { state, saveState, addLog, formatMoney, escapeHtml } from './state.js';
import { formatMoneyVND } from './utils.js';

// ========== DETECT MOBILE ==========
export function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth < 768;
}
// ========== CẤU HÌNH THAO TÁC NHANH MOBILE ==========
const mobileQuickActionDefaults = [
    { id: 'import', label: 'Nhập kho', icon: 'logo-nhapkho.png', action: 'showMobileImport()' },
    { id: 'export', label: 'Xuất kho', icon: 'logo-xuatkho.png', action: 'showMobileExport()' },
    { id: 'return', label: 'Trả hàng', icon: 'logo-trahang.png', action: 'showMobileReturn()' },
    { id: 'find', label: 'Tìm vật tư', icon: 'logo-timvattu.png', action: 'showMobileStock()' },
    { id: 'low', label: 'Cảnh báo', icon: 'logo-chuongthongbao.png', action: 'showMobileLowStock()' },
    { id: 'projects', label: 'Công trình', icon: 'logo-tongcongtrinh.png', action: 'showMobileProjects()' },
    { id: 'report', label: 'Báo cáo', icon: 'logo-baocao.png', action: 'showMobileDashboard()' },
    { id: 'stocktake', label: 'Kiểm kê kho', icon: 'logo-kiemkekho.png', action: 'showMobileStock()' },
    { id: 'barcode', label: 'Quét mã vạch', icon: 'logo-quetmavach.png', action: 'showMobileStock()' },
    { id: 'more', label: 'Xem thêm', icon: 'logo-xemthem.png', action: 'showMobileActions()' }
];

let mobileQuickActionVisible = JSON.parse(
    localStorage.getItem('steeltrack_mobile_quick_actions') ||
    JSON.stringify(['import', 'export', 'return', 'find', 'low', 'projects', 'report', 'more'])
);

// ========== BIẾN TRẠNG THÁI MOBILE ==========
let sidebarOpen = false;
let txnPage = 1;
let txnLimit = 10;
let txnSearch = '';
let txnTypeFilter = 'all';
let stockStatusFilter = 'all';
let mobileHomeTheme = localStorage.getItem('steeltrack_mobile_theme') || 'light';
// ========== FORMAT TIỀN / SỐ ==========
function formatCompactVND(value) {
    const n = Number(value || 0);
    const abs = Math.abs(n);

    if (abs >= 1000000000000) {
        return (n / 1000000000000).toLocaleString('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' nghìn tỷ';
    }

    if (abs >= 1000000000) {
        return (n / 1000000000).toLocaleString('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' tỷ';
    }

    if (abs >= 1000000) {
        return (n / 1000000).toLocaleString('vi-VN', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }) + ' triệu';
    }

    return formatMoneyVND(n);
}
// ========== BOTTOM TAB MOBILE ==========
function renderMobileTabBar(active = 'home') {
    return `
        <div class="m-bottom-safe"></div>
        <div class="m-bottom-tab">
            <button class="m-tab-btn ${active === 'home' ? 'active' : ''}" onclick="renderMobileViewOnly()">
                <img src="/images/mobile-icons/logo-trangchu.png" alt="">
                <small>Trang chủ</small>
            </button>

            <button class="m-tab-btn ${active === 'stock' ? 'active' : ''}" onclick="showMobileStock()">
                <img src="/images/mobile-icons/logo-vattu.png" alt="">
                <small>Kho</small>
            </button>

            <button class="m-tab-fab" onclick="showMobileActions()">+</button>

            <button class="m-tab-btn ${active === 'dashboard' ? 'active' : ''}" onclick="showMobileDashboard()">
                <img src="/images/mobile-icons/logo-baocao.png" alt="">
                <small>Thống kê</small>
            </button>

            <button class="m-tab-btn ${active === 'profile' ? 'active' : ''}" onclick="showMobileProfile()">
                <img src="/images/mobile-icons/logo-canhan.png" alt="">
                <small>Cá nhân</small>
            </button>
        </div>
    `;
}
// ========== MODAL CÁ NHÂN MOBILE ==========
window.showMobileProfile = function() {
    const currentUser = state.currentUser || {};

    const html = `
        <div class="m-modal ios-liquid" id="m-profile-modal">
            <div class="m-modal-hd">
                <button class="m-back" onclick="renderMobileViewOnly()">←</button>
                <span>👤 CÁ NHÂN</span>
                <div></div>
            </div>

            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;">
                <div class="m-profile-card">
                    <div class="m-avatar" style="width:64px;height:64px;font-size:28px;">
                        ${escapeHtml(currentUser.name?.charAt(0) || 'U')}
                    </div>
                    <h3>${escapeHtml(currentUser.name || 'User')}</h3>
                    <p>${currentUser.role === 'admin' ? 'Admin' : 'Nhân viên'}</p>
                </div>

                <button class="m-submit danger" onclick="logout()">Đăng xuất</button>
            </div>

            ${renderMobileTabBar('profile')}
        </div>
    `;

    document.getElementById('root').innerHTML = html;
    fixAllModalHeight();
};
// ========== ĐI TỚI CẤU KIỆN MOBILE ==========
window.showMobileStructures = function() {
    showMobileDashboard();
    setTimeout(function() {
        if (window.switchMDashTab) switchMDashTab('structures');
    }, 80);
};
// ========== MODAL NHÀ CUNG CẤP MOBILE ==========
window.showMobileSuppliers = function() {
    const suppliers = state.data.suppliers || [];

    let html = `
        <div class="m-modal ios-liquid" id="m-supplier-modal">
            <div class="m-modal-hd">
                <button class="m-back" onclick="renderMobileViewOnly()">←</button>
                <span>🏭 NHÀ CUNG CẤP (${suppliers.length})</span>
                <div></div>
            </div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;">
    `;

    if (!suppliers.length) {
        html += '<div class="m-empty">Chưa có nhà cung cấp</div>';
    } else {
        suppliers.forEach(function(s) {
            html += `
                <div class="m-stock-item">
                    <div class="m-stock-info">
                        <div class="m-stock-name">${escapeHtml(s.name)}</div>
                        <div class="m-stock-meta">${escapeHtml(s.phone || s.email || s.address || '')}</div>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>${renderMobileTabBar('home')}</div>`;
    document.getElementById('root').innerHTML = html;
    fixAllModalHeight();
};

// ========== FILE ĐÍNH KÈM MOBILE ==========
function parseAttachmentFiles(attachment) {
    if (!attachment || attachment === '[]' || attachment === 'null' || attachment === '') return [];

    try {
        const files = typeof attachment === 'string' ? JSON.parse(attachment) : attachment;
        return Array.isArray(files) ? files.filter(Boolean) : [];
    } catch (e) {
        return [];
    }
}

function getAttachmentFilePath(file) {
    return typeof file === 'string' ? file : file?.path;
}

function getAttachmentFileName(file) {
    const filePath = getAttachmentFilePath(file);
    return typeof file === 'string'
        ? String(filePath || '').split('/').pop()
        : (file?.name || String(filePath || '').split('/').pop() || 'file');
}

function getMobileFileAction(fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️ Xem ảnh';
    if (ext === 'pdf') return '📄 Mở PDF';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊 Mở Excel';
    if (['doc', 'docx'].includes(ext)) return '📝 Mở Word';

    return '📎 Mở file';
}
function isMobileImageFile(fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
}
function isMobilePdfFile(fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    return ext === 'pdf';
}

// ========== PREVIEW FILE MOBILE ==========
window.showMobilePdfPreview = function(filePath, fileName) {
    filePath = decodeURIComponent(filePath || '');
    fileName = decodeURIComponent(fileName || '');

    const html = `
        <div id="m-pdf-preview" class="m-doc-preview" onclick="this.remove()">
            <div class="m-doc-preview-head" onclick="event.stopPropagation()">
                <span>${escapeHtml(fileName || 'PDF đính kèm')}</span>
                <div>
                    <a href="${filePath}" target="_blank" onclick="event.stopPropagation()">Mở ngoài</a>
                    <button type="button" onclick="document.getElementById('m-pdf-preview')?.remove()">×</button>
                </div>
            </div>
            <iframe src="${filePath}" onclick="event.stopPropagation()"></iframe>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
};

window.showMobileImagePreview = function(filePath, fileName) {
    filePath = decodeURIComponent(filePath || '');
    fileName = decodeURIComponent(fileName || '');
    const html = `
        <div id="m-image-preview" class="m-image-preview" onclick="this.remove()">
            <div class="m-image-preview-head" onclick="event.stopPropagation()">
                <span>${escapeHtml(fileName || 'Ảnh đính kèm')}</span>
                <button type="button" onclick="document.getElementById('m-image-preview')?.remove()">×</button>
            </div>
            <img src="${filePath}" alt="${escapeHtml(fileName || 'Ảnh đính kèm')}" onclick="event.stopPropagation()">
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
};

window.showMobileAttachmentSheet = function(encodedAttachment) {
    let files = [];

    try {
        files = parseAttachmentFiles(decodeURIComponent(encodedAttachment));
    } catch (e) {}

    if (!files.length) return;

    const html = `
        <div id="m-file-sheet" class="m-action-sheet" style="display:flex;" onclick="this.remove()">
            <div class="m-action-panel" onclick="event.stopPropagation()">
                <div class="m-action-grabber"></div>
                ${files.map(function(file) {
                    const filePath = getAttachmentFilePath(file);
                    const fileName = getAttachmentFileName(file);
                    const action = getMobileFileAction(fileName);
                    const ext = String(fileName || '').split('.').pop().toLowerCase();
                    const shouldDownload = ['xls', 'xlsx', 'csv', 'doc', 'docx'].includes(ext);

if (isMobilePdfFile(fileName)) {
    return `
        <a href="javascript:void(0)"
           onclick="event.preventDefault();event.stopPropagation();window.showMobilePdfPreview('${encodeURIComponent(filePath)}', '${encodeURIComponent(fileName)}')"
           class="m-txn-file-item">
            <span>${action}</span>
            <small>${escapeHtml(fileName)}</small>
        </a>
    `;
}

if (isMobileImageFile(fileName)) {
    return `
        <a href="javascript:void(0)"
           onclick="event.preventDefault();event.stopPropagation();window.showMobileImagePreview('${encodeURIComponent(filePath)}', '${encodeURIComponent(fileName)}')"
           class="m-txn-file-item">
            <span>${action}</span>
            <small>${escapeHtml(fileName)}</small>
        </a>
    `;
}

return `
    <a href="${filePath}" target="_blank" ${shouldDownload ? 'download' : ''} class="m-txn-file-item">
        <span>${action}</span>
        <small>${escapeHtml(fileName)}</small>
    </a>
`;
                }).join('')}
                <button class="danger" onclick="document.getElementById('m-file-sheet')?.remove()">Đóng</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
};
// ========== CHI TIẾT GIAO DỊCH MOBILE ==========
window.showMobileTxnDetail = function(txnKey) {
    const t = window._mobileTxnDetailMap?.[txnKey]
        || (state.data.transactions || []).find(x => String(x.id) === String(txnKey));

    if (!t) {
        console.warn('Không tìm thấy giao dịch mobile:', txnKey, window._mobileTxnDetailMap);
        return;
    }

    const mat = (state.data.materials || []).find(m => m.id === t.mid);
    const supplier = (state.data.suppliers || []).find(s => s.id === t.supplierId);
    const project = (state.data.projects || []).find(p => p.id === t.projectId);
    const files = parseAttachmentFiles(t.attachment);

    const isImport = t.type === 'purchase';
    const isReturn = t.type === 'return';
    const typeText = isImport ? 'Nhập kho' : isReturn ? 'Trả hàng' : 'Xuất kho';
    const typeIcon = mobileTxnTypeIcon(t.type, typeText);
    const toneClass = isImport ? 'success' : isReturn ? 'info' : 'danger';

    const time = new Date(t.datetime || t.date).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const fileHtml = files.length
        ? files.map(function(file) {
            const filePath = getAttachmentFilePath(file);
            const fileName = getAttachmentFileName(file);
            const action = getMobileFileAction(fileName);
            const ext = String(fileName || '').split('.').pop().toLowerCase();
            const shouldDownload = ['xls', 'xlsx', 'csv', 'doc', 'docx'].includes(ext);
if (isMobilePdfFile(fileName)) {
    return `
        <a href="javascript:void(0)"
           onclick="event.preventDefault();event.stopPropagation();window.showMobilePdfPreview('${encodeURIComponent(filePath)}', '${encodeURIComponent(fileName)}')"
           class="m-txn-file-item">
            <span>${action}</span>
            <small>${escapeHtml(fileName)}</small>
        </a>
    `;
}
            if (isMobileImageFile(fileName)) {
    return `
        <a href="javascript:void(0)"
           onclick="event.preventDefault();event.stopPropagation();window.showMobileImagePreview('${encodeURIComponent(filePath)}', '${encodeURIComponent(fileName)}')"
           class="m-txn-file-item">
            <span>${action}</span>
            <small>${escapeHtml(fileName)}</small>
        </a>
    `;
}

return `
    <a href="${filePath}" target="_blank" ${shouldDownload ? 'download' : ''} class="m-txn-file-item">
        <span>${action}</span>
        <small>${escapeHtml(fileName)}</small>
    </a>
`;

        }).join('')
        : '<div class="m-txn-file-empty">Không có file đính kèm</div>';

    const detailRow = function(label, value, isTotal = false) {
        return `
            <div class="m-txn-detail-row ${isTotal ? 'total' : ''}">
                <span>${label}</span>
                <strong>${value}</strong>
            </div>
        `;
    };

    const html = `
        <div id="m-txn-detail-sheet" class="m-txn-detail-overlay" onclick="this.remove()">
            <div class="m-txn-detail-panel" onclick="event.stopPropagation()">
                <div class="m-action-grabber"></div>

                <div class="m-txn-detail-head">
                    <div class="m-txn-detail-title-wrap">
                        <div class="m-txn-detail-icon ${toneClass}">${typeIcon}</div>
                        <div>
                            <div class="m-txn-detail-type">${typeText}</div>
                            <div class="m-txn-detail-time">${time}</div>
                        </div>
                    </div>
                    <button type="button" class="m-txn-detail-close" onclick="document.getElementById('m-txn-detail-sheet')?.remove()">
                        <span>×</span>
                    </button>
                    </div>

                    <div class="m-txn-detail-card ${toneClass}">

                    ${detailRow('Vật tư', escapeHtml(mat?.name || 'N/A'))}
                    ${isImport ? detailRow('Nhà cung cấp', escapeHtml(supplier?.name || 'N/A')) : ''}
                    ${t.projectId ? detailRow('Công trình', escapeHtml(project?.name || 'N/A')) : ''}
                    ${detailRow('Số lượng', `${Number(t.qty || 0).toLocaleString('vi-VN')} ${mat?.unit || ''}`)}
                    ${detailRow('Đơn giá', formatMoneyVND(t.unitPrice || 0))}
                    ${t.vatRate !== undefined ? detailRow('VAT', `${t.vatRate || 0}%`) : ''}
                    ${detailRow('Thành tiền', formatMoneyVND(t.totalAmount || 0), true)}
                </div>

                <div class="m-txn-detail-note">${escapeHtml(t.note || 'Không có ghi chú')}</div>

                <div class="m-txn-file-title">File đính kèm</div>
                <div class="m-txn-file-list">${fileHtml}</div>
            </div>
        </div>
    `;

    (document.getElementById('root') || document.body).insertAdjacentHTML('beforeend', html);
};

// ========== ACTION SHEET MOBILE ==========
window.showMobileAttachmentSheetByTxn = function(txnId) {
    const attachment = window._mobileTxnAttachments?.[txnId];
    if (!attachment) return;
    window.showMobileAttachmentSheet(encodeURIComponent(attachment));
};
function renderMobileActionSheet() {
    return `
        <div id="m-action-sheet" class="m-action-sheet" style="display:none;" onclick="hideMobileActions()">
            <div class="m-action-panel" style="max-height:82vh;overflow-y:auto;width:100%;" onclick="event.stopPropagation()">
                <div class="m-action-grabber"></div>
                <button onclick="hideMobileActions();showMobileImport()">Nhập kho</button>
                <button onclick="hideMobileActions();showMobileExport()">Xuất kho</button>
                <button onclick="hideMobileActions();showMobileReturn()">Trả hàng</button>
                <button class="danger" onclick="hideMobileActions()">Đóng</button>
            </div>
        </div>
    `;
}
function setMobileSubmitLoading(isLoading, text = 'Đang lưu...') {
    const btn = document.querySelector('.m-submit');
    if (!btn) return;
    if (isLoading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = text;
        btn.disabled = true;
        btn.classList.add('loading');
    } else {
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        btn.disabled = false;
        btn.classList.remove('loading');
    }
}
// ========== DANH SÁCH GIAO DỊCH + PHÂN TRANG ==========
function renderRecentTxns(transactions, page, limit) {
    const materials = state.data.materials || [];
    const projects = state.data.projects || [];
const suppliers = state.data.suppliers || [];
const kw = String(txnSearch || '').trim().toLowerCase();

const txns = [...transactions].filter(t => {
    if (txnTypeFilter !== 'all' && t.type !== txnTypeFilter) return false;
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
    const totalPages = Math.ceil(totalItems / limit) || 1;
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    const start = (page - 1) * limit;
    const paginated = txns.slice(start, start + limit);
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
    const txnIcon = mobileTxnTypeIcon(t.type, isImport ? 'Nhập kho' : isReturn ? 'Trả hàng' : 'Xuất kho');
    const time = new Date(t.datetime || t.date).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'});
    const files = parseAttachmentFiles(t.attachment);
    if (!window._mobileTxnAttachments) window._mobileTxnAttachments = {};
    if (t.id && files.length) window._mobileTxnAttachments[t.id] = t.attachment;
    html += `
        <div class="m-txn-item" data-txn-id="${escapeHtml(txnKey)}">
            ${files.length ? `<span class="m-file-badge">${files.length}</span>` : ''}
            <div class="m-txn-icon ${txnTone}">${txnIcon}</div>
            <div class="m-txn-info">
                <div class="m-txn-name">${escapeHtml(mat?.name || 'N/A')}</div>
                <div class="m-txn-meta">${time} · ${isImport ? 'Nhập' : t.type === 'return' ? 'Trả' : 'Xuất'} · ${Number(t.qty||0).toLocaleString('vi-VN')} ${mat?.unit||''}</div>
            </div>
<div class="m-txn-amount ${txnTone}">
    ${isImport || isReturn ? '+' : '-'}${formatMoneyVND(t.totalAmount)}
</div>

        </div>
    `;
});
    // Phân trang
    html += '<div class="m-pagination">';
    html += `<select class="m-page-limit" onchange="changeTxnLimit(this.value)">`;
    html += `<option value="10" ${limit===10?'selected':''}>10</option>`;
    html += `<option value="20" ${limit===20?'selected':''}>20</option>`;
    html += `<option value="50" ${limit===50?'selected':''}>50</option>`;
    html += `</select>`;
    html += '<div class="m-page-btns">';
    html += `<button class="m-page-btn" onclick="changeTxnPage(${page-1})" ${page<=1?'disabled':''}>◀</button>`;
    html += `<span class="m-page-info">${page}/${totalPages} (${totalItems})</span>`;
    html += `<button class="m-page-btn" onclick="changeTxnPage(${page+1})" ${page>=totalPages?'disabled':''}>▶</button>`;
    html += '</div></div>';
    return html;
}
// ========== HOME MOBILE MẪU KHO VẬT TƯ ==========
window.toggleMobileHomeTheme = function() {
    mobileHomeTheme = mobileHomeTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('steeltrack_mobile_theme', mobileHomeTheme);
    renderMobileViewOnly();
};

function renderMobileHomeHero(currentUser) {
    return `
        <div class="m-wh-hero">
            <div class="m-wh-hero-top">
                <div class="m-wh-brand">
                    <img src="/images/logo-tv.png" alt="Logo">
                    <div>
                        <strong>Kho vật tư</strong>
                        <span>Nhà thép kết cấu</span>
                    </div>
                </div>
                <div class="m-wh-icons">
                    <button onclick="toggleMobileHomeTheme()">${mobileHomeTheme === 'light' ? '🌙' : '☀️'}</button>
                    <button onclick="showMobileMenu()">🔔</button>
                </div>
            </div>
        </div>
    `;
}
// ========== KPI HOME MOBILE ==========
function renderMobileHomeStats(materials, transactions, projects, lowStockCount) {
    const suppliers = state.data.suppliers || [];
    const structures = state.data.structures || [];

    return `
        <div class="m-wh-panel">
            <div class="m-wh-search-row">
                <input type="text" class="m-wh-search" placeholder="Tìm kiếm vật tư, mã, quy cách..." onclick="showMobileStock()">
                <button onclick="showMobileStock()">☷</button>
            </div>
    <div class="m-wh-stats compact">
    <div class="m-wh-stat blue" onclick="showMobileStock()">
        ${mobileIcon('logo-tongvattu.png', 'Vật tư')}
        <strong>${materials.length}</strong>
        <small>Vật tư</small>
    </div>

    <div class="m-wh-stat green" onclick="showMobileSuppliers()">
        ${mobileIcon('logo-tongnhacungcap.png', 'Nhà cung cấp')}
        <strong>${suppliers.length}</strong>
        <small>Nhà cung cấp</small>
    </div>

    <div class="m-wh-stat orange" onclick="showMobileStructures()">
        ${mobileIcon('logo-tongcaukien.png', 'Cấu kiện')}
        <strong>${structures.length}</strong>
        <small>Cấu kiện</small>
    </div>

    <div class="m-wh-stat purple" onclick="showMobileProjects()">
        ${mobileIcon('logo-tongcongtrinh.png', 'Công trình')}
        <strong>${projects.length}</strong>
        <small>Công trình</small>
    </div>
</div>

        </div>
    `;
}

// ========== ICON MOBILE ==========
function mobileIcon(name, alt = '') {
    return `<img class="m-wh-icon-img" src="/images/mobile-icons/${name}" alt="${escapeHtml(alt)}">`;
}
function mobileTxnTypeIcon(type, alt = '') {
    const iconMap = {
        purchase: 'logo-nhapkho.png',
        usage: 'logo-xuatkho.png',
        return: 'logo-trahang.png'
    };

    const icon = iconMap[type] || 'logo-vattu.png';
    return `<img class="m-txn-icon-img" src="/images/mobile-icons/${icon}" alt="${escapeHtml(alt)}">`;
}

// ========== THAO TÁC NHANH MOBILE ==========
function renderMobileQuickActions() {
    const visibleActions = mobileQuickActionDefaults.filter(item => {
        return mobileQuickActionVisible.includes(item.id);
    });

    return `
        <div class="m-wh-section">
            <div class="m-wh-section-head">
                <strong>Thao tác nhanh</strong>
                <button type="button" class="m-wh-customize-btn" onclick="event.stopPropagation();showMobileQuickActionCustomize()">Tùy chỉnh ✎</button>
            </div>
            <div class="m-wh-actions">
                ${visibleActions.map(item => `
                    <button onclick="${item.action}">
                        ${mobileIcon(item.icon, item.label)}
                        ${escapeHtml(item.label)}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// ========== ẢNH ĐẠI DIỆN NHÓM VẬT TƯ ==========
function slugifyVietnamese(text) {
    return String(text || 'khac')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'khac';
}

function getMaterialThumb(material, categoryName) {
    const img = material?.image || material?.photo || material?.thumbnail || material?.avatar;

    if (img) return img;

    return `/images/material-groups/${slugifyVietnamese(categoryName)}.png`;
}

// ========== NHÓM VẬT TƯ TRANG CHỦ ==========
function renderMobileCategoryStock(materials) {
    const groups = new Map();

    materials.forEach(m => {
        const key = m.cat || 'Khác';
        if (!groups.has(key)) {
            groups.set(key, {
                name: key,
                count: 0,
                qty: 0,
                value: 0,
                units: new Set(),
                sample: null
            });
        }

        const g = groups.get(key);
        const qty = Number(m.qty || 0);
        g.count += 1;
        g.qty += qty;
        g.value += qty * Number(m.cost || 0);
        if (m.unit) g.units.add(m.unit);
        if (!g.sample) g.sample = m;
    });

    const list = Array.from(groups.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    if (!list.length) return '';

    const maxValue = Math.max(...list.map(g => g.value), 1);

    return `
        <div class="m-wh-section">
            <div class="m-wh-section-head">
                <strong>Tồn kho theo nhóm vật tư</strong>
                <span onclick="showMobileStock()">Xem tất cả ›</span>
            </div>

            <div class="m-wh-group-list">
                ${list.map(g => {
                    const unitText = g.units.size === 1
                        ? `${Number(g.qty).toLocaleString('vi-VN')} ${Array.from(g.units)[0]}`
                        : formatCompactVND(g.value);

                    return `
                        <div class="m-wh-group-item" onclick="showMobileStockByCategory('${encodeURIComponent(g.name)}')">
                            <div class="m-wh-group-img">
                                <img src="${getMaterialThumb(g.sample, g.name)}" alt="${escapeHtml(g.name)}" onerror="this.style.display='none';this.parentElement.classList.add('fallback')">
                            </div>
                            <div class="m-wh-group-info">
                                <strong>${escapeHtml(g.name)}</strong>
                                <small>${g.count} chủng loại</small>
                                <div><span style="width:${Math.max(8, g.value / maxValue * 100)}%"></span></div>
                            </div>
                            <div class="m-wh-group-value">
                                <strong>${unitText}</strong>
                                <small>${formatCompactVND(g.value)}</small>
                            </div>
                            <em>›</em>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// ========== RENDER CHÍNH ==========
export function renderMobileView() {
    const materials = state.data.materials || [];
    const suppliers = state.data.suppliers || [];
    const projects = state.data.projects || [];
    const transactions = state.data.transactions || [];
    const lowStockCount = materials.filter(m => m.qty <= m.low).length;
    const currentUser = state.currentUser || {};
    return `
<div class="mobile-app ios-liquid m-wh-theme-${mobileHomeTheme}" id="mobile-app-container">            <!-- SIDEBAR TRƯỢT TRÁI -->
            <div class="m-sidebar-overlay ${sidebarOpen ? 'show' : ''}" onclick="toggleMSidebar()"></div>
            <div class="m-sidebar ${sidebarOpen ? 'open' : ''}">
                <div class="m-sidebar-header">
                    <img src="/images/logo-tv.png" style="height:24px;">
                    <span>TRÍ VIỆT STEEL</span>
                </div>
                <div class="m-sidebar-user">
                    <div class="m-avatar">${escapeHtml(currentUser.name?.charAt(0) || 'U')}</div>
                    <div>
                        <div class="m-uname">${escapeHtml(currentUser.name || 'User')}</div>
                        <div class="m-urole">${currentUser.role === 'admin' ? 'Admin' : 'Nhân viên'}</div>
                    </div>
                </div>
                <div class="m-sidebar-nav">
                    <div class="m-nav-item active" onclick="toggleMSidebar()">
                        <span>🏠</span><span>Trang chủ</span>
                    </div>
		    <div class="m-nav-item" onclick="toggleMSidebar();showMobileDashboard()">
                        <span>📊</span><span>Thống kê</span>
                    </div>
                    <div class="m-nav-item" onclick="toggleMSidebar();showMobileStock()">
                        <span>📦</span><span>Quản lý kho</span>
                    </div>
                    <div class="m-nav-item" onclick="toggleMSidebar();showMobileProjects()">
                        <span>🏗️</span><span>Công trình</span>
                    </div>
                    <div class="m-nav-item" onclick="toggleMSidebar();showMobileLowStock()">
                        <span>⚠️</span><span>Sắp hết hàng</span>
                    </div>
                </div>
                <div class="m-sidebar-footer">
                    <div class="m-nav-item" onclick="logout()">
                        <span>🚪</span><span>Đăng xuất</span>
                    </div>
                </div>
            </div>
            
            <!-- HEADER -->
            
            
            <!-- 6 NÚT CHÍNH -->
            

${renderMobileHomeHero(currentUser)}
${renderMobileHomeStats(materials, transactions, projects, lowStockCount)}
${renderMobileQuickActions()}
${renderMobileCategoryStock(materials)}


<div class="m-section">
    <div class="m-section-title">📋 GIAO DỊCH GẦN ĐÂY</div>

    <input type="text" class="m-search" placeholder="🔍 Tìm giao dịch..." value="${escapeHtml(txnSearch)}" oninput="filterMobileTxns(this.value)" style="margin-bottom:10px;">

    <div class="m-txn-filter">
        <button class="${txnTypeFilter === 'all' ? 'active' : ''}" onclick="filterMobileTxnType('all')">Tất cả</button>
        <button class="${txnTypeFilter === 'purchase' ? 'active' : ''}" onclick="filterMobileTxnType('purchase')">Nhập</button>
        <button class="${txnTypeFilter === 'usage' ? 'active' : ''}" onclick="filterMobileTxnType('usage')">Xuất</button>
        <button class="${txnTypeFilter === 'return' ? 'active' : ''}" onclick="filterMobileTxnType('return')">Trả</button>
    </div>

    <div id="m-txn-list">
        ${renderRecentTxns(transactions, txnPage, txnLimit)}
    </div>
</div>

            <!-- MENU POPUP -->
            <div id="m-menu" class="m-menu" style="display:none;" onclick="event.stopPropagation()">
                <div class="m-menu-item" onclick="logout()">🚪 Đăng xuất</div>
            </div>
            ${renderMobileActionSheet()}
            ${renderMobileTabBar('home')}
            <div id="modal-area"></div>
        </div>
    `;
}
// ========== TÙY CHỈNH THAO TÁC NHANH ==========
window.showMobileQuickActionCustomize = function() {
    const visible = new Set(mobileQuickActionVisible);

    document.getElementById('m-quick-customize')?.remove();

    const html = `
        <div id="m-quick-customize" class="m-action-sheet" style="display:flex;" onclick="this.remove()">
            <div class="m-action-panel m-quick-customize-panel" onclick="event.stopPropagation()">
                <div class="m-action-grabber"></div>
                <h3>Tùy chỉnh thao tác nhanh</h3>

                <div class="m-quick-customize-tools">
                    <button type="button" onclick="selectAllMobileQuickActions()">Hiện tất cả</button>
                    <button type="button" onclick="resetMobileQuickActions()">Mặc định</button>
                </div>

                <div class="m-quick-customize-list">
                    ${mobileQuickActionDefaults.map(item => `
                        <label class="m-quick-customize-item">
                            <span>
                                ${mobileIcon(item.icon, item.label)}
                                ${escapeHtml(item.label)}
                            </span>
                            <input type="checkbox"
                                data-action-id="${item.id}"
                                ${visible.has(item.id) ? 'checked' : ''}>
                        </label>
                    `).join('')}
                </div>

                <button type="button" onclick="saveMobileQuickActions()">Lưu tùy chỉnh</button>
                <button type="button" class="danger" onclick="document.getElementById('m-quick-customize')?.remove()">Đóng</button>
            </div>
        </div>
    `;

    const target = document.getElementById('mobile-app-container')
        || document.getElementById('root')
        || document.body;

    target.insertAdjacentHTML('beforeend', html);
};

window.selectAllMobileQuickActions = function() {
    document.querySelectorAll('#m-quick-customize input[type="checkbox"]').forEach(input => {
        input.checked = true;
    });
};

window.resetMobileQuickActions = function() {
    const defaults = new Set(['import', 'export', 'return', 'find', 'low', 'projects', 'report', 'more']);

    document.querySelectorAll('#m-quick-customize input[type="checkbox"]').forEach(input => {
        input.checked = defaults.has(input.dataset.actionId);
    });
};

window.saveMobileQuickActions = function() {
    const checked = Array.from(document.querySelectorAll('#m-quick-customize input[type="checkbox"]:checked'))
        .map(input => input.dataset.actionId)
        .filter(Boolean);

    if (!checked.length) {
        alert('Vui lòng chọn ít nhất 1 thao tác.');
        return;
    }

    mobileQuickActionVisible = checked;
    localStorage.setItem('steeltrack_mobile_quick_actions', JSON.stringify(mobileQuickActionVisible));

    document.getElementById('m-quick-customize')?.remove();
    renderMobileViewOnly();
};



// ========== SIDEBAR MOBILE ==========
window.toggleMSidebar = function() {
    sidebarOpen = !sidebarOpen;
    const overlay = document.querySelector('.m-sidebar-overlay');
    const sidebar = document.querySelector('.m-sidebar');
    if (overlay) overlay.classList.toggle('show', sidebarOpen);
    if (sidebar) sidebar.classList.toggle('open', sidebarOpen);
};

window.showMobileActions = function() {
    const sheet = document.getElementById('m-action-sheet');
    if (sheet) sheet.style.display = 'flex';
};

window.hideMobileActions = function() {
    const sheet = document.getElementById('m-action-sheet');
    if (sheet) sheet.style.display = 'none';
};

// ========== MODAL NHẬP KHO ==========
window.showMobileImport = function(defaultMaterialId = null) {
    const materials = state.data.materials || [];
    const suppliers = state.data.suppliers || [];
    
    if (materials.length === 0) { alert('Chưa có vật tư!'); return; }
    if (suppliers.length === 0) { alert('Chưa có nhà cung cấp!'); return; }
    
    const now = new Date();
    const dt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const html = `
        <div class="m-modal ios-liquid" id="m-import-modal">
            <div class="m-modal-hd">
                <button class="m-back" onclick="cancelMobileForm('purchase')">←</button>
                <span>📥 NHẬP KHO</span>
                <div></div>
            </div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;">
                <div class="m-field">
                    <label>📅 Thời gian</label>
                    <input type="datetime-local" id="mi-datetime" value="${dt}">
                </div>
                <div class="m-field">
                    <label>🏭 Nhà cung cấp</label>
                    <select id="mi-supplier">${suppliers.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select>
                </div>
                <div class="m-field">
                    <label>📦 Vật tư</label>
<select id="mi-material" onchange="updateMPrice()">
    ${materials.map(m => `
        <option value="${m.id}"
            data-cost="${m.cost}"
            data-unit="${m.unit}"
            ${String(m.id) === String(defaultMaterialId) ? 'selected' : ''}>
            ${escapeHtml(m.name)} (${Number(m.qty).toLocaleString('vi-VN')} ${m.unit})
        </option>
    `).join('')}
</select>
                </div>
                <div class="m-field">
                    <label>🔢 Số lượng</label>
                    <div class="m-qty-box">
                        <button class="m-qty-btn" onclick="changeMQty(-1)">−</button>
                        <input type="text" id="mi-qty" value="1" dir="ltr" class="m-qty-input" oninput="updateMobileTotal()">
                        <button class="m-qty-btn" onclick="changeMQty(1)">+</button>
                    </div>
                    <div class="m-qty-presets">
                        <span onclick="setMQty(1)">1</span>
                        <span onclick="setMQty(5)">5</span>
                        <span onclick="setMQty(10)">10</span>
                        <span onclick="setMQty(100)">100</span>
                    </div>
                </div>
                <div class="m-field">
                    <label>💰 Đơn giá (VNĐ)</label>
                    <input type="text" id="mi-price" value="0" dir="ltr" oninput="updateMobileTotal()">
                </div>
                <div class="m-field">
                    <label>🧾 VAT (%)</label>
                    <input type="text" id="mi-vat" value="10" dir="ltr" oninput="updateMobileTotal()">
                </div>
                <div class="m-field">
                    <label>📝 Ghi chú</label>
                    <input type="text" id="mi-note" placeholder="Mã hóa đơn, số chứng từ...">
                </div>
                <div class="m-field">
                    <label>📎 File đính kèm</label>
                    <input type="file" id="mi-files" multiple accept="image/*,.pdf,.xlsx,.csv,.doc,.docx" onchange="handleMobileFiles(this,'purchase')" style="padding:10px;">
                    <div id="mi-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div>
                </div>
                <div class="m-summary">
                    <div>💰 Tiền hàng: <strong id="mi-subtotal">0 ₫</strong></div>
                    <div>🧾 VAT (<span id="mi-vat-rate">10</span>%): <strong id="mi-vat-amount">0 ₫</strong></div>
                    <div style="font-size:16px;margin-top:4px;">💵 TỔNG: <strong id="mi-total" style="color:#16a34a;">0 ₫</strong></div>
                </div>
                <button class="m-submit" onclick="doMobileImport()">✅ XÁC NHẬN NHẬP KHO</button>
            </div>
        </div>
    `;
    document.getElementById('root').innerHTML = html;
    fixAllModalHeight();
    setTimeout(() => {
    const sel = document.getElementById('mi-material');
    if (sel) {
        const opt = sel.options[sel.selectedIndex];
        document.getElementById('mi-price').value = Number(opt?.dataset?.cost || 0).toLocaleString('vi-VN');
    }
    bindMobileNumberInput('mi-qty', updateMobileTotal);
    bindMobileNumberInput('mi-price', updateMobileTotal);
    bindMobileNumberInput('mi-vat', updateMobileTotal);
    updateMobileTotal();
}, 100);

};
// ========== MODAL XUẤT KHO ==========
window.showMobileExport = function(defaultProjectId = null, defaultMaterialId = null) {
    const materials = state.data.materials || [];
    const projects = state.data.projects || [];
    
    if (materials.length === 0) { alert('Chưa có vật tư!'); return; }
    if (projects.length === 0) { alert('Chưa có công trình!'); return; }
    
    const now = new Date();
    const dt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const html = `
        <div class="m-modal ios-liquid" id="m-export-modal">
            <div class="m-modal-hd">
                <button class="m-back" onclick="cancelMobileForm('usage')">←</button>
                <span>📤 XUẤT KHO</span>
                <div></div>
            </div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;">
                <div class="m-field">
                    <label>📅 Thời gian</label>
                    <input type="datetime-local" id="me-datetime" value="${dt}">
                </div>
                <div class="m-field">
    <label>🏗️ Công trình</label>
    <select id="me-project">
        ${projects.map(p => `
            <option value="${p.id}" ${String(p.id) === String(defaultProjectId) ? 'selected' : ''}>
                ${escapeHtml(p.name)}
            </option>
        `).join('')}
    </select>
</div>

<div class="m-field">
    <label>📦 Vật tư</label>
    <select id="me-material">
        ${materials.map(m => `
            <option value="${m.id}"
                data-cost="${m.cost}"
                data-unit="${m.unit}"
                data-qty="${m.qty}"
                ${String(m.id) === String(defaultMaterialId) ? 'selected' : ''}>
                ${escapeHtml(m.name)} (Còn: ${Number(m.qty).toLocaleString('vi-VN')} ${m.unit})
            </option>
        `).join('')}
    </select>
</div>

                <div class="m-field">
                    <label>🔢 Số lượng</label>
                    <div class="m-qty-box">
                        <button class="m-qty-btn" onclick="changeMQty(-1)">−</button>
                        <input type="text" id="me-qty" value="1" dir="ltr" class="m-qty-input">
                        <button class="m-qty-btn" onclick="changeMQty(1)">+</button>
                    </div>
                </div>
                <div class="m-field">
                    <label>📝 Ghi chú</label>
                    <input type="text" id="me-note" placeholder="Vị trí sử dụng...">
                </div>
                <div class="m-field">
                    <label>📎 File đính kèm</label>
                    <input type="file" id="me-files" multiple accept="image/*,.pdf,.xlsx,.csv,.doc,.docx" onchange="handleMobileFiles(this,'usage')" style="padding:10px;">
                    <div id="me-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div>
                </div>
                <button class="m-submit" style="background:#dc2626;" onclick="doMobileExport()">✅ XÁC NHẬN XUẤT KHO</button>
            </div>
        </div>
    `;
    document.getElementById('root').innerHTML = html;
        fixAllModalHeight();
        setTimeout(() => {
        bindMobileNumberInput('me-qty');
    }, 100);
};
// ========== MODAL TỒN KHO ==========
window.showMobileStock = function() {
    const materials = state.data.materials || [];
    
    let html = `
        <div class="m-modal ios-liquid" id="m-stock-modal">
            <div class="m-modal-hd">
                <button class="m-back" onclick="renderMobileViewOnly()">←</button>
                <span>📦 TỒN KHO (${materials.length})</span>
                <div></div>
            </div>
            <div class="m-modal-bd" style="padding:12px;">
                <input type="text" id="ms-search" class="m-search" placeholder="🔍 Tìm vật tư..." oninput="filterMStock()">
            </div>
            <div class="m-stock-filter">
    <button class="${stockStatusFilter === 'all' ? 'active' : ''}" onclick="filterMobileStockStatus('all')">Tất cả</button>
    <button class="${stockStatusFilter === 'low' ? 'active' : ''}" onclick="filterMobileStockStatus('low')">Sắp hết</button>
    <button class="${stockStatusFilter === 'ok' ? 'active' : ''}" onclick="filterMobileStockStatus('ok')">Còn hàng</button>
</div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;" id="ms-list">
    `;
    
    materials.forEach(m => {
        const low = m.qty <= m.low;
        html += `
<div class="m-stock-item"
    data-name="${escapeHtml(m.name).toLowerCase()}"
    data-cat="${escapeHtml(m.cat || '').toLowerCase()}"
    data-status="${low ? 'low' : 'ok'}"
    onclick="window.showMobileMaterialDetail('${m.id}')">

                <div class="m-stock-info">
                    <div class="m-stock-name">${low ? '⚠️ ' : ''}${escapeHtml(m.name)}</div>
                    <div class="m-stock-meta">${m.cat || ''} · ${formatMoneyVND(m.cost)}/${m.unit}</div>
                </div>
                <div class="m-stock-qty ${low ? 'm-text-red' : ''}">
                    <div class="m-stock-qty-val">${Number(m.qty).toLocaleString('vi-VN')}</div>
                    <div class="m-stock-qty-unit">${m.unit}</div>
                </div>
            </div>
        `;
    });
    
    html += `</div>${renderMobileActionSheet()}${renderMobileTabBar('stock')}</div>`;
    document.getElementById('root').innerHTML = html;
    fixAllModalHeight();
};

// ========== MODAL SẮP HẾT ==========
window.showMobileLowStock = function() {
    const materials = state.data.materials.filter(m => m.qty <= m.low);
    
    let html = `
    <div class="m-modal ios-liquid" id="m-low-modal">
        <div class="m-modal-hd">
            <button class="m-back" onclick="renderMobileViewOnly()">←</button>
            <span>⚠️ SẮP HẾT HÀNG (${materials.length})</span>
            <div></div>
        </div>
        <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;">
`;

    
    if (materials.length === 0) {
        html += '<div class="m-empty">✅ Tất cả đều ổn, không có hàng sắp hết!</div>';
    } else {
        materials.forEach(m => {
            html += `
                <div class="m-stock-item" onclick="window.showMobileMaterialDetail('${m.id}')">
                    <div class="m-stock-info">
                        <div class="m-stock-name">⚠️ ${escapeHtml(m.name)}</div>
                        <div class="m-stock-meta">Cần nhập thêm ${Number(m.low - m.qty).toLocaleString('vi-VN')} ${m.unit}</div>
                    </div>
                    <div class="m-stock-qty m-text-red">
                        <div class="m-stock-qty-val">${Number(m.qty).toLocaleString('vi-VN')}</div>
                        <div class="m-stock-qty-unit">${m.unit}</div>
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div>${renderMobileActionSheet()}${renderMobileTabBar('stock')}</div>`;
    document.getElementById('root').innerHTML = html;
    fixAllModalHeight();
};
// ========== MODAL CÔNG TRÌNH ==========
window.showMobileProjects = function() {
    const projects = state.data.projects || [];

    let html = `
        <div class="m-modal ios-liquid" id="m-project-modal">
            <div class="m-modal-hd">
                <button class="m-back" onclick="renderMobileViewOnly()">←</button>
                <span>🏗️ CÔNG TRÌNH (${projects.length})</span>
                <div></div>
            </div>

            <div class="m-modal-bd" style="padding:12px;">
                <input type="text" id="mp-search" class="m-search" placeholder="🔍 Tìm công trình..." oninput="filterMobileProjects()">
            </div>

            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;" id="mp-list">
    `;   
    if (projects.length === 0) {
        html += '<div class="m-empty">📭 Chưa có công trình</div>';
    } else {
        projects.forEach(p => {
            const budget = Number(p.budget || p.totalBudget || p.amount || 0);
const spent = state.data.transactions
    .filter(t => t.projectId === p.id && t.type === 'usage')
    .reduce((s,t) => s + (Number(t.totalAmount)||0), 0);
const ret = state.data.transactions
    .filter(t => t.projectId === p.id && t.type === 'return')
    .reduce((s,t) => s + (Number(t.totalAmount)||0), 0);

const net = spent - ret;
const rawPct = budget > 0 ? (net / budget) * 100 : 0;
const pct = Math.min(100, Math.max(0, rawPct));
const pctText = budget > 0 ? rawPct.toFixed(1) : '0.0';
const barColor = rawPct > 100
    ? '#dc2626'
    : rawPct > 90
        ? '#ef4444'
        : rawPct > 70
            ? '#f59e0b'
            : '#378ADD';

            html += `
<div class="m-project-item" data-name="${escapeHtml(p.name).toLowerCase()}" onclick="window.showMobileProjectDetail('${p.id}')">
                    <div class="m-project-info">
                        <div class="m-project-name">${escapeHtml(p.name)}</div>
                        <div class="m-project-meta">💰 Đã chi: ${formatMoneyVND(net)} / ${budget > 0 ? formatMoneyVND(budget) : 'Chưa đặt NS'}</div>
<div class="m-project-bar">
    <div class="m-project-fill" style="width:${pct}%;background:${barColor};"></div>
</div>

                    </div>
                    <div class="m-project-pct">${pctText}%</div>


                </div>
            `;
        });
    }
    
    html += `</div>${renderMobileActionSheet()}${renderMobileTabBar('projects')}</div>`;
    document.getElementById('root').innerHTML = html;
    fixAllModalHeight();
};
// ========== CHI TIẾT VẬT TƯ ==========
window.showMobileMaterialDetail = function(materialId) {
    const material = (state.data.materials || []).find(m => String(m.id) === String(materialId));
    if (!material) {
        alert('Không tìm thấy vật tư!');
        return;
    }

    const txns = (state.data.transactions || [])
        .filter(t => String(t.mid) === String(materialId))
        .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));

    const totalImport = txns.filter(t => t.type === 'purchase').reduce((s, t) => s + Number(t.qty || 0), 0);
    const totalUsage = txns.filter(t => t.type === 'usage').reduce((s, t) => s + Number(t.qty || 0), 0);
    const totalReturn = txns.filter(t => t.type === 'return').reduce((s, t) => s + Number(t.qty || 0), 0);

    const qty = Number(material.qty || 0);
    const low = Number(material.low || 0);
    const isLow = qty <= low;
    const stockValue = qty * Number(material.cost || 0);

    const txnRows = txns.slice(0, 25).map(t => {
        const project = (state.data.projects || []).find(p => p.id === t.projectId);
        const supplier = (state.data.suppliers || []).find(s => s.id === t.supplierId);
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

                <div class="m-txn-icon ${isImport ? 'success' : isReturn ? 'info' : 'danger'}">${mobileTxnTypeIcon(t.type, isImport ? 'Nhập kho' : isReturn ? 'Trả hàng' : 'Xuất kho')}</div>
                <div>
                    <strong>${isImport ? 'Nhập kho' : isReturn ? 'Trả hàng' : 'Xuất kho'}</strong>
                    <small>${time} · ${escapeHtml(place || 'N/A')} · ${Number(t.qty || 0).toLocaleString('vi-VN')} ${material.unit || ''}</small>
                </div>
                <span class="${isImport || isReturn ? 'success' : 'danger'}">${isImport || isReturn ? '+' : '-'}${formatMoneyVND(t.totalAmount || 0)}</span>
            </div>
        `;
    }).join('') || '<div class="m-empty">Chưa có giao dịch</div>';

    const html = `
        <div class="m-modal ios-liquid" id="m-material-detail-modal">
            <div class="m-modal-hd">
                <button class="m-back" onclick="showMobileStock()">←</button>
                <span>📦 ${escapeHtml(material.name)}</span>
                <div></div>
            </div>

            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px;">
                <div class="m-material-hero ${isLow ? 'danger' : 'safe'}">

                    <div>
                        <small>${escapeHtml(material.cat || 'Vật tư')}</small>
                        <strong>${Number(qty).toLocaleString('vi-VN')} ${material.unit || ''}</strong>
                        <span>Ngưỡng cảnh báo: ${Number(low).toLocaleString('vi-VN')} ${material.unit || ''}</span>
                    </div>
                    <div class="m-material-status">${isLow ? 'Sắp hết' : 'Ổn'}</div>

                </div>

                <div class="m-material-kpis">

                    <div class="usage">
                        <small>Đã xuất</small>
                        <strong>${Number(totalUsage).toLocaleString('vi-VN')} ${material.unit || ''}</strong>
                    </div>
                    <div class="return">
                        <small>Đã trả</small>
                        <strong>${Number(totalReturn).toLocaleString('vi-VN')} ${material.unit || ''}</strong>
                    </div>
                    <div class="net">
                        <small>Giá trị tồn</small>
                        <strong>${formatMoneyVND(stockValue)}</strong>
                    </div>
                </div>

                <div class="m-project-detail-actions">
                    <button onclick="showMobileImport('${material.id}')">📥 Nhập thêm</button>
                    <button onclick="showMobileExport(null, '${material.id}')">📤 Xuất kho</button>
                </div>

                <div class="m-section-title">🧾 GIAO DỊCH VẬT TƯ</div>
                <div class="m-project-detail-list">${txnRows}</div>
            </div>

            ${renderMobileActionSheet()}
            ${renderMobileTabBar('stock')}
        </div>
    `;

    document.getElementById('root').innerHTML = html;
    fixAllModalHeight();
};

// ========== CHI TIẾT CÔNG TRÌNH ==========
window.showMobileProjectDetail = function(projectId) {
    const project = (state.data.projects || []).find(p => String(p.id) === String(projectId));
    if (!project) {
        alert('Không tìm thấy công trình!');
        return;
    }

    const materials = state.data.materials || [];
    const txns = (state.data.transactions || [])
        .filter(t => String(t.projectId) === String(projectId))
        .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));

    const usageTxns = txns.filter(t => t.type === 'usage');
    const returnTxns = txns.filter(t => t.type === 'return');

    const totalUsage = usageTxns.reduce((s, t) => s + Number(t.totalAmount || 0), 0);
    const totalReturn = returnTxns.reduce((s, t) => s + Number(t.totalAmount || 0), 0);
    const net = totalUsage - totalReturn;
const budget = Number(project.budget || project.totalBudget || project.amount || 0);
    const rawPct = budget > 0 ? (net / budget) * 100 : 0;
const pct = Math.min(100, Math.max(0, rawPct));
const pctText = budget > 0 ? rawPct.toFixed(1) : '0.0';
const barColor = rawPct > 100
    ? '#dc2626'
    : rawPct > 90
        ? '#ef4444'
        : rawPct > 70
            ? '#f59e0b'
            : '#378ADD';

const budgetTone = pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : 'safe';

    const materialMap = new Map();

    usageTxns.forEach(t => {
        const mat = materials.find(m => m.id === t.mid);
        if (!materialMap.has(t.mid)) {
            materialMap.set(t.mid, {
                name: mat?.name || 'N/A',
                unit: mat?.unit || '',
                used: 0,
                returned: 0,
                amount: 0
            });
        }

        const item = materialMap.get(t.mid);
        item.used += Number(t.qty || 0);
        item.amount += Number(t.totalAmount || 0);
    });

    returnTxns.forEach(t => {
        if (materialMap.has(t.mid)) {
            const item = materialMap.get(t.mid);
            item.returned += Number(t.qty || 0);
            item.amount -= Number(t.totalAmount || 0);
        }
    });

    const materialRows = Array.from(materialMap.values()).map(item => {
        const remain = item.used - item.returned;

        return `
            <div class="m-project-detail-material">
                <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    <small>Đã xuất: ${Number(item.used).toLocaleString('vi-VN')} ${item.unit} · Đã trả: ${Number(item.returned).toLocaleString('vi-VN')} ${item.unit}</small>
                </div>
                <div>
                    <span>${Number(remain).toLocaleString('vi-VN')} ${item.unit}</span>
                    <em>${formatMoneyVND(item.amount)}</em>
                </div>
            </div>
        `;
    }).join('') || '<div class="m-empty">Chưa có vật tư xuất cho công trình này</div>';

    const txnRows = txns.slice(0, 30).map(t => {
        const mat = materials.find(m => m.id === t.mid);
        const isReturn = t.type === 'return';
        const time = new Date(t.datetime || t.date).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });

        return `
            <div class="m-project-detail-txn">
                <div class="m-txn-icon ${isReturn ? 'info' : 'danger'}">${mobileTxnTypeIcon(t.type, isReturn ? 'Trả hàng' : 'Xuất kho')}</div>
                <div>
                    <strong>${escapeHtml(mat?.name || 'N/A')}</strong>
                    <small>${time} · ${isReturn ? 'Trả' : 'Xuất'} · ${Number(t.qty || 0).toLocaleString('vi-VN')} ${mat?.unit || ''}</small>
                </div>
                <span class="${isReturn ? 'success' : 'danger'}">${isReturn ? '+' : '-'}${formatMoneyVND(t.totalAmount || 0)}</span>
            </div>
        `;
    }).join('') || '<div class="m-empty">Chưa có giao dịch</div>';

    const html = `
        <div class="m-modal ios-liquid" id="m-project-detail-modal">
            <div class="m-modal-hd">
                <button class="m-back" onclick="showMobileProjects()">←</button>
                <span>🏗️ ${escapeHtml(project.name)}</span>
                <div></div>
            </div>

            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px;">
                <div class="m-project-detail-hero ${budgetTone}">
                    <div>
                        <small>Chi phí ròng</small>
                        <strong>${formatMoneyVND(net)}</strong>
                        <span>Ngân sách: ${formatMoneyVND(budget)}</span>
                    </div>
<div class="m-project-detail-pct">${pctText}%</div>
                </div>

                <div class="m-project-detail-bar ${budgetTone}">
                    <div style="width:${pct}%;"></div>
                </div>
                <div class="m-project-detail-kpis">
    <div class="usage">
        <small>Đã xuất</small>
        <strong>${formatMoneyVND(totalUsage)}</strong>
    </div>
    <div class="return">
        <small>Đã trả</small>
        <strong>${formatMoneyVND(totalReturn)}</strong>
    </div>
    <div class="net">
        <small>Còn lại NS</small>
        <strong>${formatMoneyVND(budget - net)}</strong>
    </div>
</div>


                <div class="m-project-detail-actions">
<button onclick="showMobileExport('${project.id}')">📤 Xuất thêm</button>
<button onclick="showMobileReturn('${project.id}')">🔄 Trả hàng</button>
                </div>

                <div class="m-section-title">📦 VẬT TƯ ĐÃ DÙNG</div>
                <div class="m-project-detail-list">${materialRows}</div>

                <div class="m-section-title">🧾 GIAO DỊCH CÔNG TRÌNH</div>
                <div class="m-project-detail-list">${txnRows}</div>
            </div>

            ${renderMobileActionSheet()}
            ${renderMobileTabBar('projects')}
        </div>
    `;

    document.getElementById('root').innerHTML = html;
    fixAllModalHeight();
};

// ========== MODAL TRẢ HÀNG ==========
window.showMobileReturn = function(defaultProjectId = null) {
    const projects = state.data.projects.filter(p => state.data.transactions.some(t => t.projectId === p.id && t.type === 'usage'));
    
    if (projects.length === 0) { alert('Chưa có công trình nào được xuất kho!'); return; }
    
    const now = new Date();
    const dt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const html = `
        <div class="m-modal ios-liquid" id="m-return-modal">
            <div class="m-modal-hd">
                <button class="m-back" onclick="cancelMobileForm('return')">←</button>
                <span>🔄 TRẢ HÀNG</span>
                <div></div>
            </div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;">
                <div class="m-field">
                    <label>📅 Thời gian</label>
                    <input type="datetime-local" id="mr-datetime" value="${dt}">
                </div>
                <div class="m-field">
                    <label>🏗️ Công trình</label>
<select id="mr-project" onchange="loadReturnMaterials()">
    ${projects.map(p => `
        <option value="${p.id}" ${String(p.id) === String(defaultProjectId) ? 'selected' : ''}>
            ${escapeHtml(p.name)}
        </option>
    `).join('')}
</select>
                </div>
                <div class="m-field">
    <label>📦 Vật tư</label>
    <select id="mr-material" onchange="updateRPrice()"></select>
    <div id="mr-return-info" style="margin-top:6px;font-size:12px;color:#7a8099;"></div>
</div>

                <div class="m-field">
                    <label>🔢 Số lượng</label>
                    <div class="m-qty-box">
                        <button class="m-qty-btn" onclick="changeMQty(-1)">−</button>
                        <input type="text" id="mr-qty" value="1" dir="ltr" class="m-qty-input">
                        <button class="m-qty-btn" onclick="changeMQty(1)">+</button>
                    </div>
                </div>
                <div class="m-field">
                    <label>💰 Đơn giá hoàn</label>
                    <input type="text" id="mr-price" value="0" dir="ltr" readonly>
                </div>
                <div class="m-field">
                    <label>📝 Ghi chú</label>
                    <input type="text" id="mr-note" placeholder="Lý do trả hàng...">
                </div>
                <div class="m-field">
                    <label>📎 File đính kèm</label>
                    <input type="file" id="mr-files" multiple accept="image/*,.pdf,.xlsx,.csv,.doc,.docx" onchange="handleMobileFiles(this,'return')" style="padding:10px;">
                    <div id="mr-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div>
                </div>
                <button class="m-submit" style="background:#0d9488;" onclick="doMobileReturn()">✅ XÁC NHẬN TRẢ HÀNG</button>
            </div>
        </div>
    `;
    document.getElementById('root').innerHTML = html;
    fixAllModalHeight();
    setTimeout(() => {
    loadReturnMaterials();
    bindMobileNumberInput('mr-qty');
}, 250);

};
// ========== XỬ LÝ SỐ LƯỢNG / TIỀN ==========
window.changeMQty = function(delta) {
    const input = document.getElementById('mi-qty') || document.getElementById('me-qty') || document.getElementById('mr-qty');
    if (input) {
        let val = parseMobileNumber(input.value);
        val = Math.max(0, val + delta);
        const returnSel = document.getElementById('mr-material');
if (returnSel && document.getElementById('mr-qty') === input) {
    const maxReturn = Number(returnSel.options[returnSel.selectedIndex]?.dataset?.avail || 0);
    if (maxReturn > 0) val = Math.min(val, maxReturn);
}
        input.value = formatMobileNumber(val);
        updateMobileTotal();
    }
};

window.setMQty = function(val) {
    const input = document.getElementById('mi-qty') || document.getElementById('me-qty') || document.getElementById('mr-qty');
    if (input) {
        input.value = formatMobileNumber(val);
        updateMobileTotal();
    }
};
window.updateMPrice = function() { const sel = document.getElementById('mi-material'); const priceInput = document.getElementById('mi-price'); if (sel && priceInput) { priceInput.value = Number(sel.options[sel.selectedIndex]?.dataset?.cost || 0).toLocaleString('vi-VN'); } updateMobileTotal(); };
function parseMobileNumber(value) {
    const normalized = String(value || '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^\d.]/g, '');

    return Number(normalized) || 0;
}

function formatMobileNumber(value) {
    const n = Number(value || 0);
    return n ? n.toLocaleString('vi-VN', { maximumFractionDigits: 3 }) : '';
}

function bindMobileNumberInput(id, onChange = null) {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener('input', function() {
        let raw = this.value
            .replace(/\./g, '')
            .replace(/[^\d,]/g, '');

        const parts = raw.split(',');
        if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('');

        const [intPart, decimalPart] = raw.split(',');
        const formattedInt = intPart ? Number(intPart).toLocaleString('vi-VN') : '';

        this.value = decimalPart !== undefined
            ? formattedInt + ',' + decimalPart.slice(0, 3)
            : formattedInt;

        if (onChange) onChange();
    });

    input.addEventListener('blur', function() {
        const n = parseMobileNumber(this.value);
        this.value = formatMobileNumber(n);
        if (onChange) onChange();
    });
}
// ========== DỌN FILE TẠM MOBILE ==========
async function cleanupMobileTempFiles(type = null) {
    const uploads = window._upPaths || {};
    const types = type ? [type] : Object.keys(uploads);

    for (const t of types) {
        const paths = uploads[t] || [];

        await Promise.all(paths.map(function(item) {
        const filePath = typeof item === 'string' ? item : item?.path;

        return fetch('/api/upload/temp', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
        }).catch(function() {});
        }));
                                                                        

        uploads[t] = [];
    }

    window._upPaths = uploads;
}

window.cancelMobileForm = async function(type) {
    await cleanupMobileTempFiles(type);
    renderMobileViewOnly();
};

async function finalizeMobileFiles(type) {
    if (window.moveUploadedFiles) {
        return await window.moveUploadedFiles(type);
    }
    return (window._upPaths && window._upPaths[type]) || [];
}
function updateMobileTotal() {
    const qtyInput = document.getElementById('mi-qty') || document.getElementById('me-qty') || document.getElementById('mr-qty');
    const priceInput = document.getElementById('mi-price') || document.getElementById('mr-price');
    const vatInput = document.getElementById('mi-vat');
    const subtotalEl = document.getElementById('mi-subtotal');
    const vatRateEl = document.getElementById('mi-vat-rate');
    const vatAmountEl = document.getElementById('mi-vat-amount');
    const totalEl = document.getElementById('mi-total');
    
    if (qtyInput && priceInput) {
        const qty = parseMobileNumber(qtyInput.value);
        const price = parseMobileNumber(priceInput.value);
        const vat = vatInput ? parseMobileNumber(vatInput.value) : 0;
        const subtotal = qty * price;
        const vatAmount = subtotal * vat / 100;
        const total = subtotal + vatAmount;
        
        if (subtotalEl) subtotalEl.textContent = formatMoneyVND(subtotal);
        if (vatRateEl) vatRateEl.textContent = vat;
        if (vatAmountEl) vatAmountEl.textContent = formatMoneyVND(vatAmount);
        if (totalEl) totalEl.textContent = formatMoneyVND(total);
    }
}
// ========== XỬ LÝ SUBMIT MOBILE ==========
window.doMobileImport = async function() {
    try {
        const supplierId = document.getElementById('mi-supplier')?.value;
        const mid = document.getElementById('mi-material')?.value;
        const dt = document.getElementById('mi-datetime')?.value || new Date().toISOString();
        const qty = parseMobileNumber(document.getElementById('mi-qty')?.value);
        const price = parseMobileNumber(document.getElementById('mi-price')?.value);
        const vat = parseMobileNumber(document.getElementById('mi-vat')?.value);
        const note = document.getElementById('mi-note')?.value || '';

        if (!supplierId || !mid || !qty || !price) {
            alert('Vui lòng nhập đầy đủ!');
            return;
        }

        setMobileSubmitLoading(true, 'Đang nhập kho...');

        const subtotal = qty * price;
        const vatAmount = subtotal * vat / 100;
        const total = subtotal + vatAmount;
        const finalPaths = await finalizeMobileFiles('purchase');
        const attachment = JSON.stringify(finalPaths);

        const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 'm_' + Date.now(),
                mid,
                supplierId,
                type: 'purchase',
                qty,
                unitPrice: price,
                vatRate: vat,
                subtotal,
                vatAmount,
                totalAmount: total,
                note: note || 'Nhập từ mobile',
                date: dt.split('T')[0],
                datetime: dt,
                attachment
            })
        });

        const data = await res.json();

        if (data.success) {
            if (navigator.vibrate) navigator.vibrate(50);
            window._upPaths = {};

            const matLog = state.data.materials.find(function(m) { return m.id === mid; });
            addLog('Nhập kho (Mobile)', (matLog?.name || 'N/A') + ' - SL: ' + qty.toLocaleString('vi-VN') + ' - VAT: ' + vat + '%');

            window.loadState().then(function() {
                renderMobileViewOnly();
            });
        } else {
            setMobileSubmitLoading(false);
            alert('❌ ' + (data.error || 'Lỗi nhập kho'));
        }
    } catch (err) {
        console.error('Mobile import error:', err);
        setMobileSubmitLoading(false);
        alert('❌ Lỗi kết nối hoặc upload file. Vui lòng thử lại.');
    }
};

window.doMobileExport = async function() {
    try {
        const projectId = document.getElementById('me-project')?.value;
        const mid = document.getElementById('me-material')?.value;
        const dt = document.getElementById('me-datetime')?.value || new Date().toISOString();
        const qty = parseMobileNumber(document.getElementById('me-qty')?.value);
        const note = document.getElementById('me-note')?.value || '';

        if (!projectId || !mid || !qty) {
            alert('Vui lòng nhập đầy đủ!');
            return;
        }

        const mat = state.data.materials.find(m => m.id === mid);

        if (mat && Number(mat.qty || 0) < qty) {
            alert(`Không đủ tồn! Còn ${Number(mat.qty || 0).toLocaleString('vi-VN')} ${mat.unit}`);
            return;
        }

        setMobileSubmitLoading(true, 'Đang xuất kho...');

        const total = qty * Number(mat?.cost || 0);
        const finalPaths = await finalizeMobileFiles('usage');
        const attachment = JSON.stringify(finalPaths);

        const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 'm_' + Date.now(),
                mid,
                projectId,
                type: 'usage',
                qty,
                unitPrice: Number(mat?.cost || 0),
                totalAmount: total,
                note: note || 'Xuất từ mobile',
                date: dt.split('T')[0],
                datetime: dt,
                attachment
            })
        });

        const data = await res.json();

        if (data.success) {
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
            window._upPaths = {};

            const matLog = state.data.materials.find(function(m) { return m.id === mid; });
            const projLog = state.data.projects.find(function(p) { return p.id === projectId; });
            addLog('Xuất kho (Mobile)', (matLog?.name || 'N/A') + ' - SL: ' + qty.toLocaleString('vi-VN') + ' - CT: ' + (projLog?.name || 'N/A'));

            window.loadState().then(function() {
                renderMobileViewOnly();
            });
        } else {
            setMobileSubmitLoading(false);
            alert('❌ ' + (data.error || 'Lỗi xuất kho'));
        }
    } catch (err) {
        console.error('Mobile export error:', err);
        setMobileSubmitLoading(false);
        alert('❌ Lỗi kết nối hoặc upload file. Vui lòng thử lại.');
    }
};

window.loadReturnMaterials = function() {
    const pid = document.getElementById('mr-project')?.value;
    const sel = document.getElementById('mr-material');
    if (!pid || !sel) return;

    const uT = state.data.transactions.filter(t => t.projectId === pid && t.type === 'usage');
    const rT = state.data.transactions.filter(t => t.projectId === pid && t.type === 'return');
    const map = new Map();

    uT.forEach(t => {
        const m = state.data.materials.find(x => x.id === t.mid);
        if (m) {
            if (!map.has(t.mid)) {
                map.set(t.mid, {
                    id: t.mid,
                    name: m.name,
                    unit: m.unit,
                    rec: 0,
                    ret: 0,
                    price: t.unitPrice
                });
            }
            map.get(t.mid).rec += t.qty;
        }
    });

    rT.forEach(t => {
        if (map.has(t.mid)) map.get(t.mid).ret += t.qty;
    });

    const list = Array.from(map.values())
        .map(i => ({ ...i, avail: i.rec - i.ret }))
        .filter(i => i.avail > 0);

    const submitBtn = document.querySelector('#m-return-modal .m-submit');

    if (list.length === 0) {
        sel.innerHTML = '<option value="">Không có vật tư có thể trả</option>';

        const info = document.getElementById('mr-return-info');
        if (info) info.textContent = 'Công trình này chưa có vật tư đã xuất hoặc đã trả hết.';

        const priceInput = document.getElementById('mr-price');
        if (priceInput) priceInput.value = '0';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'ĐÃ TRẢ HẾT';
            submitBtn.style.opacity = '.55';
        }

        return;
    }

    sel.innerHTML = list.map(m => `
        <option value="${m.id}"
            data-price="${m.price}"
            data-rec="${m.rec}"
            data-ret="${m.ret}"
            data-avail="${m.avail}"
            data-unit="${m.unit}">
            ${escapeHtml(m.name)} (Còn trả: ${Number(m.avail).toLocaleString('vi-VN')} ${m.unit})
        </option>
    `).join('');

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '✅ XÁC NHẬN TRẢ HÀNG';
        submitBtn.style.opacity = '1';
    }

    updateRPrice();
};


window.updateRPrice = function() {
    const sel = document.getElementById('mr-material');
    const priceInput = document.getElementById('mr-price');
    const qtyInput = document.getElementById('mr-qty');
    const info = document.getElementById('mr-return-info');

    if (!sel || !priceInput) return;

    const opt = sel.options[sel.selectedIndex];
    const price = Number(opt?.dataset?.price || 0);
    const rec = Number(opt?.dataset?.rec || 0);
    const ret = Number(opt?.dataset?.ret || 0);
    const avail = Number(opt?.dataset?.avail || 0);
    const unit = opt?.dataset?.unit || '';

    priceInput.value = price.toLocaleString('vi-VN');

    if (info) {
        info.textContent =
            'Đã xuất: ' + rec.toLocaleString('vi-VN') + ' ' + unit +
            ' · Đã trả: ' + ret.toLocaleString('vi-VN') + ' ' + unit +
            ' · Còn trả: ' + avail.toLocaleString('vi-VN') + ' ' + unit;
    }

    if (qtyInput && parseMobileNumber(qtyInput.value) > avail) {
        qtyInput.value = formatMobileNumber(avail);
    }
};


window.doMobileReturn = async function() {
    try {
        const pid = document.getElementById('mr-project')?.value;
        const mid = document.getElementById('mr-material')?.value;
        const dt = document.getElementById('mr-datetime')?.value || new Date().toISOString();
        const qty = parseMobileNumber(document.getElementById('mr-qty')?.value);
        const price = parseMobileNumber(document.getElementById('mr-price')?.value);
        const note = document.getElementById('mr-note')?.value || '';

        if (!pid || !mid || !qty) {
            alert('Vui lòng nhập đầy đủ!');
            return;
        }

        const uT = state.data.transactions.filter(function(t) {
            return t.projectId === pid && t.mid === mid && t.type === 'usage';
        });
        const rT = state.data.transactions.filter(function(t) {
            return t.projectId === pid && t.mid === mid && t.type === 'return';
        });

        const totalReceived = uT.reduce(function(s, t) { return s + Number(t.qty || 0); }, 0);
        const totalReturned = rT.reduce(function(s, t) { return s + Number(t.qty || 0); }, 0);
        const avail = totalReceived - totalReturned;

        if (qty > avail) {
            alert(
                'Không thể trả quá số lượng đã nhận!\n' +
                'Đã nhận: ' + Number(totalReceived).toLocaleString('vi-VN') + '\n' +
                'Đã trả: ' + Number(totalReturned).toLocaleString('vi-VN') + '\n' +
                'Có thể trả tối đa: ' + Number(avail).toLocaleString('vi-VN')
            );
            return;
        }

        setMobileSubmitLoading(true, 'Đang trả hàng...');

        const total = qty * price;
        const finalPaths = await finalizeMobileFiles('return');
        const attachment = JSON.stringify(finalPaths);

        const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 'm_' + Date.now(),
                mid,
                projectId: pid,
                type: 'return',
                qty,
                unitPrice: price,
                totalAmount: total,
                note: note || 'Trả từ mobile',
                date: dt.split('T')[0],
                datetime: dt,
                attachment
            })
        });

        const data = await res.json();

        if (data.success) {
            window._upPaths = {};

            const matLog = state.data.materials.find(function(m) { return m.id === mid; });
            const projLog = state.data.projects.find(function(p) { return p.id === pid; });
            addLog('Trả hàng (Mobile)', (matLog?.name || 'N/A') + ' - SL: ' + qty.toLocaleString('vi-VN') + ' - CT: ' + (projLog?.name || 'N/A'));

            window.loadState().then(function() {
                renderMobileViewOnly();
            });
        } else {
            setMobileSubmitLoading(false);
            alert('❌ ' + (data.error || 'Lỗi trả hàng'));
        }
    } catch (err) {
        console.error('Mobile return error:', err);
        setMobileSubmitLoading(false);
        alert('❌ Lỗi kết nối hoặc upload file. Vui lòng thử lại.');
    }
};

// ========== TÌM KIẾM / BỘ LỌC ==========
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

    filterMStock();
};

// ========== LỌC KHO THEO NHÓM VẬT TƯ ==========
window.showMobileStockByCategory = function(encodedCategory) {
    const category = decodeURIComponent(encodedCategory || '');
    showMobileStock();

    setTimeout(function() {
        const search = document.getElementById('ms-search');

        if (search) {
            search.value = category;
            filterMStock();
        }
    }, 80);
};

window.filterMobileProjects = function() {
    const kw = document.getElementById('mp-search')?.value?.toLowerCase() || '';

    document.querySelectorAll('#mp-list .m-project-item').forEach(function(el) {
        el.style.display = (el.dataset.name || '').includes(kw) ? '' : 'none';
    });
};

window.showMobileMenu = function() { const menu = document.getElementById('m-menu'); if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none'; };

// ========== RENDER LẠI / CHUYỂN CHẾ ĐỘ ==========
window.renderMobileViewOnly = function() {
    window.loadState().then(() => {
        document.getElementById('root').innerHTML = renderMobileView();
        sidebarOpen = false;
        setTimeout(bindRecentTxnClicks, 50);
    });
};


window.switchMobileMode = function(mode) { if (mode === 'desktop') { localStorage.setItem('steeltrack_ui_mode', 'desktop'); window.location.reload(); } };

// Export global cho app.js
window.renderMobileView = renderMobileView;
window.renderMobileViewOnly = renderMobileViewOnly;
// ========== PHÂN TRANG / LỌC GIAO DỊCH ==========
window.changeTxnPage = function(page) {
    txnPage = page;
    const listEl = document.getElementById('m-txn-list');
    if (listEl) {
    listEl.innerHTML = renderRecentTxns(state.data.transactions || [], txnPage, txnLimit);
    setTimeout(bindRecentTxnClicks, 20);
}
};

window.changeTxnLimit = function(limit) {
    txnLimit = parseInt(limit);
    txnPage = 1;
    const listEl = document.getElementById('m-txn-list');
    if (listEl) {
    listEl.innerHTML = renderRecentTxns(state.data.transactions || [], txnPage, txnLimit);
    setTimeout(bindRecentTxnClicks, 20);
}
};
window.filterMobileTxns = function(value) {
    txnSearch = value || '';
    txnPage = 1;

    const listEl = document.getElementById('m-txn-list');
    if (listEl) {
        listEl.innerHTML = renderRecentTxns(state.data.transactions || [], txnPage, txnLimit);
        setTimeout(bindRecentTxnClicks, 20);
    }
};
window.filterMobileTxnType = function(type) {
    txnTypeFilter = type || 'all';
    txnPage = 1;

    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = renderMobileView();
        setTimeout(bindRecentTxnClicks, 50);
    }
};

// ========== TIỆN ÍCH MODAL MOBILE ==========
function fixAllModalHeight() {
    setTimeout(function() {
        var modals = document.querySelectorAll('.m-modal');
        modals.forEach(function(modal) {
            modal.style.height = window.innerHeight + 'px';
            modal.style.display = 'flex';
            modal.style.flexDirection = 'column';
        });
    }, 50);
}
// ========== XỬ LÝ FILE UPLOAD TỪ MOBILE ==========
window.handleMobileFiles = function(input, type) {
    if (!window._upPaths) window._upPaths = {};
    if (!window._upPaths[type]) window._upPaths[type] = [];
    
    const listId = (type === 'purchase' ? 'mi' : type === 'usage' ? 'me' : 'mr') + '-file-list';
    const list = document.getElementById(listId);
    
    for (let i = 0; i < input.files.length; i++) {
        const f = input.files[i];
        const fd = new FormData();
        fd.append('file', f);
        const id = type + '_' + Date.now() + '_' + Math.random().toString(36).substr(2,4);
        
        fetch('/api/upload/' + type + '/' + id, { method: 'POST', body: fd })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
    window._upPaths[type].push({
    path: d.path,
    name: f.name
    });

    if (list) {
        const wrap = document.createElement('span');
        wrap.style.display = 'inline-flex';
        wrap.style.alignItems = 'center';
        wrap.style.gap = '6px';
        wrap.style.marginRight = '8px';
        wrap.style.marginTop = '6px';

        const link = document.createElement('a');
link.href = 'javascript:void(0)';
link.style.color = '#378ADD';
link.style.textDecoration = 'none';
link.textContent = '📎 ' + f.name;

link.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();

    if (isMobilePdfFile(f.name)) {
        window.showMobilePdfPreview(encodeURIComponent(d.path), encodeURIComponent(f.name));
        return;
    }

    if (isMobileImageFile(f.name)) {
        window.showMobileImagePreview(encodeURIComponent(d.path), encodeURIComponent(f.name));
        return;
    }

    window.open(d.path, '_blank');
};


        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.title = 'Bỏ file';
        removeBtn.style.width = '20px';
        removeBtn.style.height = '20px';
        removeBtn.style.padding = '0';
        removeBtn.style.border = 'none';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.background = '#dc2626';
        removeBtn.style.color = '#fff';
        removeBtn.style.fontWeight = '800';
        removeBtn.style.lineHeight = '20px';
        removeBtn.style.cursor = 'pointer';

        removeBtn.onclick = async function() {
            await fetch('/api/upload/temp', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: d.path })
            }).catch(function() {});

            window._upPaths[type] = (window._upPaths[type] || []).filter(function(item) {
            return (typeof item === 'string' ? item : item.path) !== d.path;
            });

            wrap.remove();
        };

        wrap.appendChild(link);
        wrap.appendChild(removeBtn);
        list.appendChild(wrap);
    }
}

            });
    }
};
// ========== DASHBOARD MOBILE ==========
function renderMobileDashboardHero() {
    const materials = state.data.materials || [];
    const transactions = state.data.transactions || [];
    const projects = state.data.projects || [];

    const totalInventory = materials.reduce((s, m) => s + (Number(m.qty || 0) * Number(m.cost || 0)), 0);
    const lowStockCount = materials.filter(m => Number(m.qty || 0) <= Number(m.low || 0)).length;
    const activeProjects = projects.length;

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthTxns = transactions.filter(t => {
        const d = new Date(t.datetime || t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    const monthImport = monthTxns
        .filter(t => t.type === 'purchase')
        .reduce((s, t) => s + Number(t.totalAmount || 0), 0);

    const monthExport = monthTxns
        .filter(t => t.type === 'usage')
        .reduce((s, t) => s + Number(t.totalAmount || 0), 0);

    return `
        <div class="m-pro-hero">
            <div>
                <div class="m-pro-eyebrow">Tổng quan tháng này</div>
                <div class="m-pro-value">${formatCompactVND(totalInventory)}</div>
                <div class="m-pro-sub">Giá trị tồn kho hiện tại</div>
            </div>
            <div class="m-pro-ring">
                <span>${lowStockCount}</span>
                <small>Cảnh báo</small>
            </div>
        </div>

        <div class="m-pro-grid">
            <div class="m-pro-mini blue">
                <small>Nhập tháng</small>
                <strong>${formatCompactVND(monthImport)}</strong>
            </div>
            <div class="m-pro-mini red">
                <small>Xuất tháng</small>
                <strong>${formatCompactVND(monthExport)}</strong>
            </div>
            <div class="m-pro-mini green">
                <small>Vật tư</small>
                <strong>${materials.length}</strong>
            </div>
            <div class="m-pro-mini purple">
                <small>Công trình</small>
                <strong>${activeProjects}</strong>
            </div>
        </div>
    `;
}

// ========== MODAL THỐNG KÊ (CEO DASHBOARD) ==========
window.showMobileDashboard = function() {
    const materials = state.data.materials || [];
    const transactions = state.data.transactions || [];
    const projects = state.data.projects || [];
    const suppliers = state.data.suppliers || [];
    
    const html = `
        <div class="m-modal ios-liquid" id="m-dashboard-modal">
            <div class="m-modal-hd">
                <button class="m-back" onclick="renderMobileViewOnly()">←</button>
                <span>📊 THỐNG KÊ</span>
                <div></div>
            </div>
            
            <!-- Tab bar -->
            <div class="m-tab-bar">
                <div class="m-tab active" onclick="switchMDashTab('overview')" id="mtab-overview">📊 Tổng quan</div>
                <div class="m-tab" onclick="switchMDashTab('projects')" id="mtab-projects">🏗️ Công trình</div>
                <div class="m-tab" onclick="switchMDashTab('forecast')" id="mtab-forecast">🔮 Dự báo</div>
                <div class="m-tab" onclick="switchMDashTab('structures')" id="mtab-structures">🏗️ Cấu kiện</div>
            </div>
            
            <div id="m-dash-content" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px;">
                ${renderMobileDashboardHero()}
                ${renderMDashOverview()}
            </div>
            ${renderMobileActionSheet()}
            ${renderMobileTabBar('dashboard')}
        </div>
    `;
    document.getElementById('root').innerHTML = html;
    fixAllModalHeight();
};
// ========== SWITCH TAB THỐNG KÊ ==========
window.switchMDashTab = function(tab) {
    document.querySelectorAll('.m-tab').forEach(function(t) { t.classList.remove('active'); });
    document.getElementById('mtab-' + tab).classList.add('active');

    var content = document.getElementById('m-dash-content');

    if (tab === 'overview') {
        content.innerHTML = renderMobileDashboardHero() + renderMDashOverview();
    }

    if (tab === 'projects') {
        content.innerHTML = renderMDashProjects();
        setTimeout(drawDonutChart, 200);
    }

    if (tab === 'forecast') {
        content.innerHTML = '<div class="m-empty">Đang tải...</div>';
        renderMDashForecast().then(function(h) { content.innerHTML = h; });
    }

    if (tab === 'structures') {
        content.innerHTML = renderMDashStructures();
    }
};

// ========== TAB TỔNG QUAN ==========
function renderMDashOverview() {
    var materials = state.data.materials || [];
    var transactions = state.data.transactions || [];
    var projects = state.data.projects || [];
    var suppliers = state.data.suppliers || [];
    var totalImport = transactions.filter(function(t) { return t.type === 'purchase'; }).reduce(function(s, t) { return s + (Number(t.totalAmount)||0); }, 0);
    var totalExport = transactions.filter(function(t) { return t.type === 'usage'; }).reduce(function(s, t) { return s + (Number(t.totalAmount)||0); }, 0);
    var totalInventory = materials.reduce(function(s, m) { return s + (m.qty * m.cost); }, 0);
    var lowStockCount = materials.filter(function(m) { return m.qty <= m.low; }).length;
    var maxFlow = Math.max(totalImport, totalExport, 1);
    var importPct = (totalImport / maxFlow * 100).toFixed(0);
    var exportPct = (totalExport / maxFlow * 100).toFixed(0);
    
    var projectStats = projects.map(function(p) {
        var spent = transactions.filter(function(t) { return t.projectId === p.id && t.type === 'usage'; }).reduce(function(s,t) { return s + (Number(t.totalAmount)||0); }, 0);
        var ret = transactions.filter(function(t) { return t.projectId === p.id && t.type === 'return'; }).reduce(function(s,t) { return s + (Number(t.totalAmount)||0); }, 0);
        return { name: p.name, spent: spent - ret, budget: p.budget };
    }).sort(function(a,b) { return b.spent - a.spent; }).slice(0, 5);
    var maxProjectSpent = Math.max.apply(null, projectStats.map(function(p) { return p.spent; }).concat([1]));
    
    var supplierStats = suppliers.map(function(s) {
        var total = transactions.filter(function(t) { return t.type === 'purchase' && t.supplierId === s.id; }).reduce(function(sum, t) { return sum + (Number(t.totalAmount)||0); }, 0);
        return { name: s.name, total: total };
    }).sort(function(a,b) { return b.total - a.total; }).slice(0, 5);
    var maxSupplierTotal = Math.max.apply(null, supplierStats.map(function(s) { return s.total; }).concat([1]));
    
    var html = '<div class="m-kpi-grid">' +
        '<div class="m-kpi-card" style="border-left:3px solid #378ADD;"><div class="m-kpi-label">📥 TỔNG NHẬP</div><div class="m-kpi-value">' + formatCompactVND(totalImport) + '</div></div>' +
        '<div class="m-kpi-card" style="border-left:3px solid #dc2626;"><div class="m-kpi-label">📤 TỔNG XUẤT</div><div class="m-kpi-value">' + formatCompactVND(totalExport) + '</div></div>' +
        '<div class="m-kpi-card" style="border-left:3px solid #16a34a;"><div class="m-kpi-label">📦 TỒN KHO</div><div class="m-kpi-value">' + formatCompactVND(totalInventory) + '</div></div>' +
        '<div class="m-kpi-card" style="border-left:3px solid ' + (lowStockCount > 0 ? '#ea580c' : '#16a34a') + ';"><div class="m-kpi-label">⚠️ SẮP HẾT</div><div class="m-kpi-value" style="color:' + (lowStockCount > 0 ? '#dc2626' : '#16a34a') + ';">' + lowStockCount + '</div></div>' +
        '</div>';
    
    // Biểu đồ cột so sánh
    html += '<div class="m-section"><div class="m-section-title">📊 SO SÁNH NHẬP - XUẤT</div><div class="m-chart-card">' +
        '<div style="margin-bottom:14px;"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>📥 Nhập</span><span style="font-weight:700;">' + formatMoneyVND(totalImport) + '</span></div><div class="m-bar-wrap"><div class="m-bar-fill" style="width:' + importPct + '%;background:linear-gradient(90deg,#378ADD,#85B7EB);box-shadow:0 0 8px rgba(55,138,221,0.3);"></div></div></div>' +
        '<div><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>📤 Xuất</span><span style="font-weight:700;">' + formatMoneyVND(totalExport) + '</span></div><div class="m-bar-wrap"><div class="m-bar-fill" style="width:' + exportPct + '%;background:linear-gradient(90deg,#dc2626,#F09595);box-shadow:0 0 8px rgba(220,38,38,0.3);"></div></div></div>' +
        '</div></div>';
    
    if (projectStats.length > 0) {
        html += '<div class="m-section"><div class="m-section-title">🏗️ TOP CÔNG TRÌNH</div><div class="m-chart-card">';
        projectStats.forEach(function(p, i) {
            var pct = (p.spent / maxProjectSpent * 100).toFixed(0);
            html += '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span style="font-weight:600;">' + (i+1) + '. ' + escapeHtml(p.name) + '</span><span style="font-weight:700;">' + formatMoneyVND(p.spent) + '</span></div><div class="m-bar-wrap"><div class="m-bar-fill" style="width:' + pct + '%;background:#378ADD;"></div></div></div>';
        });
        html += '</div></div>';
    }
    
    if (supplierStats.length > 0) {
        html += '<div class="m-section"><div class="m-section-title">🏭 TOP NHÀ CUNG CẤP</div><div class="m-chart-card">';
        supplierStats.forEach(function(s, i) {
            var pct = (s.total / maxSupplierTotal * 100).toFixed(0);
            html += '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span style="font-weight:600;">' + (i+1) + '. ' + escapeHtml(s.name) + '</span><span style="font-weight:700;">' + formatMoneyVND(s.total) + '</span></div><div class="m-bar-wrap"><div class="m-bar-fill" style="width:' + pct + '%;background:#16a34a;"></div></div></div>';
        });
        html += '</div></div>';
    }
    
    return html;
}
// ========== TAB CÔNG TRÌNH ==========
function renderMDashProjects() {
    var projects = state.data.projects || [];
    var transactions = state.data.transactions || [];
    var totalBudget = projects.reduce(function(s, p) { return s + Number(p.budget||0); }, 0);
    var totalSpent = transactions.filter(function(t) { return t.type === 'usage'; }).reduce(function(s,t) { return s + (Number(t.totalAmount)||0); }, 0);
    var totalReturn = transactions.filter(function(t) { return t.type === 'return'; }).reduce(function(s,t) { return s + (Number(t.totalAmount)||0); }, 0);
    var net = totalSpent - totalReturn;
    var remainPct = totalBudget > 0 ? ((totalBudget - net) / totalBudget * 100).toFixed(1) : 0;
    var spentPct = totalBudget > 0 ? (net / totalBudget * 100).toFixed(1) : 0;
    
    var projectStats = projects.map(function(p) {
        var spent = transactions.filter(function(t) { return t.projectId === p.id && t.type === 'usage'; }).reduce(function(s,t) { return s + (Number(t.totalAmount)||0); }, 0);
        var ret = transactions.filter(function(t) { return t.projectId === p.id && t.type === 'return'; }).reduce(function(s,t) { return s + (Number(t.totalAmount)||0); }, 0);
        var netSpent = spent - ret;
        var pct = p.budget > 0 ? (netSpent / p.budget * 100) : 0;
        return { name: p.name, spent: netSpent, budget: p.budget, pct: pct };
    }).sort(function(a,b) { return b.spent - a.spent; });
    
    var maxSpent = Math.max.apply(null, projectStats.map(function(p) { return p.spent; }).concat([1]));
    
    var html = '<div class="m-kpi-grid">' +
        '<div class="m-kpi-card" style="border-left:3px solid #378ADD;"><div class="m-kpi-label">🏗️ TỔNG CT</div><div class="m-kpi-value">' + projects.length + '</div></div>' +
        '<div class="m-kpi-card" style="border-left:3px solid #16a34a;"><div class="m-kpi-label">💰 NGÂN SÁCH</div><div class="m-kpi-value">' + formatMoneyVND(totalBudget) + '</div></div>' +
        '<div class="m-kpi-card" style="border-left:3px solid #dc2626;"><div class="m-kpi-label">💸 ĐÃ CHI</div><div class="m-kpi-value">' + formatMoneyVND(net) + '</div></div>' +
        '<div class="m-kpi-card" style="border-left:3px solid #0891b2;"><div class="m-kpi-label">📊 CÒN LẠI</div><div class="m-kpi-value">' + formatMoneyVND(totalBudget - net) + '</div></div>' +
        '</div>';
    
    // Biểu đồ tròn ngân sách (vẽ bằng Canvas nhỏ)
    html += '<div class="m-section"><div class="m-section-title">🎯 TỔNG QUAN NGÂN SÁCH</div><div class="m-chart-card" style="text-align:center;">' +
        '<canvas id="m-donut-canvas" width="150" height="150" style="display:block;margin:0 auto;"></canvas>' +
        '<div style="display:flex;justify-content:center;gap:20px;margin-top:8px;">' +
            '<div style="font-size:12px;"><span style="display:inline-block;width:12px;height:12px;background:#dc2626;border-radius:50%;margin-right:6px;"></span>Đã chi: ' + formatMoneyVND(net) + '</div>' +
            '<div style="font-size:12px;"><span style="display:inline-block;width:12px;height:12px;background:#16a34a;border-radius:50%;margin-right:6px;"></span>Còn lại: ' + formatMoneyVND(totalBudget - net) + '</div>' +
        '</div></div></div>';    
    // Chi tiết từng công trình
    html += '<div class="m-section"><div class="m-section-title">🏗️ CHI TIẾT CÔNG TRÌNH</div><div class="m-chart-card">';
    projectStats.forEach(function(p, i) {
        var barPct = (p.spent / maxSpent * 100).toFixed(0);
        var isLast = i === projectStats.length - 1;
        var color = p.pct > 90 ? '#dc2626' : p.pct > 70 ? '#ea580c' : '#378ADD';
        var bgColor = p.pct > 90 ? 'rgba(220,38,38,0.15)' : p.pct > 70 ? 'rgba(234,88,12,0.15)' : 'rgba(55,138,221,0.15)';
        html += '<div style="margin-bottom:12px;' + (isLast ? '' : 'border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:10px;') + '">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                '<span style="font-weight:600;">' + (i+1) + '. ' + escapeHtml(p.name) + '</span>' +
                '<span style="background:' + bgColor + ';color:' + color + ';padding:2px 10px;border-radius:10px;font-size:11px;font-weight:700;">' + p.pct.toFixed(1) + '%</span>' +
            '</div>' +
            '<div class="m-bar-wrap"><div class="m-bar-fill" style="width:' + barPct + '%;background:' + color + ';"></div></div>' +
            '<div style="display:flex;justify-content:space-between;font-size:11px;color:#7a8099;margin-top:4px;"><span>💰 ' + formatMoneyVND(p.spent) + ' / ' + formatMoneyVND(p.budget) + '</span><span>Còn ' + formatMoneyVND(p.budget - p.spent) + '</span></div>' +
            '</div>';
    });
    html += '</div></div>';
    return html;
}
// ========== TAB DỰ BÁO ==========
async function renderMDashForecast() {
    try {
        const res = await fetch('/api/forecast');
        const data = await res.json();
        if (!data.success || !data.data) return '<div class="m-empty">Chưa có dữ liệu</div>';
        
        const urgent = data.data.filter(i => i.warning_level === 'danger').length;
        const warning = data.data.filter(i => i.warning_level === 'warning').length;
        const good = data.data.filter(i => i.warning_level === 'good' || i.warning_level === 'info').length;
        
        return `
            <div class="m-kpi-grid">
                <div class="m-kpi-card" style="border-left:3px solid #dc2626;"><div class="m-kpi-label">⚠️ CẦN NHẬP GẤP</div><div class="m-kpi-value" style="color:#dc2626;">${urgent}</div></div>
                <div class="m-kpi-card" style="border-left:3px solid #ea580c;"><div class="m-kpi-label">📦 SẮP HẾT</div><div class="m-kpi-value" style="color:#ea580c;">${warning}</div></div>
                <div class="m-kpi-card" style="border-left:3px solid #16a34a;"><div class="m-kpi-label">✅ ĐỦ HÀNG</div><div class="m-kpi-value" style="color:#16a34a;">${good}</div></div>
                <div class="m-kpi-card" style="border-left:3px solid #378ADD;"><div class="m-kpi-label">📊 TỔNG</div><div class="m-kpi-value">${data.data.length}</div></div>
            </div>
            <div class="m-section"><div class="m-section-title">📦 DỰ BÁO NHU CẦU</div><div class="m-chart-card">${data.data.map(item => { const cls = item.warning_level === 'danger' ? 'm-text-red' : item.warning_level === 'warning' ? '' : ''; return `<div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.05);"><div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span class="${cls}" style="font-weight:600;">${escapeHtml(item.name)}</span><span>${item.status}</span></div><div style="display:flex;justify-content:space-between;font-size:11px;color:#7a8099;"><span>Tồn: ${Number(item.current_stock).toLocaleString('vi-VN')} | TB: ${Number(item.avg_monthly_usage).toLocaleString('vi-VN')}</span><span style="color:#378ADD;">Nhập: ${Number(item.suggested_order).toLocaleString('vi-VN')} ${item.unit}</span></div></div>`}).join('')}</div></div>
        `;
    } catch(e) {
        return '<div class="m-empty">❌ Lỗi tải dữ liệu</div>';
    }
}

// ========== TAB CẤU KIỆN ==========
function renderMDashStructures() {
    const structures = state.data.structures || [];
    const transactions = state.data.transactions || [];
    
    const produceTxns = transactions.filter(t => t.type === 'produce');
    const exportTxns = transactions.filter(t => t.type === 'structure_export');
    const totalProduced = produceTxns.reduce((s,t) => s + Number(t.qty||0), 0);
    const totalExported = exportTxns.reduce((s,t) => s + Number(t.qty||0), 0);
    const stockValue = structures.reduce((s, st) => s + (Number(st.qty||0) * Number(st.cost||0)), 0);
    
    const maxQty = Math.max(...structures.map(s => Number(s.qty||0)), 1);
    
    return `
        <div class="m-kpi-grid">
            <div class="m-kpi-card" style="border-left:3px solid #378ADD;"><div class="m-kpi-label">🏗️ TỔNG CK</div><div class="m-kpi-value">${structures.length}</div></div>
            <div class="m-kpi-card" style="border-left:3px solid #16a34a;"><div class="m-kpi-label">🏭 ĐÃ SX</div><div class="m-kpi-value">${Number(totalProduced).toLocaleString('vi-VN')}</div></div>
            <div class="m-kpi-card" style="border-left:3px solid #dc2626;"><div class="m-kpi-label">📤 ĐÃ XUẤT</div><div class="m-kpi-value">${Number(totalExported).toLocaleString('vi-VN')}</div></div>
            <div class="m-kpi-card" style="border-left:3px solid #0891b2;"><div class="m-kpi-label">💰 GIÁ TRỊ</div><div class="m-kpi-value">${formatMoneyVND(stockValue)}</div></div>
        </div>
        <div class="m-section"><div class="m-section-title">🏗️ TỒN KHO CẤU KIỆN</div><div class="m-chart-card">${structures.map(s => `<div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.05);"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-weight:600;">${escapeHtml(s.name)}</span><span>${Number(s.qty||0).toLocaleString('vi-VN')} ${s.unit}</span></div><div class="m-bar-wrap"><div class="m-bar-fill" style="width:${(Number(s.qty||0)/maxQty*100).toFixed(0)}%;background:#378ADD;"></div></div><div style="font-size:10px;color:#7a8099;margin-top:2px;">${formatMoneyVND(s.cost)}/${s.unit} · Tổng: ${formatMoneyVND(Number(s.qty||0)*Number(s.cost||0))}</div></div>`).join('')}</div></div>
    `;
}

function drawDonutChart() {
    var canvas = document.getElementById('m-donut-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var projects = state.data.projects || [];
    var transactions = state.data.transactions || [];
    var totalBudget = projects.reduce(function(s, p) { return s + Number(p.budget||0); }, 0);
    var totalSpent = transactions.filter(function(t) { return t.type === 'usage'; }).reduce(function(s,t) { return s + (Number(t.totalAmount)||0); }, 0);
    var totalReturn = transactions.filter(function(t) { return t.type === 'return'; }).reduce(function(s,t) { return s + (Number(t.totalAmount)||0); }, 0);
    var net = totalSpent - totalReturn;
    var spentPct = totalBudget > 0 ? Math.min(100, (net / totalBudget * 100)) : 0;
    var remainPct = 100 - spentPct;
    
    var cx = 75, cy = 75, r = 55, w = 20;
    
    // Xóa canvas
    ctx.clearRect(0, 0, 150, 150);
    
    // Vẽ phần đã chi (màu đỏ)
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + (spentPct/100) * Math.PI*2);
    ctx.lineWidth = w;
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();
    
    // Vẽ phần còn lại (màu xanh)
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI/2 + (spentPct/100) * Math.PI*2, -Math.PI/2 + Math.PI*2);
    ctx.lineWidth = w;
    ctx.strokeStyle = '#16a34a';
    ctx.stroke();
    
    // Text ở giữa
    ctx.fillStyle = '#e8eaf0';
    ctx.font = 'bold 18px IBM Plex Sans';
    ctx.textAlign = 'center';
    ctx.fillText(spentPct.toFixed(1) + '%', cx, cy - 2);
    ctx.fillStyle = '#7a8099';
    ctx.font = '10px IBM Plex Sans';
    ctx.fillText('đã sử dụng', cx, cy + 14);
}
window.updateMobileTotal = updateMobileTotal;

// ========== INIT MOBILE ==========
export function initMobileEvents() {
// Fix chiều cao trên điện thoại thật
    function fixMobileHeight() {
        const app = document.getElementById('mobile-app-container');
        if (app) {
            app.style.height = window.innerHeight + 'px';
        }
    }
    fixMobileHeight();
    window.addEventListener('resize', fixMobileHeight);
    window.addEventListener('orientationchange', function() {
        setTimeout(fixMobileHeight, 300);
    });
    
    // Click outside menu    
document.addEventListener('click', function(e) {
        const menu = document.getElementById('m-menu');
        if (menu && !e.target.closest('.m-header-right')) { menu.style.display = 'none'; }
    });
setTimeout(bindRecentTxnClicks, 50);
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
