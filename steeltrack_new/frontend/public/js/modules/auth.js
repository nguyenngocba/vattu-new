import { state, addLog, escapeHtml } from './state.js';

export function renderLogin() {
  // Lấy chế độ đã lưu (mặc định desktop)
  const savedMode = localStorage.getItem('steeltrack_ui_mode') || 'desktop';
  
  return `<div class="login-wrap"><div class="login-card">
    <div style="text-align:center;margin-bottom:24px;">
        <img src="/images/logo.png" alt="TRIVIET STEEL" style="max-width:200px;height:auto;">
    </div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:28px;text-align:center;">Quản lý kho & Công trình & Nhà cung cấp</div>
    
    <div class="form-group"><label class="form-label">Tài khoản</label><input type="text" id="login-username" placeholder="Nhập tài khoản..." autocomplete="off"></div>
    <div class="form-group"><label class="form-label">Mật khẩu</label><input type="password" id="login-password" placeholder="Nhập mật khẩu..." autocomplete="off"></div>
    
    <!-- Chọn giao diện -->
    <div class="form-group">
        <label class="form-label">Giao diện</label>
        <div class="login-mode-options">
            <label class="login-mode-option">
                <input type="radio" name="ui_mode" value="desktop" ${savedMode === 'desktop' ? 'checked' : ''}>
                <span>Desktop</span>
            </label>
            <label class="login-mode-option">
                <input type="radio" name="ui_mode" value="mobile" ${savedMode === 'mobile' ? 'checked' : ''}>
                <span>Mobile</span>
            </label>
        </div>
    </div>
    
    <div id="login-error" style="color:var(--danger-text);font-size:12px;margin-bottom:12px;display:none;text-align:center;"></div>
    <button class="primary" onclick="window.doLogin()" style="width:100%;padding:12px;font-size:14px;font-weight:600;">Đăng nhập</button>
  </div></div>`;
}
window.doLogin = async function() {
  const username = document.getElementById('login-username')?.value?.trim();
  const password = document.getElementById('login-password')?.value || '';
  const selectedMode = document.querySelector('input[name="ui_mode"]:checked')?.value || 'desktop';

  localStorage.setItem('steeltrack_ui_mode', selectedMode);

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.error || 'Sai tài khoản hoặc mật khẩu');
    return;
  }

  window.login(data.user.id, data.user);
};




document.addEventListener('keydown', function(e) { if (e.key === 'Enter' && document.getElementById('login-username')) window.doLogin(); });

export function login(uid) { state.currentUser = state.data.users.find(u => u.id === uid); addLog('Đăng nhập', 'Đăng nhập thành công'); state.currentPane = 'dashboard'; if (window.render) window.render(); }
export function logout() { 
    localStorage.removeItem('steeltrack_current_user');
    localStorage.removeItem('steeltrack_ui_mode'); // Xóa luôn chế độ giao diện
    state.currentUser = null; 
    addLog('Đăng xuất', 'Đăng xuất'); 
    if (window.render) window.render(); 
}
export function switchPane(pane) { state.currentPane = pane; if (window.render) window.render(); }
export function setCurrentUser(user) { state.currentUser = user; }
export function getCurrentUser() { return state.currentUser; }

function formatSidebarDate(dateTimeStr) {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function renderSidebarActivity() {
  const rows = [...(state.data.transactions || [])]
    .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date))
    .slice(0, 5);
  const typeMeta = {
    purchase: ['Nhập kho', 'good'],
    usage: ['Xuất kho', 'warn'],
    return: ['Trả hàng', 'cyan'],
    transfer_sw: ['Chuyển kho', 'purple'],
    return_from_sw: ['Trả kho', 'cyan']
  };

  return `<section class="sidebar-activity">
    <div class="sidebar-activity-head">
      <div>
        <strong>Hoạt động gần đây</strong>
        <small>${rows.length} giao dịch mới nhất</small>
      </div>
      <button type="button" title="Xem nhật ký" onclick="switchPane('logs')">›</button>
    </div>
    <div class="sidebar-activity-list">
      ${rows.length ? rows.map(t => {
        const mat = (state.data.materials || []).find(m => String(m.id) === String(t.mid));
        const [label, tone] = typeMeta[t.type] || [t.type || 'Giao dịch', 'blue'];
        const qty = Number(t.qty || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
        const materialName = mat?.name || t.mid || 'N/A';
        const unit = mat?.unit || '';
        const midArg = JSON.stringify(String(t.mid || ''));
        return `<button type="button" class="sidebar-activity-item ${tone}" onclick="switchPane('entry'); setTimeout(function(){ window.openMaterialDrawer && window.openMaterialDrawer(${midArg}); }, 80);">
          <b></b>
          <span>
            <strong>${escapeHtml(label)}</strong>
            <small>${escapeHtml(materialName)}</small>
          </span>
          <em>${qty} ${escapeHtml(unit)} · ${formatSidebarDate(t.datetime || t.date)}</em>
        </button>`;
      }).join('') : '<div class="sidebar-activity-empty">Chưa có giao dịch</div>'}
    </div>
  </section>`;
}

