var HOME_CATEGORIES = ['gameloft', 'teamobi', 'gameonline', 'gameoffline', 'gameviethoa', 'trinhduyet', 'ungdung', 'hinhnen', 'nhacchuong', 'chude', 'doctruyen', 'thuthuat'];
var ALL_CATEGORIES = HOME_CATEGORIES.slice(0);
var JSON_CACHE = {};
var DEFAULT_IMAGE = 'assets/images/default.png';
var APP_STARTED = false;

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

function parseJson(text) {
    if (window.JSON && typeof window.JSON.parse === 'function') {
        return window.JSON.parse(text);
    }
    return (new Function('return ' + text))();
}

// Khởi chạy khi DOM đã sẵn sàng
function initApp() {
    if (APP_STARTED) return;
    APP_STARTED = true;
    initTheme();
    loadComponent('header', 'templates/tpl-header.html');
    loadComponent('footer', 'templates/tpl-footer.html');
    routePageData();
}

if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', initApp, false);
} else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', function () {
        if (document.readyState === 'complete') {
            initApp();
        }
    });
}

window.onload = function () {
    initApp();
};

// --- QUẢN LÝ GIAO DIỆN & TIỆN ÍCH --- //

function initTheme() {
    var savedTheme = getStoredTheme();
    if (!savedTheme) {
        savedTheme = 'default';
    }
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    saveTheme(themeName);
}

function getStoredTheme() {
    try {
        if (window.localStorage && window.localStorage.getItem) {
            return window.localStorage.getItem('hdv179_theme');
        }
    } catch (e) {
        return getCookie('hdv179_theme');
    }
    return getCookie('hdv179_theme');
}

function saveTheme(themeName) {
    try {
        if (window.localStorage && window.localStorage.setItem) {
            window.localStorage.setItem('hdv179_theme', themeName);
            return;
        }
    } catch (e) {
        // Bỏ qua nếu localStorage không hoạt động
    }
    setCookie('hdv179_theme', themeName, 365);
}

function getCookie(name) {
    var value = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return value ? decodeURIComponent(value[1]) : null;
}

function setCookie(name, value, days) {
    var expires = '';
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toGMTString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
}

function loadComponent(elementId, filePath) {
    var targetEl = document.getElementById(elementId);
    if (!targetEl) return;

    loadTextFile(filePath + '?v=' + new Date().getTime(), function (html) {
        if (html) {
            targetEl.innerHTML = html;
        }
    }, function (err) {
        if (window.console && console.error) {
            console.error(err);
        }
    });
}

function getUrlParam(param) {
    var query = window.location.search || '';
    var pairs = query.replace(/^\?/, '').split('&');
    for (var i = 0; i < pairs.length; i++) {
        var parts = pairs[i].split('=');
        if (parts[0] === param) {
            return decodeURIComponent(parts[1] || '');
        }
    }
    return '';
}

function loadTextFile(url, success, error) {
    var xhr = null;
    try {
        xhr = new XMLHttpRequest();
    } catch (e) {
        try {
            xhr = new ActiveXObject('Msxml2.XMLHTTP');
        } catch (e2) {
            try {
                xhr = new ActiveXObject('Microsoft.XMLHTTP');
            } catch (e3) {
                if (error) error('XHR not supported');
                return;
            }
        }
    }

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || xhr.status === 0) {
                if (success) success(xhr.responseText);
            } else if (error) {
                error(xhr.status);
            }
        }
    };

    xhr.open('GET', url, true);
    xhr.send(null);
}

