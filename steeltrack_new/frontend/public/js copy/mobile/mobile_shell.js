import { mobileInlineIcon, mobileTitleIcon } from './mobile_icons.js';

let deps = {};
let sidebarOpen = false;

export function renderMobileTabBar(active = 'home') {
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

export function renderMobileActionSheet() {
    return `
        <div id="m-action-sheet" class="m-action-sheet" style="display:none;" onclick="hideMobileActions()">
            <div class="m-action-panel" style="max-height:82vh;overflow-y:auto;width:100%;" onclick="event.stopPropagation()">
                <div class="m-action-grabber"></div>
                <button onclick="hideMobileActions();showMobileImport()"><img class="m-inline-icon-img" src="/images/mobile-icons/logo-nhapkho.png" alt="">Nhập kho</button>
                <button onclick="hideMobileActions();showMobileExport()"><img class="m-inline-icon-img" src="/images/mobile-icons/logo-xuatkho.png" alt="">Xuất kho</button>
                <button onclick="hideMobileActions();showMobileReturn()"><img class="m-inline-icon-img" src="/images/mobile-icons/logo-trahang.png" alt="">Trả hàng</button>
                <button class="danger" onclick="hideMobileActions()">Đóng</button>
            </div>
        </div>
    `;
}

export function renderMobileSidebar(currentUser = {}) {
    return `
        <div class="m-sidebar-overlay ${sidebarOpen ? 'show' : ''}" onclick="toggleMSidebar()"></div>
        <div class="m-sidebar ${sidebarOpen ? 'open' : ''}">
            <div class="m-sidebar-header">
                <img src="/images/logo-tv.png" style="height:24px;">
                <span>TRÍ VIỆT STEEL</span>
            </div>
            <div class="m-sidebar-user">
                <div class="m-avatar">${esc(currentUser.name?.charAt(0) || 'U')}</div>
                <div>
                    <div class="m-uname">${esc(currentUser.name || 'User')}</div>
                    <div class="m-urole">${currentUser.role === 'admin' ? 'Admin' : 'Nhân viên'}</div>
                </div>
            </div>
            <div class="m-sidebar-nav">
                <div class="m-nav-item active" onclick="toggleMSidebar()">
                    <span><img src="/images/mobile-icons/logo-trangchu.png" alt=""></span><span>Trang chủ</span>
                </div>
                <div class="m-nav-item" onclick="toggleMSidebar();showMobileDashboard()">
                    <span><img src="/images/mobile-icons/logo-baocao.png" alt=""></span><span>Thống kê</span>
                </div>
                <div class="m-nav-item" onclick="toggleMSidebar();showMobileStock()">
                    <span><img src="/images/mobile-icons/logo-vattu.png" alt=""></span><span>Quản lý kho</span>
                </div>
                <div class="m-nav-item" onclick="toggleMSidebar();showMobileProjects()">
                    <span><img src="/images/mobile-icons/logo-tongcongtrinh.png" alt=""></span><span>Công trình</span>
                </div>
                <div class="m-nav-item" onclick="toggleMSidebar();showMobileLowStock()">
                    <span><img src="/images/mobile-icons/logo-chuongthongbao.png" alt=""></span><span>Sắp hết hàng</span>
                </div>
            </div>
            <div class="m-sidebar-footer">
                <div class="m-nav-item" onclick="logout()">
                    <span>🚪</span><span>Đăng xuất</span>
                </div>
            </div>
        </div>
    `;
}

export function resetMobileSidebar() {
    sidebarOpen = false;
}

export function fixAllModalHeight() {
    setTimeout(function() {
        const modals = document.querySelectorAll('.m-modal');
        modals.forEach(function(modal) {
            modal.style.height = window.innerHeight + 'px';
            modal.style.display = 'flex';
            modal.style.flexDirection = 'column';
        });
    }, 50);
}

export function loadMobileStylesheet(id, href, beforeIds = []) {
    if (document.getElementById(id)) return Promise.resolve();

    return new Promise(function(resolve, reject) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        const anchors = Array.isArray(beforeIds) ? beforeIds : [beforeIds];
        const before = anchors.map(anchorId => document.getElementById(anchorId)).find(Boolean);
        if (before && document.head.insertBefore) {
            document.head.insertBefore(link, before);
        } else {
            document.head.appendChild(link);
        }
    });
}

