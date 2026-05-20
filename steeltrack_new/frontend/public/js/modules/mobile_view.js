import { state, addLog, escapeHtml } from './state.js';
import { formatMoneyVND } from './utils.js';
import { installMobileFiles, isMobileImageFile, isMobilePdfFile } from '../mobile/mobile_files.js';
import { installMobileLazyFeatures } from '../mobile/mobile_lazy.js';
import { bindRecentTxnClicks, installMobileTransactions, renderRecentTxnSection } from '../mobile/mobile_transactions.js';
import {
    fixAllModalHeight,
    installMobileShell,
    renderMobileActionSheet,
    renderMobileSidebar,
    renderMobileTabBar,
    resetMobileSidebar
} from '../mobile/mobile_shell.js';
import {
    getMobileHomeTheme,
    installMobileHome,
    renderMobileCategoryStock,
    renderMobileHomeHero,
    renderMobileHomeStats,
    renderMobileQuickActions
} from '../mobile/mobile_home.js';

// ========== DETECT MOBILE ==========
export function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth < 768;
}
// ========== RENDER CHÍNH ==========
export function renderMobileView() {
    const materials = state.data.materials || [];
    const projects = state.data.projects || [];
    const transactions = state.data.transactions || [];
    const lowStockCount = materials.filter(m => Number(m.qty || 0) <= Number(m.low || 0)).length;
    const currentUser = state.currentUser || {};
    return `
<div class="mobile-app ios-liquid m-wh-theme-${getMobileHomeTheme()}" id="mobile-app-container">
            ${renderMobileSidebar(currentUser)}

${renderMobileHomeHero(currentUser, lowStockCount)}
${renderMobileHomeStats(materials, transactions, projects, lowStockCount)}
${renderMobileQuickActions(lowStockCount)}
${renderMobileCategoryStock(materials)}
${renderRecentTxnSection(transactions)}

            <!-- MENU POPUP -->
            <div id="m-menu" class="m-menu" style="display:none;" onclick="event.stopPropagation()">
                <div class="m-menu-item" onclick="logout()">🚪 Đăng xuất</div>
            </div>
            ${renderMobileActionSheet()}
            ${renderMobileTabBar('home')}
            <div id="modal-area"></div>
        </div>
    `;
}
// ========== RENDER LẠI / CHUYỂN CHẾ ĐỘ ==========
window.renderMobileViewOnly = function() {
    window.loadState().then(() => {
        resetMobileSidebar();
        document.getElementById('root').innerHTML = renderMobileView();
        setTimeout(bindRecentTxnClicks, 50);
    });
};


window.switchMobileMode = function(mode) { if (mode === 'desktop') { localStorage.setItem('steeltrack_ui_mode', 'desktop'); window.location.reload(); } };

// Export global cho app.js
window.renderMobileView = renderMobileView;
window.renderMobileViewOnly = renderMobileViewOnly;

installMobileFiles({
    state,
    escapeHtml,
    formatMoneyVND
});

installMobileTransactions({
    state,
    escapeHtml,
    formatMoneyVND,
    renderMobileView
});

installMobileHome({
    state,
    escapeHtml,
    formatMoneyVND
});

installMobileShell({
    state,
    escapeHtml
});

installMobileLazyFeatures({
    state,
    escapeHtml,
    formatMoneyVND,
    addLog,
    fixAllModalHeight,
    isMobilePdfFile,
    isMobileImageFile,
    renderMobileActionSheet,
    renderMobileTabBar
});

// ========== INIT MOBILE ==========
export function initMobileEvents() {
// Fix chiều cao trên điện thoại thật
    function fixMobileHeight() {
        const app = document.getElementById('mobile-app-container');
        if (app) {
            app.style.height = window.innerHeight + 'px';
        }
    }
    fixMobileHeight();
    window.addEventListener('resize', fixMobileHeight);
    window.addEventListener('orientationchange', function() {
        setTimeout(fixMobileHeight, 300);
    });
    
    // Click outside menu    
document.addEventListener('click', function(e) {
        const menu = document.getElementById('m-menu');
        if (menu && !e.target.closest('.m-header-right')) { menu.style.display = 'none'; }
    });
setTimeout(window.bindRecentTxnClicks || bindRecentTxnClicks, 50);
}