function fetchJson(url, callback) {
    var cacheKey = url;
    if (JSON_CACHE[cacheKey]) {
        if (callback) callback(JSON_CACHE[cacheKey]);
        return;
    }

    loadTextFile(url + '?v=' + new Date().getTime(), function (text) {
        try {
            var data = parseJson(text);
            JSON_CACHE[cacheKey] = data;
            if (callback) callback(data);
        } catch (e) {
            if (callback) callback(null, e);
        }
    }, function (err) {
        if (callback) callback(null, err);
    });
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function setTextContent(el, text) {
    if (!el) return;
    if (typeof el.textContent !== 'undefined') {
        el.textContent = text;
    } else if (typeof el.innerText !== 'undefined') {
        el.innerText = text;
    } else {
        el.innerHTML = escapeHtml(text);
    }
}

// Tạo HTML thẻ bài viết dùng chung
function createCardItemHTML(item) {
    var title = escapeHtml(item && item.title ? item.title : 'Không có tiêu đề');
    var thumb = escapeHtml(item && item.thumb ? item.thumb : DEFAULT_IMAGE);
    var screen = escapeHtml(item && item.screen ? item.screen : 'N/A');
    var vendor = escapeHtml(item && item.vendor ? item.vendor : 'N/A');
    var id = escapeHtml(item && item.id ? item.id : '');

    return '<div class="wap-card wap-card--row">' +
        '<img src="' + thumb + '" alt="' + title + '" class="wap-card__thumb">' +
        '<div class="wap-card__content">' +
        '<a href="detail.html?id=' + id + '" class="wap-card__title">' + title + '</a>' +
        '<div class="wap-card__meta">📱 ' + screen + ' | 👤 ' + vendor + '</div>' +
        '</div></div>';
}

function createFallbackItemsHTML() {
    return '<div class="wap-card">Không có dữ liệu để hiển thị. Vui lòng kiểm tra file JSON hoặc đường dẫn ảnh.</div>';
}

// --- BỘ ĐIỀU HƯỚNG VÀ RENDER NỘI DUNG --- //

function routePageData() {
    var cat = getUrlParam('cat') || 'gameloft';
    var id = getUrlParam('id');
    var query = getUrlParam('q');

    // 1. Kiểm tra trang Chi tiết
    if (document.getElementById('post-detail') && id) {
        renderDetailPage(id);
    }
    // 2. Kiểm tra trang Danh mục / Tìm kiếm
    else if (document.getElementById('post-list')) {
        var catTitle = document.getElementById('category-title');
        if (query) {
            if (catTitle) setTextContent(catTitle, 'TÌM KIẾM: "' + query.toUpperCase() + '"');
            renderSearchResults(query.trim().toLowerCase());
        } else {
            var page = parseInt(getUrlParam('page'), 10) || 1;
            if (catTitle) setTextContent(catTitle, 'DANH MỤC: ' + cat.toUpperCase());
            renderListPage(cat, page);
        }
    }
    // 3. Kiểm tra Trang chủ
    else if (document.getElementById('home-gameloft')) {
        renderHomePage();
    }
}

function renderHomePage() {
    for (var i = 0; i < HOME_CATEGORIES.length; i++) {
        renderHomeSection(HOME_CATEGORIES[i], 'home-' + HOME_CATEGORIES[i], 4);
    }
}

// Render trang chủ (phần danh mục rút gọn)
function renderHomeSection(cat, containerId, limit) {
    var container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="wap-card">🔄 Đang tải...</div>';
    fetchJson('data/index/' + cat + '.json', function (data, err) {
        if (err || !data || !data.length) {
            container.innerHTML = createFallbackItemsHTML();
            return;
        }

        var html = '';
        var count = Math.min(limit || 4, data.length);
        for (var i = 0; i < count; i++) {
            html += createCardItemHTML(data[i]);
        }
        if (!html) {
            container.innerHTML = createFallbackItemsHTML();
            return;
        }
        container.innerHTML = html;
    });
}

// Render danh sách theo chuyên mục + Phân trang
function renderListPage(cat, page, perPage) {
    var listContainer = document.getElementById('post-list');
    var paginationContainer = document.getElementById('pagination');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="wap-card">🔄 Đang tải danh sách...</div>';
    page = page || 1;
    perPage = perPage || 10;

    fetchJson('data/index/' + cat + '.json', function (data, err) {
        if (err || !data || !data.length) {
            listContainer.innerHTML = createFallbackItemsHTML();
            return;
        }

        var totalPages = Math.ceil(data.length / perPage);
        var pageData = data.slice((page - 1) * perPage, page * perPage);
        var html = '';
        for (var i = 0; i < pageData.length; i++) {
            html += createCardItemHTML(pageData[i]);
        }

        if (!html) {
            listContainer.innerHTML = createFallbackItemsHTML();
            return;
        }

        listContainer.innerHTML = html;

        // Xử lý nút phân trang
        if (paginationContainer && totalPages > 1) {
            var p2 = '<div class="pagination">';
            if (page > 1) p2 += '<a href="?cat=' + cat + '&page=' + (page - 1) + '" class="btn btn-secondary">« Trước</a> ';
            p2 += '<span>Trang ' + page + '/' + totalPages + '</span>';
            if (page < totalPages) p2 += ' <a href="?cat=' + cat + '&page=' + (page + 1) + '" class="btn btn-secondary">Sau »</a>';
            paginationContainer.innerHTML = p2 + '</div>';
        }
    });
}

// Render kết quả tìm kiếm trên tất cả danh mục
function renderSearchResults(query) {
    var listContainer = document.getElementById('post-list');
    var paginationContainer = document.getElementById('pagination');
    if (!listContainer) return;

    if (paginationContainer) paginationContainer.innerHTML = '';
    listContainer.innerHTML = '<div class="wap-card">🔄 Đang tìm kiếm...</div>';

    var results = [];
    var pending = ALL_CATEGORIES.length;

    function done() {
        if (pending > 0) return;

        if (!results.length) {
            listContainer.innerHTML = '<div class="wap-card">Không tìm thấy kết quả cho "<b>' + query + '</b>".</div>';
            return;
        }

        var html = '<div class="search-result-summary">Tìm thấy <b>' + results.length + '</b> kết quả:</div>';
        for (var i = 0; i < results.length; i++) {
            html += createCardItemHTML(results[i]);
        }
        listContainer.innerHTML = html;
    }

    for (var i = 0; i < ALL_CATEGORIES.length; i++) {
        fetchJson('data/index/' + ALL_CATEGORIES[i] + '.json', function (data) {
            pending--;
            if (data && data.length) {
                for (var j = 0; j < data.length; j++) {
                    var item = data[j];
                    if (item && item.title && item.title.toLowerCase().indexOf(query) !== -1) {
                        results.push(item);
                    } else if (item && item.vendor && item.vendor.toLowerCase().indexOf(query) !== -1) {
                        results.push(item);
                    }
                }
            }
            done();
        });
    }
}

// Render chi tiết bài viết
function renderDetailPage(id) {
    var detailContainer = document.getElementById('post-detail');
    if (!detailContainer) return;

    detailContainer.innerHTML = '<div class="wap-card">🔄 Đang tải bài viết...</div>';

    fetchJson('data/items/' + id + '.json', function (item, err) {
        if (err || !item) {
            detailContainer.innerHTML = '<div class="wap-card wap-card--error">❌ Bài viết không tồn tại!</div>';
            return;
        }

        var title = escapeHtml(item.title || '').toUpperCase();
        var vendor = escapeHtml(item.vendor || 'N/A');
        var screen = escapeHtml(item.screen || 'N/A');
        var version = escapeHtml(item.version || '1.0');
        var date = escapeHtml(item.date || 'N/A');

        var html = '<div class="title-head">' + title + '</div><div class="wap-card"><div class="detail-meta">📌 <b>Hãng:</b> ' + vendor + ' | 🖥️ <b>Màn hình:</b> ' + screen + '<br>🏷️ <b>Phiên bản:</b> ' + version + ' | 📅 <b>Cập nhật:</b> ' + date + '</div>';

        // Đoạn văn bản & hình ảnh
        if (item.blocks) {
            for (var i = 0; i < item.blocks.length; i++) {
                var block = item.blocks[i];
                if (block.type === 'text') {
                    html += '<p class="detail-text">' + escapeHtml(block.value || '').replace(/\n/g, '<br>') + '</p>';
                }
                if (block.type === 'image') {
                    var imageHtml = '<div class="detail-image-wrap"><img src="' + escapeHtml(block.value || '') + '" class="detail-image">';
                    if (block.caption) {
                        imageHtml += '<div class="detail-image-caption"><i>' + escapeHtml(block.caption || '') + '</i></div>';
                    }
                    html += imageHtml + '</div>';
                }
            }
        }

        html += '</div>';

        // Danh sách file tải về
        if (item.downloads) {
            for (var i = 0; i < item.downloads.length; i++) {
                var group = item.downloads[i];
                html += '<div class="title-head">📥 ' + (group.groupTitle || '').toUpperCase() + '</div><div class="wap-card">';
                for (var j = 0; j < group.files.length; j++) {
                    var fileItem = group.files[j];
                    html += '<a href="' + fileItem.url + '" class="btn-download" download>💾 ' + fileItem.label + '</a>';
                }
                html += '</div>';
            }
        }

        detailContainer.innerHTML = html;
    });
}

// --- TIỆN ÍCH UPLOAD GITHUB (ADMIN) --- //

function uploadToGitHub(fileObj, folderPath, customBaseName, targetInputEl) {
    var tokenEl = document.getElementById('gh-token');
    var repoEl = document.getElementById('gh-repo');
    var itemIdEl = document.getElementById('game-id');

    var token = tokenEl ? tokenEl.value.trim() : '';
    var repo = repoEl ? repoEl.value.trim() : '';
    var itemId = itemIdEl ? itemIdEl.value.trim() : '';

    if (!token || !repo) {
        alert('Thiếu Token hoặc Repo!');
        return;
    }

    var baseName = customBaseName ? customBaseName.trim() : itemId;
    if (!baseName) {
        alert('Vui lòng nhập ID bài viết hoặc Tên file!');
        return;
    }

    baseName = baseName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    var ext = (fileObj.name || '').split('.').pop().toLowerCase();
    var fileName = baseName + '-' + new Date().getTime() + '.' + ext;
    var fullPath = folderPath + '/' + fileName;
    var apiUrl = 'https://api.github.com/repos/' + repo + '/contents/' + fullPath;

    if (targetInputEl) targetInputEl.value = 'Đang tải lên...';

    if (!window.FileReader) {
        alert('Trình duyệt này không hỗ trợ đọc file để upload.');
        return;
    }

    var reader = new FileReader();
    reader.onload = function () {
        var base64Content = reader.result.split(',')[1];
        var xhr = new XMLHttpRequest();
        xhr.open('PUT', apiUrl, true);
        xhr.setRequestHeader('Authorization', 'token ' + token);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (targetInputEl) targetInputEl.value = fullPath;
                    alert('Thành công: ' + fullPath);
                } else {
                    if (targetInputEl) targetInputEl.value = '';
                    alert('Lỗi upload file!');
                }
            }
        };
        xhr.send(JSON.stringify({ message: 'Upload: ' + fileName, content: base64Content }));
    };
    reader.readAsDataURL(fileObj);
}
