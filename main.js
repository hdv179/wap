/* ==========================================================================
   1. HẰNG SỐ, BIẾN TOÀN CỤC & POLYFILLS
   ========================================================================== */
var HOME_CATEGORIES = ['gameloft', 'teamobi', 'gameonline', 'gameoffline', 'gameviethoa', 'trinhduyet', 'ungdung', 'hinhnen', 'nhacchuong', 'chude', 'doctruyen', 'thuthuat'];
var ALL_CATEGORIES = HOME_CATEGORIES.slice(0);
var JSON_CACHE = {};
var DEFAULT_IMAGE = 'assets/images/default.png';
var APP_STARTED = false;
var IS_CLOUDFLARE = false;

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

function removeVietnameseTones(str) {
    if (!str) return '';
    str = String(str).toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    return str;
}

function parseJson(text) {
    if (window.JSON && typeof window.JSON.parse === 'function') {
        return window.JSON.parse(text);
    }
    try {
        return (new Function('return ' + text))();
    } catch (e) {
        return null;
    }
}

function stringifyJson(obj) {
    if (window.JSON && typeof window.JSON.stringify === 'function') {
        return window.JSON.stringify(obj);
    }
    var msg = (obj.message || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    var content = (obj.content || '');
    var sha = obj.sha ? ',"sha":"' + obj.sha + '"' : '';
    return '{"message":"' + msg + '","content":"' + content + '"' + sha + '}';
}

function stripHtmlExtension(url) {
    if (!url) return '';
    var parts = url.split('?');
    var path = parts[0];
    var query = parts[1] ? '?' + parts[1] : '';

    path = path.replace(/(^|\/)index\.html$/i, '$1');
    path = path.replace(/\.html$/i, '');

    if (path === '' || path === '/') {
        path = './';
    }
    return path + query;
}

function formatUrl(url) {
    if (IS_CLOUDFLARE) {
        return stripHtmlExtension(url);
    }
    return url;
}

/* ==========================================================================
   2. KHỞI TẠO ỨNG DỤNG
   ========================================================================== */
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

/* ==========================================================================
   3. HÀM TIỆN ÍCH HỆ THỐNG & HTTP REQUEST (XHR)
   ========================================================================== */
function getUrlParam(param) {
    var query = window.location.search || '';
    if (!query) return '';
    
    var pairs = query.replace(/^\?/, '').split('&');
    for (var i = 0; i < pairs.length; i++) {
        var parts = pairs[i].split('=');
        if (parts[0] === param) {
            var val = parts[1] || '';
            val = val.replace(/\+/g, ' ');
            try {
                return decodeURIComponent(val);
            } catch (e) {
                return unescape(val);
            }
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

function loadTextFile(url, success, error) {
    var xhr = null;
    try {
        xhr = new XMLHttpRequest();
    } catch (e1) {
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
            if (!IS_CLOUDFLARE) {
                try {
                    if (typeof xhr.getResponseHeader === 'function') {
                        var cfRay = xhr.getResponseHeader('CF-Ray');
                        var server = xhr.getResponseHeader('Server') || '';
                        if (cfRay || server.toLowerCase().indexOf('cloudflare') !== -1) {
                            IS_CLOUDFLARE = true;
                        }
                    }
                } catch (e) {}
            }

            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || xhr.status === 0) {
                if (success) success(xhr.responseText);
            } else if (error) {
                error(xhr.status);
            }
        }
    };

    xhr.open('GET', formatUrl(url), true);
    xhr.send(null);
}

function fetchJson(url, callback) {
    if (JSON_CACHE[url]) {
        if (callback) callback(JSON_CACHE[url]);
        return;
    }

    loadTextFile(url + '?v=' + new Date().getTime(), function (text) {
        var data = parseJson(text);
        if (data) {
            JSON_CACHE[url] = data;
            if (callback) callback(data);
        } else {
            if (callback) callback(null, 'JSON Parse Error');
        }
    }, function (err) {
        if (callback) callback(null, err);
    });
}

function loadComponent(elementId, filePath) {
    var targetEl = document.getElementById(elementId);
    if (!targetEl) return;

    loadTextFile(filePath + '?v=' + new Date().getTime(), function (html) {
        if (html) targetEl.innerHTML = html;
    });
}

/* ==========================================================================
   4. QUẢN LÝ THEME & COOKIE
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
   5. TEMPLATE BUILDERS
   ========================================================================== */
function createCardItemHTML(item) {
    var title = escapeHtml(item && item.title ? item.title : 'Không có tiêu đề');
    var thumb = escapeHtml(item && item.thumb ? item.thumb : DEFAULT_IMAGE);
    var screen = escapeHtml(item && item.screen ? item.screen : 'N/A');
    var vendor = escapeHtml(item && item.vendor ? item.vendor : 'N/A');
    var id = escapeHtml(item && item.id ? item.id : '');

    var detailLink = formatUrl('detail.html?id=' + id);

    return '<div class="wap-card wap-card--row">' +
        '<img src="' + thumb + '" alt="' + title + '" class="wap-card__thumb">' +
        '<div class="wap-card__content">' +
        '<a href="' + detailLink + '" class="wap-card__title">' + title + '</a>' +
        '<div class="wap-card__meta">Màn hình: ' + screen + ' | Hãng: ' + vendor + '</div>' +
        '</div></div>';
}

function createFallbackItemsHTML() {
    return '<div class="wap-card">Không có dữ liệu để hiển thị. Vui lòng kiểm tra file JSON hoặc đường dẫn ảnh.</div>';
}

/* ==========================================================================
   6. BỘ ĐIỀU HƯỚNG & RENDER TRANG
   ========================================================================== */
function routePageData() {
    var cat = getUrlParam('cat') || 'gameloft';
    var id = getUrlParam('id');
    var query = getUrlParam('q');

    var listContainer = document.getElementById('post-list');
    var detailContainer = document.getElementById('post-detail');
    var catTitle = document.getElementById('category-title');

    if (query && query.trim() !== '') {
        if (catTitle) setTextContent(catTitle, 'TÌM KIẾM: "' + query.toUpperCase() + '"');
        renderSearchResults(query.trim());
        return;
    }

    if (detailContainer && id) {
        renderDetailPage(id);
    } else if (listContainer) {
        var page = parseInt(getUrlParam('page'), 10) || 1;
        if (catTitle) setTextContent(catTitle, 'DANH MỤC: ' + cat.toUpperCase());
        renderListPage(cat, page);
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

    container.innerHTML = '<div class="wap-card">Đang tải...</div>';
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

function renderListPage(cat, page, perPage) {
    var listContainer = document.getElementById('post-list');
    var paginationContainer = document.getElementById('pagination');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="wap-card">Đang tải danh sách...</div>';
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
            var nav = '<div class="pagination">';
            if (page > 1) {
                var prevUrl = formatUrl('index.html?cat=' + cat + '&page=' + (page - 1));
                nav += '<a href="' + prevUrl + '" class="btn btn-secondary">« Trước</a> ';
            }
            nav += '<span>Trang ' + page + '/' + totalPages + '</span>';
            if (page < totalPages) {
                var nextUrl = formatUrl('index.html?cat=' + cat + '&page=' + (page + 1));
                nav += ' <a href="' + nextUrl + '" class="btn btn-secondary">Sau »</a>';
            }
            paginationContainer.innerHTML = nav + '</div>';
        }
    });
}

function renderSearchResults(query) {
    var listContainer = document.getElementById('post-list');
    var paginationContainer = document.getElementById('pagination');

    if (!listContainer) {
        var mainWrapper = document.getElementById('main-content') || document.body;
        var searchBox = document.createElement('div');
        searchBox.id = 'post-list';
        mainWrapper.appendChild(searchBox);
        listContainer = searchBox;
    }

    if (paginationContainer) paginationContainer.innerHTML = '';
    listContainer.innerHTML = '<div class="wap-card">Đang tìm kiếm...</div>';

    var results = [];
    var cleanQuery = removeVietnameseTones(query);
    var categoryIndex = 0;

    function processNextCategory() {
        if (categoryIndex >= ALL_CATEGORIES.length) {
            if (!results.length) {
                listContainer.innerHTML = '<div class="wap-card">Không tìm thấy kết quả phù hợp cho "<b>' + escapeHtml(query) + '</b>".</div>';
                return;
            }

            var html = '<div class="search-result-summary">Tìm thấy <b>' + results.length + '</b> kết quả:</div>';
            for (var i = 0; i < results.length; i++) {
                html += createCardItemHTML(results[i]);
            }
            listContainer.innerHTML = html;
            return;
        }

        var currentCat = ALL_CATEGORIES[categoryIndex];
        categoryIndex++;

        fetchJson('data/index/' + currentCat + '.json', function (data, err) {
            if (!err && data && data.length) {
                for (var j = 0; j < data.length; j++) {
                    var item = data[j];
                    if (!item) continue;

                    var title = removeVietnameseTones(item.title || '');
                    var vendor = removeVietnameseTones(item.vendor || '');
                    var id = removeVietnameseTones(item.id || '');

                    if (title.indexOf(cleanQuery) !== -1 ||
                        vendor.indexOf(cleanQuery) !== -1 ||
                        id.indexOf(cleanQuery) !== -1) {

                        var isDuplicate = false;
                        for (var k = 0; k < results.length; k++) {
                            if (results[k].id === item.id) {
                                isDuplicate = true;
                                break;
                            }
                        }
                        if (!isDuplicate) {
                            results.push(item);
                        }
                    }
                }
            }
            processNextCategory(); // Đảm bảo luôn chuyển sang danh mục tiếp theo dù có lỗi JSON hay không
        });
    }

    processNextCategory();
}

function renderDetailPage(id) {
    var detailContainer = document.getElementById('post-detail');
    if (!detailContainer) return;

    detailContainer.innerHTML = '<div class="wap-card">Đang tải bài viết...</div>';

    fetchJson('data/items/' + id + '.json', function (item, err) {
        if (err || !item) {
            detailContainer.innerHTML = '<div class="wap-card wap-card--error">Bài viết không tồn tại!</div>';
            return;
        }

        var title = escapeHtml(item.title || '').toUpperCase();
        var vendor = escapeHtml(item.vendor || 'N/A');
        var screen = escapeHtml(item.screen || 'N/A');
        var version = escapeHtml(item.version || '1.0');
        var date = escapeHtml(item.date || 'N/A');

        var html = '<div class="title-head">' + title + '</div>' +
            '<div class="wap-card">' +
            '<div class="detail-meta"><b>Hãng:</b> ' + vendor + ' | <b>Màn hình:</b> ' + screen + '<br><b>Phiên bản:</b> ' + version + ' | <b>Cập nhật:</b> ' + date + '</div>';

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
                html += '<div class="title-head">' + escapeHtml((group.groupTitle || '').toUpperCase()) + '</div><div class="wap-card">';
                for (var k = 0; k < group.files.length; k++) {
                    var fileItem = group.files[k];
                    html += '<a href="' + escapeHtml(fileItem.url) + '" class="btn-download" download>' + escapeHtml(fileItem.label) + '</a>';
                }
                html += '</div>';
            }
        }

        detailContainer.innerHTML = html;
    });
}