function esc(value) {
    return deps.escapeHtml ? deps.escapeHtml(value) : String(value ?? '');
}

function titleIcon(name, alt) {
    return mobileTitleIcon(name, alt, esc);
}

function inlineIcon(name, alt) {
    return mobileInlineIcon(name, alt, esc);
}

function mobileMoney(value) {
    return deps.formatMoneyVND ? deps.formatMoneyVND(Number(value || 0)) : Number(value || 0).toLocaleString('vi-VN');
}

function txnAmount(txn) {
    return Number(txn.totalAmount ?? txn.total_amount ?? 0);
}

function txnSupplierId(txn) {
    return String(txn.supplierId || txn.supplier_id || '');
}

function txnProjectId(txn) {
    return String(txn.projectId || txn.project_id || '');
}

function txnMaterialId(txn) {
    return String(txn.mid || txn.material_id || '');
}

function mobileThemeClass() {
    return 'm-wh-theme-' + (localStorage.getItem('steeltrack_mobile_theme') || 'light');
}

export function installMobileShell(options) {
    deps = options;

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

    window.showMobileMenu = function() {
        const menu = document.getElementById('m-menu');
        if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    };

    window.showMobileProfile = function() {
        const currentUser = deps.state.currentUser || {};
        const data = deps.state.data || {};
        const permissions = currentUser.permissions || {};
        const permissionLabels = [
            ['canImport', 'Nhập kho'],
            ['canExport', 'Xuất kho'],
            ['canCreateMaterial', 'Thêm vật tư'],
            ['canEditMaterial', 'Sửa vật tư'],
            ['canDeleteMaterial', 'Xóa vật tư'],
            ['canManageSupplier', 'Quản lý NCC'],
            ['canDeleteProject', 'Xóa công trình'],
            ['canAccessSettings', 'Cài đặt']
        ];
        const enabledPermissions = currentUser.role === 'admin'
            ? permissionLabels.map(item => item[1])
            : permissionLabels.filter(item => permissions[item[0]]).map(item => item[1]);
        const theme = localStorage.getItem('steeltrack_mobile_theme') || 'light';
        const quickActions = (() => {
            try {
                const saved = JSON.parse(localStorage.getItem('steeltrack_mobile_quick_actions') || '[]');
                return Array.isArray(saved) && saved.length ? saved.length : 8;
            } catch (e) {
                return 8;
            }
        })();
        const html = `
            <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-profile-modal">
                <div class="m-modal-hd">
                    <button class="m-back" onclick="renderMobileViewOnly()">←</button>
                    <span>👤 CÁ NHÂN</span>
                    <div></div>
                </div>

                <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;">
                    <div class="m-profile-hero">
                        <div class="m-profile-avatar">${esc(currentUser.name?.charAt(0) || 'U')}</div>
                        <div>
                            <h3>${esc(currentUser.name || 'User')}</h3>
                            <p>${currentUser.role === 'admin' ? 'Quản trị viên' : 'Nhân viên kho'}</p>
                            <span>${esc(currentUser.username || currentUser.id || '')}</span>
                        </div>
                    </div>

                    <div class="m-profile-grid">
                        <div><small>Vật tư</small><strong>${(data.materials || []).length}</strong></div>
                        <div><small>Công trình</small><strong>${(data.projects || []).length}</strong></div>
                        <div><small>NCC</small><strong>${(data.suppliers || []).length}</strong></div>
                        <div><small>Cấu kiện</small><strong>${(data.structures || []).length}</strong></div>
                    </div>

                    <div class="m-profile-section">
                        <div class="m-profile-section-title">Thiết lập mobile</div>
                        <button type="button" onclick="toggleMobileHomeTheme();setTimeout(showMobileProfile,0)">
                            <span>${theme === 'light' ? '☀️' : '🌙'} Giao diện</span>
                            <strong>${theme === 'light' ? 'Sáng' : 'Tối'}</strong>
                        </button>
                        <button type="button" onclick="showMobileQuickActionCustomize()">
                    <span>${inlineIcon('logo-xemthem.png', 'Thao tác nhanh')} Thao tác nhanh</span>
                            <strong>${quickActions} mục</strong>
                        </button>
                    </div>

                    <div class="m-profile-section">
                        <div class="m-profile-section-title">Lối tắt</div>
                        <button type="button" onclick="showMobileDashboard()"><span>📊 Báo cáo</span><strong>›</strong></button>
                        <button type="button" onclick="showMobileLowStock()"><span>${inlineIcon('logo-chuongthongbao.png', 'Cảnh báo')} Vật tư sắp hết</span><strong>›</strong></button>
                        <button type="button" onclick="showMobileSuppliers()"><span>${inlineIcon('logo-tongnhacungcap.png', 'Nhà cung cấp')} Nhà cung cấp</span><strong>›</strong></button>
                    </div>

                    <div class="m-profile-section">
                        <div class="m-profile-section-title">Quyền sử dụng</div>
                        <div class="m-profile-perms">
                            ${enabledPermissions.length ? enabledPermissions.map(label => `<span>${esc(label)}</span>`).join('') : '<em>Chưa có quyền thao tác</em>'}
                        </div>
                    </div>

                    <button class="m-submit danger" onclick="logout()">Đăng xuất</button>
                </div>

                ${renderMobileTabBar('profile')}
            </div>
        `;

        document.getElementById('root').innerHTML = html;
        fixAllModalHeight();
    };

    function structureTypeName(structure) {
        const text = `${structure.type || ''} ${structure.cat || ''} ${structure.name || ''}`.toLowerCase();
        if (text.includes('cột')) return 'Cột';
        if (text.includes('dầm')) return 'Dầm';
        if (text.includes('kèo')) return 'Kèo';
        if (text.includes('xà gồ')) return 'Xà gồ';
        if (text.includes('giằng')) return 'Giằng';
        if (text.includes('bản mã')) return 'Bản mã';
        return structure.type || 'Cấu kiện';
    }

    function structureMeta(structure) {
        const qty = Number(structure.qty || 0).toLocaleString('vi-VN');
        const unit = esc(structure.unit || 'cái');
        const type = esc(structureTypeName(structure));
        const value = deps.formatMoneyVND ? deps.formatMoneyVND(Number(structure.qty || 0) * Number(structure.cost || 0)) : Number(Number(structure.qty || 0) * Number(structure.cost || 0)).toLocaleString('vi-VN');
        return `${type} · Tồn: ${qty} ${unit} · ${value}`;
    }

    window.showMobileStructures = function() {
        loadMobileStylesheet('mobile-stock-css', 'css/mobile/mobile-stock.css', 'mobile-home-css').catch(function() {});
        const structures = deps.state.data.structures || [];
        const html = `
            <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-structure-modal">
                <div class="m-modal-hd">
                    <button class="m-back" onclick="renderMobileViewOnly()">←</button>
                    <span>${titleIcon('logo-tongcaukien.png', 'Cấu kiện')} CẤU KIỆN (${structures.length})</span>
                    <div></div>
                </div>

                <div class="m-modal-bd" style="padding:12px;">
                    <input type="text" id="mstr-search" class="m-search" placeholder="Tìm cấu kiện..." oninput="filterMobileStructures()">
                </div>

                <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;" id="mstr-list">
                    ${structures.length ? structures.map(function(s) {
                        return `
                            <div class="m-stock-item"
                                 data-name="${esc(`${s.name || ''} ${structureTypeName(s)}`).toLowerCase()}"
                                 onclick="showMobileStructureDetail('${esc(s.id)}')">
                                <div class="m-stock-info">
                                    <div class="m-stock-name">${esc(s.name || 'N/A')}</div>
                                    <div class="m-stock-meta">${structureMeta(s)}</div>
                                </div>
                                <div class="m-material-status">${Number(s.qty || 0).toLocaleString('vi-VN')} ${esc(s.unit || '')}</div>
                            </div>
                        `;
                    }).join('') : '<div class="m-empty">Chưa có cấu kiện</div>'}
                </div>

                ${renderMobileActionSheet()}
                ${renderMobileTabBar('stock')}
            </div>
        `;

        document.getElementById('root').innerHTML = html;
        fixAllModalHeight();
    };

    window.showMobileStructureDetail = function(structureId) {
        const structure = (deps.state.data.structures || []).find(s => String(s.id) === String(structureId));
        if (!structure) {
            alert('Không tìm thấy cấu kiện!');
            return;
        }

        const txns = (deps.state.data.transactions || [])
            .filter(t => String(t.mid || t.material_id || '') === String(structureId))
            .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));
        const produced = txns.filter(t => t.type === 'produce').reduce((sum, t) => sum + Number(t.qty || 0), 0);
        const exported = txns.filter(t => t.type === 'structure_export').reduce((sum, t) => sum + Number(t.qty || 0), 0);
        const returned = txns.filter(t => t.type === 'structure_return').reduce((sum, t) => sum + Number(t.qty || 0), 0);
        const stockValue = Number(structure.qty || 0) * Number(structure.cost || 0);
        const money = mobileMoney(stockValue);
        const rows = txns.slice(0, 20).map(function(t) {
            const label = t.type === 'produce' ? 'Sản xuất' : t.type === 'structure_return' ? 'Trả về' : 'Xuất CT';
            const time = new Date(t.datetime || t.date).toLocaleDateString('vi-VN');
            const tone = t.type === 'structure_return' ? 'success' : t.type === 'structure_export' ? 'danger' : '';
            return `
                <div class="m-material-txn">
                    <div class="m-txn-icon">${label.charAt(0)}</div>
                    <div>
                        <strong>${esc(label)}</strong>
                        <small>${time} · ${Number(t.qty || 0).toLocaleString('vi-VN')} ${esc(structure.unit || '')}</small>
                        <span class="${tone}">${mobileMoney(txnAmount(t))}</span>
                    </div>
                </div>
            `;
        }).join('') || '<div class="m-empty">Chưa có giao dịch cấu kiện</div>';

        const html = `
            <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-structure-detail-modal">
                <div class="m-modal-hd">
                    <button class="m-back" onclick="showMobileStructures()">←</button>
                    <span>${titleIcon('logo-tongcaukien.png', 'Cấu kiện')} ${esc(structure.name || 'Cấu kiện')}</span>
                    <div></div>
                </div>

                <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px;">
                    <div class="m-material-hero safe">
                        <div>
                            <small>${esc(structureTypeName(structure))}</small>
                            <strong>${Number(structure.qty || 0).toLocaleString('vi-VN')} ${esc(structure.unit || '')}</strong>
                            <span>Giá trị tồn: ${money}</span>
                        </div>
                        <div class="m-material-status">Tồn kho</div>
                    </div>

                    <div class="m-material-kpis">
                        <div class="usage"><small>Đã SX</small><strong>${Number(produced).toLocaleString('vi-VN')} ${esc(structure.unit || '')}</strong></div>
                        <div class="return"><small>Đã xuất</small><strong>${Number(exported).toLocaleString('vi-VN')} ${esc(structure.unit || '')}</strong></div>
                        <div class="net"><small>Đã trả</small><strong>${Number(returned).toLocaleString('vi-VN')} ${esc(structure.unit || '')}</strong></div>
                    </div>

                    <div class="m-section-title">${inlineIcon('logo-tongcaukien.png', 'Cấu kiện')} GIAO DỊCH CẤU KIỆN</div>
                    <div class="m-project-detail-list">${rows}</div>
                </div>

                ${renderMobileActionSheet()}
                ${renderMobileTabBar('stock')}
            </div>
        `;

        document.getElementById('root').innerHTML = html;
        fixAllModalHeight();
    };

    window.filterMobileStructures = function() {
        const kw = document.getElementById('mstr-search')?.value?.toLowerCase() || '';
        document.querySelectorAll('#mstr-list .m-stock-item').forEach(function(el) {
            el.style.display = (el.dataset.name || '').includes(kw) ? '' : 'none';
        });
    };

    window.showMobileSuppliers = function() {
        loadMobileStylesheet('mobile-stock-css', 'css/mobile/mobile-stock.css', 'mobile-home-css').catch(function() {});
        const suppliers = deps.state.data.suppliers || [];
        let html = `
            <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-supplier-modal">
                <div class="m-modal-hd">
                    <button class="m-back" onclick="renderMobileViewOnly()">←</button>
                    <span>${titleIcon('logo-tongnhacungcap.png', 'Nhà cung cấp')} NHÀ CUNG CẤP (${suppliers.length})</span>
                    <div></div>
                </div>
                <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;">
        `;

        if (!suppliers.length) {
            html += '<div class="m-empty">Chưa có nhà cung cấp</div>';
        } else {
            suppliers.forEach(function(s) {
                html += `
                    <div class="m-stock-item" onclick="showMobileSupplierDetail('${esc(s.id)}')">
                        <div class="m-stock-info">
                            <div class="m-stock-name">${esc(s.name)}</div>
                            <div class="m-stock-meta">${esc(s.phone || s.email || s.address || '')}</div>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>${renderMobileTabBar('home')}</div>`;
        document.getElementById('root').innerHTML = html;
        fixAllModalHeight();
    };

    window.showMobileSupplierDetail = function(supplierId) {
        const supplier = (deps.state.data.suppliers || []).find(s => String(s.id) === String(supplierId));
        if (!supplier) {
            alert('Không tìm thấy nhà cung cấp!');
            return;
        }

        const materials = deps.state.data.materials || [];
        const txns = (deps.state.data.transactions || [])
            .filter(t => txnSupplierId(t) === String(supplierId) && t.type === 'purchase')
            .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));
        const totalValue = txns.reduce((sum, t) => sum + txnAmount(t), 0);
        const totalQty = txns.reduce((sum, t) => sum + Number(t.qty || 0), 0);
        const materialCount = new Set(txns.map(t => txnMaterialId(t))).size;
        const latestTxn = txns[0];
        const latestText = latestTxn ? new Date(latestTxn.datetime || latestTxn.date).toLocaleDateString('vi-VN') : 'Chưa nhập';
        const rows = txns.slice(0, 20).map(function(t) {
            const material = materials.find(m => String(m.id) === txnMaterialId(t));
            const time = new Date(t.datetime || t.date).toLocaleDateString('vi-VN');
            return `
                <div class="m-material-txn">
                    <div class="m-txn-icon">N</div>
                    <div>
                        <strong>${esc(material?.name || 'Vật tư')}</strong>
                        <small>${time} · ${Number(t.qty || 0).toLocaleString('vi-VN')} ${esc(material?.unit || '')}</small>
                        <span class="success">${mobileMoney(txnAmount(t))}</span>
                    </div>
                </div>
            `;
        }).join('') || '<div class="m-empty">Chưa có giao dịch nhập từ nhà cung cấp này</div>';

        const html = `
            <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-supplier-detail-modal">
                <div class="m-modal-hd">
                    <button class="m-back" onclick="showMobileSuppliers()">←</button>
                    <span>${titleIcon('logo-tongnhacungcap.png', 'Nhà cung cấp')} ${esc(supplier.name || 'Nhà cung cấp')}</span>
                    <div></div>
                </div>

                <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px;">
                    <div class="m-material-hero safe">
                        <div>
                            <small>${esc(supplier.phone || supplier.email || 'Nhà cung cấp')}</small>
                            <strong>${mobileMoney(totalValue)}</strong>
                            <span>Lần nhập gần nhất: ${esc(latestText)}</span>
                        </div>
                        <div class="m-material-status">NCC</div>
                    </div>

                    <div class="m-material-kpis">
                        <div class="usage"><small>Đơn nhập</small><strong>${txns.length}</strong></div>
                        <div class="return"><small>Vật tư</small><strong>${materialCount}</strong></div>
                        <div class="net"><small>Tổng SL</small><strong>${Number(totalQty).toLocaleString('vi-VN')}</strong></div>
                    </div>

                    <div class="m-project-detail-actions">
                        <button onclick="showMobileImport()">${inlineIcon('logo-nhapkho.png', 'Nhập kho')} Nhập từ NCC</button>
                        <button onclick="showMobileSuppliers()">${inlineIcon('logo-tongnhacungcap.png', 'Nhà cung cấp')} Danh sách NCC</button>
                    </div>

                    <div class="m-section-title">${inlineIcon('logo-nhapkho.png', 'Nhập kho')} LỊCH SỬ NHẬP HÀNG</div>
                    <div class="m-project-detail-list">${rows}</div>
                </div>

                ${renderMobileActionSheet()}
                ${renderMobileTabBar('home')}
            </div>
        `;

        document.getElementById('root').innerHTML = html;
        fixAllModalHeight();
    };
}
