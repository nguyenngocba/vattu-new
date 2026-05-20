import { mobileIcon } from './mobile_icons.js';

const QUICK_ACTION_DEFAULTS = [
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

const DEFAULT_VISIBLE_ACTIONS = ['import', 'export', 'return', 'find', 'low', 'projects', 'report', 'more'];

let deps = {};
let mobileHomeTheme = localStorage.getItem('steeltrack_mobile_theme') || 'light';
let mobileQuickActionVisible = readVisibleActions();

function escapeValue(value) {
    const text = String(value ?? '');
    return deps.escapeHtml ? deps.escapeHtml(text) : text;
}

function compactVND(value) {
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

    return deps.formatMoneyVND ? deps.formatMoneyVND(n) : n.toLocaleString('vi-VN');
}

function readVisibleActions() {
    try {
        const saved = JSON.parse(localStorage.getItem('steeltrack_mobile_quick_actions') || 'null');
        return Array.isArray(saved) && saved.length ? saved : DEFAULT_VISIBLE_ACTIONS;
    } catch (e) {
        return DEFAULT_VISIBLE_ACTIONS;
    }
}

export function getMobileHomeTheme() {
    return mobileHomeTheme;
}

function renderAlertBadge(count) {
    const n = Number(count || 0);
    if (n <= 0) return '';
    return `<span class="m-alert-badge">${n > 99 ? '99+' : n}</span>`;
}

export function renderMobileHomeHero(_currentUser = {}, lowStockCount = 0) {
    const alertAction = Number(lowStockCount || 0) > 0 ? 'showMobileLowStock()' : 'showMobileMenu()';

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
                    <button class="m-alert-button" onclick="${alertAction}" aria-label="Cảnh báo vật tư">
                        <span class="m-wh-alert-bell" aria-hidden="true"></span>
                        ${renderAlertBadge(lowStockCount)}
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function renderMobileHomeStats(materials, transactions, projects, lowStockCount) {
    const suppliers = deps.state?.data?.suppliers || [];
    const structures = deps.state?.data?.structures || [];

    return `
        <div class="m-wh-panel">
            <div class="m-wh-search-row">
                <input type="text" class="m-wh-search" placeholder="Tìm kiếm vật tư, mã, quy cách..." onclick="showMobileStock()">
                <button onclick="showMobileStock()">
                    <img class="m-inline-icon-img" src="/images/mobile-icons/logo-timvattu.png" alt="Tìm vật tư">
                </button>
            </div>
            <div class="m-wh-stats compact">
                <div class="m-wh-stat blue" onclick="showMobileStock()">
                    ${mobileIcon('logo-tongvattu.png', 'Vật tư', escapeValue)}
                    <strong>${materials.length}</strong>
                    <small>Vật tư</small>
                </div>

                <div class="m-wh-stat green" onclick="showMobileSuppliers()">
                    ${mobileIcon('logo-tongnhacungcap.png', 'Nhà cung cấp', escapeValue)}
                    <strong>${suppliers.length}</strong>
                    <small>Nhà cung cấp</small>
                </div>

                <div class="m-wh-stat orange" onclick="showMobileStructures()">
                    ${mobileIcon('logo-tongcaukien.png', 'Cấu kiện', escapeValue)}
                    <strong>${structures.length}</strong>
                    <small>Cấu kiện</small>
                </div>

                <div class="m-wh-stat purple" onclick="showMobileProjects()">
                    ${mobileIcon('logo-tongcongtrinh.png', 'Công trình', escapeValue)}
                    <strong>${projects.length}</strong>
                    <small>Công trình</small>
                </div>
            </div>
        </div>
    `;
}

export function renderMobileQuickActions(lowStockCount = 0) {
    const visibleActions = QUICK_ACTION_DEFAULTS.filter(item => {
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
                    <button class="${item.id === 'low' ? 'm-alert-button' : ''}" onclick="${item.action}">
                        ${mobileIcon(item.icon, item.label, escapeValue)}
                        ${item.id === 'low' ? renderAlertBadge(lowStockCount) : ''}
                        ${escapeValue(item.label)}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

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

export function renderMobileCategoryStock(materials) {
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
                        : compactVND(g.value);

                    return `
                        <div class="m-wh-group-item" onclick="showMobileStockByCategory('${encodeURIComponent(g.name)}')">
                            <div class="m-wh-group-img">
                                <img src="${getMaterialThumb(g.sample, g.name)}" alt="${escapeValue(g.name)}" onerror="this.style.display='none';this.parentElement.classList.add('fallback')">
                            </div>
                            <div class="m-wh-group-info">
                                <strong>${escapeValue(g.name)}</strong>
                                <small>${g.count} chủng loại</small>
                                <div><span style="width:${Math.max(8, g.value / maxValue * 100)}%"></span></div>
                            </div>
                            <div class="m-wh-group-value">
                                <strong>${unitText}</strong>
                                <small>${compactVND(g.value)}</small>
                            </div>
                            <em>›</em>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

export function installMobileHome(options) {
    deps = options || {};

    window.toggleMobileHomeTheme = function() {
        mobileHomeTheme = mobileHomeTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('steeltrack_mobile_theme', mobileHomeTheme);
        window.renderMobileViewOnly?.();
    };

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
                        ${QUICK_ACTION_DEFAULTS.map(item => `
                            <label class="m-quick-customize-item">
                                <span>
                                    ${mobileIcon(item.icon, item.label, escapeValue)}
                                    ${escapeValue(item.label)}
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
        const defaults = new Set(DEFAULT_VISIBLE_ACTIONS);
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
        window.renderMobileViewOnly?.();
    };
}
