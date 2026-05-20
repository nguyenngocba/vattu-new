export function mobileIcon(name, alt = '', escapeHtml = value => String(value ?? '')) {
    return `<img class="m-wh-icon-img" src="/images/mobile-icons/${name}" alt="${escapeHtml(alt)}">`;
}

export function mobileInlineIcon(name, alt = '', escapeHtml = value => String(value ?? '')) {
    return `<img class="m-inline-icon-img" src="/images/mobile-icons/${name}" alt="${escapeHtml(alt)}">`;
}

export function mobileTitleIcon(name, alt = '', escapeHtml = value => String(value ?? '')) {
    return `<img class="m-title-icon-img" src="/images/mobile-icons/${name}" alt="${escapeHtml(alt)}">`;
}

export function mobileTxnTypeIcon(type, alt = '', escapeHtml = value => String(value ?? '')) {
    const iconMap = {
        purchase: 'logo-nhapkho.png',
        usage: 'logo-xuatkho.png',
        return: 'logo-trahang.png'
    };

    const icon = iconMap[type] || 'logo-vattu.png';
    return `<img class="m-txn-icon-img" src="/images/mobile-icons/${icon}" alt="${escapeHtml(alt)}">`;
}
