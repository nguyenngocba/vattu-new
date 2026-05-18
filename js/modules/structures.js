import { state, saveState, addLog, escapeHtml, showModal, closeModal } from './state.js';
import { formatMoneyVND, setupNumberInput, getNumberFromInput, renderAttachmentLinks } from './utils.js';
let structureListContainer = null;
const STRUCTURE_PAGE_SIZES = [10, 50, 100, 200];
const YARD_COLUMNS = 'ABCDEFGHIJK'.split('');
const YARD_ROWS = 50;
const YARD_MAX_LAYER = 4;
const YARD_MAX_STACK_HEIGHT = 9;
const YARD_MAX_STACK_WEIGHT = 24000;
window.structurePaging = window.structurePaging || {
    structures: { page: 1, size: 10 },
    sw: { page: 1, size: 10 }
};

function escapeAttr(value) {
    return String(value ?? '').replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
}

function num(value) {
    return Number(value || 0);
}

function structureTxns(sid) {
    return (state.data.transactions || [])
        .filter(t => String(t.mid) === String(sid) && ['produce', 'structure_export', 'structure_return'].includes(t.type))
        .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));
}

function getStructureProjectName(s) {
    return state.data.projects?.find(p => String(p.id) === String(s.projectId))?.name || s.projectName || 'Chưa gán';
}

