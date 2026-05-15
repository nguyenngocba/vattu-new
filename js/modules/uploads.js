window._upPaths = window._upPaths || {};

function appendUploadedLink(list, path, filename, type) {
    if (!list) return;

    const wrap = document.createElement('span');
    wrap.style.display = 'inline-flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '6px';
    wrap.style.marginRight = '8px';
    wrap.style.marginTop = '6px';

    const link = document.createElement('a');
    link.href = path;
    link.target = '_blank';
    link.style.color = 'var(--accent)';
    link.style.textDecoration = 'none';
    link.textContent = '📎 ' + filename;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.title = 'Bỏ file';
    removeBtn.style.width = '20px';
    removeBtn.style.height = '20px';
    removeBtn.style.padding = '0';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '50%';
    removeBtn.style.background = 'var(--danger)';
    removeBtn.style.color = '#fff';
    removeBtn.style.fontWeight = '800';
    removeBtn.style.lineHeight = '20px';
    removeBtn.style.cursor = 'pointer';

    removeBtn.onclick = async function() {
        await cleanupUploadedFile(path, type);
        wrap.remove();
    };

    wrap.appendChild(link);
    wrap.appendChild(removeBtn);
    list.appendChild(wrap);
}

export function upFiles(input, type) {
    if (!input || !input.files) return;
    if (!window._upPaths[type]) window._upPaths[type] = [];

    const list = document.getElementById((type === 'usage' ? 'usage' : type) + '-file-list');

    for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const formData = new FormData();
        formData.append('file', file);

        const id = type + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        fetch('/api/upload/' + type + '/' + id, { method: 'POST', body: formData })
            .then((response) => response.json())
            .then((data) => {
                if (!data.success) return;

                window._upPaths[type].push(data.path);

                // Hiển thị tên file gốc, không hiển thị tên mã hóa trên server.
                appendUploadedLink(list, data.path, file.name, type);
            })
            .catch((error) => console.error('Upload error:', error));
    }
}

export async function cleanupUploadedFile(path, type = null) {
    if (!path) return;

    await fetch('/api/upload/temp', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
    }).catch(function() {});

    if (type && window._upPaths?.[type]) {
        window._upPaths[type] = window._upPaths[type].filter(function(p) {
            return p !== path;
        });
        return;
    }

    Object.keys(window._upPaths || {}).forEach(function(t) {
        window._upPaths[t] = window._upPaths[t].filter(function(p) {
            return p !== path;
        });
    });
}

export async function cleanupUploadedFiles(type = null) {
    const uploads = window._upPaths || {};
    const types = type ? [type] : Object.keys(uploads);

    for (const t of types) {
        const paths = uploads[t] || [];

        await Promise.all(paths.map(function(path) {
            return cleanupUploadedFile(path, t);
        }));

        uploads[t] = [];
    }

    window._upPaths = uploads;
}

export async function moveUploadedFiles(type) {
    if (!window._upPaths || !window._upPaths[type]) return [];

    const finalPaths = [];

    for (let i = 0; i < window._upPaths[type].length; i++) {
        try {
            const response = await fetch('/api/move-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: window._upPaths[type][i], type })
            });
            const data = await response.json();
            if (data.success) finalPaths.push(data.path);
        } catch (error) {
            console.error('Move file error:', error);
        }
    }

    return finalPaths;
}

window.upFiles = upFiles;
window.moveUploadedFiles = moveUploadedFiles;
window.cleanupUploadedFile = cleanupUploadedFile;
window.cleanupUploadedFiles = cleanupUploadedFiles;

