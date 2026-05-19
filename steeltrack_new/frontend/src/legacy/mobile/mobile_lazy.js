import { loadMobileStylesheet } from './mobile_shell.js';

let deps = {};
let mobileDashboardLoadPromise = null;
let mobileFormsLoadPromise = null;
let mobileStockLoadPromise = null;
let mobileProjectsLoadPromise = null;
let mobileDashboardStylePromise = null;
let mobileFormsStylePromise = null;
let mobileStockStylePromise = null;
let mobileProjectsStylePromise = null;

function ensureMobileDashboardStyle() {
    if (!mobileDashboardStylePromise) {
        mobileDashboardStylePromise = loadMobileStylesheet(
            'mobile-dashboard-css',
            'css/mobile/mobile-dashboard.css'
        );
    }
    return mobileDashboardStylePromise;
}

function ensureMobileFormsStyle() {
    if (!mobileFormsStylePromise) {
        mobileFormsStylePromise = loadMobileStylesheet(
            'mobile-forms-css',
            'css/mobile/mobile-forms.css',
            'mobile-transactions-css'
        );
    }
    return mobileFormsStylePromise;
}

function ensureMobileStockStyle() {
    if (!mobileStockStylePromise) {
        mobileStockStylePromise = loadMobileStylesheet(
            'mobile-stock-css',
            'css/mobile/mobile-stock.css',
            'mobile-home-css'
        );
    }
    return mobileStockStylePromise;
}

function ensureMobileProjectsStyle() {
    if (!mobileProjectsStylePromise) {
        mobileProjectsStylePromise = loadMobileStylesheet(
            'mobile-projects-css',
            'css/mobile/mobile-projects.css',
            ['mobile-stock-css', 'mobile-home-css']
        );
    }
    return mobileProjectsStylePromise;
}

async function ensureMobileDashboard() {
    if (!mobileDashboardLoadPromise) {
        mobileDashboardLoadPromise = Promise.all([
            ensureMobileDashboardStyle(),
            import('./mobile_dashboard.js')
        ]).then(function(results) {
            const module = results[1];
            module.installMobileDashboard({
                state: deps.state,
                escapeHtml: deps.escapeHtml,
                formatMoneyVND: deps.formatMoneyVND,
                renderMobileActionSheet: deps.renderMobileActionSheet,
                renderMobileTabBar: deps.renderMobileTabBar,
                fixAllModalHeight: deps.fixAllModalHeight
            });
        });
    }
    return mobileDashboardLoadPromise;
}

async function ensureMobileForms() {
    if (!mobileFormsLoadPromise) {
        mobileFormsLoadPromise = Promise.all([
            ensureMobileFormsStyle(),
            import('./mobile_forms.js')
        ]).then(function(results) {
            const module = results[1];
            module.installMobileForms({
                state: deps.state,
                escapeHtml: deps.escapeHtml,
                formatMoneyVND: deps.formatMoneyVND,
                addLog: deps.addLog,
                fixAllModalHeight: deps.fixAllModalHeight,
                isMobilePdfFile: deps.isMobilePdfFile,
                isMobileImageFile: deps.isMobileImageFile
            });
        });
    }
    return mobileFormsLoadPromise;
}

async function ensureMobileStock() {
    if (!mobileStockLoadPromise) {
        mobileStockLoadPromise = Promise.all([
            ensureMobileStockStyle(),
            import('./mobile_stock.js')
        ]).then(function(results) {
            const module = results[1];
            module.installMobileStock({
                state: deps.state,
                escapeHtml: deps.escapeHtml,
                formatMoneyVND: deps.formatMoneyVND,
                renderMobileActionSheet: deps.renderMobileActionSheet,
                renderMobileTabBar: deps.renderMobileTabBar,
                fixAllModalHeight: deps.fixAllModalHeight
            });
        });
    }
    return mobileStockLoadPromise;
}

async function ensureMobileProjects() {
    if (!mobileProjectsLoadPromise) {
        mobileProjectsLoadPromise = Promise.all([
            ensureMobileProjectsStyle(),
            import('./mobile_projects.js')
        ]).then(function(results) {
            const module = results[1];
            module.installMobileProjects({
                state: deps.state,
                escapeHtml: deps.escapeHtml,
                formatMoneyVND: deps.formatMoneyVND,
                renderMobileActionSheet: deps.renderMobileActionSheet,
                renderMobileTabBar: deps.renderMobileTabBar,
                fixAllModalHeight: deps.fixAllModalHeight
            });
        });
    }
    return mobileProjectsLoadPromise;
}

export function installMobileLazyFeatures(options) {
    deps = options;

    window.showMobileDashboard = async function() {
        await ensureMobileDashboard();
        return window.showMobileDashboard();
    };

    window.showMobileImport = async function(defaultMaterialId = null) {
        await ensureMobileForms();
        return window.showMobileImport(defaultMaterialId);
    };

    window.showMobileExport = async function(defaultProjectId = null, defaultMaterialId = null) {
        await ensureMobileForms();
        return window.showMobileExport(defaultProjectId, defaultMaterialId);
    };

    window.showMobileReturn = async function(defaultProjectId = null) {
        await ensureMobileForms();
        return window.showMobileReturn(defaultProjectId);
    };

    window.showMobileStock = async function() {
        await ensureMobileStock();
        return window.showMobileStock();
    };

    window.showMobileLowStock = async function() {
        await ensureMobileStock();
        return window.showMobileLowStock();
    };

    window.showMobileMaterialDetail = async function(materialId) {
        await ensureMobileStock();
        return window.showMobileMaterialDetail(materialId);
    };

    window.filterMStock = async function() {
        await ensureMobileStock();
        return window.filterMStock();
    };

    window.filterMobileStockStatus = async function(status) {
        await ensureMobileStock();
        return window.filterMobileStockStatus(status);
    };

    window.showMobileStockByCategory = async function(encodedCategory) {
        await ensureMobileStock();
        return window.showMobileStockByCategory(encodedCategory);
    };

    window.showMobileProjects = async function() {
        await ensureMobileProjects();
        return window.showMobileProjects();
    };

    window.showMobileProjectDetail = async function(projectId) {
        await ensureMobileProjects();
        return window.showMobileProjectDetail(projectId);
    };

    window.filterMobileProjects = async function() {
        await ensureMobileProjects();
        return window.filterMobileProjects();
    };
}
