/* ==========================================================================
   1. HẰNG SỐ & TIỆN ÍCH
   ========================================================================== */
var HOME_CATEGORIES = ['gameloft', 'teamobi', 'gameonline', 'gameoffline', 'gameviethoa', 'trinhduyet', 'ungdung', 'hinhnen', 'nhacchuong', 'chude', 'doctruyen', 'thuthuat'];
var ALL_CATEGORIES = HOME_CATEGORIES.slice(0);
var DEFAULT_IMAGE = 'assets/images/default.png';
var APP_STARTED = false;

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
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

/* ==========================================================================
   2. TIỆN ÍCH NẠP SCRIPT ĐỘNG THAY CHO AJAX/XHR
   ========================================================================== */
function loadDataScript(src, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src + '?v=' + new Date().getTime();
    
    script.onload = function () {
        if (callback) callback(true);
    };
    script.onerror = function () {
        if (callback) callback(false);
    };
    script.onreadystatechange = function () {
        if (this.readyState === 'loaded' || this.readyState === 'complete') {
            if (callback) callback(true);
        }
    };
    document.getElementsByTagName('head')[0].appendChild(script);
}

/* ==========================================================================
   3. THEME MANAGEMENT
   ========================================================================== */
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

function getStoredTheme() {
    try {
        if (window.localStorage && window.localStorage.getItem) {
            return window.localStorage.getItem('hdv179_theme');
        }
    } catch (e) {}
    return getCookie('hdv179_theme');
}

function saveTheme(themeName) {
    try {
        if (window.localStorage && window.localStorage.setItem) {
            window.localStorage.setItem('hdv179_theme', themeName);
            return;
        }
    } catch (e) {}
    setCookie('hdv179_theme', themeName, 365);
}

function initTheme() {
    var savedTheme = getStoredTheme() || 'default';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    saveTheme(themeName);
}

/* ==========================================================================
   4. TEMPLATE BUILDERS
   ========================================================================== */
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
        '<div class="wap-card__meta">MH: ' + screen + ' | Hang: ' + vendor + '</div>' +
        '</div></div>';
}

function createFallbackItemsHTML() {
    return '<div class="wap-card">Không có dữ liệu để hiển thị.</div>';
}

/* ==========================================================================
   5. BỘ ĐIỀU HƯỚNG & RENDER NỘI DUNG
   ========================================================================== */
function routePageData() {
    var cat = getUrlParam('cat') || 'gameloft';
    var id = getUrlParam('id');
    var query = getUrlParam('q');

    if (document.getElementById('post-detail') && id) {
        renderDetailPage(id);
    } else if (document.getElementById('post-list')) {
        var catTitle = document.getElementById('category-title');
        if (query) {
            if (catTitle) setTextContent(catTitle, 'TIM KIEM: "' + query.toUpperCase() + '"');
            renderSearchResults(query.trim().toLowerCase());
        } else {
            var page = parseInt(getUrlParam('page'), 10) || 1;
            if (catTitle) setTextContent(catTitle, 'DANH MUC: ' + cat.toUpperCase());
            renderListPage(cat, page);
        }
    } else if (document.getElementById('home-gameloft')) {
        renderHomePage();
    }
}

function renderHomePage() {
    for (var i = 0; i < HOME_CATEGORIES.length; i++) {
        renderHomeSection(HOME_CATEGORIES[i], 'home-' + HOME_CATEGORIES[i], 4);
    }
}