/* ==========================================================================
   7. CHỨC NĂNG QUẢN TRỊ (UPLOAD GITHUB)
   ========================================================================== */
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
        alert('Trình duyệt này không hỗ trợ FileReader để tải lên.');
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
                    alert('Lỗi upload file (Mã lỗi: ' + xhr.status + ')!');
                }
            }
        };
        xhr.send(stringifyJson({ message: 'Upload: ' + fileName, content: base64Content }));
    };
    reader.readAsDataURL(fileObj);
}

/* ==========================================================================
   8. TỰ ĐỘNG XỬ LÝ EVENT BẤM CLICK & SUBMIT FORM TÌM KIẾM
   ========================================================================== */
function handleGlobalLinks(e) {
    if (!IS_CLOUDFLARE) return;

    e = e || window.event;
    var target = e.target || e.srcElement;

    while (target && target.tagName !== 'A') {
        target = target.parentNode;
    }

    if (target && target.tagName === 'A') {
        var href = target.getAttribute('href');

        if (!href || href.indexOf('http://') === 0 || href.indexOf('https://') === 0 || href.indexOf('#') === 0 || href.indexOf('javascript:') === 0 || target.hasAttribute('download')) {
            return;
        }

        var cleanedUrl = stripHtmlExtension(href);
        // Kiểm tra tránh chuyển hướng nếu đường dẫn rỗng hoặc đã trỏ đúng trang hiện tại
        if (cleanedUrl && cleanedUrl !== href && cleanedUrl !== window.location.pathname) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            window.location.href = cleanedUrl;
        }
    }
}

function handleGlobalForms(e) {
    if (!IS_CLOUDFLARE) return;

    e = e || window.event;
    var target = e.target || e.srcElement;

    if (target && target.tagName === 'FORM') {
        var action = target.getAttribute('action') || '';
        if (action.indexOf('.html') !== -1) {
            var cleanedAction = stripHtmlExtension(action);
            target.setAttribute('action', cleanedAction);
        }
    }
}

if (document.addEventListener) {
    document.addEventListener('click', handleGlobalLinks, false);
    document.addEventListener('submit', handleGlobalForms, false);
} else if (document.attachEvent) {
    document.attachEvent('onclick', handleGlobalLinks);
    document.attachEvent('onsubmit', handleGlobalForms);
}
