import { mobileInlineIcon, mobileTitleIcon, mobileTxnTypeIcon } from './mobile_icons.js';

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

function titleIcon(name, alt) {
    return mobileTitleIcon(name, alt, escapeValue);
}

function inlineIcon(name, alt) {
    return mobileInlineIcon(name, alt, escapeValue);
}

function projectStats(project) {
    const budget = Number(project.budget || project.totalBudget || project.amount || 0);
    const spent = (data().transactions || [])
        .filter(t => t.projectId === project.id && t.type === 'usage')
        .reduce((s, t) => s + Number(t.totalAmount || 0), 0);
    const ret = (data().transactions || [])
        .filter(t => t.projectId === project.id && t.type === 'return')
        .reduce((s, t) => s + Number(t.totalAmount || 0), 0);
    const net = spent - ret;
    const rawPct = budget > 0 ? (net / budget) * 100 : 0;
    const pct = Math.min(100, Math.max(0, rawPct));
    const barColor = rawPct > 100 ? '#dc2626' : rawPct > 90 ? '#ef4444' : rawPct > 70 ? '#f59e0b' : '#378ADD';
    return { budget, spent, ret, net, rawPct, pct, pctText: budget > 0 ? rawPct.toFixed(1) : '0.0', barColor };
}

function renderProjectItem(project) {
    const stats = projectStats(project);
    return `
        <div class="m-project-item" data-name="${escapeValue(project.name).toLowerCase()}" onclick="window.showMobileProjectDetail('${project.id}')">
            <div class="m-project-info">
                <div class="m-project-name">${escapeValue(project.name)}</div>
                <div class="m-project-meta">💰 Đã chi: ${money(stats.net)} / ${stats.budget > 0 ? money(stats.budget) : 'Chưa đặt NS'}</div>
                <div class="m-project-bar">
                    <div class="m-project-fill" style="width:${stats.pct}%;background:${stats.barColor};"></div>
                </div>
            </div>
            <div class="m-project-pct">${stats.pctText}%</div>
        </div>
    `;
}