function renderHomeSection(cat, containerId, limit) {
    var container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="wap-card">Dang tai...</div>';
    
    // Nạp file JS dữ liệu thay vì JSON
    window.CURRENT_CAT_DATA = null;
    loadDataScript('data/index/' + cat + '.js', function (success) {
        var data = window.CURRENT_CAT_DATA;
        if (!success || !data || !data.length) {
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

function renderListPage(cat, page, perPage) {
    var listContainer = document.getElementById('post-list');
    var paginationContainer = document.getElementById('pagination');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="wap-card">Dang tai danh sach...</div>';
    page = page || 1;
    perPage = perPage || 10;

    window.CURRENT_CAT_DATA = null;
    loadDataScript('data/index/' + cat + '.js', function (success) {
        var data = window.CURRENT_CAT_DATA;
        if (!success || !data || !data.length) {
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
            var nav = '<div class="pagination">';
            if (page > 1) nav += '<a href="?cat=' + cat + '&page=' + (page - 1) + '" class="btn btn-secondary">&laquo; Truoc</a> ';
            nav += '<span>Trang ' + page + '/' + totalPages + '</span>';
            if (page < totalPages) nav += ' <a href="?cat=' + cat + '&page=' + (page + 1) + '" class="btn btn-secondary">Sau &raquo;</a>';
            paginationContainer.innerHTML = nav + '</div>';
        }
    });
}

function renderSearchResults(query) {
    var listContainer = document.getElementById('post-list');
    var paginationContainer = document.getElementById('pagination');
    if (!listContainer) return;

    if (paginationContainer) paginationContainer.innerHTML = '';
    listContainer.innerHTML = '<div class="wap-card">Dang tim kiem...</div>';

    var results = [];
    var pending = ALL_CATEGORIES.length;

    function checkDone() {
        if (pending > 0) return;

        if (!results.length) {
            listContainer.innerHTML = '<div class="wap-card">Khong tim thay ket qua cho "<b>' + escapeHtml(query) + '</b>".</div>';
            return;
        }

        var html = '<div class="search-result-summary">Tim thay <b>' + results.length + '</b> ket qua:</div>';
        for (var i = 0; i < results.length; i++) {
            html += createCardItemHTML(results[i]);
        }
        listContainer.innerHTML = html;
    }

    for (var i = 0; i < ALL_CATEGORIES.length; i++) {
        (function(categoryName) {
            loadDataScript('data/index/' + categoryName + '.js', function () {
                pending--;
                var data = window.CURRENT_CAT_DATA;
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
                checkDone();
            });
        })(ALL_CATEGORIES[i]);
    }
}

function renderDetailPage(id) {
    var detailContainer = document.getElementById('post-detail');
    if (!detailContainer) return;

    detailContainer.innerHTML = '<div class="wap-card">Dang tai bai viet...</div>';

    window.CURRENT_ITEM_DATA = null;
    loadDataScript('data/items/' + id + '.js', function (success) {
        var item = window.CURRENT_ITEM_DATA;
        if (!success || !item) {
            detailContainer.innerHTML = '<div class="wap-card wap-card--error">Bai viet khong ton tai!</div>';
            return;
        }

        var title = escapeHtml(item.title || '').toUpperCase();
        var vendor = escapeHtml(item.vendor || 'N/A');
        var screen = escapeHtml(item.screen || 'N/A');
        var version = escapeHtml(item.version || '1.0');
        var date = escapeHtml(item.date || 'N/A');

        var html = '<div class="title-head">' + title + '</div>' +
            '<div class="wap-card">' +
            '<div class="detail-meta"><b>Hang:</b> ' + vendor + ' | <b>Man hinh:</b> ' + screen + '<br><b>Phien ban:</b> ' + version + ' | <b>Cap nhat:</b> ' + date + '</div>';

        if (item.blocks) {
            for (var i = 0; i < item.blocks.length; i++) {
                var block = item.blocks[i];
                if (block.type === 'text') {
                    html += '<p class="detail-text">' + escapeHtml(block.value || '').replace(/\n/g, '<br>') + '</p>';
                } else if (block.type === 'image') {
                    html += '<div class="detail-image-wrap"><img src="' + escapeHtml(block.value || '') + '" class="detail-image">';
                    if (block.caption) {
                        html += '<div class="detail-image-caption"><i>' + escapeHtml(block.caption || '') + '</i></div>';
                    }
                    html += '</div>';
                }
            }
        }
        html += '</div>';

        if (item.downloads) {
            for (var j = 0; j < item.downloads.length; j++) {
                var group = item.downloads[j];
                html += '<div class="title-head">TAI VE: ' + (group.groupTitle || '').toUpperCase() + '</div><div class="wap-card">';
                for (var k = 0; k < group.files.length; k++) {
                    var fileItem = group.files[k];
                    html += '<a href="' + fileItem.url + '" class="btn-download">Tai ve: ' + escapeHtml(fileItem.label) + '</a>';
                }
                html += '</div>';
            }
        }

        detailContainer.innerHTML = html;
    });
}

function initApp() {
    if (APP_STARTED) return;
    APP_STARTED = true;
    initTheme();
    routePageData();
}

if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', initApp, false);
} else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', function () {
        if (document.readyState === 'complete') initApp();
    });
}

window.onload = function () {
    initApp();
};