function getStructureYard(s) {
    const zone = YARD_COLUMNS.includes(String(s.zone || '').toUpperCase()) ? String(s.zone).toUpperCase() : null;
    const positionX = zone ? YARD_COLUMNS.indexOf(zone) : Math.abs(String(s.id || s.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % YARD_COLUMNS.length;
    const positionY = Math.min(YARD_ROWS - 1, Math.max(0, Number(s.position_y ?? s.positionY ?? 0) || (Math.abs(String(s.name || '').length * 7) % YARD_ROWS)));
    return {
        zone: zone || YARD_COLUMNS[positionX],
        positionX,
        positionY,
        layer: Math.max(1, Math.min(YARD_MAX_LAYER, Number(s.layer || 1))),
        rotation: Number(s.rotation || 0),
        length: Number(s.length || s.length_m || 6),
        width: Number(s.width || s.width_m || 1.2),
        height: Number(s.height || s.height_m || .8),
        weight: Number(s.weight || 1200)
    };
}

function yardCellKey(yard) {
    return `${yard.zone}${yard.positionY + 1}`;
}

function yardOccupancy() {
    const structures = state.data.structures || [];
    const cells = new Map();
    structures.forEach(s => {
        const yard = getStructureYard(s);
        const key = yardCellKey(yard);
        if (!cells.has(key)) cells.set(key, { key, zone: yard.zone, row: yard.positionY + 1, qty: 0, weight: 0, layers: new Set(), items: [] });
        const cell = cells.get(key);
        cell.qty += Number(s.qty || 0);
        cell.weight += Number(s.qty || 0) * yard.weight;
        cell.layers.add(yard.layer);
        cell.items.push(s);
    });
    const occupied = cells.size;
    const total = YARD_COLUMNS.length * YARD_ROWS;
    const congested = [...cells.values()].filter(c => c.layers.size >= YARD_MAX_LAYER || c.weight > YARD_MAX_STACK_WEIGHT || c.items.length >= 4).length;
    return { cells, occupied, total, percent: total ? occupied / total * 100 : 0, congested };
}

function yardWarnings(s) {
    const yard = getStructureYard(s);
    const cell = yardOccupancy().cells.get(yardCellKey(yard));
    const warnings = [];
    if (yard.layer > YARD_MAX_LAYER) warnings.push('Stack vượt số tầng');
    if (yard.height * yard.layer > YARD_MAX_STACK_HEIGHT) warnings.push('Vượt chiều cao stack');
    if (cell && cell.weight > YARD_MAX_STACK_WEIGHT) warnings.push('Cell vượt tải trọng');
    const mixedTypes = new Set((cell?.items || []).map(item => String(item.type || item.name || '').split(/\s+/)[0]));
    if (mixedTypes.size > 1) warnings.push('Stack nhiều loại cấu kiện');
    return warnings;
}

function structureStatus(s) {
    if (Number(s.qty || 0) <= 0) return { label: 'Hết tồn', cls: 'danger' };
    const warnings = yardWarnings(s);
    if (warnings.length) return { label: 'Cần kiểm tra', cls: 'warn' };
    if (s.projectId) return { label: 'Đã gán CT', cls: 'purple' };
    return { label: 'Sẵn sàng', cls: 'good' };
}

function formatStructureDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return escapeHtml(String(value));
    return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function structureTypeName(s) {
    const text = `${s.type || ''} ${s.cat || ''} ${s.name || ''}`.toLowerCase();
    if (text.includes('cột')) return 'Cột';
    if (text.includes('dầm')) return 'Dầm';
    if (text.includes('kèo')) return 'Kèo';
    if (text.includes('xà gồ') || text.includes('xa go')) return 'Xà gồ';
    if (text.includes('bản mã') || text.includes('ban ma')) return 'Bản mã';
    return s.type || s.cat || 'Cấu kiện';
}

function structureTotals() {
    const structures = state.data.structures || [];
    const txns = state.data.transactions || [];
    const produced = txns.filter(t => t.type === 'produce').reduce((sum, t) => sum + num(t.qty), 0);
    const exported = txns.filter(t => t.type === 'structure_export').reduce((sum, t) => sum + num(t.qty), 0);
    const returned = txns.filter(t => t.type === 'structure_return').reduce((sum, t) => sum + num(t.qty), 0);
    const stock = structures.reduce((sum, s) => sum + num(s.qty), 0);
    const value = structures.reduce((sum, s) => sum + num(s.qty) * num(s.cost), 0);
    return { produced, exported, returned, stock, value };
}

function renderYardDashboard(structures) {
    const occupancy = yardOccupancy();
    const warnings = structures.reduce((sum, s) => sum + (yardWarnings(s).length ? 1 : 0), 0);
    const totalStock = structures.reduce((sum, s) => sum + num(s.qty), 0);
    const value = structures.reduce((sum, s) => sum + num(s.qty) * num(s.cost), 0);

    return `
        <div class="card component-yard-card">
            <div class="sec-title component-yard-title">
                <span>🗺️ SMART COMPONENT YARD</span>
                <div class="component-yard-actions">
                    <button class="sm" onclick="window.drawComponentYardMap()">Toàn yard</button>
                    <button class="sm" onclick="window.setComponentYardView('top')">Top view</button>
                    <button class="sm" onclick="window.setComponentYardView('side')">Side view</button>
                </div>
            </div>
            <div class="component-yard-kpis">
                <div><small>% sử dụng yard</small><strong>${occupancy.percent.toFixed(1)}%</strong><span>${occupancy.occupied}/${occupancy.total} ô đang dùng</span></div>
                <div><small>Tồn cấu kiện</small><strong>${Number(totalStock).toLocaleString('vi-VN')}</strong><span>${structures.length} loại cấu kiện</span></div>
                <div><small>Giá trị tồn</small><strong>${formatMoneyVND(value)}</strong><span>Theo đơn giá BOM</span></div>
                <div><small>Cảnh báo yard</small><strong>${warnings}</strong><span>${occupancy.congested} cell cần kiểm tra</span></div>
            </div>
            <div class="component-yard-shell">
                <aside class="component-yard-panel">
                    <label>Tìm cấu kiện</label>
                    <div class="component-yard-search">
                        <input id="component-yard-search" placeholder="Nhập mã, tên, vị trí..." onkeydown="if(event.key==='Enter') window.searchComponentYard()">
                        <button class="sm primary" onclick="window.searchComponentYard()">Tìm</button>
                    </div>
                    <div class="component-yard-legend">
                        <span><b class="empty"></b>Trống</span>
                        <span><b class="ok"></b>Có cấu kiện</span>
                        <span><b class="warn"></b>Sắp đầy</span>
                        <span><b class="danger"></b>Cảnh báo</span>
                        <span><b class="active"></b>Đang chọn</span>
                    </div>
                    <p>Grid yard: trục ngang A-K, trục dọc 1-50. Click vào cell để xem cấu kiện và stack layer.</p>
                </aside>
                <section class="component-yard-map-wrap">
                    <canvas id="component-yard-canvas" width="1120" height="520"></canvas>
                </section>
                <aside class="component-yard-panel" id="component-yard-detail">
                    <h3>Chưa chọn cấu kiện</h3>
                    <p>Chọn một ô trên bản đồ hoặc tìm cấu kiện để xem vị trí, layer, cảnh báo và thao tác nhanh.</p>
                </aside>
            </div>
        </div>
    `;
}
function getStructurePaging(key) {
    if (!window.structurePaging[key]) {
        window.structurePaging[key] = { page: 1, size: 10 };
    }
    return window.structurePaging[key];
}
function getStructurePage(key, rows) {
    const paging = getStructurePaging(key);
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
function renderStructurePageSize(key, pageData) {
    return `
        <div style="display:flex;align-items:center;gap:8px;">
            <span class="metric-sub">Hiển thị:</span>
            <select onchange="window.setStructurePageSize('${key}', this.value)" style="width:80px;">
                ${STRUCTURE_PAGE_SIZES.map(size => `<option value="${size}" ${pageData.size === size ? 'selected' : ''}>${size}</option>`).join('')}
            </select>
        </div>
    `;
}
function renderStructurePager(key, pageData, label) {
    return `
        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-top:12px;padding:8px 0;">
            <div style="text-align:left;">
                <button class="sm" onclick="window.setStructurePage('${key}', ${pageData.page - 1})" ${pageData.page <= 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>◀ Trang trước</button>
            </div>
            <span class="metric-sub" style="text-align:center;">Trang ${pageData.page} / ${pageData.totalPages} (${pageData.totalItems} ${label})</span>
            <div style="text-align:right;">
                <button class="sm" onclick="window.setStructurePage('${key}', ${pageData.page + 1})" ${pageData.page >= pageData.totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Trang sau ▶</button>
            </div>
        </div>
    `;
}
window.setStructurePageSize = function(key, size) {
    const paging = getStructurePaging(key);
    paging.size = Number(size) || 10;
    paging.page = 1;

    if (key.startsWith('sw_detail_')) {
        window.showSWDetail(key.replace('sw_detail_', ''));
    } else if (key.startsWith('structure_detail_')) {
        window.showStructureDetail(key.replace('structure_detail_', ''));
    } else if (window.render) {
        window.render();
    }
};
window.setStructurePage = function(key, page) {
    const paging = getStructurePaging(key);
    paging.page = Number(page) || 1;

    if (key.startsWith('sw_detail_')) {
        window.showSWDetail(key.replace('sw_detail_', ''));
    } else if (key.startsWith('structure_detail_')) {
        window.showStructureDetail(key.replace('structure_detail_', ''));
    } else if (window.render) {
        window.render();
    }
};



export function renderStructures() {
    const structures = state.data.structures || [];
    const structurePage = getStructurePage('structures', structures);
    const displayStructures = structurePage.rows;

    let html = renderYardDashboard(structures);

    html += `<div class="card">
        <div class="sec-title" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
    <span>🏗️ DANH SÁCH CẤU KIỆN</span>
    <div style="display:flex;align-items:center;gap:10px;margin-left:auto;">
        ${renderStructurePageSize('structures', structurePage)}
        <button class="sm primary" onclick="window.openStructureModal()">+ Thêm cấu kiện</button>
    </div>
</div>

        <div class="tbl-wrap">
            <table style="min-width:600px;">
                <thead><tr><th>Tên cấu kiện</th><th>Loại</th><th>Vị trí yard</th><th style="text-align:right;">Tồn kho</th><th>ĐVT</th><th style="text-align:right;">Đơn giá</th><th style="text-align:right;">Tổng giá trị</th><th>TT Yard</th><th>Thao tác</th></tr></thead>
                <tbody>`;
    
    if (displayStructures.length === 0) {
        html += '<tr><td colspan="9" style="text-align:center;">📭 Chưa có cấu kiện nào</td></tr>';

    } else {
        displayStructures.forEach(s => {
            const yard = getStructureYard(s);
            const status = structureStatus(s);
            html += `<tr>
                <td><strong style="cursor:pointer;color:var(--accent);" onclick="window.openComponentWorkspace('${s.id}')">${escapeHtml(s.name)}</strong><div class="metric-sub">${escapeHtml(s.id || '')}</div></td>
                <td>${escapeHtml(structureTypeName(s))}</td>
                <td><button class="sm" onclick="window.highlightComponentOnYard('${s.id}')">${yard.zone}${yard.positionY + 1} · L${yard.layer}</button></td>
                <td style="text-align:right;">${Number(s.qty||0).toLocaleString('vi-VN')} ${s.unit}</td>
                <td>${s.unit}</td>
                <td style="text-align:right;">${formatMoneyVND(s.cost)}</td>
                <td style="text-align:right;color:var(--accent);font-weight:500;">${formatMoneyVND(Number(s.qty||0) * Number(s.cost||0))}</td>
                <td><span class="badge b-${status.cls}">${status.label}</span></td>
                <td>
                    <button class="sm" onclick="window.openStructureModal('${s.id}')">✏️</button>
                    <button class="sm" onclick="window.openComponentWorkspace('${s.id}', 'yard')">🗺️</button>
                    <button class="sm primary" onclick="window.produceStructure('${s.id}')">🏭 Sản xuất</button>
                    <button class="sm" onclick="window.exportStructure('${s.id}')">📤 Xuất CT</button>
                    <button class="sm danger-btn" onclick="window.deleteStructure('${s.id}')">🗑️</button>
                </td>
            </tr>`;
        });
    }
    
    html += `</tbody></table></div>
    ${renderStructurePager('structures', structurePage, 'cấu kiện')}
</div>`;

html += `
<div class="card" style="margin-top:16px;">

    <div class="sec-title" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <span>📦 KHO CẤU KIỆN</span>
        <div style="display:flex;align-items:center;gap:10px;margin-left:auto;">
            <div id="sw-page-size-holder"></div>
            <button class="sm" onclick="window.openTransferToSW()">+ Nhập từ kho chính</button>
        </div>
    </div>
    <div class="tbl-wrap">
        <table style="min-width:650px;">
            <thead>
                <tr>
                    <th>STT</th>
                    <th>Tên vật tư</th>
                    <th>Loại</th>
                    <th style="text-align:right;">Tồn CK</th>
                    <th>ĐVT</th>
                    <th style="text-align:right;">Tồn kho chính</th>
                    <th>TT</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody id="sw-table-body">
                <tr><td colspan="8">Đang tải...</td></tr>
            </tbody>
        </table>
    </div>
    <div id="sw-pager-holder"></div>
</div>`;

    
    setTimeout(function(){
        if (window.drawComponentYardMap) window.drawComponentYardMap(window._componentYardHighlight || null);
        fetch('/api/structure-warehouse').then(r=>r.json()).then(d=>{
            var tb = document.getElementById('sw-table-body');
            if(tb && d.success) {
    var rows = d.data || [];
    var swPage = getStructurePage('sw', rows);
    var swRows = swPage.rows;
    var pageSizeHolder = document.getElementById('sw-page-size-holder');
    var pagerHolder = document.getElementById('sw-pager-holder');

    if (pageSizeHolder) pageSizeHolder.innerHTML = renderStructurePageSize('sw', swPage);
    if (pagerHolder) pagerHolder.innerHTML = renderStructurePager('sw', swPage, 'vật tư');

    tb.innerHTML = swRows.length === 0 ? '<tr><td colspan="8">Kho rỗng</td></tr>' : swRows.map(function(m,i){
        var index = ((swPage.page - 1) * swPage.size) + i + 1;

                    var cat = (state.data.materials.find(x=>x.id===m.material_id)||{}).cat||'—';
                    var mainQty = (state.data.materials.find(x=>x.id===m.material_id)||{}).qty||0;
                    var sc = Number(m.qty)<=5?'b-low':'b-ok';
                    var st = Number(m.qty)<=5?'⚠️':'✅';
                    var name = String(m.material_name || '').replace(/\s*\(Tồn:.*\)$/,'');
                    return `<tr>
                        <td>${index}</td>
                        <td><strong style="cursor:pointer;color:var(--accent);" onclick="showSWDetail('${m.material_id}')">${name}</strong></td>
                        <td>${cat}</td>
                        <td style="text-align:right;">${Number(m.qty).toLocaleString('vi-VN')} ${m.unit}</td>
                        <td>${m.unit}</td>
                        <td style="text-align:right;">${Number(mainQty).toLocaleString('vi-VN')} ${m.unit}</td>
                        <td><span class="badge ${sc}">${st}</span></td>
                        <td><button class="sm" onclick="returnToMainWarehouse('${m.material_id}')">🔄 Trả lại</button></td>
                    </tr>`;
                }).join('');
            }
        });
    }, 100);
    return html;
}

window.openStructureModal = function(sid = null) {
    const s = sid ? (state.data.structures||[]).find(x => x.id === sid) : null;
    let materialOpts = '<option value="">Đang tải...</option>';
    fetch('/api/sw-options').then(r=>r.text()).then(html => { materialOpts = html; document.querySelectorAll('.bom-mat').forEach(s => s.innerHTML = html); });
    const materialOptsDummy = state.data.materials.map(m => 
        `<option value="${m.id}" data-unit="${m.unit}">${escapeHtml(m.name)} (Tồn: ${Number(m.qty).toLocaleString('vi-VN')} ${m.unit})</option>`
    ).join('');
    const existingMats = s?.materials || [];
    const yard = getStructureYard(s || {});
    const zoneOptions = YARD_COLUMNS.map(z => `<option value="${z}" ${yard.zone === z ? 'selected' : ''}>Khu ${z}</option>`).join('');
    
    showModal(`
        <div class="modal-hd"><span class="modal-title">${s ? '✏️ Sửa' : '➕ Thêm'} cấu kiện</span><button class="xbtn" onclick="closeModal()">✕</button></div>
        <div class="modal-bd">
            <div class="form-grid2">
                <div class="form-group form-full"><label class="form-label">Tên cấu kiện</label><input id="s-name" value="${escapeHtml(s?.name||'')}"></div>
                <div class="form-group"><label class="form-label">Đơn vị tính</label><input id="s-unit" value="${s?.unit||'cái'}"></div>
                <div class="form-group"><label class="form-label">Đơn giá (tự động từ BOM)</label><input type="text" id="s-cost" value="${s?.cost||0}" dir="ltr" readonly style="background:var(--surface3);"></div>
            </div>
            <div class="sec-title" style="margin-top:16px;">🗺️ VỊ TRÍ YARD / STACK</div>
            <div class="form-grid2">
                <div class="form-group"><label class="form-label">Khu vực</label><select id="s-zone">${zoneOptions}</select></div>
                <div class="form-group"><label class="form-label">Dòng yard (1-50)</label><input type="text" id="s-position-y" value="${yard.positionY + 1}" dir="ltr"></div>
                <div class="form-group"><label class="form-label">Layer stack</label><input type="text" id="s-layer" value="${yard.layer}" dir="ltr"></div>
                <div class="form-group"><label class="form-label">Xoay (độ)</label><input type="text" id="s-rotation" value="${yard.rotation}" dir="ltr"></div>
                <div class="form-group"><label class="form-label">Dài (m)</label><input type="text" id="s-length" value="${yard.length}" dir="ltr"></div>
                <div class="form-group"><label class="form-label">Rộng (m)</label><input type="text" id="s-width" value="${yard.width}" dir="ltr"></div>
                <div class="form-group"><label class="form-label">Cao (m)</label><input type="text" id="s-height" value="${yard.height}" dir="ltr"></div>
                <div class="form-group"><label class="form-label">Trọng lượng / cấu kiện (kg)</label><input type="text" id="s-weight" value="${yard.weight}" dir="ltr"></div>
            </div>
            <div class="sec-title" style="margin-top:16px;">📦 THÀNH PHẦN CẤU KIỆN (BOM)</div>
            <div id="bom-list">
                ${existingMats.length > 0 ? existingMats.map(m => {
                    const mat = state.data.materials.find(x => x.id === m.materialId);
                    return `<div class="bom-row" style="display:flex;gap:8px;margin-bottom:8px;">
                        <select class="bom-mat" style="flex:2;" onchange="window.updateBomCost()">
                            ${materialOpts.replace(`value="${m.materialId}"`, `value="${m.materialId}" selected`)}
                        </select>
                        <input type="text" class="bom-qty" value="${m.quantity}" style="width:80px;" dir="ltr" oninput="window.updateBomCost()">
                        <button class="sm danger-btn" onclick="this.parentElement.remove();window.updateBomCost()">✕</button>
                    </div>`;
                }).join('') : ''}
            </div>
            <button class="sm" onclick="window.addBomRow()">+ Thêm vật tư</button>
            <div class="metric-sub" style="margin-top:8px;" id="bom-total">Tổng giá: 0 ₫</div>
        </div>
        <div class="modal-ft">
            <button onclick="closeModal()">Hủy</button>
            <button class="primary" onclick="window.saveStructure('${s?.id||''}')">Lưu</button>
        </div>
    `);
    
    setTimeout(() => {
        window.updateBomCost();
        ['s-position-y','s-layer','s-rotation','s-length','s-width','s-height','s-weight'].forEach(id => {
            const input = document.getElementById(id);
            if (input) setupNumberInput(input, { isInteger: ['s-position-y','s-layer','s-rotation'].includes(id), decimals: null });
        });
        fetch('/api/sw-options').then(r=>r.text()).then(html => {
            document.querySelectorAll('.bom-mat').forEach(s => s.innerHTML = html);
        });
    }, 200);
};

window.addBomRow = function() {
    let materialOpts = '<option value="">Đang tải...</option>';
    fetch('/api/sw-options').then(r=>r.text()).then(html => { materialOpts = html; document.querySelectorAll('.bom-mat').forEach(s => s.innerHTML = html); });
    const materialOptsDummy = state.data.materials.map(m => 
        `<option value="${m.id}" data-unit="${m.unit}">${escapeHtml(m.name)} (Tồn: ${Number(m.qty).toLocaleString('vi-VN')} ${m.unit})</option>`
    ).join('');
    const div = document.createElement('div');
    div.className = 'bom-row';
    div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
    div.innerHTML = `<select class="bom-mat" style="flex:2;" onchange="window.updateBomCost()">${materialOptsDummy}</select><input type="text" class="bom-qty" value="1" style="width:80px;" dir="ltr" oninput="window.updateBomCost()"><button class="sm danger-btn" onclick="this.parentElement.remove();window.updateBomCost()">✕</button>`;
    document.getElementById('bom-list').appendChild(div);
    window.updateBomCost();
};

window.updateBomCost = function() {
    let total = 0;
    document.querySelectorAll('.bom-row').forEach(row => {
        const matId = row.querySelector('.bom-mat')?.value;
        const qty = parseFloat(row.querySelector('.bom-qty')?.value?.replace(/\./g,'').replace(',','.')) || 0;
        if (matId) {
            const mat = state.data.materials.find(m => m.id === matId);
            if (mat) total += qty * (mat.cost||0);
        }
    });
    document.getElementById('bom-total').innerText = 'Tổng giá: ' + formatMoneyVND(total);
    const costInput = document.getElementById('s-cost');
    if (costInput) costInput.value = Math.round(total).toLocaleString('vi-VN');
};

window.saveStructure = function(sid) {
    const name = document.getElementById('s-name')?.value.trim();
    if (!name) return alert('Nhập tên cấu kiện');
    const unit = document.getElementById('s-unit')?.value || 'cái';
    const cost = parseInt(document.getElementById('s-cost')?.value.replace(/[^0-9]/g,'')) || 0;
    
    const materials = [];
    document.querySelectorAll('.bom-row').forEach(row => {
        const matId = row.querySelector('.bom-mat')?.value;
        const qty = parseFloat(row.querySelector('.bom-qty')?.value?.replace(/\./g,'').replace(',','.')) || 0;
        if (matId && qty > 0) {
            const mat = state.data.materials.find(m => m.id === matId);
            materials.push({ materialId: matId, materialName: mat?.name||'', unit: mat?.unit||'', quantity: qty });
        }
    });
    
    const id = sid || 'tvsck' + Date.now().toString(36).slice(-8);
    const existing = (state.data.structures||[]).find(x=>x.id===sid);
    const zone = (document.getElementById('s-zone')?.value || 'A').toUpperCase();
    const positionY = Math.max(0, Math.min(YARD_ROWS - 1, getNumberFromInput(document.getElementById('s-position-y')) - 1));
    const struct = {
        ...(existing || {}),
        id,
        name,
        unit,
        qty: existing?.qty || 0,
        cost,
        materials,
        zone,
        positionX: YARD_COLUMNS.indexOf(zone),
        position_y: positionY,
        positionY,
        layer: Math.max(1, getNumberFromInput(document.getElementById('s-layer')) || 1),
        rotation: getNumberFromInput(document.getElementById('s-rotation')) || 0,
        length: getNumberFromInput(document.getElementById('s-length')) || 6,
        width: getNumberFromInput(document.getElementById('s-width')) || 1.2,
        height: getNumberFromInput(document.getElementById('s-height')) || .8,
        weight: getNumberFromInput(document.getElementById('s-weight')) || 1200
    };
    
    if (!state.data.structures) state.data.structures = [];
    const idx = state.data.structures.findIndex(x => x.id === sid);
    if (idx >= 0) state.data.structures[idx] = struct; else state.data.structures.push(struct);
    
    fetch('/api/structures', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(struct) });
    saveState();
    
    addLog(sid ? "Sửa cấu kiện" : "Thêm cấu kiện", `${name} (${id}) - ĐVT: ${unit} - Giá: ${formatMoneyVND(cost)}`);
    closeModal();
    if (window.render) window.render();
};

window.produceStructure = function(sid) {
    const s = (state.data.structures||[]).find(x => x.id === sid);
    if (!s) { alert("Không tìm thấy cấu kiện!"); return; }
    
    var now = new Date();
    var dt = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + 'T' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    
    var html = '<div class="modal-hd"><span class="modal-title">🏭 Sản xuất: ' + escapeHtml(s.name) + '</span><button class="xbtn" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-bd">' +
        '<div class="form-group"><label class="form-label">📅 Thời gian sản xuất</label><input type="datetime-local" id="prod-datetime" value="' + dt + '"></div>' +
        '<div class="form-group"><label class="form-label">Cấu kiện</label><input value="' + escapeHtml(s.name) + ' (Tồn: ' + Number(s.qty).toLocaleString('vi-VN') + ' ' + s.unit + ')" disabled></div>' +
        '<div class="form-group"><label class="form-label">🔢 Số lượng sản xuất</label><input type="text" id="prod-qty" value="1" dir="ltr"></div>' +
        '<div class="form-group"><label class="form-label">📝 Ghi chú</label><input type="text" id="prod-note" placeholder="Ghi chú..."></div>' +
        '<div class="form-group"><label class="form-label">📎 File đính kèm</label><input type="file" id="prod-files" multiple onchange="window.upFiles(this,\'produce\')"><div id="produce-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div></div>' +
        '</div>' +
        '<div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="window.confirmProduceStructure(\'' + sid + '\')">🏭 Xác nhận sản xuất</button></div>';
    
    showModal(html);
    setTimeout(function(){
        var qtyInput = document.getElementById('prod-qty');
        if (qtyInput) setupNumberInput(qtyInput, { isInteger: false, decimals: null });
    }, 100);
};

window.confirmProduceStructure = async function(sid) {
    var dt = document.getElementById('prod-datetime')?.value || new Date().toISOString();
    var qty = getNumberFromInput(document.getElementById('prod-qty'));
    var note = document.getElementById('prod-note')?.value || '';
    var finalPaths = window.moveUploadedFiles ? await window.moveUploadedFiles('produce') : [];
    var attachment = JSON.stringify(finalPaths);
    
    if (qty <= 0) { alert('Vui lòng nhập số lượng!'); return; }
    
    var s = (state.data.structures||[]).find(x => x.id === sid);
    fetch("/api/produce-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId: sid, quantity: qty, datetime: dt, note: note, attachment: attachment })
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            window._upPaths = {};
            addLog("Sản xuất cấu kiện", s.name + " - SL: " + qty + " " + s.unit);
            alert("✅ Sản xuất thành công!");
            closeModal();
            window.loadState().then(() => window.render());
        } else {
            alert("❌ Lỗi: " + d.error);
        }
    });
};
window.showSWDetail = function(mid) {
    fetch('/api/sw-logs/' + mid).then(r=>r.json()).then(d=>{
        if(!d.success || d.data.length===0) { alert('Chưa có lịch sử chuyển kho!'); return; }

        var rows = d.data || [];
        var detailKey = 'sw_detail_' + mid;
        var detailPage = getStructurePage(detailKey, rows);
        var displayRows = detailPage.rows;
        var item = rows[0];

        var html = '<div class="modal-hd"><span class="modal-title">📦 Chi tiết Kho CK: '+escapeHtml(item.material_name || '')+'</span><button class="xbtn" onclick="closeModal()">✕</button></div>';

        html += '<div class="modal-bd" style="max-height:70vh;overflow-y:auto;">';
        html += '<div class="sec-title" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
            '<span>📜 LỊCH SỬ CHUYỂN / TRẢ KHO CK</span>' +
            renderStructurePageSize(detailKey, detailPage) +
            '</div>';

        html += '<div class="tbl-wrap"><table style="min-width:700px;"><thead><tr><th>Thời gian</th><th style="text-align:center;">Loại</th><th style="text-align:right;">SL</th><th>ĐVT</th><th style="text-align:right;">Đơn giá</th><th>Ghi chú</th><th>File</th></tr></thead><tbody>';

        displayRows.forEach(function(l){
            var dt = new Date(l.created_at).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
            var files = renderAttachmentLinks(l.attachment, escapeHtml);
            var typeIcon = l.type === 'return_to_main' ? '🔄 Trả lại kho chính' : '📦 Chuyển sang kho CK';
            var typeColor = l.type === 'return_to_main' ? 'color: var(--success-text);' : 'color: var(--accent);';
            var absQty = Math.abs(Number(l.qty));
            var qtyDisplay = absQty.toLocaleString('vi-VN');
            var qtySign = l.type === 'return_to_main' ? '-' : '+';
            var qtyColor = l.type === 'return_to_main' ? 'color: var(--success-text);' : 'color: var(--accent);';

            html += '<tr>' +
                '<td style="white-space:nowrap;">'+dt+'</td>' +
                '<td style="text-align:center; '+typeColor+' font-weight:bold;">'+typeIcon+'</td>' +
                '<td style="text-align:right; '+qtyColor+' font-weight:bold;">'+qtySign+qtyDisplay+' '+escapeHtml(l.unit || '')+'</td>' +
                '<td>'+escapeHtml(l.unit || '')+'</td>' +
                '<td style="text-align:right;">'+Number(l.cost||0).toLocaleString('vi-VN')+' ₫</td>' +
                '<td>'+escapeHtml(l.note || '—')+'</td>' +
                '<td style="text-align:left;">'+(files||'—')+'</td>' +
                '</tr>';
        });

        html += '</tbody></table></div>';
        html += renderStructurePager(detailKey, detailPage, 'giao dịch');
        html += '</div><div class="modal-ft"><button onclick="closeModal()">Đóng</button></div>';

        showModal(html);
    });
};


