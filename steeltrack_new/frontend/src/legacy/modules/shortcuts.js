import { state, escapeHtml } from './state.js';

export function initShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openCommandPalette();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            focusSearchInput();
        }
        if (e.altKey && e.key === 'm') { e.preventDefault(); if(window.switchPane) window.switchPane('entry'); }
        if (e.altKey && e.key === 'd') { e.preventDefault(); if(window.switchPane) window.switchPane('dashboard'); }
        if (e.altKey && e.key === 'p') { e.preventDefault(); if(window.switchPane) window.switchPane('projects'); }
        if (e.altKey && e.key === 's') { e.preventDefault(); if(window.switchPane) window.switchPane('suppliers'); }
        if (e.altKey && e.key === 'l') { e.preventDefault(); if(window.switchPane) window.switchPane('logs'); }
        if (e.altKey && e.key === 'c') { e.preventDefault(); if(window.switchPane) window.switchPane('settings'); }
        if (e.key === '?') { e.preventDefault(); showShortcutsHelp(); }
        if (e.key === 'Escape') {
            const palette = document.getElementById('desktop-command-palette');
            if (palette) { palette.remove(); return; }
            const modal = document.querySelector('.modal-overlay');
            if (modal) { const btn = modal.querySelector('.xbtn'); if(btn) btn.click(); }
        }
    });
}

function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function txnLabel(type) {
    if (type === 'purchase') return 'Phiếu nhập';
    if (type === 'usage') return 'Phiếu xuất';
    if (type === 'return') return 'Phiếu trả';
    if (type === 'transfer_sw') return 'Chuyển kho CK';
    if (type === 'structure_export') return 'Xuất cấu kiện';
    if (type === 'structure_return') return 'Trả cấu kiện';
    return type || 'Giao dịch';
}

function buildCommandResults(query = '') {
    const q = normalize(query);
    const rows = [];
    const push = row => {
        const haystack = normalize([row.title, row.subtitle, row.meta, row.id].join(' '));
        if (!q || haystack.includes(q)) rows.push(row);
    };

    (state.data.materials || []).forEach(m => push({
        type: 'Vật tư',
        id: m.id,
        title: m.name,
        subtitle: `${m.cat || 'Chưa phân nhóm'} · Tồn ${Number(m.qty || 0).toLocaleString('vi-VN')} ${m.unit || ''}`,
        meta: m.id,
        action: `window.switchPane && window.switchPane('entry'); setTimeout(() => window.openMaterialDrawer && window.openMaterialDrawer('${m.id}'), 120);`
    }));

    (state.data.transactions || []).slice(0, 300).forEach(t => {
        const mat = (state.data.materials || []).find(m => m.id === t.mid) || (state.data.structures || []).find(s => s.id === t.mid);
        push({
            type: txnLabel(t.type),
            id: t.id,
            title: `${txnLabel(t.type)} ${t.id || ''}`,
            subtitle: `${mat?.name || t.mid || 'N/A'} · ${Number(t.qty || 0).toLocaleString('vi-VN')} ${mat?.unit || ''}`,
            meta: String(t.date || t.datetime || '').slice(0, 10),
            action: mat && (state.data.materials || []).some(m => m.id === t.mid)
                ? `window.switchPane && window.switchPane('entry'); setTimeout(() => window.openMaterialDrawer && window.openMaterialDrawer('${t.mid}'), 120);`
                : `window.switchPane && window.switchPane('logs');`
        });
    });

    (state.data.projects || []).forEach(p => push({
        type: 'Công trình',
        id: p.id,
        title: p.name,
        subtitle: `Ngân sách ${Number(p.budget || 0).toLocaleString('vi-VN')} đ`,
        meta: p.status || p.id,
        action: `window.switchPane && window.switchPane('projects'); setTimeout(() => window.showProjectDetail && window.showProjectDetail('${p.id}'), 120);`
    }));

    (state.data.suppliers || []).forEach(s => push({
        type: 'Nhà cung cấp',
        id: s.id,
        title: s.name,
        subtitle: [s.phone, s.email].filter(Boolean).join(' · ') || 'Thông tin nhà cung cấp',
        meta: s.id,
        action: `window.switchPane && window.switchPane('suppliers'); setTimeout(() => window.showSupplierDetail && window.showSupplierDetail('${s.id}'), 120);`
    }));

    (state.data.structures || []).forEach(s => push({
        type: 'Cấu kiện',
        id: s.id,
        title: s.name,
        subtitle: `Tồn ${Number(s.qty || 0).toLocaleString('vi-VN')} ${s.unit || ''}`,
        meta: s.id,
        action: `window.switchPane && window.switchPane('structures'); setTimeout(() => window.showStructureDetail && window.showStructureDetail('${s.id}'), 120);`
    }));

    return rows.slice(0, 12);
}

