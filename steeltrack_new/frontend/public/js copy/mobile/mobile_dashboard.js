import { buildMobileDashboardData } from './mobile_dashboard_data.js';
import { drawMobileDashboardCharts } from './mobile_charts.js';
import { createDefaultPeriod, periodMonthValue, toInputDate } from './mobile_dashboard_format.js';
import { createDashboardRenderer } from './mobile_dashboard_render.js';

let deps = {};
let renderer = null;
let dashboardData = null;
let activeTab = 'overview';
let dashboardPeriod = createDefaultPeriod();

function rebuildDashboard() {
    dashboardData = buildMobileDashboardData(deps.state, dashboardPeriod);
}

function drawChartsSoon(tab = activeTab) {
    setTimeout(() => drawMobileDashboardCharts(dashboardData, tab), 80);
}

function renderDashboardShell() {
    document.getElementById('root').innerHTML = renderer.renderShell({
        activeTab,
        data: dashboardData,
        period: dashboardPeriod
    });
    document.getElementById('m-dashboard-modal')?.classList.add(mobileThemeClass());
    deps.fixAllModalHeight?.();
    drawChartsSoon(activeTab);
}

function rerenderDashboard() {
    rebuildDashboard();
    renderDashboardShell();
}

function setDashboardPeriod(nextPeriod) {
    dashboardPeriod = nextPeriod;
    document.getElementById('m-dash-period-sheet')?.remove();
    rerenderDashboard();
}

function setDashboardMonth(value) {
    const [year, month] = String(value || '').split('-').map(Number);
    if (!year || !month) return;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const today = new Date();
    const finalEnd = today.getFullYear() === year && today.getMonth() === month - 1 && today < end ? today : end;
    setDashboardPeriod({
        start: toInputDate(start),
        end: toInputDate(finalEnd)
    });
}

function switchDashboardTab(tab) {
    activeTab = tab;
    dashboardData = dashboardData || buildMobileDashboardData(deps.state, dashboardPeriod);
    document.querySelectorAll('.m-report-tabs button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`mtab-${tab}`)?.classList.add('active');

    const content = document.getElementById('m-dash-content');
    if (!content) return;
    content.innerHTML = renderer.renderTab(tab, dashboardData, dashboardPeriod);
    drawChartsSoon(tab);
}

function showDashboardPeriodSheet() {
    document.getElementById('m-dash-period-sheet')?.remove();
    const target = document.getElementById('m-dashboard-modal') || document.getElementById('root');
    target?.insertAdjacentHTML('beforeend', renderer.renderPeriodSheet(dashboardPeriod));
}

function applyDashboardPeriod() {
    const start = document.getElementById('m-dash-start')?.value;
    const end = document.getElementById('m-dash-end')?.value;
    if (!start || !end) return;
    setDashboardPeriod(start <= end ? { start, end } : { start: end, end: start });
}

function mobileThemeClass() {
    return 'm-wh-theme-' + (localStorage.getItem('steeltrack_mobile_theme') || 'light');
}

function showMobileLowStock() {
    window.showMobileStock?.();
    setTimeout(() => window.filterMobileStockStatus?.('low'), 80);
}

export function installMobileDashboard(options) {
    deps = options || {};
    renderer = createDashboardRenderer({ deps });

    window.showMobileDashboard = function() {
        activeTab = 'overview';
        rerenderDashboard();
    };

    window.switchMDashTab = switchDashboardTab;
    window.showMDashPeriodSheet = showDashboardPeriodSheet;
    window.showMobileLowStock = showMobileLowStock;

    window.applyMDashMonth = function() {
        const value = document.getElementById('m-dash-month')?.value || periodMonthValue(dashboardPeriod);
        setDashboardMonth(value);
    };

    window.setMDashMonth = setDashboardMonth;
    window.applyMDashPeriod = applyDashboardPeriod;
}
