import { escapeHtml } from '../state.js';
import { formatMoneyVND } from '../utils.js?v=1777963068';

let forecastDataCache = null;
let forecastProjectsCache = null;
let forecastStructuresCache = null;
function getPagerHelpers() {
    return {
        getPagedData: window.getPagedData || function(key, rows) {
            const paging = window.dashboardPaging?.[key] || { page: 1, size: 10 };
            const size = Number(paging.size) || 10;
            const totalItems = rows.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / size));
            const page = Math.min(Math.max(1, Number(paging.page) || 1), totalPages);
            const start = (page - 1) * size;
            return { rows: rows.slice(start, start + size), page, size, totalItems, totalPages };
        },
        renderDashboardPager: window.renderDashboardPager || function() { return ''; },
        renderDashboardPageSize: window.renderDashboardPageSize || function() { return ''; }
    };
}


export async function loadForecast() {
    const container = document.getElementById('forecast-container');
    if (!container) return;

    container.innerHTML = '<div class="metric-sub" style="text-align:center;">Đang tải dữ liệu...</div>';

    try {
        const res = await fetch('/api/forecast');
        const data = await res.json();

        if (!data.success || !data.data || data.data.length === 0) {
            container.innerHTML = '<div class="metric-sub" style="text-align:center;">Chưa có dữ liệu dự báo</div>';
            const urgent = document.getElementById('forecast-urgent-count');
            const warning = document.getElementById('forecast-warning-count');
            const good = document.getElementById('forecast-good-count');
            if (urgent) urgent.textContent = '0';
            if (warning) warning.textContent = '0';
            if (good) good.textContent = '0';
            return;
        }

        forecastDataCache = data.data;

        const urgentCount = data.data.filter((item) => item.warning_level === 'danger').length;
        const warningCount = data.data.filter((item) => item.warning_level === 'warning').length;
        const goodCount = data.data.filter((item) => item.warning_level === 'good' || item.warning_level === 'info').length;

        const urgentEl = document.getElementById('forecast-urgent-count');
        const warningEl = document.getElementById('forecast-warning-count');
        const goodEl = document.getElementById('forecast-good-count');

        if (urgentEl) urgentEl.textContent = urgentCount;
        if (warningEl) warningEl.textContent = warningCount;
        if (goodEl) goodEl.textContent = goodCount;

        renderForecastTable();
    } catch (e) {
        console.error('Forecast error:', e);
        container.innerHTML = '<div class="metric-sub" style="text-align:center;">Lỗi tải dữ liệu: ' + e.message + '</div>';
    }
}

export function renderForecastTable() {
    const container = document.getElementById('forecast-container');
    if (!container || !forecastDataCache) return;

    const { getPagedData, renderDashboardPager, renderDashboardPageSize } = getPagerHelpers();
    const pageData = getPagedData('forecastMaterials', forecastDataCache);
    const paginatedData = pageData.rows;

    let html = '<div class="sec-title" style="display:flex;align-items:center;justify-content:space-between;">' +
        '<span>📦 DỰ BÁO NHU CẦU VẬT TƯ (3 tháng gần nhất)</span>' +
        renderDashboardPageSize('forecastMaterials', pageData) +
        '</div>';

    html += '<div class="tbl-wrap"><table style="min-width:800px;"><thead><tr>' +
        '<th>Vật tư</th><th>ĐVT</th><th style="text-align:right;">Tồn kho</th>' +
        '<th style="text-align:right;">TB tháng</th><th style="text-align:right;">Đề xuất nhập</th>' +
        '<th>Trạng thái</th><th>Gợi ý</th>' +
        '</tr></thead><tbody>';

    paginatedData.forEach((item) => {
        const statusClass = item.warning_level === 'danger' ? 'status-danger' :
                           item.warning_level === 'warning' ? 'status-warn' :
                           'status-good';
        let suggestion = '';
        if (item.current_stock <= item.min_stock) {
            suggestion = 'Cần nhập gấp!';
        } else if (item.total_exported > 0 && item.current_stock < item.avg_monthly_usage) {
            suggestion = 'Nên nhập ' + item.suggested_order + ' ' + item.unit;
        } else if (item.total_exported === 0) {
            suggestion = 'Chưa có nhu cầu';
        } else {
            suggestion = 'Tạm ổn';
        }

        html += '<tr onclick="window.showMaterialDetail(\'' + item.id + '\')" style="cursor:pointer;">' +
            '<td><strong>' + escapeHtml(item.name) + '</strong></td>' +
            '<td>' + item.unit + '</td>' +
            '<td style="text-align:right;' + (item.warning_level === 'danger' ? 'color:var(--danger-text);font-weight:bold;' : '') + '">' + Number(item.current_stock).toLocaleString('vi-VN') + '</td>' +
            '<td style="text-align:right;">' + Number(item.avg_monthly_usage).toLocaleString('vi-VN') + '</td>' +
            '<td style="text-align:right;color:var(--accent);font-weight:bold;">' + Number(item.suggested_order).toLocaleString('vi-VN') + ' ' + item.unit + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + item.status + '</span></td>' +
            '<td>' + suggestion + '</td>' +
            '</tr>';
    });

    html += '</tbody></table></div>';
    html += renderDashboardPager('forecastMaterials', pageData, 'vật tư');
    html += '<div class="metric-sub" style="margin-top:8px;">Dự báo dựa trên nhu cầu 3 tháng gần nhất (trung bình tháng x 2 - tồn kho hiện tại)</div>';

    container.innerHTML = html;
}


