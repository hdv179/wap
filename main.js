var HOME_CATEGORIES = ['gameloft', 'teamobi', 'gameonline', 'gameoffline', 'gameviethoa', 'trinhduyet', 'ungdung', 'hinhnen', 'nhacchuong', 'chude', 'doctruyen', 'thuthuat'];
var ALL_CATEGORIES = ['gameloft', 'teamobi', 'gameonline', 'gameoffline', 'gameviethoa', 'trinhduyet', 'ungdung', 'hinhnen', 'nhacchuong', 'chude', 'doctruyen', 'thuthuat'];
var JSON_CACHE = {};
var DEFAULT_IMAGE = 'assets/images/default.png';

// Polyfill cho String.trim
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

// Parse JSON an toàn cho trình duyệt Java cũ
function parseJson(text) {
    if (window.JSON && typeof window.JSON.parse === 'function') {
        return window.JSON.parse(text);
    }
    return (new Function('return ' + text))();
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
    if (typeof el.innerText !== 'undefined') {
        el.innerText = text;
    } else if (typeof el.textContent !== 'undefined') {
        el.textContent = text;
    } else {
        el.innerHTML = escapeHtml(text);
    }
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
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        try {
            xhr = new ActiveXObject('Msxml2.XMLHTTP');
        } catch (e) {
            try {
                xhr = new ActiveXObject('Microsoft.XMLHTTP');
            } catch (e2) {}
        }
    }

    if (!xhr) {
        if (error) error('XHR Not Supported');
        return;
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
    if (JSON_CACHE[url]) {
        if (callback) callback(JSON_CACHE[url]);
        return;
    }

    loadTextFile(url + '?v=' + new Date().getTime(), function (text) {
        try {
            var data = parseJson(text);
            JSON_CACHE[url] = data;
            if (callback) callback(data);
        } catch (e) {
            if (callback) callback(null, e);
        }
    }, function (err) {
        if (callback) callback(null, err);
    });
}

function createCardItemHTML(item) {
    var title = escapeHtml(item && item.title ? item.title : 'Không có tiêu đề');
    var thumb = escapeHtml(item && item.thumb ? item.thumb : DEFAULT_IMAGE);
    var screen = escapeHtml(item && item.screen ? item.screen : 'N/A');
    var vendor = escapeHtml(item && item.vendor ? item.vendor : 'N/A');
    var id = escapeHtml(item && item.id ? item.id : '');

    return '<div class="wap-card wap-card--row">' +
        '<img src="' + thumb + '" alt="' + title + '" class="wap-card__thumb" />' +
        '<div class="wap-card__content">' +
        '<a href="detail.html?id=' + id + '" class="wap-card__title">' + title + '</a>' +
        '<div class="wap-card__meta">📱 ' + screen + ' | 👤 ' + vendor + '</div>' +
        '</div><div class="clear"></div></div>';
}

function createFallbackItemsHTML() {
    return '<div class="wap-card">Không có dữ liệu để hiển thị.</div>';
}

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
        container.innerHTML = html || createFallbackItemsHTML();
    });
}

function renderHomePage() {
    for (var i = 0; i < HOME_CATEGORIES.length; i++) {
        renderHomeSection(HOME_CATEGORIES[i], 'home-' + HOME_CATEGORIES[i], 4);
    }
}

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

        listContainer.innerHTML = html || createFallbackItemsHTML();

        if (paginationContainer && totalPages > 1) {
            var p2 = '<div class="pagination">';
            if (page > 1) p2 += '<a href="?cat=' + cat + '&amp;page=' + (page - 1) + '" class="btn btn-secondary">« Trước</a> ';
            p2 += '<span>Trang ' + page + '/' + totalPages + '</span>';
            if (page < totalPages) p2 += ' <a href="?cat=' + cat + '&amp;page=' + (page + 1) + '" class="btn btn-secondary">Sau »</a>';
            paginationContainer.innerHTML = p2 + '</div>';
        }
    });
}

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
            listContainer.innerHTML = '<div class="wap-card">Không tìm thấy kết quả cho "<b>' + escapeHtml(query) + '</b>".</div>';
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

        var html = '<div class="title-head">' + title + '</div><div class="wap-card"><div class="detail-meta">📌 <b>Hãng:</b> ' + vendor + ' | 🖥️ <b>Màn hình:</b> ' + screen + '<br />🏷️ <b>Phiên bản:</b> ' + version + ' | 📅 <b>Cập nhật:</b> ' + date + '</div>';

        if (item.blocks) {
            for (var i = 0; i < item.blocks.length; i++) {
                var block = item.blocks[i];
                if (block.type === 'text') {
                    html += '<p class="detail-text">' + escapeHtml(block.value || '').replace(/\n/g, '<br />') + '</p>';
                }
                if (block.type === 'image') {
                    var imageHtml = '<div class="detail-image-wrap"><img src="' + escapeHtml(block.value || '') + '" class="detail-image" alt="img" />';
                    if (block.caption) {
                        imageHtml += '<div class="detail-image-caption"><i>' + escapeHtml(block.caption || '') + '</i></div>';
                    }
                    html += imageHtml + '</div>';
                }
            }
        }

        html += '</div>';

        if (item.downloads) {
            for (var i = 0; i < item.downloads.length; i++) {
                var group = item.downloads[i];
                html += '<div class="title-head">📥 ' + escapeHtml((group.groupTitle || '').toUpperCase()) + '</div><div class="wap-card">';
                for (var j = 0; j < group.files.length; j++) {
                    var fileItem = group.files[j];
                    html += '<a href="' + escapeHtml(fileItem.url) + '" class="btn-download">💾 ' + escapeHtml(fileItem.label) + '</a>';
                }
                html += '</div>';
            }
        }

        detailContainer.innerHTML = html;
    });
}

function routePageData() {
    var cat = getUrlParam('cat') || 'gameloft';
    var id = getUrlParam('id');
    var query = getUrlParam('q');

    if (document.getElementById('post-detail') && id) {
        renderDetailPage(id);
    } else if (document.getElementById('post-list')) {
        var catTitle = document.getElementById('category-title');
        if (query) {
            if (catTitle) setTextContent(catTitle, 'TÌM KIẾM: "' + query.toUpperCase() + '"');
            renderSearchResults(query.trim().toLowerCase());
        } else {
            var page = parseInt(getUrlParam('page'), 10) || 1;
            if (catTitle) setTextContent(catTitle, 'DANH MỤC: ' + cat.toUpperCase());
            renderListPage(cat, page);
        }
    } else if (document.getElementById('home-gameloft')) {
        renderHomePage();
    }
}

// Khởi chạy khi window tải xong (Tương thích 100% Java Browser)
window.onload = function () {
    routePageData();
};