import { mobileTxnTypeIcon } from './mobile_icons.js';

let deps = {};

function escapeValue(value) {
    const text = String(value ?? '');
    return deps.escapeHtml ? deps.escapeHtml(text) : text;
}

function money(value) {
    return deps.formatMoneyVND ? deps.formatMoneyVND(value || 0) : Number(value || 0).toLocaleString('vi-VN');
}

export function parseAttachmentFiles(attachment) {
    if (!attachment || attachment === '[]' || attachment === 'null' || attachment === '') return [];

    try {
        const files = typeof attachment === 'string' ? JSON.parse(attachment) : attachment;
        return Array.isArray(files) ? files.filter(Boolean) : [];
    } catch (e) {
        return [];
    }
}

export function getAttachmentFilePath(file) {
    return typeof file === 'string' ? file : file?.path;
}

export function getAttachmentFileName(file) {
    const filePath = getAttachmentFilePath(file);
    return typeof file === 'string'
        ? String(filePath || '').split('/').pop()
        : (file?.name || String(filePath || '').split('/').pop() || 'file');
}

export function getMobileFileAction(fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️ Xem ảnh';
    if (ext === 'pdf') return '📄 Mở PDF';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊 Mở Excel';
    if (['doc', 'docx'].includes(ext)) return '📝 Mở Word';

    return '📎 Mở file';
}

export function isMobileImageFile(fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
}

export function isMobilePdfFile(fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    return ext === 'pdf';
}

function renderFileAction(file) {
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
                <small>${escapeValue(fileName)}</small>
            </a>
        `;
    }

    if (isMobileImageFile(fileName)) {
        return `
            <a href="javascript:void(0)"
               onclick="event.preventDefault();event.stopPropagation();window.showMobileImagePreview('${encodeURIComponent(filePath)}', '${encodeURIComponent(fileName)}')"
               class="m-txn-file-item">
                <span>${action}</span>
                <small>${escapeValue(fileName)}</small>
            </a>
        `;
    }

    return `
        <a href="${filePath}" target="_blank" ${shouldDownload ? 'download' : ''} class="m-txn-file-item">
            <span>${action}</span>
            <small>${escapeValue(fileName)}</small>
        </a>
    `;
}

export function installMobileFiles(options) {
    deps = options || {};

    window.showMobilePdfPreview = function(filePath, fileName) {
        filePath = decodeURIComponent(filePath || '');
        fileName = decodeURIComponent(fileName || '');

        const html = `
            <div id="m-pdf-preview" class="m-doc-preview" onclick="this.remove()">
                <div class="m-doc-preview-head" onclick="event.stopPropagation()">
                    <span>${escapeValue(fileName || 'PDF đính kèm')}</span>
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
                    <span>${escapeValue(fileName || 'Ảnh đính kèm')}</span>
                    <button type="button" onclick="document.getElementById('m-image-preview')?.remove()">×</button>
                </div>
                <img src="${filePath}" alt="${escapeValue(fileName || 'Ảnh đính kèm')}" onclick="event.stopPropagation()">
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
                    ${files.map(renderFileAction).join('')}
                    <button class="danger" onclick="document.getElementById('m-file-sheet')?.remove()">Đóng</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    };

    window.showMobileAttachmentSheetByTxn = function(txnId) {
        const attachment = window._mobileTxnAttachments?.[txnId];
        if (!attachment) return;
        window.showMobileAttachmentSheet(encodeURIComponent(attachment));
    };

    window.showMobileTxnDetail = function(txnKey) {
        const state = deps.state;
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
        const typeIcon = mobileTxnTypeIcon(t.type, typeText, escapeValue);
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
            ? files.map(renderFileAction).join('')
            : '<div class="m-txn-file-empty">Không có file đính kèm</div>';

        const detailRow = function(label, value, isTotal = false) {
            return `
                <div class="m-txn-detail-row ${isTotal ? 'total' : ''}">
                    <span>${label}</span>
                    <strong>${value}</strong>
                </div>
            `;
        };

        const theme = localStorage.getItem('steeltrack_mobile_theme') === 'light' ? 'light' : 'dark';
        const html = `
            <div id="m-txn-detail-sheet" class="m-txn-detail-overlay m-wh-theme-${theme}" onclick="this.remove()">
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
                        ${detailRow('Vật tư', escapeValue(mat?.name || 'N/A'))}
                        ${isImport ? detailRow('Nhà cung cấp', escapeValue(supplier?.name || 'N/A')) : ''}
                        ${t.projectId ? detailRow('Công trình', escapeValue(project?.name || 'N/A')) : ''}
                        ${detailRow('Số lượng', `${Number(t.qty || 0).toLocaleString('vi-VN')} ${mat?.unit || ''}`)}
                        ${detailRow('Đơn giá', money(t.unitPrice || 0))}
                        ${t.vatRate !== undefined ? detailRow('VAT', `${t.vatRate || 0}%`) : ''}
                        ${detailRow('Thành tiền', money(t.totalAmount || 0), true)}
                    </div>

                    <div class="m-txn-detail-note">${escapeValue(t.note || 'Không có ghi chú')}</div>

                    <div class="m-txn-file-title">File đính kèm</div>
                    <div class="m-txn-file-list">${fileHtml}</div>
                </div>
            </div>
        `;

        (document.getElementById('root') || document.body).insertAdjacentHTML('beforeend', html);
    };
}
