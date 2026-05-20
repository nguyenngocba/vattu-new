import { mobileInlineIcon, mobileTitleIcon } from './mobile_icons.js';

let deps = {};

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

function nowLocalValue() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function titleIcon(name, alt) {
    return mobileTitleIcon(name, alt, escapeValue);
}

function inlineIcon(name, alt) {
    return mobileInlineIcon(name, alt, escapeValue);
}

function setSubmitLoading(isLoading, text = 'Đang lưu...') {
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

function parseMobileNumber(value) {
    const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
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
        let raw = this.value.replace(/\./g, '').replace(/[^\d,]/g, '');
        const parts = raw.split(',');
        if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('');
        const [intPart, decimalPart] = raw.split(',');
        const formattedInt = intPart ? Number(intPart).toLocaleString('vi-VN') : '';
        this.value = decimalPart !== undefined ? formattedInt + ',' + decimalPart.slice(0, 3) : formattedInt;
        if (onChange) onChange();
    });
    input.addEventListener('blur', function() {
        const n = parseMobileNumber(this.value);
        this.value = formatMobileNumber(n);
        if (onChange) onChange();
    });
}

async function cleanupMobileTempFiles(type = null) {
    const uploads = window._upPaths || {};
    const types = type ? [type] : Object.keys(uploads);
    for (const t of types) {
        const paths = uploads[t] || [];
        await Promise.all(paths.map(item => {
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

async function finalizeMobileFiles(type) {
    if (window.moveUploadedFiles) return await window.moveUploadedFiles(type);
    return (window._upPaths && window._upPaths[type]) || [];
}

function renderImportForm(defaultMaterialId) {
    const materials = data().materials || [];
    const suppliers = data().suppliers || [];
    return `
        <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-import-modal">
            <div class="m-modal-hd"><button class="m-back" onclick="cancelMobileForm('purchase')">←</button><span>${titleIcon('logo-nhapkho.png', 'Nhập kho')} NHẬP KHO</span><div></div></div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;">
                <div class="m-field"><label>Thời gian</label><input type="datetime-local" id="mi-datetime" value="${nowLocalValue()}"></div>
                <div class="m-field"><label>${inlineIcon('logo-tongnhacungcap.png', 'Nhà cung cấp')} Nhà cung cấp</label><select id="mi-supplier">${suppliers.map(s => `<option value="${s.id}">${escapeValue(s.name)}</option>`).join('')}</select></div>
                <div class="m-field"><label>${inlineIcon('logo-vattu.png', 'Vật tư')} Vật tư</label><select id="mi-material" onchange="updateMPrice()">${materials.map(m => `<option value="${m.id}" data-cost="${m.cost}" data-unit="${m.unit}" ${String(m.id) === String(defaultMaterialId) ? 'selected' : ''}>${escapeValue(m.name)} (${Number(m.qty).toLocaleString('vi-VN')} ${escapeValue(m.unit)})</option>`).join('')}</select></div>
                <div class="m-field"><label>🔢 Số lượng</label><div class="m-qty-box"><button class="m-qty-btn" onclick="changeMQty(-1)">−</button><input type="text" id="mi-qty" value="1" dir="ltr" class="m-qty-input" oninput="updateMobileTotal()"><button class="m-qty-btn" onclick="changeMQty(1)">+</button></div><div class="m-qty-presets"><span onclick="setMQty(1)">1</span><span onclick="setMQty(5)">5</span><span onclick="setMQty(10)">10</span><span onclick="setMQty(100)">100</span></div></div>
                <div class="m-field"><label>💰 Đơn giá (VNĐ)</label><input type="text" id="mi-price" value="0" dir="ltr" oninput="updateMobileTotal()"></div>
                <div class="m-field"><label>🧾 VAT (%)</label><input type="text" id="mi-vat" value="10" dir="ltr" oninput="updateMobileTotal()"></div>
                <div class="m-field"><label>📝 Ghi chú</label><input type="text" id="mi-note" placeholder="Mã hóa đơn, số chứng từ..."></div>
                <div class="m-field"><label>📎 File đính kèm</label><input type="file" id="mi-files" multiple accept="image/*,.pdf,.xlsx,.csv,.doc,.docx" onchange="handleMobileFiles(this,'purchase')" style="padding:10px;"><div id="mi-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div></div>
                <div class="m-summary"><div>💰 Tiền hàng: <strong id="mi-subtotal">0 ₫</strong></div><div>🧾 VAT (<span id="mi-vat-rate">10</span>%): <strong id="mi-vat-amount">0 ₫</strong></div><div style="font-size:16px;margin-top:4px;">💵 TỔNG: <strong id="mi-total" style="color:#16a34a;">0 ₫</strong></div></div>
                <button class="m-submit" onclick="doMobileImport()">${inlineIcon('logo-nhapkho.png', 'Nhập kho')} XÁC NHẬN NHẬP KHO</button>
            </div>
        </div>`;
}

function renderExportForm(defaultProjectId, defaultMaterialId) {
    const materials = data().materials || [];
    const projects = data().projects || [];
    return `
        <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-export-modal">
            <div class="m-modal-hd"><button class="m-back" onclick="cancelMobileForm('usage')">←</button><span>${titleIcon('logo-xuatkho.png', 'Xuất kho')} XUẤT KHO</span><div></div></div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;">
                <div class="m-field"><label>📅 Thời gian</label><input type="datetime-local" id="me-datetime" value="${nowLocalValue()}"></div>
                <div class="m-field"><label>${inlineIcon('logo-tongcongtrinh.png', 'Công trình')} Công trình</label><select id="me-project">${projects.map(p => `<option value="${p.id}" ${String(p.id) === String(defaultProjectId) ? 'selected' : ''}>${escapeValue(p.name)}</option>`).join('')}</select></div>
                <div class="m-field"><label>${inlineIcon('logo-vattu.png', 'Vật tư')} Vật tư</label><select id="me-material">${materials.map(m => `<option value="${m.id}" data-cost="${m.cost}" data-unit="${m.unit}" data-qty="${m.qty}" ${String(m.id) === String(defaultMaterialId) ? 'selected' : ''}>${escapeValue(m.name)} (Còn: ${Number(m.qty).toLocaleString('vi-VN')} ${escapeValue(m.unit)})</option>`).join('')}</select></div>
                <div class="m-field"><label>🔢 Số lượng</label><div class="m-qty-box"><button class="m-qty-btn" onclick="changeMQty(-1)">−</button><input type="text" id="me-qty" value="1" dir="ltr" class="m-qty-input"><button class="m-qty-btn" onclick="changeMQty(1)">+</button></div></div>
                <div class="m-field"><label>📝 Ghi chú</label><input type="text" id="me-note" placeholder="Vị trí sử dụng..."></div>
                <div class="m-field"><label>📎 File đính kèm</label><input type="file" id="me-files" multiple accept="image/*,.pdf,.xlsx,.csv,.doc,.docx" onchange="handleMobileFiles(this,'usage')" style="padding:10px;"><div id="me-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div></div>
                <button class="m-submit" style="background:#dc2626;" onclick="doMobileExport()">${inlineIcon('logo-xuatkho.png', 'Xuất kho')} XÁC NHẬN XUẤT KHO</button>
            </div>
        </div>`;
}

function renderReturnForm(defaultProjectId) {
    const projects = (data().projects || []).filter(p => (data().transactions || []).some(t => t.projectId === p.id && t.type === 'usage'));
    return `
        <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-return-modal">
            <div class="m-modal-hd"><button class="m-back" onclick="cancelMobileForm('return')">←</button><span>${titleIcon('logo-trahang.png', 'Trả hàng')} TRẢ HÀNG</span><div></div></div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;">
                <div class="m-field"><label>📅 Thời gian</label><input type="datetime-local" id="mr-datetime" value="${nowLocalValue()}"></div>
                <div class="m-field"><label>${inlineIcon('logo-tongcongtrinh.png', 'Công trình')} Công trình</label><select id="mr-project" onchange="loadReturnMaterials()">${projects.map(p => `<option value="${p.id}" ${String(p.id) === String(defaultProjectId) ? 'selected' : ''}>${escapeValue(p.name)}</option>`).join('')}</select></div>
                <div class="m-field"><label>${inlineIcon('logo-vattu.png', 'Vật tư')} Vật tư</label><select id="mr-material" onchange="updateRPrice()"></select><div id="mr-return-info" style="margin-top:6px;font-size:12px;color:#7a8099;"></div></div>
                <div class="m-field"><label>🔢 Số lượng</label><div class="m-qty-box"><button class="m-qty-btn" onclick="changeMQty(-1)">−</button><input type="text" id="mr-qty" value="1" dir="ltr" class="m-qty-input"><button class="m-qty-btn" onclick="changeMQty(1)">+</button></div></div>
                <div class="m-field"><label>💰 Đơn giá hoàn</label><input type="text" id="mr-price" value="0" dir="ltr" readonly></div>
                <div class="m-field"><label>📝 Ghi chú</label><input type="text" id="mr-note" placeholder="Lý do trả hàng..."></div>
                <div class="m-field"><label>📎 File đính kèm</label><input type="file" id="mr-files" multiple accept="image/*,.pdf,.xlsx,.csv,.doc,.docx" onchange="handleMobileFiles(this,'return')" style="padding:10px;"><div id="mr-file-list" style="margin-top:6px;font-size:11px;color:#7a8099;"></div></div>
                <button class="m-submit" style="background:#0d9488;" onclick="doMobileReturn()">${inlineIcon('logo-trahang.png', 'Trả hàng')} XÁC NHẬN TRẢ HÀNG</button>
            </div>
        </div>`;
}

async function saveTransaction(body, successLog) {
    const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Lỗi lưu giao dịch');
    window._upPaths = {};
    deps.addLog?.(successLog.action, successLog.details);
    await window.loadState();
    window.renderMobileViewOnly();
}

export function installMobileForms(options) {
    deps = options || {};

    window.showMobileImport = function(defaultMaterialId = null) {
        if (!(data().materials || []).length) return alert('Chưa có vật tư!');
        if (!(data().suppliers || []).length) return alert('Chưa có nhà cung cấp!');
        document.getElementById('root').innerHTML = renderImportForm(defaultMaterialId);
        deps.fixAllModalHeight?.();
        setTimeout(() => {
            window.updateMPrice();
            bindMobileNumberInput('mi-qty', window.updateMobileTotal);
            bindMobileNumberInput('mi-price', window.updateMobileTotal);
            bindMobileNumberInput('mi-vat', window.updateMobileTotal);
        }, 100);
    };

    window.showMobileExport = function(defaultProjectId = null, defaultMaterialId = null) {
        if (!(data().materials || []).length) return alert('Chưa có vật tư!');
        if (!(data().projects || []).length) return alert('Chưa có công trình!');
        document.getElementById('root').innerHTML = renderExportForm(defaultProjectId, defaultMaterialId);
        deps.fixAllModalHeight?.();
        setTimeout(() => bindMobileNumberInput('me-qty'), 100);
    };

    window.showMobileReturn = function(defaultProjectId = null) {
        const projects = (data().projects || []).filter(p => (data().transactions || []).some(t => t.projectId === p.id && t.type === 'usage'));
        if (!projects.length) return alert('Chưa có công trình nào được xuất kho!');
        document.getElementById('root').innerHTML = renderReturnForm(defaultProjectId);
        deps.fixAllModalHeight?.();
        setTimeout(() => { window.loadReturnMaterials(); bindMobileNumberInput('mr-qty'); }, 250);
    };

    window.changeMQty = function(delta) {
        const input = document.getElementById('mi-qty') || document.getElementById('me-qty') || document.getElementById('mr-qty');
        if (!input) return;
        let val = Math.max(0, parseMobileNumber(input.value) + delta);
        const returnSel = document.getElementById('mr-material');
        if (returnSel && document.getElementById('mr-qty') === input) {
            const maxReturn = Number(returnSel.options[returnSel.selectedIndex]?.dataset?.avail || 0);
            if (maxReturn > 0) val = Math.min(val, maxReturn);
        }
        input.value = formatMobileNumber(val);
        window.updateMobileTotal();
    };

    window.setMQty = function(val) {
        const input = document.getElementById('mi-qty') || document.getElementById('me-qty') || document.getElementById('mr-qty');
        if (!input) return;
        input.value = formatMobileNumber(val);
        window.updateMobileTotal();
    };

    window.updateMPrice = function() {
        const sel = document.getElementById('mi-material');
        const priceInput = document.getElementById('mi-price');
        if (sel && priceInput) priceInput.value = Number(sel.options[sel.selectedIndex]?.dataset?.cost || 0).toLocaleString('vi-VN');
        window.updateMobileTotal();
    };

    window.updateMobileTotal = function() {
        const qtyInput = document.getElementById('mi-qty') || document.getElementById('me-qty') || document.getElementById('mr-qty');
        const priceInput = document.getElementById('mi-price') || document.getElementById('mr-price');
        const vatInput = document.getElementById('mi-vat');
        if (!qtyInput || !priceInput) return;
        const qty = parseMobileNumber(qtyInput.value);
        const price = parseMobileNumber(priceInput.value);
        const vat = vatInput ? parseMobileNumber(vatInput.value) : 0;
        const subtotal = qty * price;
        const vatAmount = subtotal * vat / 100;
        document.getElementById('mi-subtotal') && (document.getElementById('mi-subtotal').textContent = money(subtotal));
        document.getElementById('mi-vat-rate') && (document.getElementById('mi-vat-rate').textContent = vat);
        document.getElementById('mi-vat-amount') && (document.getElementById('mi-vat-amount').textContent = money(vatAmount));
        document.getElementById('mi-total') && (document.getElementById('mi-total').textContent = money(subtotal + vatAmount));
    };

    window.cancelMobileForm = async function(type) {
        await cleanupMobileTempFiles(type);
        window.renderMobileViewOnly();
    };

    window.doMobileImport = async function() {
        try {
            const supplierId = document.getElementById('mi-supplier')?.value;
            const mid = document.getElementById('mi-material')?.value;
            const qty = parseMobileNumber(document.getElementById('mi-qty')?.value);
            const price = parseMobileNumber(document.getElementById('mi-price')?.value);
            const vat = parseMobileNumber(document.getElementById('mi-vat')?.value);
            if (!supplierId || !mid || !qty || !price) return alert('Vui lòng nhập đầy đủ!');
            setSubmitLoading(true, 'Đang nhập kho...');
            const subtotal = qty * price;
            const vatAmount = subtotal * vat / 100;
            const mat = (data().materials || []).find(m => m.id === mid);
            await saveTransaction({
                id: 'm_' + Date.now(), mid, supplierId, type: 'purchase', qty, unitPrice: price, vatRate: vat,
                subtotal, vatAmount, totalAmount: subtotal + vatAmount, note: document.getElementById('mi-note')?.value || 'Nhập từ mobile',
                date: (document.getElementById('mi-datetime')?.value || new Date().toISOString()).split('T')[0],
                datetime: document.getElementById('mi-datetime')?.value || new Date().toISOString(),
                attachment: JSON.stringify(await finalizeMobileFiles('purchase'))
            }, { action: 'Nhập kho (Mobile)', details: `${mat?.name || 'N/A'} - SL: ${qty.toLocaleString('vi-VN')} - VAT: ${vat}%` });
        } catch (err) {
            console.error('Mobile import error:', err);
            setSubmitLoading(false);
            alert('❌ ' + (err.message || 'Lỗi nhập kho'));
        }
    };

    window.doMobileExport = async function() {
        try {
            const projectId = document.getElementById('me-project')?.value;
            const mid = document.getElementById('me-material')?.value;
            const qty = parseMobileNumber(document.getElementById('me-qty')?.value);
            const mat = (data().materials || []).find(m => m.id === mid);
            if (!projectId || !mid || !qty) return alert('Vui lòng nhập đầy đủ!');
            if (mat && Number(mat.qty || 0) < qty) return alert(`Không đủ tồn! Còn ${Number(mat.qty || 0).toLocaleString('vi-VN')} ${mat.unit}`);
            setSubmitLoading(true, 'Đang xuất kho...');
            const total = qty * Number(mat?.cost || 0);
            const project = (data().projects || []).find(p => p.id === projectId);
            await saveTransaction({
                id: 'm_' + Date.now(), mid, projectId, type: 'usage', qty, unitPrice: Number(mat?.cost || 0), totalAmount: total,
                note: document.getElementById('me-note')?.value || 'Xuất từ mobile',
                date: (document.getElementById('me-datetime')?.value || new Date().toISOString()).split('T')[0],
                datetime: document.getElementById('me-datetime')?.value || new Date().toISOString(),
                attachment: JSON.stringify(await finalizeMobileFiles('usage'))
            }, { action: 'Xuất kho (Mobile)', details: `${mat?.name || 'N/A'} - SL: ${qty.toLocaleString('vi-VN')} - CT: ${project?.name || 'N/A'}` });
        } catch (err) {
            console.error('Mobile export error:', err);
            setSubmitLoading(false);
            alert('❌ ' + (err.message || 'Lỗi xuất kho'));
        }
    };

    window.loadReturnMaterials = function() {
        const pid = document.getElementById('mr-project')?.value;
        const sel = document.getElementById('mr-material');
        if (!pid || !sel) return;
        const map = new Map();
        (data().transactions || []).filter(t => t.projectId === pid && t.type === 'usage').forEach(t => {
            const mat = (data().materials || []).find(m => m.id === t.mid);
            if (!mat) return;
            if (!map.has(t.mid)) map.set(t.mid, { id: t.mid, name: mat.name, unit: mat.unit, rec: 0, ret: 0, price: t.unitPrice });
            map.get(t.mid).rec += Number(t.qty || 0);
        });
        (data().transactions || []).filter(t => t.projectId === pid && t.type === 'return').forEach(t => {
            if (map.has(t.mid)) map.get(t.mid).ret += Number(t.qty || 0);
        });
        const list = Array.from(map.values()).map(i => ({ ...i, avail: i.rec - i.ret })).filter(i => i.avail > 0);
        const submitBtn = document.querySelector('#m-return-modal .m-submit');
        if (!list.length) {
            sel.innerHTML = '<option value="">Không có vật tư có thể trả</option>';
            document.getElementById('mr-return-info') && (document.getElementById('mr-return-info').textContent = 'Công trình này chưa có vật tư đã xuất hoặc đã trả hết.');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'ĐÃ TRẢ HẾT'; submitBtn.style.opacity = '.55'; }
            return;
        }
        sel.innerHTML = list.map(m => `<option value="${m.id}" data-price="${m.price}" data-rec="${m.rec}" data-ret="${m.ret}" data-avail="${m.avail}" data-unit="${m.unit}">${escapeValue(m.name)} (Còn trả: ${Number(m.avail).toLocaleString('vi-VN')} ${escapeValue(m.unit)})</option>`).join('');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '✅ XÁC NHẬN TRẢ HÀNG'; submitBtn.style.opacity = '1'; }
        window.updateRPrice();
    };

    window.updateRPrice = function() {
        const sel = document.getElementById('mr-material');
        const opt = sel?.options[sel.selectedIndex];
        const price = Number(opt?.dataset?.price || 0);
        const rec = Number(opt?.dataset?.rec || 0);
        const ret = Number(opt?.dataset?.ret || 0);
        const avail = Number(opt?.dataset?.avail || 0);
        const unit = opt?.dataset?.unit || '';
        document.getElementById('mr-price') && (document.getElementById('mr-price').value = price.toLocaleString('vi-VN'));
        document.getElementById('mr-return-info') && (document.getElementById('mr-return-info').textContent = `Đã xuất: ${rec.toLocaleString('vi-VN')} ${unit} · Đã trả: ${ret.toLocaleString('vi-VN')} ${unit} · Còn trả: ${avail.toLocaleString('vi-VN')} ${unit}`);
        const qtyInput = document.getElementById('mr-qty');
        if (qtyInput && parseMobileNumber(qtyInput.value) > avail) qtyInput.value = formatMobileNumber(avail);
    };

    window.doMobileReturn = async function() {
        try {
            const pid = document.getElementById('mr-project')?.value;
            const mid = document.getElementById('mr-material')?.value;
            const qty = parseMobileNumber(document.getElementById('mr-qty')?.value);
            const price = parseMobileNumber(document.getElementById('mr-price')?.value);
            if (!pid || !mid || !qty) return alert('Vui lòng nhập đầy đủ!');
            const received = (data().transactions || []).filter(t => t.projectId === pid && t.mid === mid && t.type === 'usage').reduce((s, t) => s + Number(t.qty || 0), 0);
            const returned = (data().transactions || []).filter(t => t.projectId === pid && t.mid === mid && t.type === 'return').reduce((s, t) => s + Number(t.qty || 0), 0);
            const avail = received - returned;
            if (qty > avail) return alert(`Không thể trả quá số lượng đã nhận!\nĐã nhận: ${received.toLocaleString('vi-VN')}\nĐã trả: ${returned.toLocaleString('vi-VN')}\nCó thể trả tối đa: ${avail.toLocaleString('vi-VN')}`);
            setSubmitLoading(true, 'Đang trả hàng...');
            const mat = (data().materials || []).find(m => m.id === mid);
            const project = (data().projects || []).find(p => p.id === pid);
            await saveTransaction({
                id: 'm_' + Date.now(), mid, projectId: pid, type: 'return', qty, unitPrice: price, totalAmount: qty * price,
                note: document.getElementById('mr-note')?.value || 'Trả từ mobile',
                date: (document.getElementById('mr-datetime')?.value || new Date().toISOString()).split('T')[0],
                datetime: document.getElementById('mr-datetime')?.value || new Date().toISOString(),
                attachment: JSON.stringify(await finalizeMobileFiles('return'))
            }, { action: 'Trả hàng (Mobile)', details: `${mat?.name || 'N/A'} - SL: ${qty.toLocaleString('vi-VN')} - CT: ${project?.name || 'N/A'}` });
        } catch (err) {
            console.error('Mobile return error:', err);
            setSubmitLoading(false);
            alert('❌ ' + (err.message || 'Lỗi trả hàng'));
        }
    };

    window.handleMobileFiles = function(input, type) {
        if (!window._upPaths) window._upPaths = {};
        if (!window._upPaths[type]) window._upPaths[type] = [];
        const listId = (type === 'purchase' ? 'mi' : type === 'usage' ? 'me' : 'mr') + '-file-list';
        const list = document.getElementById(listId);
        Array.from(input.files || []).forEach(f => {
            const fd = new FormData();
            const id = type + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
            fd.append('file', f);
            fetch('/api/upload/' + type + '/' + id, { method: 'POST', body: fd }).then(r => r.json()).then(d => {
                if (!d.success) return;
                window._upPaths[type].push({ path: d.path, name: f.name });
                if (!list) return;
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
                    if (deps.isMobilePdfFile?.(f.name)) return window.showMobilePdfPreview(encodeURIComponent(d.path), encodeURIComponent(f.name));
                    if (deps.isMobileImageFile?.(f.name)) return window.showMobileImagePreview(encodeURIComponent(d.path), encodeURIComponent(f.name));
                    window.open(d.path, '_blank');
                };
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.textContent = '×';
                removeBtn.title = 'Bỏ file';
                removeBtn.style.cssText = 'width:20px;height:20px;padding:0;border:none;border-radius:50%;background:#dc2626;color:#fff;font-weight:800;line-height:20px;cursor:pointer;';
                removeBtn.onclick = async function() {
                    await fetch('/api/upload/temp', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: d.path }) }).catch(function() {});
                    window._upPaths[type] = (window._upPaths[type] || []).filter(item => (typeof item === 'string' ? item : item.path) !== d.path);
                    wrap.remove();
                };
                wrap.appendChild(link);
                wrap.appendChild(removeBtn);
                list.appendChild(wrap);
            });
        });
    };
}