window.returnToMainWarehouse = function(mid) {
    const material = state.data.materials.find(m => m.id === mid);
    if (!material) return alert('Không tìm thấy vật tư!');

    fetch('/api/structure-warehouse')
        .then(r => r.json())
        .then(swData => {
            const swItem = swData.data.find(w => w.material_id === mid);
            const maxQty = swItem ? Number(swItem.qty) : 0;
            if (maxQty <= 0) return alert('Kho CK không còn vật tư này để trả!');

            const now = new Date();
            const dt = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0') + 'T' +
                String(now.getHours()).padStart(2, '0') + ':' +
                String(now.getMinutes()).padStart(2, '0');

            showModal(`
                <div class="modal-hd"><span class="modal-title">🔄 Trả vật tư về kho chính</span><button class="xbtn" onclick="closeModal()">✕</button></div>
                <div class="modal-bd">
                    <div class="form-group"><label class="form-label">📅 Thời gian trả</label><input type="datetime-local" id="sw-return-datetime" value="${dt}"></div>
                    <div class="form-group"><label class="form-label">Vật tư</label><input value="${escapeHtml(material.name)} (Tối đa: ${maxQty.toLocaleString('vi-VN')} ${material.unit})" disabled></div>
                    <div class="form-group"><label class="form-label">Số lượng trả</label><input type="text" id="sw-return-qty" value="1" dir="ltr"></div>
                    <div class="form-group"><label class="form-label">Ghi chú</label><input id="sw-return-note" value="Trả lại kho chính"></div>
                </div>
                <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="window.confirmReturnToMainWarehouse('${mid}', ${maxQty})">Xác nhận trả</button></div>
            `);

            setTimeout(function() {
                const qtyInput = document.getElementById('sw-return-qty');
                if (qtyInput) setupNumberInput(qtyInput, { isInteger: false, decimals: null });
            }, 100);
        });
};

