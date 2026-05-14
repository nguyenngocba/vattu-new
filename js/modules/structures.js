import { state, saveState, addLog, escapeHtml, showModal, closeModal } from './state.js';
import { formatMoneyVND, setupNumberInput, getNumberFromInput } from './utils.js';

let structureListContainer = null;
const STRUCTURE_PAGE_SIZES = [10, 50, 100, 200];

window.structurePaging = window.structurePaging || {
    structures: { page: 1, size: 10 },
    sw: { page: 1, size: 10 }
};

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

    let html = `<div class="card">
        <div class="sec-title" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
    <span>🏗️ DANH SÁCH CẤU KIỆN</span>
    <div style="display:flex;align-items:center;gap:10px;margin-left:auto;">
        ${renderStructurePageSize('structures', structurePage)}
        <button class="sm primary" onclick="window.openStructureModal()">+ Thêm cấu kiện</button>
    </div>
</div>

        <div class="tbl-wrap">
            <table style="min-width:600px;">
                <thead><tr><th>Tên cấu kiện</th><th style="text-align:right;">Tồn kho</th><th>ĐVT</th><th style="text-align:right;">Đơn giá</th><th style="text-align:right;">Tổng giá trị</th><th>Thao tác</th></tr></thead>
                <tbody>`;
    
    if (displayStructures.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center;">📭 Chưa có cấu kiện nào</td></tr>';

    } else {
        displayStructures.forEach(s => {
            html += `<tr>
                <td><strong style="cursor:pointer;color:var(--accent);" onclick="window.showStructureDetail('${s.id}')">${escapeHtml(s.name)}</strong></td>
                <td style="text-align:right;">${Number(s.qty||0).toLocaleString('vi-VN')} ${s.unit}</td>
                <td>${s.unit}</td>
                <td style="text-align:right;">${formatMoneyVND(s.cost)}</td>
                <td style="text-align:right;color:var(--accent);font-weight:500;">${formatMoneyVND(Number(s.qty||0) * Number(s.cost||0))}</td>
                <td>
                    <button class="sm" onclick="window.openStructureModal('${s.id}')">✏️</button>
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
    
    showModal(`
        <div class="modal-hd"><span class="modal-title">${s ? '✏️ Sửa' : '➕ Thêm'} cấu kiện</span><button class="xbtn" onclick="closeModal()">✕</button></div>
        <div class="modal-bd">
            <div class="form-grid2">
                <div class="form-group form-full"><label class="form-label">Tên cấu kiện</label><input id="s-name" value="${escapeHtml(s?.name||'')}"></div>
                <div class="form-group"><label class="form-label">Đơn vị tính</label><input id="s-unit" value="${s?.unit||'cái'}"></div>
                <div class="form-group"><label class="form-label">Đơn giá (tự động từ BOM)</label><input type="text" id="s-cost" value="${s?.cost||0}" dir="ltr" readonly style="background:var(--surface3);"></div>
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
    const struct = { id, name, unit, qty: (state.data.structures||[]).find(x=>x.id===sid)?.qty||0, cost, materials };
    
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
        '<div class="form-group"><label class="form-label">📎 File đính kèm</label><input type="file" id="prod-files" multiple onchange="window.handleMobileFiles(this,\'produce\')"><div id="prod-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div></div>' +
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
            var files = '';
            try {
                var att = JSON.parse(l.attachment || '[]');
                att.forEach(function(f){ files += '<a href="'+f+'" target="_blank">📎</a> '; });
            } catch(e){}

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
                '<td style="text-align:center;">'+(files||'—')+'</td>' +
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

            let files = '—';
            try {
                const att = JSON.parse(t.attachment || '[]');
                if (Array.isArray(att) && att.length > 0) {
                    files = att.map(f => `<a href="${f}" target="_blank">📎</a>`).join(' ');
                }
            } catch (e) {}

            return `<tr>
                <td style="white-space:nowrap;">${dt}</td>
                <td style="text-align:center; ${isProduce ? 'color:var(--accent);' : isReturn ? 'color:var(--success-text);' : 'color:var(--warn-text);'} font-weight:bold;">
                    ${isProduce ? '🏭 Sản xuất' : isReturn ? '🔄 Trả về kho' : '📤 Xuất ra CT'}
                </td>
                <td style="text-align:center;">${!isProduce ? escapeHtml(projectName) : '—'}</td>
                <td style="text-align:right;">${Number(t.qty||0).toLocaleString('vi-VN')} ${s.unit}</td>
                <td style="text-align:left;">${escapeHtml(t.note || '—')}</td>
                <td style="text-align:center;">${files}</td>
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
            <div class="form-group"><label class="form-label">📎 File đính kèm</label><input type="file" id="exp-files" multiple onchange="window.handleMobileFiles(this,'structure_export')"><div id="exp-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div></div>
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
        '<div class="form-group"><label class="form-label">📎 File đính kèm</label><input type="file" id="return-structure-files" multiple onchange="window.handleMobileFiles(this,\'structure_return\')"><div id="return-structure-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div></div>' +
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
function toVNTime(utcStr) {
    if (!utcStr) return '';
    var d = new Date(utcStr);
    d.setHours(d.getHours() + 7); // UTC+7
    return d.toLocaleString('vi-VN', {hour:'2-digit',minute:'2-digit',second:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'});
}
