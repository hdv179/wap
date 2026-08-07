const HOME_CATEGORIES = ['gameloft', 'teamobi', 'gameonline', 'gameoffline', 'gameviethoa', 'trinhduyet', 'ungdung', 'hinhnen', 'nhacchuong', 'chude', 'doctruyen', 'thuthuat'];
const ALL_CATEGORIES = [...HOME_CATEGORIES];
const JSON_CACHE = new Map();
const DEFAULT_IMAGE = 'assets/images/default.png';

// Khởi chạy khi DOM đã sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    loadComponent("header", "templates/tpl-header.html");
    loadComponent("footer", "templates/tpl-footer.html");
    routePageData();
});

// --- QUẢN LÝ GIAO DIỆN & TIỆN ÍCH --- //

function initTheme() {
    const savedTheme = localStorage.getItem("hdv179_theme") || "default";
    document.documentElement.setAttribute("data-theme", savedTheme);
}

function setTheme(themeName) {
    document.documentElement.setAttribute("data-theme", themeName);
    localStorage.setItem("hdv179_theme", themeName);
}

function loadComponent(elementId, filePath) {
    const targetEl = document.getElementById(elementId);
    if (!targetEl) return;
    // Bổ sung query v= timestamp để tránh cache template HTML
    fetch(`${filePath}?v=${Date.now()}`)
        .then(res => res.text())
        .then(html => { targetEl.innerHTML = html; })
        .catch(err => console.error(err));
}

function getUrlParam(param) {
    return new URLSearchParams(window.location.search).get(param);
}

function fetchJson(url) {
    const cacheKey = url;
    if (JSON_CACHE.has(cacheKey)) {
        return Promise.resolve(JSON_CACHE.get(cacheKey));
    }

    return fetch(`${url}?v=${Date.now()}`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            JSON_CACHE.set(cacheKey, data);
            return data;
        });
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Tạo HTML thẻ bài viết dùng chung
function createCardItemHTML(item) {
    const title = escapeHtml(item?.title || 'Không có tiêu đề');
    const thumb = escapeHtml(item?.thumb || DEFAULT_IMAGE);
    const screen = escapeHtml(item?.screen || 'N/A');
    const vendor = escapeHtml(item?.vendor || 'N/A');
    const id = escapeHtml(item?.id || '');

    return `
        <div class="wap-card wap-card--row">
            <img src="${thumb}" alt="${title}" class="wap-card__thumb">
            <div class="wap-card__content">
                <a href="detail.html?id=${id}" class="wap-card__title">${title}</a>
                <div class="wap-card__meta">📱 ${screen} | 👤 ${vendor}</div>
            </div>
        </div>
    `;
}

// --- BỘ ĐIỀU HƯỚNG VÀ RENDER NỘI DUNG --- //

function routePageData() {
    const cat = getUrlParam('cat') || 'gameloft';
    const id = getUrlParam('id');
    const query = getUrlParam('q');

    // 1. Kiểm tra trang Chi tiết
    if (document.getElementById('post-detail') && id) {
        renderDetailPage(id);
    } 
    // 2. Kiểm tra trang Danh mục / Tìm kiếm (Tương thích cả GitHub Pages & Cloudflare Pages)
    else if (document.getElementById('post-list')) {
        const catTitle = document.getElementById('category-title');
        if (query) {
            if (catTitle) catTitle.innerText = `TÌM KIẾM: "${query.toUpperCase()}"`;
            renderSearchResults(query.trim().toLowerCase());
        } else {
            const page = parseInt(getUrlParam('page')) || 1;
            if (catTitle) catTitle.innerText = `DANH MỤC: ${cat.toUpperCase()}`;
            renderListPage(cat, page);
        }
    } 
    // 3. Kiểm tra Trang chủ
    else if (document.getElementById('home-gameloft')) {
        HOME_CATEGORIES.forEach(catName => {
            renderHomeSection(catName, `home-${catName}`, 4);
        });
    }
}

// Render trang chủ (phần danh mục rút gọn)
function renderHomeSection(cat, containerId, limit = 4) {
    const container = document.getElementById(containerId);
    if (!container) return;

    fetchJson(`data/index/${cat}.json`)
        .then(data => {
            if (!data || !data.length) return container.innerHTML = '<div class="wap-card">Đang cập nhật...</div>';
            container.innerHTML = data.slice(0, limit).map(item => createCardItemHTML(item)).join('');
        })
        .catch(() => container.innerHTML = '<div class="wap-card">Chưa có dữ liệu.</div>');
}

// Render danh sách theo chuyên mục + Phân trang
function renderListPage(cat, page = 1, perPage = 10) {
    const listContainer = document.getElementById('post-list');
    const paginationContainer = document.getElementById('pagination');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="wap-card">🔄 Đang tải danh sách...</div>';

    fetchJson(`data/index/${cat}.json`)
        .then(data => {
            if (!data || !data.length) return listContainer.innerHTML = '<div class="wap-card">Chưa có bài viết nào.</div>';

            const totalPages = Math.ceil(data.length / perPage);
            const pageData = data.slice((page - 1) * perPage, page * perPage);

            listContainer.innerHTML = pageData.map(item => createCardItemHTML(item)).join('');

            // Xử lý nút phân trang
            if (paginationContainer && totalPages > 1) {
                let p2 = '<div class="pagination">';
                if (page > 1) p2 += `<a href="?cat=${cat}&page=${page - 1}" class="btn btn-secondary">« Trước</a> `;
                p2 += `<span>Trang ${page}/${totalPages}</span>`;
                if (page < totalPages) p2 += ` <a href="?cat=${cat}&page=${page + 1}" class="btn btn-secondary">Sau »</a>`;
                paginationContainer.innerHTML = p2 + '</div>';
            }
        })
        .catch(() => listContainer.innerHTML = '<div class="wap-card">Mục này chưa có dữ liệu.</div>');
}