window.confirmReturnToMainWarehouse = function(mid, maxQty) {
    const material = state.data.materials.find(m => m.id === mid);
    const qty = getNumberFromInput(document.getElementById('sw-return-qty'));
    const datetime = document.getElementById('sw-return-datetime')?.value || new Date().toISOString();
    const note = document.getElementById('sw-return-note')?.value || 'Trả lại kho chính';

    if (!qty || qty <= 0) return alert('Vui lòng nhập số lượng hợp lệ!');
    if (qty > maxQty) return alert(`Không thể trả quá ${maxQty.toLocaleString('vi-VN')} ${material?.unit || ''}!`);

    fetch('/api/return-from-sw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material_id: mid, qty, datetime, note })
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            addLog("Trả lại kho chính", `${material?.name || mid} - SL: ${qty.toLocaleString('vi-VN')} ${material?.unit || ''}`);
            alert('✅ Đã trả lại kho chính!');
            closeModal();
            window.loadState().then(() => window.render());
        } else {
            alert('❌ ' + d.error);
        }
    });
};

window.deleteStructure = function(sid) {
    const s = (state.data.structures||[]).find(x => x.id === sid);
    if (!confirm(`Xóa cấu kiện "${s?.name}"?`)) return;
    addLog('Xóa cấu kiện', `${s?.name} (${sid})`);
    state.data.structures = (state.data.structures||[]).filter(x => x.id !== sid);
    fetch('/api/structures/' + sid, { method: 'DELETE' });
    saveState();
    if (window.render) window.render();
};

