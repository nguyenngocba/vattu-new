export function pad(value) {
    return String(value).padStart(2, '0');
}

export function toInputDate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function createDefaultPeriod() {
    const now = new Date();
    return {
        start: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: toInputDate(now)
    };
}

export function periodMonthValue(period) {
    return String(period?.start || '').slice(0, 7);
}

export function periodLabel(period) {
    const fmt = value => {
        const [year, month, day] = String(value || '').split('-');
        return day && month && year ? `${day}/${month}/${year.slice(2)}` : '';
    };
    return `${fmt(period?.start)} - ${fmt(period?.end)}`;
}

export function periodButtonLabel(period) {
    const [startYear, startMonth, startDay] = String(period?.start || '').split('-').map(Number);
    const [endYear, endMonth, endDay] = String(period?.end || '').split('-').map(Number);
    if (!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay) return 'Chọn kỳ';

    const today = new Date();
    const isCurrentMonth = startYear === today.getFullYear()
        && startMonth === today.getMonth() + 1
        && startDay === 1
        && endYear === today.getFullYear()
        && endMonth === today.getMonth() + 1
        && endDay === today.getDate();
    if (isCurrentMonth) return 'Tháng này';

    const monthEnd = new Date(startYear, startMonth, 0).getDate();
    const isFullMonth = startYear === endYear && startMonth === endMonth && startDay === 1 && endDay === monthEnd;
    if (isFullMonth) return `T${pad(startMonth)}/${String(startYear).slice(2)}`;

    return `${pad(startDay)}/${pad(startMonth)} - ${pad(endDay)}/${pad(endMonth)}`;
}

export function monthDisplay(value) {
    const [year, month] = String(value || '').split('-');
    return month && year ? `T${month}/${year.slice(2)}` : value;
}

export function recentMonths(limit = 12) {
    const now = new Date();
    return Array.from({ length: limit }, (_, index) => {
        const d = new Date(now.getFullYear(), now.getMonth() - index, 1);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    });
}

export function compactValue(value, moneyFormatter) {
    const n = Number(value || 0);
    const abs = Math.abs(n);
    if (abs >= 1000000000) return `${(n / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
    if (abs >= 1000000) return `${(n / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`;
    return moneyFormatter ? moneyFormatter(n) : n.toLocaleString('vi-VN');
}

export function pct(value, max) {
    return Math.max(4, Math.min(100, max > 0 ? (Number(value || 0) / max) * 100 : 0));
}
