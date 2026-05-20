import { state, saveState, addLog, genMid, genPid, genSid, escapeHtml } from './state.js';
import { parseNumber, formatMoneyVND } from './utils.js?v=1777963068';

export function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        if (typeof XLSX === 'undefined') { reject(new Error('Thư viện XLSX chưa được tải')); return; }
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                resolve(jsonData);
            } catch (error) { reject(error); }
        };
        reader.onerror = () => reject(new Error('Không thể đọc file'));
        reader.readAsArrayBuffer(file);
    });
}

export async function importMaterialsFromExcel(file) {
    try {
        const data = await readExcelFile(file);
        const preview = buildImportPreview('materials', data);
        return await commitImportPreview('materials', preview);
    } catch (error) { return { success: false, count: 0, errors: [error.message] }; }
}

export async function importProjectsFromExcel(file) {
    try {
        const data = await readExcelFile(file);
        const preview = buildImportPreview('projects', data);
        return await commitImportPreview('projects', preview);
    } catch (error) { return { success: false, count: 0, errors: [error.message] }; }
}

export async function importSuppliersFromExcel(file) {
    try {
        const data = await readExcelFile(file);
        const preview = buildImportPreview('suppliers', data);
        return await commitImportPreview('suppliers', preview);
    } catch (error) { return { success: false, count: 0, errors: [error.message] }; }
}

function cell(row, keys, fallback = '') {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];
    }
    return fallback;
}

function buildImportPreview(type, data) {
    const rows = (data || []).map((row, index) => {
        const rowNumber = index + 2;
        const errors = [];
        const warnings = [];
        let payload = null;

        if (type === 'materials') {
            const name = String(cell(row, ['Tên vật tư', 'Tên', 'name', 'Name'])).trim();
            const cat = String(cell(row, ['Loại', 'Danh mục', 'category', 'cat'], 'Vật tư khác')).trim() || 'Vật tư khác';
            const unit = String(cell(row, ['Đơn vị', 'unit'], 'cái')).trim() || 'cái';
            const qty = parseNumber(cell(row, ['Số lượng', 'Tồn kho', 'qty'], 0));
            const cost = parseNumber(cell(row, ['Đơn giá', 'Giá', 'cost'], 0));
            const low = parseNumber(cell(row, ['Ngưỡng cảnh báo', 'low'], 5));
            const note = String(cell(row, ['Ghi chú', 'note'], '') || '');
            if (!name) errors.push('Thiếu tên vật tư');
            if (qty < 0) errors.push('Số lượng âm');
            if (cost < 0) errors.push('Đơn giá âm');
            if (low < 0) errors.push('Ngưỡng cảnh báo âm');
            if (state.data.materials.some(m => String(m.name || '').toLowerCase() === name.toLowerCase())) warnings.push('Trùng tên vật tư hiện có');
            payload = { name, cat, unit, qty, cost, low, note };
        }

        if (type === 'projects') {
            const name = String(cell(row, ['Tên công trình', 'Tên', 'name', 'Name'])).trim();
            const budget = parseNumber(cell(row, ['Ngân sách', 'budget'], 0));
            if (!name) errors.push('Thiếu tên công trình');
            if (budget < 0) errors.push('Ngân sách âm');
            if (state.data.projects.some(p => String(p.name || '').toLowerCase() === name.toLowerCase())) errors.push('Công trình đã tồn tại');
            payload = { name, budget, spent: 0 };
        }

        if (type === 'suppliers') {
            const name = String(cell(row, ['Tên nhà cung cấp', 'Tên', 'name', 'Name'])).trim();
            const phone = String(cell(row, ['SĐT', 'Điện thoại', 'phone'], '') || '');
            const email = String(cell(row, ['Email', 'email'], '') || '');
            const address = String(cell(row, ['Địa chỉ', 'address'], '') || '');
            if (!name) errors.push('Thiếu tên nhà cung cấp');
            if (state.data.suppliers.some(s => String(s.name || '').toLowerCase() === name.toLowerCase())) errors.push('Nhà cung cấp đã tồn tại');
            payload = { name, phone, email, address };
        }

        return {
            rowNumber,
            status: errors.length ? 'error' : warnings.length ? 'warning' : 'ok',
            errors,
            warnings,
            payload
        };
    });

    return {
        type,
        total: rows.length,
        rows,
        validRows: rows.filter(row => row.status !== 'error'),
        errorRows: rows.filter(row => row.status === 'error'),
        warningRows: rows.filter(row => row.status === 'warning')
    };
}

