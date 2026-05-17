const elements = new Map();

function createCanvasContext() {
    return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: 'left',
        setTransform() {},
        clearRect() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        quadraticCurveTo() {},
        arc() {},
        stroke() {},
        fill() {},
        fillRect() {},
        fillText() {}
    };
}

function registerHtmlElements(html) {
    const idMatches = String(html || '').matchAll(/<([a-zA-Z0-9-]+)[^>]*\sid="([^"]+)"/g);
    for (const match of idMatches) {
        if (!elements.has(match[2])) createElement(match[1], match[2]);
    }
}

function createClassList() {
    const values = new Set();
    return {
        add: (...items) => items.forEach(item => values.add(item)),
        remove: (...items) => items.forEach(item => values.delete(item)),
        toggle: item => {
            if (values.has(item)) {
                values.delete(item);
                return false;
            }
            values.add(item);
            return true;
        },
        contains: item => values.has(item)
    };
}

function createElement(tagName = 'div', id = '') {
    let htmlContent = '';
    const element = {
        tagName: String(tagName).toUpperCase(),
        id,
        style: {},
        dataset: {},
        children: [],
        options: [{ dataset: {} }],
        selectedIndex: 0,
        classList: createClassList(),
        textContent: '',
        get innerHTML() {
            return htmlContent;
        },
        set innerHTML(nextHtml) {
            htmlContent = String(nextHtml ?? '');
            registerHtmlElements(htmlContent);
        },
        _value: '',
        get value() {
            return this._value;
        },
        set value(nextValue) {
            this._value = String(nextValue ?? '');
        },
        disabled: false,
        appendChild(child) {
            this.children.push(child);
            if (child.id) elements.set(child.id, child);
            if (typeof child.onload === 'function') setTimeout(child.onload, 0);
            return child;
        },
        insertBefore(child, before) {
            const index = this.children.indexOf(before);
            if (index >= 0) {
                this.children.splice(index, 0, child);
            } else {
                this.children.push(child);
            }
            if (child.id) elements.set(child.id, child);
            if (typeof child.onload === 'function') setTimeout(child.onload, 0);
            return child;
        },
        insertAdjacentHTML(_position, html) {
            this.innerHTML += html;
            const idMatches = html.matchAll(/\sid="([^"]+)"/g);
            for (const match of idMatches) {
                if (!elements.has(match[1])) createElement('div', match[1]);
            }
        },
        addEventListener(type, handler) {
            this._listeners = this._listeners || {};
            this._listeners[type] = handler;
        },
        remove() {
            if (this.id) elements.delete(this.id);
        },
        setAttribute(name, value) {
            this[name] = value;
        },
        getBoundingClientRect() {
            return { width: 320, height: 180 };
        },
        getContext() {
            return createCanvasContext();
        },
        querySelectorAll() {
            return [];
        },
        querySelector() {
            return null;
        }
    };
    if (id) elements.set(id, element);
    return element;
}

const root = createElement('div', 'root');
createElement('div', 'modal-area');

globalThis.window = globalThis;
Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { userAgent: 'iPhone Smoke Test' }
});
globalThis.innerWidth = 390;
globalThis.innerHeight = 844;
globalThis.devicePixelRatio = 2;
globalThis.location = { reload() {} };
globalThis.alert = message => {
    throw new Error(`Unexpected alert: ${message}`);
};
globalThis.localStorage = {
    store: new Map(),
    getItem(key) {
        return this.store.has(key) ? this.store.get(key) : null;
    },
    setItem(key, value) {
        this.store.set(key, String(value));
    },
    removeItem(key) {
        this.store.delete(key);
    }
};
globalThis.document = {
    documentElement: createElement('html'),
    head: createElement('head'),
    body: createElement('body'),
    createElement,
    getElementById(id) {
        return elements.get(id) || null;
    },
    querySelectorAll() {
        return [];
    },
    querySelector() {
        return null;
    },
    addEventListener() {}
};
['mobile-transactions-css', 'mobile-home-css', 'mobile-overrides-css'].forEach(id => {
    const link = createElement('link', id);
    document.head.appendChild(link);
});
globalThis.addEventListener = function() {};
globalThis.logout = function() {};
globalThis.fetch = async function(url) {
    if (String(url).startsWith('/api/data')) {
        return { json: async () => ({ success: true, data: {} }) };
    }
    return { ok: true, json: async () => ({ success: true }) };
};

