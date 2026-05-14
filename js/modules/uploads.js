window._upPaths = window._upPaths || {};

function appendUploadedLink(list, path, filename) {
    if (!list) return;
    const link = document.createElement('a');
    link.href = path;
    link.target = '_blank';
    link.style.color = 'var(--accent)';
    link.style.marginRight = '6px';
    link.textContent = '📎 ' + filename;
    list.appendChild(link);
    list.appendChild(document.createTextNode(' '));
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
                appendUploadedLink(list, data.path, data.filename);
            })
            .catch((error) => console.error('Upload error:', error));
    }
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
