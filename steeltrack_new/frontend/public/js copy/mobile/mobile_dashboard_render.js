import {
    compactValue,
    monthDisplay,
    pct,
    periodButtonLabel,
    periodLabel,
    periodMonthValue,
    recentMonths
} from './mobile_dashboard_format.js';

export function createDashboardRenderer(options = {}) {
    const deps = options.deps || {};

    const money = value => deps.formatMoneyVND ? deps.formatMoneyVND(value || 0) : Number(value || 0).toLocaleString('vi-VN');
    const compact = value => compactValue(value, money);
    const esc = value => {
        const text = String(value ?? '');
        return deps.escapeHtml ? deps.escapeHtml(text) : text;
    };
    const icon = (name, alt) => `<img src="/images/mobile-icons/${name}" alt="${esc(alt || '')}">`;
    const actionLink = (label, action) => `<button type="button" class="m-report-title-action" onclick="${esc(action)}">${esc(label)}</button>`;

    function kpi(label, value, iconName, tone = '') {
        return `
            <div class="m-report-kpi ${tone}">
                <div>${icon(iconName, label)}</div>
                <span>${esc(label)}</span>
                <strong>${esc(value)}</strong>
            </div>
        `;
    }

    function metric(label, value, unit, iconName, tone = '', delta = '') {
        return `
            <div class="m-report-metric ${tone}">
                <div class="m-report-metric-icon">${icon(iconName, label)}</div>
                <span>${esc(label)}</span>
                <strong>${esc(value)}</strong>
                <small>${esc(unit || '')}</small>
                ${delta ? `<em>${esc(delta)}</em>` : ''}
            </div>
        `;
    }

    function renderCategoryLegend(rows, valueFormatter = value => compact(value)) {
        const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0) || 1;
        return rows.slice(0, 5).map((row, index) => {
            const percent = Number(row.value || 0) / total * 100;
            return `
                <div class="m-report-donut-row">
                    <i style="background:${['#38bdf8', '#22c55e', '#facc15', '#f97316', '#64748b'][index] || '#94a3b8'}"></i>
                    <span>${esc(row.name)}</span>
                    <strong>${percent.toFixed(1)}%</strong>
                    <em>${esc(valueFormatter(row.value, row))}</em>
                </div>
            `;
        }).join('');
    }

    function renderDonutCard(title, subtitle, canvasId, rows, valueFormatter) {
        return `
            <section class="m-report-card">
                <div class="m-report-title"><span>${esc(title)}</span><em>${esc(subtitle || '')}</em></div>
                <div class="m-report-donut-wrap">
                    <canvas id="${esc(canvasId)}" class="m-report-donut"></canvas>
                    <div class="m-report-donut-legend">${renderCategoryLegend(rows, valueFormatter)}</div>
                </div>
            </section>
        `;
    }

    function renderBars(rows, valueKey = 'value', labelKey = 'name') {
        const max = Math.max(...rows.map(r => Number(r[valueKey] || 0)), 1);
        return rows.length ? rows.map((row, index) => `
            <div class="m-report-bar-row">
                <div class="m-report-bar-head">
                    <span>${index + 1}. ${esc(row[labelKey])}</span>
                    <strong>${compact(row[valueKey])}</strong>
                </div>
                <div class="m-report-bar"><i style="width:${pct(row[valueKey], max)}%"></i></div>
            </div>
        `).join('') : '<div class="m-report-empty">Chưa có dữ liệu</div>';
    }

    function renderValueTable(rows, valueKey = 'value', labelKey = 'name', headers = ['Tên', 'Giá trị', 'Tỷ lệ']) {
        return rows.length ? `
            <div class="m-report-table">
                <div class="m-report-table-head">
                    <span>${esc(headers[0])}</span>
                    <span>${esc(headers[1])}</span>
                    <span>${esc(headers[2])}</span>
                </div>
                ${rows.map(row => `
                    <div class="m-report-table-row">
                        <strong>${esc(row[labelKey])}</strong>
                        <span>${compact(row[valueKey])}</span>
                        <div><i style="width:${pct(row.percent || row[valueKey], 100)}%"></i></div>
                        <em>${Number(row.percent || 0).toFixed(1)}%</em>
                    </div>
                `).join('')}
            </div>
        ` : '<div class="m-report-empty">Chưa có dữ liệu</div>';
    }

    function renderMaterialTopRows(rows) {
        return rows.length ? rows.map(row => `
            <div class="m-report-material-row">
                <b>${icon('logo-vattu.png', row.name)}</b>
                <strong>${esc(row.name)}</strong>
                <span>${Number(row.qty || 0).toLocaleString('vi-VN')} ${esc(row.unit || '')}</span>
                <em>${compact(row.value)}</em>
            </div>
        `).join('') : '<div class="m-report-empty">Chưa có dữ liệu</div>';
    }

    function renderStars(score) {
        const full = Math.max(0, Math.min(5, Math.round(score)));
        return `${'★'.repeat(full)}${'☆'.repeat(5 - full)}`;
    }

    function renderStructureProgressRows(rows) {
        const statusLabel = {
            completed: 'Hoàn thành',
            in_progress: 'Đang sản xuất',
            pending: 'Chờ sản xuất'
        };
        return rows.length ? rows.map(row => `
            <div class="m-report-production-row ${esc(row.status)}">
                <div>
                    <strong>${esc(row.name)}</strong>
                    <small>${esc(row.type)} · ${Number(row.producedQty || 0).toLocaleString('vi-VN')}/${Number(row.plannedQty || 0).toLocaleString('vi-VN')} ${esc(row.unit || '')}</small>
                </div>
                <div class="m-report-score-bar"><i style="width:${pct(row.progressPct, 100)}%"></i></div>
                <em>${Number(row.progressPct || 0).toFixed(0)}%</em>
                <span>${esc(statusLabel[row.status] || 'Đang sản xuất')}</span>
            </div>
        `).join('') : '<div class="m-report-empty">Chưa có dữ liệu tiến độ cấu kiện</div>';
    }

    function renderProjectBudgetAlerts(rows) {
        return rows.length ? rows.map(row => {
            const over = Number(row.remainingValue || 0) < 0;
            const detail = over
                ? `Vượt ${compact(Math.abs(row.remainingValue))} · đã dùng ${Number(row.usedPct || 0).toFixed(0)}%`
                : `Còn ${compact(row.remainingValue)} · đã dùng ${Number(row.usedPct || 0).toFixed(0)}%`;
            return `
                <div class="m-report-alert ${over ? 'danger' : 'warn'}" onclick="showMobileProjects()">
                    <b>${over ? '!' : '▲'}</b>
                    <div>
                        <strong>${esc(row.name)}</strong>
                        <small>${esc(detail)}</small>
                    </div>
                    <span>›</span>
                </div>
            `;
        }).join('') : '<div class="m-report-empty">Không có công trình chạm ngưỡng ngân sách</div>';
    }

    function renderOverview(d, period) {
        const flowLabel = d.flowGranularity === 'week' ? 'theo tuần' : 'theo tháng';
        return `
            <section class="m-report-section-title">
                <strong>TỔNG QUAN KHO</strong>
                <span>${esc(periodLabel(period))}</span>
            </section>
            <section class="m-report-metrics">
                ${metric('Tồn đầu kỳ', compact(d.summary.startInventoryValue), 'giá trị', 'logo-tongquan.png', 'blue')}
                ${metric('Tồn cuối kỳ', compact(d.summary.inventoryValue), 'giá trị', 'logo-tongvattu.png', 'green')}
                ${metric('Nhập trong kỳ', compact(d.summary.monthImportValue), 'giá trị', 'logo-nhapkho.png', 'amber')}
                ${metric('Xuất trong kỳ', compact(d.summary.monthExportValue), 'giá trị', 'logo-xuatkho.png', 'purple')}
            </section>
            <section class="m-report-grid m-report-overview-grid">
                ${kpi('Vật tư sắp hết', d.summary.lowCount, 'logo-chuongthongbao.png', d.summary.lowCount ? 'red' : 'green')}
                ${kpi('Nhà cung cấp', d.summary.suppliers, 'logo-tongnhacungcap.png', 'blue')}
                ${kpi('Công trình', d.summary.projects, 'logo-tongcongtrinh.png', d.summary.projectBudgetAlertCount ? 'red' : 'amber')}
                ${kpi('Cấu kiện', d.summary.structures, 'logo-tongcaukien.png', 'green')}
            </section>
            <section class="m-report-card">
                <div class="m-report-title"><span>Biến động nhập - xuất - tồn kho</span><em>${flowLabel}</em></div>
                <canvas id="m-report-flow-canvas" class="m-report-canvas"></canvas>
                <div class="m-report-legend"><span><i class="green"></i>Nhập</span><span><i class="blue"></i>Xuất</span><span><i class="orange"></i>Tồn kho</span></div>
            </section>
            <section class="m-report-card">
                <div class="m-report-title"><span>Phân tích theo danh mục</span>${actionLink('Xem tất cả ›', 'showMobileStock()')}</div>
                <div class="m-report-donut-wrap">
                    <canvas id="m-report-category-canvas" class="m-report-donut" data-center="${esc(compact(d.summary.inventoryValue))}" data-subcenter="tồn kho"></canvas>
                    <div class="m-report-donut-legend">${renderCategoryLegend(d.categories)}</div>
                </div>
            </section>
            ${renderDonutCard('Phân tích danh mục công trình', Number(d.summary.projects).toLocaleString('vi-VN'), 'm-report-overview-project-canvas', d.projects.categories, value => `${Number(value || 0).toLocaleString('vi-VN')} CT`)}
            ${renderDonutCard('Phân tích danh mục cấu kiện', Number(d.structures.producedQty).toLocaleString('vi-VN'), 'm-report-overview-structure-canvas', d.structures.typeRows, value => `${Number(value || 0).toLocaleString('vi-VN')} CK`)}
            <section class="m-report-card">
                <div class="m-report-title"><span>Cảnh báo</span>${actionLink('Xem tất cả ›', 'showMobileLowStock()')}</div>
                ${d.lowMaterials.length ? d.lowMaterials.map((m, index) => `<div class="m-report-alert ${index === 0 ? 'danger' : 'warn'}"><b>${index === 0 ? '!' : '▲'}</b><div><strong>${esc(m.name)}</strong><small>Tồn kho: ${Number(m.qty || 0).toLocaleString('vi-VN')} ${esc(m.unit || '')}</small></div><span>›</span></div>`).join('') : '<div class="m-report-empty">Không có cảnh báo</div>'}
            </section>
        `;
    }

    function renderMaterials(d) {
        return `
            <section class="m-report-grid">
                ${kpi('Vật tư', d.summary.materials, 'logo-tongvattu.png', 'blue')}
                ${kpi('Giá trị', compact(d.summary.inventoryValue), 'logo-vattu.png', 'green')}
                ${kpi('Nhóm', d.materials.categories.length, 'logo-xemthem.png', 'amber')}
                ${kpi('Sắp hết', d.summary.lowCount, 'logo-chuongthongbao.png', 'red')}
            </section>
            ${renderDonutCard('Cơ cấu tồn kho vật tư', compact(d.summary.inventoryValue), 'm-report-material-canvas', d.materials.categories)}
            <section class="m-report-card"><div class="m-report-title"><span>Tồn kho theo nhóm vật tư</span><em>Giá trị cuối kỳ</em></div>${renderValueTable(d.materials.categories, 'value', 'name', ['Nhóm vật tư', 'Giá trị', 'Tỷ lệ'])}</section>
            <section class="m-report-card"><div class="m-report-title"><span>Top 5 vật tư tồn nhiều nhất</span>${actionLink('Xem tất cả ›', 'showMobileStock()')}</div>${renderMaterialTopRows(d.materials.topStock)}</section>
        `;
    }

    function renderSuppliers(d, period) {
        return `
            <section class="m-report-grid">
                ${kpi('Nhà cung cấp', d.summary.suppliers, 'logo-tongnhacungcap.png', 'blue')}
                ${kpi('Đơn nhập', d.suppliers.totalOrders, 'logo-nhapkho.png', 'green')}
                ${kpi('Giá trị nhập', compact(d.suppliers.totalValue), 'logo-taophieunhap.png', 'amber')}
                ${kpi('Top NCC', d.suppliers.top.length, 'logo-tongquanlykho.png', 'green')}
            </section>
            ${renderDonutCard('Nhập hàng theo nhà cung cấp', compact(d.suppliers.totalValue), 'm-report-supplier-canvas', d.suppliers.top)}
            <section class="m-report-card"><div class="m-report-title"><span>Top nhà cung cấp theo giá trị nhập</span><em>${esc(periodLabel(period))}</em></div>${renderValueTable(d.suppliers.top, 'value', 'name', ['Nhà cung cấp', 'Giá trị', 'Tỷ lệ'])}</section>
            <section class="m-report-card"><div class="m-report-title"><span>Đánh giá nhà cung cấp</span>${actionLink('Xem tất cả ›', 'showMobileSuppliers()')}</div>${d.suppliers.top.length ? d.suppliers.top.map((s, index) => {
                const score = Math.max(3.8, Math.min(4.9, 4.8 - index * 0.18 + Math.min(0.15, s.orders * 0.02)));
                return `<div class="m-report-rating"><strong>${esc(s.name)}</strong><span>${renderStars(score)}</span><em>${score.toFixed(1)}</em></div>`;
            }).join('') : '<div class="m-report-empty">Chưa có nhập hàng trong kỳ</div>'}</section>
        `;
    }

    function renderProjects(d, period) {
        return `
            <section class="m-report-grid">
                ${kpi('Công trình', d.summary.projects, 'logo-tongcongtrinh.png', 'blue')}
                ${kpi('Giá trị xuất', compact(d.projects.totalExportValue), 'logo-xuatkho.png', 'red')}
                ${kpi('Giá trị trả', compact(d.projects.totalReturnValue), 'logo-trahang.png', 'green')}
                ${kpi('Xuất ròng', compact(d.projects.totalValue), 'logo-baocao.png', 'amber')}
            </section>
            <section class="m-report-card">
                <div class="m-report-title"><span>Nhập - xuất theo công trình</span><em>${esc(periodLabel(period))}</em></div>
                <canvas id="m-report-project-canvas" class="m-report-canvas compact"></canvas>
                <div class="m-report-legend"><span><i class="green"></i>Trả về</span><span><i class="blue"></i>Xuất</span></div>
            </section>
            ${renderDonutCard('Phân tích danh mục công trình', Number(d.summary.projects).toLocaleString('vi-VN'), 'm-report-project-category-canvas', d.projects.categories, value => `${Number(value || 0).toLocaleString('vi-VN')} CT`)}
            <section class="m-report-card"><div class="m-report-title"><span>Danh mục công trình</span><em>Theo ngân sách</em></div>${renderValueTable(d.projects.categories, 'value', 'name', ['Nhóm công trình', 'Số lượng', 'Tỷ lệ'])}</section>
            <section class="m-report-card"><div class="m-report-title"><span>Cảnh báo ngân sách</span>${actionLink('Xem tất cả ›', 'showMobileProjects()')}</div>${renderProjectBudgetAlerts(d.projects.budgetAlerts)}</section>
            <section class="m-report-card"><div class="m-report-title"><span>Xuất ròng theo công trình</span><em>${esc(periodLabel(period))}</em></div>${renderValueTable(d.projects.top, 'netValue', 'name', ['Công trình', 'Giá trị', 'Tỷ lệ'])}</section>
            <section class="m-report-card"><div class="m-report-title"><span>Tỷ lệ dùng ngân sách vật tư</span>${actionLink('Xem tất cả ›', 'showMobileProjects()')}</div>${d.projects.top.length ? d.projects.top.map(p => {
                return `<div class="m-report-project-eff"><strong>${esc(p.name)}</strong><div class="m-report-score-bar"><i style="width:${pct(p.budgetUsagePct, 100)}%"></i></div><em>${Number(p.budgetUsagePct || 0).toFixed(0)}%</em></div>`;
            }).join('') : '<div class="m-report-empty">Chưa có dữ liệu công trình</div>'}</section>
        `;
    }

    function renderStructures(d, period) {
        return `
            <section class="m-report-grid">
                ${kpi('Đã sản xuất', Number(d.structures.producedQty).toLocaleString('vi-VN'), 'logo-tongcaukien.png', 'blue')}
                ${kpi('Đang sản xuất', Number(d.structures.inProgressQty).toLocaleString('vi-VN'), 'logo-tongquan.png', 'amber')}
                ${kpi('Chờ sản xuất', Number(d.structures.pendingQty).toLocaleString('vi-VN'), 'logo-dubao.png', 'red')}
                ${kpi('Hoàn thành', Number(d.structures.completedQty).toLocaleString('vi-VN'), 'logo-tongquanlykho.png', 'green')}
            </section>
            ${renderDonutCard('Sản lượng theo loại cấu kiện', Number(d.structures.producedQty).toLocaleString('vi-VN'), 'm-report-structure-canvas', d.structures.typeRows, value => `${Number(value || 0).toLocaleString('vi-VN')} CK`)}
            <section class="m-report-card"><div class="m-report-title"><span>Phân tích danh mục cấu kiện</span><em>Theo loại</em></div>${renderValueTable(d.structures.typeRows, 'value', 'name', ['Loại cấu kiện', 'Sản lượng', 'Tỷ lệ'])}</section>
            <section class="m-report-card"><div class="m-report-title"><span>Tồn kho cấu kiện</span><em>Cuối kỳ</em></div>${renderBars(d.structures.rows)}</section>
            <section class="m-report-card"><div class="m-report-title"><span>Tiến độ sản xuất</span><em>${esc(periodLabel(period))}</em></div>${renderStructureProgressRows(d.structures.progressRows)}</section>
        `;
    }

    function renderForecast(d, period) {
        const lowRows = d.forecast.lowSoon || [];
        const trend = d.forecast.netValue >= 0 ? 'Dòng tiền nhập đang cao hơn xuất' : 'Tốc độ xuất đang cao hơn nhập';
        return `
            <section class="m-report-grid">
                ${kpi('Nhập TB/tháng', compact(d.forecast.avgImport), 'logo-nhapkho.png', 'green')}
                ${kpi('Xuất TB/tháng', compact(d.forecast.avgExport), 'logo-xuatkho.png', 'red')}
                ${kpi('Chênh lệch', compact(d.forecast.netValue), 'logo-dubao.png', d.forecast.netValue >= 0 ? 'green' : 'red')}
                ${kpi('Tồn dự kiến', compact(d.forecast.projectedInventoryValue), 'logo-tongquan.png', 'blue')}
            </section>
            <section class="m-report-card">
                <div class="m-report-title"><span>Xu hướng nhập - xuất</span><em>6 tháng gần nhất</em></div>
                <canvas id="m-report-forecast-canvas" class="m-report-canvas compact"></canvas>
                <div class="m-report-legend"><span><i class="green"></i>Nhập</span><span><i class="blue"></i>Xuất</span></div>
            </section>
            <section class="m-report-card">
                <div class="m-report-title"><span>Dự báo tháng kế tiếp</span><em>${esc(periodLabel(period))}</em></div>
                <div class="m-report-forecast-state ${d.forecast.netValue >= 0 ? 'good' : 'warn'}">
                    <strong>${esc(trend)}</strong>
                    <span>${esc(compact(Math.abs(d.forecast.netValue)))}</span>
                </div>
                <div class="m-report-score"><strong>Nhập dự kiến</strong><span>${compact(d.forecast.avgImport)}</span><em>Theo TB 6 tháng</em></div>
                <div class="m-report-score"><strong>Xuất dự kiến</strong><span>${compact(d.forecast.avgExport)}</span><em>Theo TB 6 tháng</em></div>
                <div class="m-report-score"><strong>Tồn cuối kỳ dự kiến</strong><span>${compact(d.forecast.projectedInventoryValue)}</span><em>Tạm tính</em></div>
            </section>
            <section class="m-report-card">
                <div class="m-report-title"><span>Vật tư có nguy cơ thiếu</span><em>≤ 45 ngày</em></div>
                ${lowRows.length ? lowRows.map(m => `<div class="m-report-alert warn"><b>▲</b><div><strong>${esc(m.name)}</strong><small>Còn khoảng ${m.daysLeft} ngày · ${Number(m.qty || 0).toLocaleString('vi-VN')} ${esc(m.unit || '')}</small></div><span>›</span></div>`).join('') : '<div class="m-report-empty">Chưa phát hiện nguy cơ thiếu theo dữ liệu kỳ này</div>'}
            </section>
        `;
    }

    function renderTab(tab, data, period) {
        if (tab === 'materials') return renderMaterials(data, period);
        if (tab === 'forecast') return renderForecast(data, period);
        if (tab === 'suppliers') return renderSuppliers(data, period);
        if (tab === 'projects') return renderProjects(data, period);
        if (tab === 'structures') return renderStructures(data, period);
        return renderOverview(data, period);
    }

    function renderShell({ activeTab = 'overview', data, period }) {
        return `
            <div class="m-modal ios-liquid m-report-modal" id="m-dashboard-modal">
                <div class="m-report-status">
                    <span>9:41</span>
                    <strong>▰ ▰ ▰</strong>
                </div>
                <div class="m-report-head compact">
                    <div class="m-report-head-copy">
                        <strong>Báo cáo</strong>
                        <span>${esc(periodLabel(period))}</span>
                    </div>
                    <div class="m-report-head-actions">
                        <button type="button" onclick="showMDashPeriodSheet()"><span class="m-report-period-dot"></span>${esc(periodButtonLabel(period))}<b>⌄</b></button>
                        <button type="button" onclick="showMobileMenu()">●</button>
                    </div>
                </div>
                <div class="m-report-tabs">
                    ${[
                        ['overview', 'Tổng quan', 'logo-tongquan.png'],
                        ['materials', 'Vật tư', 'logo-tongvattu.png'],
                        ['forecast', 'Dự báo', 'logo-dubao.png'],
                        ['suppliers', 'Nhà cung cấp', 'logo-tongnhacungcap.png'],
                        ['projects', 'Công trình', 'logo-tongcongtrinh.png'],
                        ['structures', 'Cấu kiện', 'logo-tongcaukien.png']
                    ].map(([id, label, iconName]) => `<button id="mtab-${id}" class="${activeTab === id ? 'active' : ''}" onclick="switchMDashTab('${id}')">${icon(iconName, label)}<span>${label}</span></button>`).join('')}
                </div>
                <div id="m-dash-content" class="m-report-content">${renderTab(activeTab, data, period)}</div>
                ${deps.renderMobileActionSheet ? deps.renderMobileActionSheet() : ''}
                ${deps.renderMobileTabBar ? deps.renderMobileTabBar('dashboard') : ''}
            </div>
        `;
    }

    function renderPeriodSheet(period) {
        return `
            <div id="m-dash-period-sheet" class="m-action-sheet" style="display:flex;" onclick="this.remove()">
                <div class="m-action-panel m-report-period-panel" onclick="event.stopPropagation()">
                    <div class="m-action-grabber"></div>
                    <h3>Chọn kỳ dữ liệu</h3>
                    <label>Tháng</label>
                    <input type="month" id="m-dash-month" value="${esc(periodMonthValue(period))}" oninput="applyMDashMonth()" onchange="applyMDashMonth()">
                    <div class="m-report-month-list">
                        ${recentMonths().map(month => `
                            <button type="button"
                                    class="${periodMonthValue(period) === month ? 'active' : ''}"
                                    onclick="setMDashMonth('${month}')">${esc(monthDisplay(month))}</button>
                        `).join('')}
                    </div>
                    <div class="m-report-period-grid">
                        <div>
                            <label>Từ ngày</label>
                            <input type="date" id="m-dash-start" value="${esc(period.start)}">
                        </div>
                        <div>
                            <label>Đến ngày</label>
                            <input type="date" id="m-dash-end" value="${esc(period.end)}">
                        </div>
                    </div>
                    <button type="button" onclick="applyMDashMonth()">Dùng tháng đã chọn</button>
                    <button type="button" onclick="applyMDashPeriod()">Áp dụng khoảng ngày</button>
                    <button type="button" class="danger" onclick="document.getElementById('m-dash-period-sheet')?.remove()">Đóng</button>
                </div>
            </div>
        `;
    }

    return {
        renderShell,
        renderPeriodSheet,
        renderTab
    };
}