const { state } = await import('../js/modules/state.js');
const originalTrace = console.trace;
console.trace = function() {};
state.currentUser = { id: 'u1', name: 'Admin', role: 'admin' };
console.trace = originalTrace;
state.data.materials = [
    { id: 'm1', name: 'Thép H I200', cat: 'Thép hình', unit: 'tấn', qty: 120, low: 20, cost: 15000000 },
    { id: 'm2', name: 'Bu lông M20', cat: 'Bu lông - Ốc vít', unit: 'cái', qty: 5000, low: 1000, cost: 4500 }
];
state.data.suppliers = [{ id: 's1', name: 'Nhà cung cấp A', phone: '0900000000' }];
state.data.projects = [{ id: 'p1', name: 'Công trình A', budget: 100000000 }];
state.data.structures = [{ id: 'st1', name: 'Khung K1', type: 'Khung thép', status: 'done', weight: 12 }];
state.data.transactions = [
    { id: 't1', type: 'purchase', mid: 'm1', supplierId: 's1', qty: 50, unitPrice: 15000000, totalAmount: 750000000, date: '2026-05-01', datetime: '2026-05-01T08:00' },
    { id: 't2', type: 'usage', mid: 'm1', projectId: 'p1', qty: 10, unitPrice: 15000000, totalAmount: 150000000, date: '2026-05-02', datetime: '2026-05-02T08:00' },
    { id: 't3', type: 'return', mid: 'm1', projectId: 'p1', qty: 1, unitPrice: 15000000, totalAmount: 15000000, date: '2026-05-03', datetime: '2026-05-03T08:00' },
    { id: 't4', type: 'produce', mid: 'st1', qty: 6, totalAmount: 0, date: '2026-05-04', datetime: '2026-05-04T08:00' },
    { id: 't5', type: 'structure_export', mid: 'st1', projectId: 'p1', qty: 2, unitPrice: 8500000, totalAmount: 17000000, date: '2026-05-05', datetime: '2026-05-05T08:00' }
];

const mobile = await import('../js/modules/mobile_view.js');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

assert(mobile.isMobileDevice(), 'Mobile detection failed');
const homeHtml = mobile.renderMobileView();
assert(homeHtml.includes('Kho vật tư'), 'Home hero missing');
assert(homeHtml.includes('m-bottom-tab'), 'Bottom tab missing');
root.innerHTML = homeHtml;

const checks = [
    ['showMobileStock', () => window.showMobileStock()],
    ['showMobileProjects', () => window.showMobileProjects()],
    ['showMobileSuppliers', () => window.showMobileSuppliers()],
    ['showMobileProfile', () => window.showMobileProfile()],
    ['showMobileDashboard', () => window.showMobileDashboard()],
    ['showMobileStructures', () => window.showMobileStructures()],
    ['showMobileImport', () => window.showMobileImport()],
    ['showMobileExport', () => window.showMobileExport()],
    ['showMobileReturn', () => window.showMobileReturn()]
];

for (const [name, run] of checks) {
    await run();
    assert(typeof root.innerHTML === 'string' && root.innerHTML.length > 50, `${name} did not render`);
    if (name === 'showMobileStructures') {
        assert(root.innerHTML.includes('CẤU KIỆN'), 'Structures list did not render');
        assert(!root.innerHTML.includes('m-dashboard-modal'), 'Structures shortcut should not open dashboard');
        window.showMobileStructureDetail('st1');
        assert(root.innerHTML.includes('GIAO DỊCH CẤU KIỆN'), 'Structure detail did not render');
    }
    if (name === 'showMobileSuppliers') {
        window.showMobileSupplierDetail('s1');
        assert(root.innerHTML.includes('LỊCH SỬ NHẬP HÀNG'), 'Supplier detail did not render');
    }
    if (name === 'showMobileProfile') {
        assert(root.innerHTML.includes('Thiết lập mobile'), 'Profile mobile settings missing');
        assert(root.innerHTML.includes('Quyền sử dụng'), 'Profile permissions missing');
        assert(root.innerHTML.includes('Lối tắt'), 'Profile shortcuts missing');
    }
}

