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
    await cleanupUploadedFile({ path, name: filename }, type);
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

                window._upPaths[type].push({
                    path: data.path,
                    name: file.name
                });

                appendUploadedLink(list, data.path, file.name, type);
                })
                   .catch((error) => console.error('Upload error:', error));
                }
}

export async function cleanupUploadedFile(fileItem, type = null) {
    const filePath = typeof fileItem === 'string' ? fileItem : fileItem?.path;
    if (!filePath) return;

    await fetch('/api/upload/temp', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
    }).catch(function() {});

    const sameFile = function(item) {
        return (typeof item === 'string' ? item : item?.path) === filePath;
    };

    if (type && window._upPaths?.[type]) {
        window._upPaths[type] = window._upPaths[type].filter(function(item) {
            return !sameFile(item);
        });
        return;
    }

    Object.keys(window._upPaths || {}).forEach(function(t) {
        window._upPaths[t] = window._upPaths[t].filter(function(item) {
            return !sameFile(item);
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
function pathBasename(filePath) {
    return String(filePath || '').split('/').pop() || 'file';
}

export async function moveUploadedFiles(type) {
    if (!window._upPaths || !window._upPaths[type]) return [];

    const finalFiles = [];

    for (let i = 0; i < window._upPaths[type].length; i++) {
        const item = window._upPaths[type][i];
        const tempPath = typeof item === 'string' ? item : item.path;
        const originalName = typeof item === 'string' ? pathBasename(item) : item.name;

        try {
            const response = await fetch('/api/move-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: tempPath, type })
            });

            const data = await response.json();

            if (data.success) {
                finalFiles.push({
                    path: data.path,
                    name: originalName || pathBasename(data.path)
                });
            }
        } catch (error) {
            console.error('Move file error:', error);
        }
    }

    return finalFiles;
}


window.upFiles = upFiles;
window.moveUploadedFiles = moveUploadedFiles;
window.cleanupUploadedFile = cleanupUploadedFile;
window.cleanupUploadedFiles = cleanupUploadedFiles;