window.showStructureDetail = function(sid) {
    const s = (state.data.structures||[]).find(x => x.id === sid);
    if (!s) return;
    
    const produceTxns = state.data.transactions
        .filter(t => t.mid === sid && t.type === 'produce')
        .sort((a,b) => new Date(b.datetime||b.date) - new Date(a.datetime||a.date));
    
    const exportTxns = state.data.transactions
        .filter(t => t.mid === sid && t.type === 'structure_export')
        .sort((a,b) => new Date(b.datetime||b.date) - new Date(a.datetime||a.date));

    const returnTxns = state.data.transactions
        .filter(t => t.mid === sid && t.type === 'structure_return')
        .sort((a,b) => new Date(b.datetime||b.date) - new Date(a.datetime||a.date));        
    
    const totalProduced = produceTxns.reduce((sum, t) => sum + Number(t.qty||0), 0);
    const totalExported = exportTxns.reduce((sum, t) => sum + Number(t.qty||0), 0);
    const totalReturned = returnTxns.reduce((sum, t) => sum + Number(t.qty||0), 0);
    const currentStock = Number(s.qty || 0);
    const allHistory = [
        ...produceTxns.map(t => ({ ...t, historyType: 'produce' })), 
        ...exportTxns.map(t => ({ ...t, historyType: 'export' })),
        ...returnTxns.map(t => ({ ...t, historyType: 'return' }))
    ].sort((a,b) => new Date(b.datetime||b.date) - new Date(a.datetime||a.date));
    const detailKey = 'structure_detail_' + sid;
    const historyPage = getStructurePage(detailKey, allHistory);
    const displayHistory = historyPage.rows;
    let historyHtml = '';
    if (displayHistory.length > 0) {
        historyHtml = displayHistory.map(t => {
            const isProduce = t.historyType === 'produce';
            const isReturn = t.historyType === 'return';
            var dt = t.date || '';
            if (t.datetime) {
                var d = new Date(t.datetime);
                dt = d.toLocaleString('vi-VN', {
                    hour:'2-digit',
                    minute:'2-digit',
                    second:'2-digit',
                    day:'2-digit',
                    month:'2-digit',
                    year:'numeric'
                });
            }
            const projectName = !isProduce ? (state.data.projects.find(p => p.id === t.projectId)?.name || 'N/A') : '';
            let files = renderAttachmentLinks(t.attachment, escapeHtml);
            return `<tr>
                <td style="white-space:nowrap;">${dt}</td>
                <td style="text-align:center; ${isProduce ? 'color:var(--accent);' : isReturn ? 'color:var(--success-text);' : 'color:var(--warn-text);'} font-weight:bold;">
                    ${isProduce ? '🏭 Sản xuất' : isReturn ? '🔄 Trả về kho' : '📤 Xuất ra CT'}
                </td>
                <td style="text-align:center;">${!isProduce ? escapeHtml(projectName) : '—'}</td>
                <td style="text-align:right;">${Number(t.qty||0).toLocaleString('vi-VN')} ${s.unit}</td>
                <td style="text-align:left;">${escapeHtml(t.note || '—')}</td>
                <td style="text-align:left;">${files}</td>
            </tr>`;
        }).join('');
    } else {
        historyHtml = '<tr><td colspan="6" style="text-align:center;">📭 Chưa có lịch sử</td></tr>';
    }
    let html = `<div class="modal-hd" style="background:var(--accent-bg);">
        <span class="modal-title" style="font-size:20px;">🏗️ Cấu kiện: ${escapeHtml(s.name)} (${s.id})</span>
        <button class="xbtn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-bd" style="max-height:70vh;overflow-y:auto;">
        <div class="grid4" style="margin-bottom:20px;">
            <div class="metric-card"><div class="metric-label">📦 TỒN KHO</div><div class="metric-val" style="font-size:18px;">${currentStock.toLocaleString('vi-VN')} ${s.unit}</div></div>
            <div class="metric-card"><div class="metric-label">💰 ĐƠN GIÁ</div><div class="metric-val" style="font-size:18px;">${formatMoneyVND(s.cost)}</div></div>
            <div class="metric-card"><div class="metric-label">🏭 ĐÃ SẢN XUẤT</div><div class="metric-val" style="font-size:18px;color:var(--accent);">${totalProduced.toLocaleString('vi-VN')} ${s.unit}</div><div class="metric-sub">${produceTxns.length} lần sản xuất</div></div>
            <div class="metric-card"><div class="metric-label">📤 ĐÃ XUẤT CT</div><div class="metric-val" style="font-size:18px;color:var(--warn-text);">${totalExported.toLocaleString('vi-VN')} ${s.unit}</div><div class="metric-sub">${exportTxns.length} lần xuất</div></div>
            <div class="metric-card"><div class="metric-label">🔄 ĐÃ TRẢ</div><div class="metric-val" style="font-size:18px;color:var(--success-text);">${totalReturned.toLocaleString('vi-VN')} ${s.unit}</div><div class="metric-sub">${returnTxns.length} lần trả</div></div>
        </div>
        
        <div class="sec-title">📦 THÀNH PHẦN (BOM)</div>
        <div class="tbl-wrap" style="margin-bottom:20px;">
            <table style="min-width:400px;"><thead><tr><th>Vật tư</th><th style="text-align:right;">SL / 1 cấu kiện</th><th>ĐVT</th></tr></thead>
                <tbody>${(s.materials||[]).map(m => `<tr><td style="text-align:left;">${escapeHtml(m.materialName)}</td><td style="text-align:right;">${Number(m.quantity).toLocaleString('vi-VN')}</td><td>${m.unit}</td></tr>`).join('')}</tbody>
            </table>
        </div>
        
        <div class="sec-title" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
    <span>📜 LỊCH SỬ (${allHistory.length} giao dịch)</span>
    ${renderStructurePageSize(detailKey, historyPage)}
</div>

        <div class="tbl-wrap">
            <table style="min-width:700px;">
                <thead>
                    <tr>
                        <th style="text-align:left;">Thời gian</th>
                        <th style="text-align:center;">Loại</th>
                        <th style="text-align:center;">Công trình</th>
                        <th style="text-align:right;">Số lượng</th>
                        <th style="text-align:left;">Ghi chú</th>
                        <th style="text-align:center;">File</th>
                    </tr>
                </thead>
                <tbody>${historyHtml}</tbody>
            </table>
        </div>
        ${renderStructurePager(detailKey, historyPage, 'giao dịch')}

    </div>
    <div class="modal-ft">
        <button onclick="closeModal()">Đóng</button>
        <button class="primary" onclick="closeModal();window.produceStructure('${sid}')">🏭 Sản xuất</button>
        <button class="primary" style="background:var(--warn);" onclick="closeModal();window.exportStructure('${sid}')">📤 Xuất cấu kiện</button>
    </div>`;
    
    showModal(html, null);
};