await window.showMobileDashboard();
await new Promise(resolve => setTimeout(resolve, 120));
assert(root.innerHTML.includes('Tồn đầu kỳ'), 'Dashboard start inventory KPI missing');
assert(root.innerHTML.includes('Tồn cuối kỳ'), 'Dashboard end inventory KPI missing');
assert(root.innerHTML.includes('Vật tư sắp hết'), 'Overview low-stock KPI missing');
assert(root.innerHTML.includes('Nhà cung cấp'), 'Overview suppliers KPI missing');
assert(root.innerHTML.includes('Phân tích danh mục công trình'), 'Overview project category analysis missing');
assert(root.innerHTML.includes('Phân tích danh mục cấu kiện'), 'Overview structure category analysis missing');
assert(root.innerHTML.includes('showMobileStock()'), 'Dashboard stock view-all action missing');
assert(root.innerHTML.includes('showMobileLowStock()'), 'Dashboard low-stock view-all action missing');
assert(typeof window.showMobileLowStock === 'function', 'Low-stock dashboard action was not registered');
assert(root.innerHTML.includes('Tháng này'), 'Dashboard compact period label missing');
assert(elements.has('m-report-flow-canvas'), 'Dashboard flow canvas missing');
assert(elements.has('m-report-overview-project-canvas'), 'Overview project category canvas missing');
assert(elements.has('m-report-overview-structure-canvas'), 'Overview structure category canvas missing');
assert(typeof elements.get('m-report-flow-canvas')._listeners?.pointerdown === 'function', 'Dashboard chart pointer handler missing');
elements.get('m-report-flow-canvas')._listeners.pointerdown({ clientX: 150 });
window.switchMDashTab('materials');
await new Promise(resolve => setTimeout(resolve, 120));
assert(document.getElementById('m-dash-content').innerHTML.includes('Cơ cấu tồn kho vật tư'), 'Materials tab did not render');
assert(elements.has('m-report-material-canvas'), 'Materials donut canvas missing');
window.switchMDashTab('forecast');
await new Promise(resolve => setTimeout(resolve, 120));
assert(document.getElementById('m-dash-content').innerHTML.includes('Xu hướng nhập - xuất'), 'Forecast trend chart missing');
assert(elements.has('m-report-forecast-canvas'), 'Forecast canvas missing');
window.switchMDashTab('projects');
await new Promise(resolve => setTimeout(resolve, 120));
assert(document.getElementById('m-dash-content').innerHTML.includes('Nhập - xuất theo công trình'), 'Projects bar chart missing');
assert(document.getElementById('m-dash-content').innerHTML.includes('Phân tích danh mục công trình'), 'Projects category analysis missing');
assert(document.getElementById('m-dash-content').innerHTML.includes('Cảnh báo ngân sách'), 'Projects budget warning card missing');
assert(document.getElementById('m-dash-content').innerHTML.includes('showMobileProjects()'), 'Projects view-all action missing');
assert(elements.has('m-report-project-canvas'), 'Projects canvas missing');
assert(elements.has('m-report-project-category-canvas'), 'Projects category canvas missing');
window.switchMDashTab('structures');
await new Promise(resolve => setTimeout(resolve, 120));
assert(document.getElementById('m-dash-content').innerHTML.includes('Sản lượng theo loại cấu kiện'), 'Structures production donut missing');
assert(document.getElementById('m-dash-content').innerHTML.includes('Phân tích danh mục cấu kiện'), 'Structures category analysis missing');
assert(document.getElementById('m-dash-content').innerHTML.includes('Tiến độ sản xuất'), 'Structures production progress missing');
assert(elements.has('m-report-structure-canvas'), 'Structures canvas missing');
window.showMDashPeriodSheet();
assert(elements.has('m-dash-period-sheet'), 'Dashboard period sheet did not render');
document.getElementById('m-dash-month').value = '2025-03';
window.setMDashMonth('2025-03');
assert(root.innerHTML.includes('01/03/25'), 'Dashboard month selection did not update period label');
assert(root.innerHTML.includes('T03/25'), 'Dashboard compact full-month label did not update');
assert(elements.has('mobile-dashboard-css'), 'Dashboard CSS was not lazy loaded');
assert(elements.has('mobile-forms-css'), 'Forms CSS was not lazy loaded');
assert(elements.has('mobile-stock-css'), 'Stock CSS was not lazy loaded');
assert(elements.has('mobile-projects-css'), 'Projects CSS was not lazy loaded');
console.log('Mobile runtime smoke test passed');