async function commitImportPreview(type, preview) {
    if (!preview || preview.total === 0) return { success: false, count: 0, errors: ['File không có dữ liệu'], total: 0 };
    const errors = preview.errorRows.map(row => `Dòng ${row.rowNumber}: ${row.errors.join(', ')}`);
    let successCount = 0;

    for (const row of preview.validRows) {
        if (type === 'materials') {
            const item = { id: genMid(), ...row.payload };
            state.data.materials.push(item);
            fetch('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).catch(function(){});
            successCount++;
        }
        if (type === 'projects') {
            const item = { id: genPid(), ...row.payload };
            state.data.projects.push(item);
            fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).catch(function(){});
            successCount++;
        }
        if (type === 'suppliers') {
            const item = { id: genSid(), ...row.payload };
            state.data.suppliers.push(item);
            fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).catch(function(){});
            successCount++;
        }
    }

    if (successCount > 0) {
        saveState();
        const label = type === 'materials' ? 'vật tư' : type === 'projects' ? 'công trình' : 'nhà cung cấp';
        addLog('Import Excel', `Đã import ${successCount} ${label} từ Excel`);
    }

    return { success: successCount > 0, count: successCount, errors, total: preview.total, warnings: preview.warningRows.length };
}

function renderPreviewTable(preview) {
    if (!preview) return '';
    const rows = preview.rows.slice(0, 30);
    return `
        <div class="import-preview-summary">
            <div><strong>${preview.total}</strong><small>Tổng dòng</small></div>
            <div><strong>${preview.validRows.length}</strong><small>Có thể import</small></div>
            <div><strong>${preview.warningRows.length}</strong><small>Cảnh báo</small></div>
            <div><strong>${preview.errorRows.length}</strong><small>Lỗi</small></div>
        </div>
        <div class="desktop-table-wrap import-preview-table">
            <table>
                <thead><tr><th>Dòng</th><th>Trạng thái</th><th>Dữ liệu chính</th><th>Ghi chú kiểm tra</th></tr></thead>
                <tbody>${rows.map(row => {
                    const p = row.payload || {};
                    const main = preview.type === 'materials'
                        ? `${p.name || '—'} · ${p.cat || '—'} · ${p.qty ?? 0} ${p.unit || ''} · ${formatMoneyVND(p.cost || 0)}`
                        : preview.type === 'projects'
                            ? `${p.name || '—'} · ${formatMoneyVND(p.budget || 0)}`
                            : `${p.name || '—'} · ${p.phone || '—'} · ${p.email || '—'}`;
                    const notes = [...row.errors, ...row.warnings];
                    return `<tr class="import-row-${row.status}"><td>${row.rowNumber}</td><td>${row.status === 'ok' ? 'Hợp lệ' : row.status === 'warning' ? 'Cảnh báo' : 'Lỗi'}</td><td>${escapeHtml(main)}</td><td>${notes.length ? escapeHtml(notes.join(' · ')) : 'Sẵn sàng import'}</td></tr>`;
                }).join('')}</tbody>
            </table>
        </div>
        ${preview.rows.length > rows.length ? `<div class="metric-sub">Chỉ hiển thị trước 30/${preview.rows.length} dòng đầu.</div>` : ''}
    `;
}