window.exportStructure = function(sid) {
    const s = (state.data.structures||[]).find(x => x.id === sid);
    addLog("Mở modal xuất cấu kiện", `${s?.name} - Tồn: ${s?.qty} ${s?.unit}`);
    if (!s || parseFloat(s.qty) <= 0) return alert('Không có cấu kiện trong kho!');
    if (state.data.projects.length === 0) return alert('Chưa có công trình!');

    var now = new Date();
    var dt = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + 'T' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

    var projOpts = state.data.projects.map(p => '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>').join('');
    showModal(`
        <div class="modal-hd"><span class="modal-title">📤 Xuất cấu kiện ra công trình</span><button class="xbtn" onclick="closeModal()">✕</button></div>
        <div class="modal-bd">
            <div class="form-group"><label class="form-label">📅 Thời gian xuất</label><input type="datetime-local" id="exp-datetime" value="${dt}"></div>
            <div class="form-group"><label class="form-label">Cấu kiện</label><input value="${escapeHtml(s.name)} (Tồn: ${Number(s.qty).toLocaleString('vi-VN')} ${s.unit})" disabled></div>
            <div class="form-group"><label class="form-label">Công trình</label><select id="exp-proj">${projOpts}</select></div>
            <div class="form-group"><label class="form-label">Số lượng</label><input type="text" id="exp-qty" value="1" dir="ltr"></div>
            <div class="form-group"><label class="form-label">Ghi chú</label><input id="exp-note" placeholder="Ghi chú..."></div>
            <div class="form-group"><label class="form-label">📎 File đính kèm</label><input type="file" id="exp-files" multiple onchange="window.upFiles(this,'structure_export')"><div id="structure_export-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div></div>
        </div>
        <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="window.confirmExportStructure('${sid}')">Xác nhận xuất</button></div>
    `);
        setTimeout(function(){
        var qtyInput = document.getElementById('exp-qty');
        if (qtyInput) setupNumberInput(qtyInput, { isInteger: false, decimals: null });
        }, 100);
};
window.confirmExportStructure = async function(sid) {
    var pid = document.getElementById('exp-proj')?.value;
    var dt = document.getElementById('exp-datetime')?.value || new Date().toISOString();
    var qty = getNumberFromInput(document.getElementById('exp-qty'));
    var note = document.getElementById('exp-note')?.value || '';
    var finalPaths = window.moveUploadedFiles ? await window.moveUploadedFiles('structure_export') : [];
    var attachment = JSON.stringify(finalPaths);
    
    if (!pid || qty <= 0) return alert('Thiếu thông tin!');
    
    var s = (state.data.structures||[]).find(x => x.id === sid);
    if (!s || parseFloat(s.qty) < qty) return alert('Không đủ cấu kiện trong kho!');
    
    var projectName = state.data.projects.find(p => p.id === pid)?.name || '';
    addLog('Xuất cấu kiện', `${s?.name} - SL: ${qty} ${s?.unit} ra công trình ${projectName}`);    
    
    fetch('/api/export-structure', { method: 'POST', headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ structureId: sid, projectId: pid, quantity: qty, note: note, datetime: dt, attachment: attachment }) })
        .then(r => r.json())
        .then(d => {
            if (d.success) {
                window._upPaths = {};
                alert('✅ Đã xuất cấu kiện ra công trình!');
                closeModal();
                window.loadState().then(() => window.render());
            } else alert('❌ Lỗi: ' + d.error);
        });
};
window.returnStructureToWarehouse = function(projectId) {
    // Lấy cấu kiện đã xuất cho công trình này
    var exportedStructures = [];
    var txns = state.data.transactions.filter(function(t) { 
        return t.projectId === projectId && t.type === 'structure_export'; 
    });
    var returnTxns = state.data.transactions.filter(function(t) { 
        return t.projectId === projectId && t.type === 'structure_return'; 
    });
    
    var structureIds = [...new Set(txns.map(function(t) { return t.mid; }))];
    structureIds.forEach(function(sid) {
        var s = (state.data.structures || []).find(function(x) { return x.id === sid; });
        if (!s) return;
        var totalExp = txns.filter(function(t) { return t.mid === sid; }).reduce(function(sum, t) { return sum + Number(t.qty||0); }, 0);
        var totalRet = returnTxns.filter(function(t) { return t.mid === sid; }).reduce(function(sum, t) { return sum + Number(t.qty||0); }, 0);
        
        // Tính số đã gán vào tiến độ (schedule)
        var usedInSchedule = 0;
        var sched = state.data.projectSchedules?.find(function(s) { return s.projectId === projectId; });
        if (sched?.tasks?.length > 0) {
            function flatTasks(tasks) { var r = []; for (var i = 0; i < tasks.length; i++) { r.push(tasks[i]); if (tasks[i].subTasks?.length > 0) r = r.concat(flatTasks(tasks[i].subTasks)); } return r; }
            var allTasks = flatTasks(sched.tasks);
            allTasks.forEach(function(task) {
                if (task.materials?.length > 0) {
                    task.materials.forEach(function(mat) {
                        if (mat.materialId === sid) usedInSchedule += mat.quantity || 0;
                    });
                }
            });
        }
        var usedManual = (state.data.projectMaterialUsage || []).filter(function(u) { return u.projectId === projectId && u.materialId === sid; }).reduce(function(s, u) { return s + Number(u.usedQty||0); }, 0);
        var totalUsed = Math.max(usedInSchedule, usedManual);
        var avail = totalExp - totalRet - totalUsed;
        if (avail > 0) {
            exportedStructures.push({ id: sid, name: s.name, unit: s.unit, cost: s.cost, avail: avail });
        }
    });
    if (exportedStructures.length === 0) {
        alert('Không có cấu kiện nào đã xuất cho công trình này!');
        return;
    }
    var opts = exportedStructures.map(function(s) {
        return '<option value="' + s.id + '" data-cost="' + s.cost + '">' + s.name + ' (Có thể trả: ' + Number(s.avail).toLocaleString('vi-VN') + ' ' + s.unit + ')</option>';
    }).join('');
        var now = new Date();
    var dt = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + 'T' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
        var html = '<div class="modal-hd" style="background:#0891b2;"><span class="modal-title">🏗️ Trả cấu kiện về kho</span><button class="xbtn" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-bd">' +
        '<div class="form-group"><label class="form-label">📅 Thời gian trả</label><input type="datetime-local" id="return-structure-datetime" value="' + dt + '"></div>' +
        '<div class="form-group"><label class="form-label">Cấu kiện</label><select id="return-structure-id">' + opts + '</select></div>' +
        '<div class="form-group"><label class="form-label">Số lượng</label><input type="text" id="return-structure-qty" value="1" dir="ltr"></div>' +
        '<div class="form-group"><label class="form-label">Ghi chú</label><input type="text" id="return-structure-note" placeholder="Lý do trả..."></div>' +
        '<div class="form-group"><label class="form-label">📎 File đính kèm</label><input type="file" id="return-structure-files" multiple onchange="window.upFiles(this,\'structure_return\')"><div id="structure_return-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div></div>' +
        '</div>' +
        '<div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" style="background:#0891b2;" onclick="window.confirmReturnStructure(\'' + projectId + '\')">Xác nhận trả</button></div>';
    showModal(html);
    setTimeout(function() {
        var qtyInput = document.getElementById('return-structure-qty');
        if (qtyInput) setupNumberInput(qtyInput, { isInteger: false, decimals: null });
    }, 100);
};
window.confirmReturnStructure = async function(projectId) {
    var sid = document.getElementById('return-structure-id')?.value;
    var dt = document.getElementById('return-structure-datetime')?.value || new Date().toISOString();
    var qty = getNumberFromInput(document.getElementById('return-structure-qty'));
    var note = document.getElementById('return-structure-note')?.value || '';
    if (!sid || qty <= 0) { alert('Vui lòng nhập đầy đủ!'); return; }
    var s = (state.data.structures || []).find(function(x) { return x.id === sid; });
    var finalPaths = window.moveUploadedFiles ? await window.moveUploadedFiles('structure_return') : [];
    var attachment = JSON.stringify(finalPaths);
    fetch('/api/return-structure', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ structureId: sid, projectId: projectId, qty: qty, note: note, datetime: dt, attachment: attachment }) 
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
        if (d.success) {
            window._upPaths = {};
            addLog('Trả cấu kiện', (s?.name||sid) + ' - SL: ' + qty + ' ' + (s?.unit||'') + ' - CT: ' + projectId);
            closeModal();
            window.loadState().then(function() { window.render(); });
        } else {
            alert('❌ ' + d.error);
        }
    });
};

window.setComponentYardView = function(view) {
    window._componentYardView = view === 'side' ? 'side' : 'top';
    window.drawComponentYardMap(window._componentYardHighlight || null);
};