export function installMobileProjects(options) {
    deps = options || {};

    window.showMobileProjects = function() {
        const projects = data().projects || [];
        const html = `
            <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-project-modal">
                <div class="m-modal-hd">
                    <button class="m-back" onclick="renderMobileViewOnly()">←</button>
                    <span>${titleIcon('logo-tongcongtrinh.png', 'Công trình')} CÔNG TRÌNH (${projects.length})</span>
                    <div></div>
                </div>

                <div class="m-modal-bd" style="padding:12px;">
                    <input type="text" id="mp-search" class="m-search" placeholder="Tìm công trình..." oninput="filterMobileProjects()">
                </div>

                <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;" id="mp-list">
                    ${projects.length ? projects.map(renderProjectItem).join('') : '<div class="m-empty">📭 Chưa có công trình</div>'}
                </div>
                ${deps.renderMobileActionSheet ? deps.renderMobileActionSheet() : ''}
                ${deps.renderMobileTabBar ? deps.renderMobileTabBar('projects') : ''}
            </div>
        `;

        document.getElementById('root').innerHTML = html;
        deps.fixAllModalHeight?.();
    };

    window.showMobileProjectDetail = function(projectId) {
        const project = (data().projects || []).find(p => String(p.id) === String(projectId));
        if (!project) {
            alert('Không tìm thấy công trình!');
            return;
        }

        const materials = data().materials || [];
        const txns = (data().transactions || [])
            .filter(t => String(t.projectId) === String(projectId))
            .sort((a, b) => new Date(b.datetime || b.date) - new Date(a.datetime || a.date));
        const usageTxns = txns.filter(t => t.type === 'usage');
        const returnTxns = txns.filter(t => t.type === 'return');
        const totalUsage = usageTxns.reduce((s, t) => s + Number(t.totalAmount || 0), 0);
        const totalReturn = returnTxns.reduce((s, t) => s + Number(t.totalAmount || 0), 0);
        const net = totalUsage - totalReturn;
        const stats = projectStats(project);
        const budgetTone = stats.pct >= 90 ? 'danger' : stats.pct >= 70 ? 'warn' : 'safe';
        const materialMap = new Map();

        usageTxns.forEach(t => {
            const mat = materials.find(m => m.id === t.mid);
            if (!materialMap.has(t.mid)) {
                materialMap.set(t.mid, { name: mat?.name || 'N/A', unit: mat?.unit || '', used: 0, returned: 0, amount: 0 });
            }
            const item = materialMap.get(t.mid);
            item.used += Number(t.qty || 0);
            item.amount += Number(t.totalAmount || 0);
        });

        returnTxns.forEach(t => {
            if (!materialMap.has(t.mid)) return;
            const item = materialMap.get(t.mid);
            item.returned += Number(t.qty || 0);
            item.amount -= Number(t.totalAmount || 0);
        });

        const materialRows = Array.from(materialMap.values()).map(item => {
            const remain = item.used - item.returned;
            return `
                <div class="m-project-detail-material">
                    <div>
                        <strong>${escapeValue(item.name)}</strong>
                        <small>Đã xuất: ${Number(item.used).toLocaleString('vi-VN')} ${escapeValue(item.unit)} · Đã trả: ${Number(item.returned).toLocaleString('vi-VN')} ${escapeValue(item.unit)}</small>
                    </div>
                    <div>
                        <span>${Number(remain).toLocaleString('vi-VN')} ${escapeValue(item.unit)}</span>
                        <em>${money(item.amount)}</em>
                    </div>
                </div>
            `;
        }).join('') || '<div class="m-empty">Chưa có vật tư xuất cho công trình này</div>';

        const txnRows = txns.slice(0, 30).map(t => {
            const mat = materials.find(m => m.id === t.mid);
            const isReturn = t.type === 'return';
            const time = new Date(t.datetime || t.date).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
            });
            return `
                <div class="m-project-detail-txn">
                    <div class="m-txn-icon ${isReturn ? 'info' : 'danger'}">${mobileTxnTypeIcon(t.type, isReturn ? 'Trả hàng' : 'Xuất kho', escapeValue)}</div>
                    <div>
                        <strong>${escapeValue(mat?.name || 'N/A')}</strong>
                        <small>${time} · ${isReturn ? 'Trả' : 'Xuất'} · ${Number(t.qty || 0).toLocaleString('vi-VN')} ${escapeValue(mat?.unit || '')}</small>
                    </div>
                    <span class="${isReturn ? 'success' : 'danger'}">${isReturn ? '+' : '-'}${money(t.totalAmount || 0)}</span>
                </div>
            `;
        }).join('') || '<div class="m-empty">Chưa có giao dịch</div>';

        const html = `
            <div class="m-modal ios-liquid ${mobileThemeClass()}" id="m-project-detail-modal">
                <div class="m-modal-hd">
                    <button class="m-back" onclick="showMobileProjects()">←</button>
                    <span>${titleIcon('logo-tongcongtrinh.png', 'Công trình')} ${escapeValue(project.name)}</span>
                    <div></div>
                </div>

                <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px;">
                    <div class="m-project-detail-hero ${budgetTone}">
                        <div>
                            <small>Chi phí ròng</small>
                            <strong>${money(net)}</strong>
                            <span>Ngân sách: ${money(stats.budget)}</span>
                        </div>
                        <div class="m-project-detail-pct">${stats.pctText}%</div>
                    </div>

                    <div class="m-project-detail-bar ${budgetTone}">
                        <div style="width:${stats.pct}%;"></div>
                    </div>
                    <div class="m-project-detail-kpis">
                        <div class="usage"><small>Đã xuất</small><strong>${money(totalUsage)}</strong></div>
                        <div class="return"><small>Đã trả</small><strong>${money(totalReturn)}</strong></div>
                        <div class="net"><small>Còn lại NS</small><strong>${money(stats.budget - net)}</strong></div>
                    </div>

                    <div class="m-project-detail-actions">
                        <button onclick="showMobileExport('${project.id}')">${inlineIcon('logo-xuatkho.png', 'Xuất kho')} Xuất thêm</button>
                        <button onclick="showMobileReturn('${project.id}')">${inlineIcon('logo-trahang.png', 'Trả hàng')} Trả hàng</button>
                    </div>

                    <div class="m-section-title">${inlineIcon('logo-vattu.png', 'Vật tư')} VẬT TƯ ĐÃ DÙNG</div>
                    <div class="m-project-detail-list">${materialRows}</div>

                    <div class="m-section-title">🧾 GIAO DỊCH CÔNG TRÌNH</div>
                    <div class="m-project-detail-list">${txnRows}</div>
                </div>

                ${deps.renderMobileActionSheet ? deps.renderMobileActionSheet() : ''}
                ${deps.renderMobileTabBar ? deps.renderMobileTabBar('projects') : ''}
            </div>
        `;

        document.getElementById('root').innerHTML = html;
        deps.fixAllModalHeight?.();
    };

    window.filterMobileProjects = function() {
        const kw = document.getElementById('mp-search')?.value?.toLowerCase() || '';
        document.querySelectorAll('#mp-list .m-project-item').forEach(function(el) {
            el.style.display = (el.dataset.name || '').includes(kw) ? '' : 'none';
        });
    };
}
