import { state, escapeHtml } from './state.js';

const LOG_PAGE_SIZES = [10, 50, 100, 200];

window.logPaging = window.logPaging || { page: 1, size: 50 };

function getLogPage(rows) {
    const paging = window.logPaging;
    const size = Number(paging.size) || 50;
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

function renderLogPageSize(pageData) {
    return `
        <div style="display:flex;align-items:center;gap:8px;margin-left:auto;">
            <span class="metric-sub">Hiển thị:</span>
            <select onchange="window.setLogPageSize(this.value)" style="width:80px;">
                ${LOG_PAGE_SIZES.map(size => `<option value="${size}" ${pageData.size === size ? 'selected' : ''}>${size}</option>`).join('')}
            </select>
        </div>
    `;
}

function renderLogPager(pageData) {
    return `
        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-top:12px;padding:8px 0;">
            <div style="text-align:left;">
                <button class="sm" onclick="window.setLogPage(${pageData.page - 1})" ${pageData.page <= 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>◀ Trang trước</button>
            </div>
            <span class="metric-sub" style="text-align:center;">Trang ${pageData.page} / ${pageData.totalPages} (${pageData.totalItems} dòng)</span>
            <div style="text-align:right;">
                <button class="sm" onclick="window.setLogPage(${pageData.page + 1})" ${pageData.page >= pageData.totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Trang sau ▶</button>
            </div>
        </div>
    `;
}

window.setLogPageSize = function(size) {
    window.logPaging.size = Number(size) || 50;
    window.logPaging.page = 1;
    if (window.render) window.render();
};

window.setLogPage = function(page) {
    window.logPaging.page = Number(page) || 1;
    if (window.render) window.render();
};

export function renderLogs() {
    const allLogs = [...(state.data.logs || [])];
    const pageData = getLogPage(allLogs);
    const logs = pageData.rows;

    return `<div class="card">
        <div class="sec-title" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <span>📋 NHẬT KÝ HỆ THỐNG (${pageData.totalItems})</span>
            ${renderLogPageSize(pageData)}
        </div>
        <div class="tbl-wrap" style="max-height:70vh;overflow-y:auto">
            ${logs.length > 0 ? logs.map(log => {
                const time = log.timeStr || new Date(log.timestamp).toLocaleString('vi-VN');
                return `<div class="log-entry">
                    <span class="log-time">[${time}]</span> 
                    <span class="log-user">👤 ${escapeHtml(log.userName || 'System')}</span> 
                    <span class="log-action">${escapeHtml(log.action || '')}</span> 
                    ${log.details ? `<span class="metric-sub">📝 ${escapeHtml(log.details)}</span>` : ''}
                </div>`;
            }).join('') : '<div class="log-entry">Chưa có hoạt động nào</div>'}
        </div>
        ${renderLogPager(pageData)}
    </div>`;
}