window.highlightComponentOnYard = function(sid) {
    window._componentYardHighlight = sid;
    window.drawComponentYardMap(sid);
    document.getElementById('component-yard-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.searchComponentYard = function() {
    const q = (document.getElementById('component-yard-search')?.value || '').trim().toLowerCase();
    if (!q) return window.drawComponentYardMap(null);
    const match = (state.data.structures || []).find(s => {
        const yard = getStructureYard(s);
        const haystack = `${s.id || ''} ${s.name || ''} ${structureTypeName(s)} ${yard.zone}${yard.positionY + 1}`.toLowerCase();
        return haystack.includes(q);
    });
    if (!match) {
        const detail = document.getElementById('component-yard-detail');
        if (detail) detail.innerHTML = '<h3>Không tìm thấy</h3><p>Không có cấu kiện hoặc vị trí yard khớp từ khóa.</p>';
        return;
    }
    window.highlightComponentOnYard(match.id);
};

function updateYardDetail(selectedStructure, cell) {
    const detail = document.getElementById('component-yard-detail');
    if (!detail) return;
    if (!selectedStructure && !cell) {
        detail.innerHTML = '<h3>Chưa chọn cấu kiện</h3><p>Chọn một ô trên bản đồ hoặc tìm cấu kiện để xem vị trí, layer, cảnh báo và thao tác nhanh.</p>';
        return;
    }
    const items = cell?.items || (selectedStructure ? [selectedStructure] : []);
    if (!items.length) {
        detail.innerHTML = `
            <h3>${escapeHtml(cell?.zone || '')}${cell?.row || ''} · ô trống</h3>
            <p>Vị trí này đang trống, có thể dùng để tập kết cấu kiện mới nếu phù hợp tải trọng và kích thước.</p>
            <div class="component-yard-warning-list"><p class="good">Không có cảnh báo.</p></div>
        `;
        return;
    }
    const main = selectedStructure || items[0];
    const yard = getStructureYard(main);
    const warnings = items.flatMap(item => yardWarnings(item));
    detail.innerHTML = `
        <h3>${escapeHtml(yard.zone)}${yard.positionY + 1} · ${items.length} cấu kiện</h3>
        <div class="component-yard-detail-main">
            <strong>${escapeHtml(main.name || '')}</strong>
            <span>${escapeHtml(structureTypeName(main))} · Layer ${yard.layer} · ${Number(main.qty || 0).toLocaleString('vi-VN')} ${escapeHtml(main.unit || '')}</span>
        </div>
        <div class="component-stack-view">
            ${[4,3,2,1].map(layer => `<div class="${items.some(item => getStructureYard(item).layer === layer) ? 'filled' : ''}"><span>Layer ${layer}</span></div>`).join('')}
        </div>
        <div class="component-yard-mini-list">
            ${items.slice(0, 6).map(item => {
                const y = getStructureYard(item);
                const status = structureStatus(item);
                return `<button onclick="window.openComponentWorkspace('${escapeAttr(item.id)}', 'yard')"><span>${escapeHtml(item.name || '')}</span><b class="badge b-${status.cls}">${status.label}</b><small>${y.zone}${y.positionY + 1} · L${y.layer}</small></button>`;
            }).join('')}
        </div>
        <div class="component-yard-warning-list">
            ${warnings.length ? [...new Set(warnings)].map(w => `<p class="warn">⚠ ${escapeHtml(w)}</p>`).join('') : '<p class="good">Yard cell đang ổn định.</p>'}
        </div>
        <div class="component-yard-quick-actions">
            <button class="sm primary" onclick="window.openComponentWorkspace('${escapeAttr(main.id)}')">Mở workspace</button>
            <button class="sm" onclick="window.produceStructure('${escapeAttr(main.id)}')">Sản xuất</button>
            <button class="sm" onclick="window.exportStructure('${escapeAttr(main.id)}')">Xuất CT</button>
        </div>
    `;
}

window.drawComponentYardMap = function(highlightId = null) {
    const canvas = document.getElementById('component-yard-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const view = window._componentYardView || 'top';
    const occupancy = yardOccupancy();
    const structures = state.data.structures || [];
    const selected = structures.find(s => String(s.id) === String(highlightId));
    window._componentYardHighlight = highlightId || null;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#061522';
    ctx.fillRect(0, 0, width, height);

    if (view === 'side' && selected) {
        const yard = getStructureYard(selected);
        ctx.fillStyle = '#dbeafe';
        ctx.font = '700 18px system-ui';
        ctx.fillText(`Side view: ${selected.name} · ${yard.zone}${yard.positionY + 1}`, 26, 36);
        const baseX = 96;
        const baseY = height - 74;
        const layerH = 58;
        for (let layer = 1; layer <= YARD_MAX_LAYER; layer++) {
            const y = baseY - layer * layerH;
            const filled = layer <= yard.layer;
            ctx.fillStyle = filled ? 'rgba(31,122,255,.34)' : 'rgba(148,163,184,.08)';
            ctx.strokeStyle = filled ? '#60a5fa' : 'rgba(148,163,184,.22)';
            ctx.lineWidth = 2;
            ctx.fillRect(baseX, y, width - 220, layerH - 8);
            ctx.strokeRect(baseX, y, width - 220, layerH - 8);
            ctx.fillStyle = filled ? '#e0f2fe' : '#64748b';
            ctx.font = '700 13px system-ui';
            ctx.fillText(`Layer ${layer}`, baseX + 18, y + 32);
        }
        updateYardDetail(selected, occupancy.cells.get(yardCellKey(yard)));
        return;
    }

    const padLeft = 42;
    const padTop = 34;
    const padRight = 18;
    const padBottom = 24;
    const gridW = width - padLeft - padRight;
    const gridH = height - padTop - padBottom;
    const cellW = gridW / YARD_COLUMNS.length;
    const cellH = gridH / YARD_ROWS;

    ctx.font = '700 12px system-ui';
    ctx.textAlign = 'center';
    YARD_COLUMNS.forEach((col, x) => {
        ctx.fillStyle = '#93c5fd';
        ctx.fillText(col, padLeft + x * cellW + cellW / 2, 22);
    });

    for (let row = 0; row < YARD_ROWS; row++) {
        if (row % 5 === 0) {
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'right';
            ctx.fillText(String(row + 1), padLeft - 8, padTop + row * cellH + cellH);
        }
        for (let col = 0; col < YARD_COLUMNS.length; col++) {
            const key = `${YARD_COLUMNS[col]}${row + 1}`;
            const cell = occupancy.cells.get(key);
            const x = padLeft + col * cellW;
            const y = padTop + row * cellH;
            const hasHighlight = selected && yardCellKey(getStructureYard(selected)) === key;
            const warning = cell && (cell.weight > YARD_MAX_STACK_WEIGHT || cell.layers.size >= YARD_MAX_LAYER || cell.items.length >= 4);

            ctx.fillStyle = 'rgba(16,185,129,.055)';
            if (cell) ctx.fillStyle = 'rgba(31,122,255,.24)';
            if (cell && cell.layers.size >= 3) ctx.fillStyle = 'rgba(245,158,11,.30)';
            if (warning) ctx.fillStyle = 'rgba(239,68,68,.34)';
            if (hasHighlight) ctx.fillStyle = 'rgba(96,165,250,.72)';
            ctx.fillRect(x + .8, y + .8, cellW - 1.6, cellH - 1.6);
            ctx.strokeStyle = hasHighlight ? '#fef08a' : 'rgba(125,211,252,.075)';
            ctx.lineWidth = hasHighlight ? 2.4 : 1;
            ctx.strokeRect(x + .8, y + .8, cellW - 1.6, cellH - 1.6);
        }
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#e0f2fe';
    ctx.font = '700 13px system-ui';
    ctx.fillText(`Yard overview · ${occupancy.occupied}/${occupancy.total} cell · ${occupancy.percent.toFixed(1)}% sử dụng`, padLeft, height - 7);

    canvas.onclick = function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (canvas.height / rect.height);
        const col = Math.floor((x - padLeft) / cellW);
        const row = Math.floor((y - padTop) / cellH);
        if (col < 0 || col >= YARD_COLUMNS.length || row < 0 || row >= YARD_ROWS) return;
        const key = `${YARD_COLUMNS[col]}${row + 1}`;
        const cell = occupancy.cells.get(key);
        if (cell?.items?.length) {
            window._componentYardHighlight = cell.items[0].id;
            window.drawComponentYardMap(cell.items[0].id);
        } else {
            updateYardDetail(null, { key, zone: YARD_COLUMNS[col], row: row + 1, items: [] });
        }
    };

    updateYardDetail(selected, selected ? occupancy.cells.get(yardCellKey(getStructureYard(selected))) : null);
};

window.closeComponentWorkspace = function() {
    document.getElementById('component-workspace-overlay')?.remove();
};

function renderStructureTxnTable(rows, s) {
    if (!rows.length) return '<div class="metric-sub">Chưa có giao dịch</div>';
    return `
        <div class="desktop-table-wrap">
            <table style="min-width:760px;">
                <thead><tr><th>Thời gian</th><th>Loại</th><th>Công trình</th><th style="text-align:right;">Số lượng</th><th>Ghi chú</th><th>File</th></tr></thead>
                <tbody>${rows.map(t => {
                    const project = state.data.projects?.find(p => String(p.id) === String(t.projectId));
                    const label = t.type === 'produce' ? 'Sản xuất' : t.type === 'structure_return' ? 'Trả từ CT' : 'Xuất công trình';
                    return `<tr><td>${formatStructureDate(t.datetime || t.date)}</td><td>${label}</td><td>${escapeHtml(project?.name || '—')}</td><td style="text-align:right;">${num(t.qty).toLocaleString('vi-VN')} ${escapeHtml(s.unit || '')}</td><td>${escapeHtml(t.note || '—')}</td><td>${renderAttachmentLinks(t.attachment, escapeHtml) || '—'}</td></tr>`;
                }).join('')}</tbody>
            </table>
        </div>
    `;
}

window.openComponentWorkspace = function(sid, tab = 'overview') {
    const s = (state.data.structures || []).find(x => String(x.id) === String(sid));
    if (!s) return;
    window.closeComponentWorkspace();
    const yard = getStructureYard(s);
    const warnings = yardWarnings(s);
    const txns = structureTxns(sid);
    const produced = txns.filter(t => t.type === 'produce').reduce((sum, t) => sum + num(t.qty), 0);
    const exported = txns.filter(t => t.type === 'structure_export').reduce((sum, t) => sum + num(t.qty), 0);
    const returned = txns.filter(t => t.type === 'structure_return').reduce((sum, t) => sum + num(t.qty), 0);
    const bomCost = (s.materials || []).reduce((sum, m) => {
        const mat = state.data.materials?.find(x => String(x.id) === String(m.materialId));
        return sum + num(m.quantity) * num(mat?.cost);
    }, 0);
    const tabs = [
        ['overview', 'Tổng quan'],
        ['bom', 'BOM'],
        ['production', 'Sản xuất'],
        ['yard', 'Yard Position'],
        ['logistics', 'Logistics']
    ];
    const panels = {
        overview: `
            <div class="material-workspace-grid">
                <section class="material-workspace-card"><h3>Tồn hiện tại</h3><strong>${num(s.qty).toLocaleString('vi-VN')} ${escapeHtml(s.unit || '')}</strong><small>${formatMoneyVND(num(s.qty) * num(s.cost))}</small></section>
                <section class="material-workspace-card"><h3>Vị trí tập kết</h3><strong>${yard.zone}${yard.positionY + 1}</strong><small>Layer ${yard.layer} · xoay ${yard.rotation}°</small></section>
                <section class="material-workspace-card"><h3>Tiến độ</h3><strong>${produced ? Math.min(100, Math.round((exported / produced) * 100)) : 0}%</strong><small>${exported.toLocaleString('vi-VN')} đã xuất / ${produced.toLocaleString('vi-VN')} đã sản xuất</small></section>
                <section class="material-workspace-card"><h3>Loại cấu kiện</h3><strong>${escapeHtml(structureTypeName(s))}</strong><small>${escapeHtml(getStructureProjectName(s))}</small></section>
                <section class="material-workspace-card wide">
                    <h3>Insight Yard</h3>
                    <div class="material-recommend-list">
                        <div><span>Kích thước</span><strong>${yard.length}m x ${yard.width}m x ${yard.height}m</strong></div>
                        <div><span>Tải stack ước tính</span><strong>${(yard.weight * Math.max(1, num(s.qty))).toLocaleString('vi-VN')} kg</strong></div>
                        <div><span>BOM</span><strong>${(s.materials || []).length} vật tư · ${formatMoneyVND(bomCost || s.cost || 0)}</strong></div>
                        <div><span>Cảnh báo</span><strong>${warnings.length ? warnings.join(', ') : 'Không có cảnh báo'}</strong></div>
                    </div>
                </section>
            </div>`,
        bom: `
            <h3>Bill of Materials</h3>
            <div class="desktop-table-wrap"><table style="min-width:720px;">
                <thead><tr><th>Vật tư</th><th style="text-align:right;">Định mức / cấu kiện</th><th>ĐVT</th><th style="text-align:right;">Đơn giá</th><th style="text-align:right;">Cost</th></tr></thead>
                <tbody>${(s.materials || []).map(m => {
                    const mat = state.data.materials?.find(x => String(x.id) === String(m.materialId));
                    return `<tr><td>${escapeHtml(m.materialName || mat?.name || '')}</td><td style="text-align:right;">${num(m.quantity).toLocaleString('vi-VN')}</td><td>${escapeHtml(m.unit || mat?.unit || '')}</td><td style="text-align:right;">${formatMoneyVND(mat?.cost || 0)}</td><td style="text-align:right;">${formatMoneyVND(num(m.quantity) * num(mat?.cost))}</td></tr>`;
                }).join('') || '<tr><td colspan="5" style="text-align:center;">Chưa có BOM</td></tr>'}</tbody>
            </table></div>`,
        production: `
            <div class="material-workspace-grid">
                <section class="material-workspace-card"><h3>Đã sản xuất</h3><strong>${produced.toLocaleString('vi-VN')}</strong><small>${txns.filter(t => t.type === 'produce').length} đợt</small></section>
                <section class="material-workspace-card"><h3>Đã xuất CT</h3><strong>${exported.toLocaleString('vi-VN')}</strong><small>${txns.filter(t => t.type === 'structure_export').length} phiếu</small></section>
                <section class="material-workspace-card"><h3>Đã trả</h3><strong>${returned.toLocaleString('vi-VN')}</strong><small>Cấu kiện trả từ công trình</small></section>
                <section class="material-workspace-card wide"><h3>Timeline sản xuất / xuất</h3>${renderStructureTxnTable(txns, s)}</section>
            </div>`,
        yard: `
            <div class="material-workspace-grid">
                <section class="material-workspace-card"><h3>Zone</h3><strong>${yard.zone}</strong><small>Trục ngang A-K</small></section>
                <section class="material-workspace-card"><h3>Grid</h3><strong>${yard.positionY + 1}</strong><small>Trục dọc 1-50</small></section>
                <section class="material-workspace-card"><h3>Layer</h3><strong>${yard.layer}</strong><small>Tối đa khuyến nghị ${YARD_MAX_LAYER}</small></section>
                <section class="material-workspace-card wide">
                    <h3>Stack side view</h3>
                    <div class="component-stack-view large">${[4,3,2,1].map(layer => `<div class="${layer <= yard.layer ? 'filled' : ''}"><span>Layer ${layer}</span></div>`).join('')}</div>
                    <div class="component-yard-warning-list">${warnings.length ? warnings.map(w => `<p class="warn">⚠ ${escapeHtml(w)}</p>`).join('') : '<p class="good">Stack hợp lệ theo quy tắc hiện tại.</p>'}</div>
                    <button class="sm primary" onclick="window.closeComponentWorkspace(); window.highlightComponentOnYard('${escapeAttr(s.id)}')">Zoom tới yard map</button>
                </section>
            </div>`,
        logistics: `
            <div class="material-workspace-grid">
                <section class="material-workspace-card"><h3>Sẵn sàng xuất</h3><strong>${num(s.qty).toLocaleString('vi-VN')}</strong><small>${escapeHtml(s.unit || '')} tại yard</small></section>
                <section class="material-workspace-card"><h3>Đã xuất</h3><strong>${exported.toLocaleString('vi-VN')}</strong><small>Ra công trình</small></section>
                <section class="material-workspace-card"><h3>Đã trả</h3><strong>${returned.toLocaleString('vi-VN')}</strong><small>Từ công trình về</small></section>
                <section class="material-workspace-card wide"><h3>Chuẩn bị logistics</h3><div class="material-recommend-list">
                    <div><span>Vị trí lấy hàng</span><strong>${yard.zone}${yard.positionY + 1} · Layer ${yard.layer}</strong></div>
                    <div><span>Yêu cầu xe cẩu</span><strong>${yard.weight > 3000 ? 'Cần kiểm tra tải nâng' : 'Tải nâng tiêu chuẩn'}</strong></div>
                    <div><span>Đề xuất</span><strong>${warnings.length ? 'Xử lý cảnh báo stack trước khi xuất' : 'Có thể lập phiếu xuất công trình'}</strong></div>
                </div></section>
            </div>`
    };
    const overlay = document.createElement('div');
    overlay.id = 'component-workspace-overlay';
    overlay.className = 'material-workspace-overlay component-workspace-overlay';
    overlay.innerHTML = `
        <div class="material-workspace-backdrop" onclick="window.closeComponentWorkspace()"></div>
        <section class="material-workspace component-workspace">
            <header class="material-workspace-head">
                <div>
                    <small>${escapeHtml(s.id || '')} · ${escapeHtml(structureTypeName(s))} · ${yard.zone}${yard.positionY + 1}</small>
                    <h2>${escapeHtml(s.name || '')}</h2>
                    <span class="badge b-${structureStatus(s).cls}">${structureStatus(s).label}</span>
                </div>
                <div class="material-workspace-actions">
                    <button class="sm" onclick="window.produceStructure('${escapeAttr(s.id)}')">Sản xuất</button>
                    <button class="sm" onclick="window.exportStructure('${escapeAttr(s.id)}')">Xuất CT</button>
                    <button class="sm" onclick="window.openStructureModal('${escapeAttr(s.id)}')">Chỉnh sửa</button>
                    <button class="sm" onclick="window.closeComponentWorkspace()">✕</button>
                </div>
            </header>
            <div class="material-workspace-main">
                <nav>${tabs.map(([key, label]) => `<button class="${key === tab ? 'active' : ''}" onclick="window.openComponentWorkspace('${escapeAttr(s.id)}', '${key}')"><span>${label}</span>${key === 'yard' && warnings.length ? `<b>${warnings.length}</b>` : ''}</button>`).join('')}</nav>
                <article>${panels[tab] || panels.overview}</article>
            </div>
        </section>
    `;
    document.body.appendChild(overlay);
};

window.showStructureDetail = function(sid) {
    window.openComponentWorkspace(sid);
};

function toVNTime(utcStr) {
    if (!utcStr) return '';
    var d = new Date(utcStr);
    d.setHours(d.getHours() + 7); // UTC+7
    return d.toLocaleString('vi-VN', {hour:'2-digit',minute:'2-digit',second:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'});
}