// Render kết quả tìm kiếm trên tất cả danh mục
function renderSearchResults(query) {
    const listContainer = document.getElementById('post-list');
    const paginationContainer = document.getElementById('pagination');
    if (!listContainer) return;

    if (paginationContainer) paginationContainer.innerHTML = '';
    listContainer.innerHTML = '<div class="wap-card">🔄 Đang tìm kiếm...</div>';

    Promise.all(
        ALL_CATEGORIES.map(cat => fetchJson(`data/index/${cat}.json`).catch(() => []))
    ).then(results => {
        const matchedItems = results.flat().filter(item =>
            item.title?.toLowerCase().includes(query) || item.vendor?.toLowerCase().includes(query)
        );

        if (!matchedItems.length) {
            return listContainer.innerHTML = `<div class="wap-card">Không tìm thấy kết quả cho "<b>${query}</b>".</div>`;
        }

        let html = `<div class="search-result-summary">Tìm thấy <b>${matchedItems.length}</b> kết quả:</div>`;
        html += matchedItems.map(item => createCardItemHTML(item)).join('');
        listContainer.innerHTML = html;
    });
}

// Render chi tiết bài viết
function renderDetailPage(id) {
    const detailContainer = document.getElementById('post-detail');
    if (!detailContainer) return;

    detailContainer.innerHTML = '<div class="wap-card">🔄 Đang tải bài viết...</div>';

    fetchJson(`data/items/${id}.json`)
        .then(item => {
            const title = escapeHtml(item?.title || '').toUpperCase();
            const vendor = escapeHtml(item?.vendor || 'N/A');
            const screen = escapeHtml(item?.screen || 'N/A');
            const version = escapeHtml(item?.version || '1.0');
            const date = escapeHtml(item?.date || 'N/A');

            let html = `
                <div class="title-head">${title}</div>
                <div class="wap-card">
                    <div class="detail-meta">
                        📌 <b>Hãng:</b> ${vendor} | 🖥️ <b>Màn hình:</b> ${screen}<br>
                        🏷️ <b>Phiên bản:</b> ${version} | 📅 <b>Cập nhật:</b> ${date}
                    </div>
            `;

            // Đoạn văn bản & hình ảnh
            if (item.blocks) {
                item.blocks.forEach(b => {
                    if (b.type === 'text') html += `<p class="detail-text">${escapeHtml(b.value || '').replace(/\n/g, '<br>')}</p>`;
                    if (b.type === 'image') html += `<div class="detail-image-wrap"><img src="${escapeHtml(b.value || '')}" class="detail-image">${b.caption ? `<div class="detail-image-caption"><i>${escapeHtml(b.caption || '')}</i></div>` : ''}</div>`;
                });
            }
            html += `</div>`;

            // Danh sách file tải về
            if (item.downloads) {
                item.downloads.forEach(g => {
                    html += `<div class="title-head">📥 ${(g.groupTitle || '').toUpperCase()}</div><div class="wap-card">`;
                    g.files.forEach(f => {
                        html += `<a href="${f.url}" class="btn-download" download>💾 ${f.label}</a>`;
                    });
                    html += `</div>`;
                });
            }

            detailContainer.innerHTML = html;
        })
        .catch(() => detailContainer.innerHTML = '<div class="wap-card wap-card--error">❌ Bài viết không tồn tại!</div>');
}

// --- TIỆN ÍCH UPLOAD GITHUB (ADMIN) --- //

async function uploadToGitHub(fileObj, folderPath, customBaseName, targetInputEl) {
    const token = document.getElementById('gh-token').value.trim();
    const repo = document.getElementById('gh-repo').value.trim();
    const itemId = document.getElementById('game-id').value.trim();

    if (!token || !repo) return alert('Thiếu Token hoặc Repo!');

    let baseName = customBaseName ? customBaseName.trim() : itemId;
    if (!baseName) return alert('Vui lòng nhập ID bài viết hoặc Tên file!');

    baseName = baseName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    const ext = fileObj.name.split('.').pop().toLowerCase();
    const fileName = `${baseName}-${Date.now()}.${ext}`;
    const fullPath = `${folderPath}/${fileName}`;
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${fullPath}`;

    targetInputEl.value = "Đang tải lên...";

    const reader = new FileReader();
    reader.readAsDataURL(fileObj);
    reader.onload = async function () {
        const base64Content = reader.result.split(',')[1];
        try {
            const res = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Upload: ${fileName}`, content: base64Content })
            });

            if (res.ok) {
                targetInputEl.value = fullPath;
                alert(`Thành công: ${fullPath}`);
            } else {
                alert('Lỗi upload file!');
                targetInputEl.value = '';
            }
        } catch (e) {
            alert('Lỗi kết nối API!');
            targetInputEl.value = '';
        }
    };
}