export async function loadForecastProjects() {
    try {
        const res = await fetch('/api/forecast-projects');
        const data = await res.json();
        const container = document.getElementById('forecast-projects-container');
        if (!container || !data.success) return;

        forecastProjectsCache = data.data || [];
        renderForecastProjectsTable();
    } catch (e) {}
}

function renderForecastProjectsTable() {
    const container = document.getElementById('forecast-projects-container');
    if (!container || !forecastProjectsCache) return;

    const { getPagedData, renderDashboardPager, renderDashboardPageSize } = getPagerHelpers();
    const pageData = getPagedData('forecastProjects', forecastProjectsCache);
    const rows = pageData.rows;

    let html = '<div class="sec-title" style="display:flex;align-items:center;justify-content:space-between;">' +
        '<span>🏗️ DỰ BÁO CÔNG TRÌNH</span>' +
        renderDashboardPageSize('forecastProjects', pageData) +
        '</div>';

    html += '<div class="tbl-wrap"><table><thead><tr><th>Công trình</th><th style="text-align:right;">NS còn lại</th><th style="text-align:center;">Tiến độ</th><th style="text-align:center;">Dự kiến</th><th>Trạng thái</th></tr></thead><tbody>';

    rows.forEach((p) => {
        const cls = p.status === 'VƯỢT NS' ? 'status-danger' : p.status === 'SẮP HẾT' ? 'status-warn' : 'status-good';
        const remainColor = p.remain < 0 ? 'color:var(--danger-text);' : '';
        html += '<tr><td><strong>' + escapeHtml(p.name) + '</strong></td>' +
            '<td style="text-align:right;' + remainColor + '">' + formatMoneyVND(p.remain) + '</td>' +
            '<td style="text-align:center;">' + p.pct + '%</td>' +
            '<td style="text-align:center;">' + (p.estMonths === '—' ? '—' : p.estMonths + ' tháng') + '</td>' +
            '<td><span class="status-badge ' + cls + '">' + p.status + '</span></td></tr>';
    });

    html += '</tbody></table></div>';
    html += renderDashboardPager('forecastProjects', pageData, 'công trình');

    container.innerHTML = html;
}


export async function loadForecastStructures() {
    try {
        const res = await fetch('/api/forecast-structures');
        const data = await res.json();
        const container = document.getElementById('forecast-structures-container');
        if (!container || !data.success) return;

        forecastStructuresCache = data.data || [];
        renderForecastStructuresTable();
    } catch (e) {}
}

function renderForecastStructuresTable() {
    const container = document.getElementById('forecast-structures-container');
    if (!container || !forecastStructuresCache) return;

    const { getPagedData, renderDashboardPager, renderDashboardPageSize } = getPagerHelpers();
    const pageData = getPagedData('forecastStructures', forecastStructuresCache);
    const rows = pageData.rows;

    let html = '<div class="sec-title" style="display:flex;align-items:center;justify-content:space-between;">' +
        '<span>🏭 DỰ BÁO CẤU KIỆN</span>' +
        renderDashboardPageSize('forecastStructures', pageData) +
        '</div>';

    html += '<div class="tbl-wrap"><table><thead><tr><th>Cấu kiện</th><th style="text-align:right;">Tồn kho</th><th style="text-align:right;">Xuất TB/tháng</th><th style="text-align:center;">Dự kiến hết</th><th>Trạng thái</th></tr></thead><tbody>';

    rows.forEach((s) => {
        const cls = s.status === 'CẦN SX' ? 'status-danger' : s.status === 'SẮP HẾT' ? 'status-warn' : 'status-good';
        html += '<tr><td><strong>' + escapeHtml(s.name) + '</strong></td>' +
            '<td style="text-align:right;">' + Number(s.stock).toLocaleString('vi-VN') + ' ' + s.unit + '</td>' +
            '<td style="text-align:right;">' + Number(s.avgMonthly).toLocaleString('vi-VN') + ' ' + s.unit + '</td>' +
            '<td style="text-align:center;">' + (s.estMonths === '99+' ? '> 99 tháng' : s.estMonths + ' tháng') + '</td>' +
            '<td><span class="status-badge ' + cls + '">' + s.status + '</span></td></tr>';
    });

    html += '</tbody></table></div>';
    html += renderDashboardPager('forecastStructures', pageData, 'cấu kiện');

    container.innerHTML = html;
}



window.loadForecast = loadForecast;
window.renderForecastTable = renderForecastTable;
window.loadForecastProjects = loadForecastProjects;
window.loadForecastStructures = loadForecastStructures;
window.renderForecastProjectsTable = renderForecastProjectsTable;
window.renderForecastStructuresTable = renderForecastStructuresTable;
