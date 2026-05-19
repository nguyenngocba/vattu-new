const COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#14b8a6', '#f97316', '#64748b'];

function setupCanvas(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
}

function moneyShort(value) {
    const n = Number(value || 0);
    if (Math.abs(n) >= 1000000000) return `${(n / 1000000000).toFixed(1)}t`;
    if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(0)}tr`;
    return n.toLocaleString('vi-VN');
}

function isLightChart(canvas) {
    return Boolean(canvas?.closest?.('.m-wh-theme-light'));
}

function chartPalette(canvas) {
    const light = isLightChart(canvas);
    return {
        light,
        pointFill: light ? '#ffffff' : '#06111f',
        grid: light ? 'rgba(100, 116, 139, .16)' : 'rgba(148, 163, 184, .08)',
        axis: light ? 'rgba(71, 85, 105, .78)' : 'rgba(203,213,225,.62)',
        label: light ? 'rgba(51, 65, 85, .86)' : 'rgba(226,232,240,.72)',
        activeLabel: light ? '#0f172a' : '#f8fafc',
        bubbleBg: light ? 'rgba(255, 255, 255, .96)' : 'rgba(8, 18, 32, .94)',
        bubbleBorder: light ? 'rgba(148, 163, 184, .30)' : 'rgba(148, 163, 184, .18)',
        bubbleText: light ? '#0f172a' : '#f8fafc',
        bubbleSub: light ? 'rgba(51,65,85,.86)' : 'rgba(226,232,240,.86)',
        donutText: light ? '#0f172a' : '#e5edf7',
        donutSub: light ? 'rgba(71,85,105,.76)' : 'rgba(226,232,240,.66)'
    };
}

function drawSmoothLine(ctx, points, color, palette) {
    ctx.beginPath();
    points.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
            return;
        }
        const prev = points[index - 1];
        const cx = (prev.x + point.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cx, (prev.y + point.y) / 2);
    });
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = palette.pointFill;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });
}

function drawFocusBubble(ctx, point, rows, width, palette) {
    if (!point || !rows?.length) return;
    const x = Math.max(72, Math.min(point.x, width - 72));
    const y = Math.max(38, point.y - 54);
    const left = x - 60;
    const top = y - 25;
    const right = left + 120;
    const bottom = top + 52;
    const radius = 8;

    ctx.fillStyle = palette.bubbleBg;
    ctx.strokeStyle = palette.bubbleBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left + radius, top);
    ctx.lineTo(right - radius, top);
    ctx.quadraticCurveTo(right, top, right, top + radius);
    ctx.lineTo(right, bottom - radius);
    ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
    ctx.lineTo(left + radius, bottom);
    ctx.quadraticCurveTo(left, bottom, left, bottom - radius);
    ctx.lineTo(left, top + radius);
    ctx.quadraticCurveTo(left, top, left + radius, top);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.bubbleText;
    ctx.font = '800 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(point.label || '', x, y - 9);

    const lines = [
        ['Nhập', point.importValue, '#22c55e'],
        ['Xuất', point.exportValue, '#3b82f6'],
        ['Tồn', point.stockValue, '#f59e0b']
    ];
    ctx.textAlign = 'left';
    lines.forEach((line, index) => {
        ctx.fillStyle = line[2];
        ctx.beginPath();
        ctx.arc(x - 48, y + 5 + index * 11, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = palette.bubbleSub;
        ctx.font = '700 9px system-ui';
        ctx.fillText(`${line[0]}: ${moneyShort(line[1])}`, x - 40, y + 8 + index * 11);
    });
}

export function drawMobileBarLineChart(canvas, rows) {
    if (!canvas || !rows?.length) return;
    const defaultFocus = rows.length > 3 ? Math.floor(rows.length / 2) : rows.length - 1;

    const render = focusIndex => {
        const { ctx, width, height } = setupCanvas(canvas);
        const palette = chartPalette(canvas);
        const pad = { l: 38, r: 16, t: 18, b: 30 };
        const innerW = width - pad.l - pad.r;
        const innerH = height - pad.t - pad.b;
        const max = Math.max(...rows.flatMap(r => [r.importValue, r.exportValue, r.stockValue]), 1);

        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = palette.grid;
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i += 1) {
            const y = pad.t + (innerH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad.l, y);
            ctx.lineTo(width - pad.r, y);
            ctx.stroke();
            ctx.fillStyle = palette.axis;
            ctx.font = '10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(moneyShort(max - (max / 4) * i), pad.l - 6, y + 3);
        }

        const makePoints = key => rows.map((row, i) => ({
            x: pad.l + (innerW / Math.max(rows.length - 1, 1)) * i,
            y: pad.t + innerH - innerH * (Number(row[key] || 0) / max)
        }));

        drawSmoothLine(ctx, makePoints('importValue'), '#22c55e', palette);
        drawSmoothLine(ctx, makePoints('exportValue'), '#3b82f6', palette);
        drawSmoothLine(ctx, makePoints('stockValue'), '#f59e0b', palette);

        const selected = Math.max(0, Math.min(rows.length - 1, focusIndex ?? defaultFocus));
        const stockPoint = makePoints('stockValue')[selected];
        if (stockPoint) {
            ctx.strokeStyle = palette.bubbleBorder;
            ctx.beginPath();
            ctx.moveTo(stockPoint.x, pad.t);
            ctx.lineTo(stockPoint.x, pad.t + innerH);
            ctx.stroke();
            drawFocusBubble(ctx, { ...stockPoint, ...rows[selected] }, rows, width, palette);
        }

        rows.forEach((row, i) => {
            const x = pad.l + (innerW / Math.max(rows.length - 1, 1)) * i;
            ctx.fillStyle = i === selected ? palette.activeLabel : palette.label;
            ctx.font = i === selected ? '800 10px system-ui' : '10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(row.label, x, height - 8);
        });

        canvas._mDashChartMeta = { pad, innerW, rows };
    };

    render(canvas._mDashFocusIndex ?? defaultFocus);

    if (canvas._mDashPointerBound) return;
    canvas._mDashPointerBound = true;
    const updateFocus = event => {
        const rect = canvas.getBoundingClientRect();
        const meta = canvas._mDashChartMeta;
        if (!meta) return;
        const x = event.clientX - rect.left;
        const step = meta.innerW / Math.max(rows.length - 1, 1);
        const index = rows.length === 1 ? 0 : Math.round((x - meta.pad.l) / step);
        const next = Math.max(0, Math.min(rows.length - 1, index));
        if (next === canvas._mDashFocusIndex) return;
        canvas._mDashFocusIndex = next;
        render(next);
    };
    canvas.addEventListener('pointermove', updateFocus);
    canvas.addEventListener('pointerdown', updateFocus);
}

export function drawMobileProjectBarChart(canvas, rows) {
    if (!canvas || !rows?.length) return;
    const { ctx, width, height } = setupCanvas(canvas);
    const palette = chartPalette(canvas);
    const dataRows = rows.slice(0, 5);
    const pad = { l: 34, r: 12, t: 18, b: 34 };
    const innerW = width - pad.l - pad.r;
    const innerH = height - pad.t - pad.b;
    const max = Math.max(...dataRows.flatMap(r => [r.exportValue, r.returnValue]), 1);
    const groupW = innerW / dataRows.length;
    const barW = Math.min(16, groupW * .22);

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
        const y = pad.t + (innerH / 3) * i;
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(width - pad.r, y);
        ctx.stroke();
        ctx.fillStyle = palette.axis;
        ctx.font = '10px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(moneyShort(max - (max / 3) * i), pad.l - 6, y + 3);
    }

    dataRows.forEach((row, index) => {
        const center = pad.l + groupW * index + groupW / 2;
        const exportH = innerH * (Number(row.exportValue || 0) / max);
        const returnH = innerH * (Number(row.returnValue || 0) / max);

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(center - barW - 2, pad.t + innerH - returnH, barW, returnH);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(center + 2, pad.t + innerH - exportH, barW, exportH);

        ctx.fillStyle = palette.label;
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(String(row.name || '').slice(0, 3).toUpperCase(), center, height - 10);
    });
}

export function drawMobileForecastChart(canvas, rows) {
    if (!canvas || !rows?.length) return;
    const { ctx, width, height } = setupCanvas(canvas);
    const palette = chartPalette(canvas);
    const pad = { l: 36, r: 14, t: 18, b: 32 };
    const innerW = width - pad.l - pad.r;
    const innerH = height - pad.t - pad.b;
    const max = Math.max(...rows.flatMap(r => [r.importValue, r.exportValue]), 1);
    const groupW = innerW / rows.length;
    const barW = Math.min(15, groupW * .24);

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
        const y = pad.t + (innerH / 3) * i;
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(width - pad.r, y);
        ctx.stroke();
        ctx.fillStyle = palette.axis;
        ctx.font = '10px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(moneyShort(max - (max / 3) * i), pad.l - 6, y + 3);
    }

    rows.forEach((row, index) => {
        const center = pad.l + groupW * index + groupW / 2;
        const importH = innerH * (Number(row.importValue || 0) / max);
        const exportH = innerH * (Number(row.exportValue || 0) / max);

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(center - barW - 2, pad.t + innerH - importH, barW, importH);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(center + 2, pad.t + innerH - exportH, barW, exportH);

        ctx.fillStyle = palette.label;
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(row.label || row.key || '', center, height - 10);
    });
}

export function drawMobileDonutChart(canvas, rows) {
    if (!canvas || !rows?.length) return;
    const { ctx, width, height } = setupCanvas(canvas);
    const palette = chartPalette(canvas);
    const total = rows.reduce((sum, r) => sum + Number(r.value || 0), 0) || 1;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 12;
    let start = -Math.PI / 2;

    ctx.clearRect(0, 0, width, height);
    rows.forEach((row, index) => {
        const slice = (Number(row.value || 0) / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, start + slice);
        ctx.lineWidth = 18;
        ctx.strokeStyle = COLORS[index % COLORS.length];
        ctx.stroke();
        start += slice;
    });

    const center = canvas.dataset.center || moneyShort(total);
    const subcenter = canvas.dataset.subcenter || '';

    ctx.fillStyle = palette.donutText;
    ctx.font = '800 15px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(center, cx, cy - 2);
    ctx.fillStyle = palette.donutSub;
    ctx.font = '10px system-ui';
    ctx.fillText(subcenter, cx, cy + 14);
}

function syncDonutDataset(id, center, subcenter) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    canvas.dataset.center = center || canvas.dataset.center || '';
    canvas.dataset.subcenter = subcenter || canvas.dataset.subcenter || '';
    return canvas;
}

export function drawMobileDashboardCharts(data, activeTab = 'overview') {
    if (!data) return;
    if (activeTab === 'overview') {
        drawMobileBarLineChart(document.getElementById('m-report-flow-canvas'), data.flow);
        drawMobileDonutChart(syncDonutDataset('m-report-category-canvas', null, 'tồn kho'), data.categories);
        drawMobileDonutChart(syncDonutDataset('m-report-overview-project-canvas', null, 'công trình'), data.projects?.categories || []);
        drawMobileDonutChart(syncDonutDataset('m-report-overview-structure-canvas', null, 'cấu kiện'), data.structures?.typeRows || []);
        return;
    }
    if (activeTab === 'materials') {
        drawMobileDonutChart(syncDonutDataset('m-report-material-canvas', null, 'tồn kho'), data.materials?.categories || []);
        return;
    }
    if (activeTab === 'suppliers') {
        drawMobileDonutChart(syncDonutDataset('m-report-supplier-canvas', null, 'nhập'), data.suppliers?.top || []);
        return;
    }
    if (activeTab === 'projects') {
        drawMobileProjectBarChart(document.getElementById('m-report-project-canvas'), data.projects?.top || []);
        drawMobileDonutChart(syncDonutDataset('m-report-project-category-canvas', null, 'công trình'), data.projects?.categories || []);
        return;
    }
    if (activeTab === 'forecast') {
        drawMobileForecastChart(document.getElementById('m-report-forecast-canvas'), data.forecast?.monthlyRows || []);
        return;
    }
    if (activeTab === 'structures') {
        drawMobileDonutChart(syncDonutDataset('m-report-structure-canvas', null, 'cấu kiện'), data.structures?.typeRows || []);
    }
}