export function renderSidebar() {
  const hasAccessSettings = state.currentUser?.permissions?.canAccessSettings || state.currentUser?.role === 'admin';
  const isCollapsed = localStorage.getItem('steeltrack_sidebar_collapsed') === 'true';
  
  return `<div class="sidebar ${isCollapsed ? 'collapsed' : ''}">
    <div class="sidebar-logo" onclick="if(document.querySelector('.sidebar').classList.contains('collapsed')) toggleSidebar()">
        <img src="/images/logo.png" alt="LOGO" class="logo-full" style="height:32px;width:auto;">
        <img src="/images/logo-tv.png" alt="LOGO" class="logo-mini" style="height:32px;width:auto;">
        <button class="sidebar-toggle-btn" type="button" aria-label="${isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}" onclick="event.stopPropagation();toggleSidebar()"></button>
    </div>
    <div class="sidebar-user">
        <div class="uname">${escapeHtml(state.currentUser.name)}</div>
        <div class="urole">${state.currentUser.role === 'admin' ? 'Quản trị viên' : 'Nhân viên kho'}</div>
    </div>
    <div class="sidebar-nav">
        <div class="nav-item ${state.currentPane === 'dashboard' ? 'active' : ''}" onclick="switchPane('dashboard')">
            <img src="/images/logo-tk.png" class="nav-icon" style="width:24px;height:24px;">
            <span>Thống kê</span>
        </div>
        <div class="nav-item ${state.currentPane === 'entry' ? 'active' : ''}" onclick="switchPane('entry')">
            <img src="/images/logo-qlk.png" class="nav-icon" style="width:24px;height:24px;">
            <span>Quản lý kho</span>
        </div>
        <div class="nav-item ${state.currentPane === 'structures' ? 'active' : ''}" onclick="switchPane('structures')">
            <img src="/images/logo-ck.png" class="nav-icon" style="width:24px;height:24px;">
            <span>Cấu kiện</span>
        </div>
        <div class="nav-item ${state.currentPane === 'projects' ? 'active' : ''}" onclick="switchPane('projects')">
            <img src="/images/logo-ct.png" class="nav-icon" style="width:24px;height:24px;">
            <span>Công trình</span>
        </div>
        <div class="nav-item ${state.currentPane === 'suppliers' ? 'active' : ''}" onclick="switchPane('suppliers')">
            <img src="/images/logo-ncc.png" class="nav-icon" style="width:24px;height:24px;">
            <span>Nhà cung cấp</span>
        </div>
        <div class="nav-item ${state.currentPane === 'logs' ? 'active' : ''}" onclick="switchPane('logs')">
            <img src="/images/logo-nk.png" class="nav-icon" style="width:24px;height:24px;">
            <span>Nhật ký</span>
        </div>
        ${hasAccessSettings ? `<div class="nav-item ${state.currentPane === 'settings' ? 'active' : ''}" onclick="switchPane('settings')">
            <img src="/images/logo-cd.png" class="nav-icon" style="width:24px;height:24px;">
            <span>Cài đặt</span>
        </div>` : ''}
    </div>
    ${renderSidebarActivity()}
    <div class="sidebar-bottom">
        <button onclick="logout()" style="width:100%">
            <span>🚪 Đăng xuất</span>
        </button>
    </div>
  </div>`;
}
export function renderTopbar() {
  let btns = '';
  const hasPermission = (perm) => state.currentUser?.permissions?.[perm] === true || state.currentUser?.role === 'admin';
  if (state.currentPane === 'entry') btns = `${hasPermission('canCreateMaterial') ? '<button class="sm" onclick="openMatModal()">+ Thêm vật tư</button>' : ''} ${hasPermission('canImport') ? '<button class="sm primary" onclick="openPurchaseModal()">📥 Nhập kho</button>' : ''} ${hasPermission('canExport') ? '<button class="sm" onclick="openTxnModal(\'usage\')">📤 Xuất kho</button>' : ''} <button class="sm" onclick="window.openTransferToSW()">📦 Chuyển kho CK</button> <button class="sm" onclick="showImportModal(\'materials\', () => window.render())">📂 Import Excel</button> <button class="sm" onclick="exportToExcel(\'materials\')">📎 Export Excel</button>`;
  if (state.currentPane === 'projects') btns = `${hasPermission('canCreateMaterial') ? '<button class="sm primary" onclick="openProjectModal()">+ Công trình mới</button>' : ''} <button class="sm" onclick="showImportModal('projects', () => window.render())">📂 Import Excel</button> <button class="sm" onclick="exportAllProjectsReport()">📎 Export Excel</button>`;
  if (state.currentPane === 'dashboard') btns = '';
  if (state.currentPane === 'suppliers') btns = `${hasPermission('canManageSupplier') ? '<button class="sm primary" onclick="openSupplierModal()">+ Nhà cung cấp mới</button>' : ''} <button class="sm" onclick="showImportModal('suppliers', () => window.render())">📂 Import Excel</button> <button class="sm" onclick="exportAllSuppliersReport()">📎 Export Excel</button>`;
  const userName = escapeHtml(state.currentUser?.name || 'Người dùng');
  const canOpenSettings = state.currentUser?.permissions?.canAccessSettings || state.currentUser?.role === 'admin';
  const lowCount = (state.data.materials || []).filter(m => Number(m.qty || 0) <= Number(m.low || 0)).length;
  const todayText = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dashboardTools = state.currentPane === 'dashboard' ? `
        <label class="desktop-top-search" title="Tìm kiếm vật tư">
            <span>⌕</span>
            <input type="search" placeholder="Tìm kiếm vật tư, mã, phiếu nhập, công trình..." onfocus="window.openCommandPalette && window.openCommandPalette()" onclick="window.openCommandPalette && window.openCommandPalette()" readonly>
        </label>
        <button type="button" class="desktop-date-chip" title="Bộ lọc thời gian" onclick="document.getElementById('fover-date-from')?.focus()">
            <span>▣</span><strong>${todayText}</strong>
        </button>
  ` : '';
  const quickSearchButton = state.currentPane === 'dashboard' ? '' : '<button type="button" class="desktop-icon-btn" aria-label="Tìm kiếm toàn hệ thống" title="Tìm kiếm toàn hệ thống" onclick="window.openCommandPalette && window.openCommandPalette()">⌕</button>';
  return `<div class="topbar">
    <span class="topbar-title"><strong>${getPaneTitle()}</strong><small>Tổng quan kho vật tư</small></span>
    <div class="topbar-actions">
        ${dashboardTools}
        <div class="topbar-buttons">${btns}</div>
        ${quickSearchButton}
        <button type="button" class="desktop-icon-btn desktop-notify-btn" aria-label="Vật tư cảnh báo" title="Vật tư cảnh báo" onclick="window.showDesktopLowStockMaterials && window.showDesktopLowStockMaterials()">
            ⚠
            ${lowCount ? `<span>${lowCount > 99 ? '99+' : lowCount}</span>` : ''}
        </button>
        <button type="button" class="desktop-user-chip" aria-label="Tài khoản người dùng" title="${canOpenSettings ? 'Mở cài đặt tài khoản' : 'Tài khoản'}" onclick="${canOpenSettings ? "switchPane('settings')" : "switchPane('dashboard')"}">
            <span>${userName.charAt(0).toUpperCase()}</span>
            <strong>${userName}</strong>
        </button>
    </div>
  </div>`;
}

export function getPaneTitle() {
  const titles = { entry: 'Quản lý tồn kho', dashboard: 'Bảng điều khiển trung tâm', projects: 'Quản lý công trình', suppliers: 'Quản lý nhà cung cấp', logs: 'Nhật ký hệ thống', settings: 'Cấu hình hệ thống' };
  return titles[state.currentPane] || '';
}

let currentModalCallback = null;
export function showModal(html, callback) { currentModalCallback = callback; const modalArea = document.getElementById('modal-area'); if (modalArea) modalArea.innerHTML = `<div class="modal-overlay"><div class="modal">${html}</div></div>`; }
export async function closeModal() {
    if (window.cleanupUploadedFiles) {
        await window.cleanupUploadedFiles();
    }

    const modalArea = document.getElementById('modal-area');
    if (modalArea) modalArea.innerHTML = '';

    if (currentModalCallback) currentModalCallback();
    currentModalCallback = null;
}