export function showImportModal(type, onSuccess) {
    let title = '', acceptFormat = '';
    switch(type) {
        case 'materials': title = '📥 Import danh sách vật tư từ Excel'; acceptFormat = 'Tên vật tư, Loại, Đơn vị, Số lượng, Đơn giá, Ngưỡng cảnh báo, Ghi chú'; break;
        case 'projects': title = '📥 Import danh sách công trình từ Excel'; acceptFormat = 'Tên công trình, Ngân sách'; break;
        case 'suppliers': title = '📥 Import danh sách nhà cung cấp từ Excel'; acceptFormat = 'Tên nhà cung cấp, SĐT, Email, Địa chỉ'; break;
        default: return;
    }
    
    const modalHtml = `<div class="modal-hd"><span class="modal-title">${title}</span><button class="xbtn" onclick="closeModal()">✕</button></div>
        <div class="modal-bd"><div class="metric-card" style="margin-bottom: 16px; background: var(--accent-bg);">
            <div class="metric-sub">📋 Định dạng file Excel (.xlsx, .xls)</div><div class="metric-sub">Các cột khuyến nghị: ${acceptFormat}</div>
            <div class="metric-sub" style="margin-top: 8px;"><a href="#" id="download-template-${type}" style="color: var(--accent);">📎 Tải file mẫu</a></div></div>
            <div class="form-group"><label class="form-label">Chọn file Excel</label><input type="file" id="import-file-input" accept=".xlsx,.xls"></div>
            <div id="import-preview" style="display:none;"></div>
            <div id="import-progress" style="display: none; margin-top: 12px;"><div class="progress-bar"><div id="import-progress-bar" class="progress-fill" style="width: 0%;"></div></div><div id="import-status" class="metric-sub" style="margin-top: 8px;"></div></div>
        </div>
        <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" id="confirm-import" disabled style="opacity:.55;cursor:not-allowed;">Import dữ liệu</button></div>`;
    
    window.showModal(modalHtml, null);
    
    setTimeout(() => {
        const downloadLink = document.getElementById(`download-template-${type}`);
        if (downloadLink) downloadLink.onclick = (e) => { e.preventDefault(); downloadTemplate(type); };
        
        const confirmBtn = document.getElementById('confirm-import');
        const fileInput = document.getElementById('import-file-input');
        const previewDiv = document.getElementById('import-preview');
        let currentPreview = null;

        if (fileInput) fileInput.onchange = async () => {
            const file = fileInput.files[0];
            currentPreview = null;
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '.55';
                confirmBtn.style.cursor = 'not-allowed';
            }
            if (!file) {
                if (previewDiv) { previewDiv.style.display = 'none'; previewDiv.innerHTML = ''; }
                return;
            }
            if (previewDiv) {
                previewDiv.style.display = 'block';
                previewDiv.innerHTML = '<div class="metric-card">Đang đọc và kiểm tra file...</div>';
            }
            try {
                const data = await readExcelFile(file);
                currentPreview = buildImportPreview(type, data);
                if (previewDiv) previewDiv.innerHTML = renderPreviewTable(currentPreview);
                if (confirmBtn) {
                    confirmBtn.disabled = currentPreview.validRows.length === 0;
                    confirmBtn.style.opacity = currentPreview.validRows.length === 0 ? '.55' : '1';
                    confirmBtn.style.cursor = currentPreview.validRows.length === 0 ? 'not-allowed' : 'pointer';
                    confirmBtn.textContent = `Import ${currentPreview.validRows.length} dòng hợp lệ`;
                }
            } catch (err) {
                if (previewDiv) previewDiv.innerHTML = `<div class="metric-card text-danger">Không thể đọc file: ${escapeHtml(err.message)}</div>`;
            }
        };

        if (confirmBtn) confirmBtn.onclick = async () => {
            if (!currentPreview) { alert('Vui lòng chọn và kiểm tra file Excel trước'); return; }
            if (currentPreview.validRows.length === 0) { alert('Không có dòng hợp lệ để import'); return; }
            
            const progressDiv = document.getElementById('import-progress');
            const progressBar = document.getElementById('import-progress-bar');
            const statusDiv = document.getElementById('import-status');
            progressDiv.style.display = 'block'; progressBar.style.width = '50%'; statusDiv.innerText = 'Đang xử lý...';
            
            const result = await commitImportPreview(type, currentPreview);
            
            progressBar.style.width = '100%';
            if (result.success) {
                statusDiv.innerText = `✅ Import thành công: ${result.count}/${result.total} bản ghi`;
                if (result.errors.length > 0) console.warn('Import errors:', result.errors);
                setTimeout(() => {
                    window.closeModal();
                    if (onSuccess) onSuccess();
                    if (window.render) window.render();
                    if (window.showAppToast) window.showAppToast('Import hoàn tất', `Thành công ${result.count}, lỗi ${result.errors.length}`, 'success');
                    else alert(`✅ Import hoàn tất!\nThành công: ${result.count}\nThất bại: ${result.errors.length}`);
                }, 1500);
            } else {
                statusDiv.innerText = `❌ Import thất bại: ${result.errors[0] || 'Lỗi không xác định'}`;
                setTimeout(() => { progressDiv.style.display = 'none'; }, 2000);
            }
        };
    }, 100);
}

function downloadTemplate(type) {
    let data = [], filename = '';
    switch(type) {
        case 'materials':
            data = [{ 'Tên vật tư': 'Thép tấm 10mm', 'Loại': 'Tấm thép', 'Đơn vị': 'tấn', 'Số lượng': 10, 'Đơn giá': 8500000, 'Ngưỡng cảnh báo': 5, 'Ghi chú': 'Thép chất lượng cao' }];
            filename = 'template_import_vat_tu.xlsx'; break;
        case 'projects':
            data = [{ 'Tên công trình': 'Nhà kho A', 'Ngân sách': 50000000 }];
            filename = 'template_import_cong_trinh.xlsx'; break;
        case 'suppliers':
            data = [{ 'Tên nhà cung cấp': 'Công ty Thép ABC', 'SĐT': '0912345678', 'Email': 'contact@thepabc.com', 'Địa chỉ': 'Hà Nội' }];
            filename = 'template_import_nha_cung_cap.xlsx'; break;
    }
    if (typeof XLSX !== 'undefined' && data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, filename);
    } else alert('Đang tải thư viện Excel, vui lòng thử lại sau.');
}