function renderCommandResults(query = '') {
    const list = document.getElementById('command-palette-results');
    if (!list) return;
    const rows = buildCommandResults(query);
    list.innerHTML = rows.length ? rows.map((row, index) => `
        <button class="command-result ${index === 0 ? 'active' : ''}" data-action="${escapeHtml(row.action)}">
            <span>${escapeHtml(row.type)}</span>
            <strong>${escapeHtml(row.title || '')}</strong>
            <small>${escapeHtml(row.subtitle || '')}</small>
            <em>${escapeHtml(row.meta || '')}</em>
        </button>
    `).join('') : '<div class="command-empty">Không tìm thấy kết quả phù hợp</div>';

    list.querySelectorAll('.command-result').forEach(button => {
        button.onclick = function() {
            const action = this.dataset.action;
            document.getElementById('desktop-command-palette')?.remove();
            if (action) Function(action)();
        };
    });
}

function moveCommandSelection(delta) {
    const items = [...document.querySelectorAll('#command-palette-results .command-result')];
    if (!items.length) return;
    const current = Math.max(0, items.findIndex(item => item.classList.contains('active')));
    items[current]?.classList.remove('active');
    const next = (current + delta + items.length) % items.length;
    items[next].classList.add('active');
    items[next].scrollIntoView({ block: 'nearest' });
}

function openCommandPalette() {
    document.getElementById('desktop-command-palette')?.remove();
    const palette = document.createElement('div');
    palette.id = 'desktop-command-palette';
    palette.className = 'desktop-command-palette';
    palette.innerHTML = `
        <div class="command-backdrop" onclick="document.getElementById('desktop-command-palette')?.remove()"></div>
        <section class="command-panel">
            <div class="command-input-row">
                <span>⌕</span>
                <input id="command-palette-input" type="search" placeholder="Tìm vật tư, mã, phiếu nhập/xuất, công trình, cấu kiện, NCC..." autocomplete="off">
                <kbd>ESC</kbd>
            </div>
            <div id="command-palette-results" class="command-results"></div>
        </section>
    `;
    document.body.appendChild(palette);
    const input = document.getElementById('command-palette-input');
    input?.focus();
    renderCommandResults('');
    if (input) {
        input.oninput = () => renderCommandResults(input.value);
        input.onkeydown = e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); moveCommandSelection(1); }
            if (e.key === 'ArrowUp') { e.preventDefault(); moveCommandSelection(-1); }
            if (e.key === 'Enter') {
                e.preventDefault();
                document.querySelector('#command-palette-results .command-result.active')?.click();
            }
        };
    }
}

if (typeof window !== 'undefined') {
    window.openCommandPalette = openCommandPalette;
}

function focusSearchInput() {
    const inputs = ['mat-search-keyword', 'proj-search-keyword', 'sup-search-keyword'];
    for (const id of inputs) {
        const input = document.getElementById(id);
        if (input && input.offsetParent !== null) { input.focus(); input.select(); break; }
    }
}

function showShortcutsHelp() {
    const content = `<div class="modal-hd"><span class="modal-title">⌨️ PHÍM TẮT</span><button class="xbtn" onclick="closeModal()">✕</button></div>
        <div class="modal-bd"><table style="width:100%"><thead><tr><th>Phím</th><th>Chức năng</th></tr></thead>
        <tbody>
            <tr><td><kbd>Ctrl+K</kbd></td><td>🔍 Command palette</td></tr>
            <tr><td><kbd>Ctrl+F</kbd></td><td>🔎 Tìm trong trang hiện tại</td></tr>
            <tr><td><kbd>Alt+M</kbd></td><td>📦 Quản lý kho</td></tr>
            <tr><td><kbd>Alt+D</kbd></td><td>📊 Dashboard</td></tr>
            <tr><td><kbd>Alt+P</kbd></td><td>🏗️ Công trình</td></tr>
            <tr><td><kbd>Alt+S</kbd></td><td>🏭 Nhà cung cấp</td></tr>
            <tr><td><kbd>Alt+L</kbd></td><td>📋 Nhật ký</td></tr>
            <tr><td><kbd>Alt+C</kbd></td><td>⚙️ Cài đặt</td></tr>
            <tr><td><kbd>?</kbd></td><td>❓ Trợ giúp</td></tr>
            <tr><td><kbd>ESC</kbd></td><td>❌ Đóng modal</td></tr>
        </tbody></table></div>
        <div class="modal-ft"><button onclick="closeModal()">Đóng</button></div>`;
    if(window.showModal) window.showModal(content, null);
}
