// WAP JavaScript - Tuong thich trinh duyet Java cu
// KHONG dung: let/const, arrow functions, template literals, Promise, fetch, Array.forEach, Object.keys
// Su dung: var, for loop, function, XHR, ActiveXObject fallback

var HOME_CATS = ['gameloft', 'teamobi', 'gameonline', 'gameoffline', 'gameviethoa', 'trinhduyet', 'ungdung', 'hinhnen', 'nhacchuong', 'chude', 'doctruyen', 'thuthuat'];
var ALL_CATS = HOME_CATS.slice(0);
var JSON_CACHE = {};
var DEFAULT_IMG = 'assets/images/default.png';
var APP_STARTED = false;

// Polyfill String.trim cho trinh duyet cu
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

// Parse JSON an toan cho ca trinh duyet cu khong co window.JSON
function parseJson(text) {
    try {
        if (window.JSON && typeof window.JSON.parse === 'function') {
            return window.JSON.parse(text);
        }
    } catch (e) {}
    try {
        return (new Function('return ' + text))();
    } catch (e2) {
        return null;
    }
}

// Lay tham so URL
function getParam(name) {
    var s = window.location.search || '';
    var pairs = s.replace(/^\?/, '').split('&');
    for (var i = 0; i < pairs.length; i++) {
        var kv = pairs[i].split('=');
        if (kv[0] === name) {
            try { return decodeURIComponent(kv[1] || ''); }
            catch (e) { return kv[1] || ''; }
        }
    }
    return '';
}

// XHR tuong thich IE / Opera Mini / UCWEB
function loadText(url, ok, fail) {
    var xhr = null;
    try { xhr = new XMLHttpRequest(); } catch (e) {}
    if (!xhr) {
        try { xhr = new ActiveXObject('Msxml2.XMLHTTP'); } catch (e) {}
    }
    if (!xhr) {
        try { xhr = new ActiveXObject('Microsoft.XMLHTTP'); } catch (e) {}
    }
    if (!xhr) {
        if (fail) fail('no-xhr');
        return;
    }
    try {
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                var s = xhr.status;
                if (s === 0 || (s >= 200 && s < 300) || s === 304) {
                    if (ok) ok(xhr.responseText);
                } else {
                    if (fail) fail(s);
                }
            }
        };
        xhr.open('GET', url, true);
        xhr.send(null);
    } catch (e2) {
        if (fail) fail(e2);
    }
}

// Cache-busting de tranh cache trinh duyet cu
function noCache(url) {
    var sep = (url.indexOf('?') >= 0) ? '&' : '?';
    return url + sep + 'v=' + (new Date()).getTime();
}

// Tai JSON co cache
function fetchJson(url, cb) {
    if (JSON_CACHE[url]) { if (cb) cb(JSON_CACHE[url]); return; }
    loadText(noCache(url), function (text) {
        var d = parseJson(text);
        if (d) JSON_CACHE[url] = d;
        if (cb) cb(d);
    }, function () { if (cb) cb(null); });
}

// Escape HTML
function esc(v) {
    if (v == null) return '';
    return String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Set text an toan
function setText(el, t) {
    if (!el) return;
    if (typeof el.textContent !== 'undefined') el.textContent = t;
    else if (typeof el.innerText !== 'undefined') el.innerText = t;
    else el.innerHTML = esc(t);
}

// Tao HTML card 1 muc (co anh thumb)
function cardHTML(item) {
    if (!item) return '';
    var title = esc(item.title || 'Khong co tieu de');
    var thumb = esc(item.thumb || DEFAULT_IMG);
    var screen = esc(item.screen || 'N/A');
    var vendor = esc(item.vendor || 'N/A');
    var id = esc(item.id || '');
    return '<div class="wap-card wap-row">' +
        '<img src="' + thumb + '" alt="' + title + '" class="wap-row-img" width="36" height="36">' +
        '<div class="wap-row-body">' +
        '<a href="detail.html?id=' + id + '" class="wap-row-title">' + title + '</a>' +
        '<div class="wap-row-meta">' + screen + ' | ' + vendor + '</div>' +
        '</div></div>';
}

// Tao HTML header (inline, khong XHR)
function renderHeader() {
    var el = document.getElementById('wap-header');
    if (!el) return;
    el.innerHTML =
        '<div class="site-header">HDV179 WAP PORTAL</div>' +
        '<div class="nav-menu">' +
        '<a href="index.html">Trang Chu</a> | ' +
        '<a href="category.html?cat=gameloft">Gameloft</a> | ' +
        '<a href="category.html?cat=teamobi">TeaMobi</a> | ' +
        '<a href="category.html?cat=ungdung">Ung Dung</a>' +
        '</div>' +
        '<div class="search-box">' +
        '<form action="category.html" method="get">' +
        '<input type="text" name="q" class="search-input" maxlength="80"> ' +
        '<input type="submit" value="Tim" class="search-btn">' +
        '</form>' +
        '</div>';
}

// Tao HTML footer (inline)
function renderFooter() {
    var el = document.getElementById('wap-footer');
    if (!el) return;
    el.innerHTML =
        '<div class="site-footer">' +
        '<a href="index.html">Trang Chu</a> | ' +
        '<a href="#top">Len Dau</a>' +
        '<br>' +
        'Giao dien: ' +
        '<a href="javascript:setTheme(\'default\')" style="color:#333">Mac Dinh</a> | ' +
        '<a href="javascript:setTheme(\'blue\')" style="color:#0066cc">Xanh</a> | ' +
        '<a href="javascript:setTheme(\'dark\')" style="color:#555">Toi</a>' +
        '<br>' +
        '<span style="color:#666">&#169; 2026 HDV179 WAP</span>' +
        '</div>';
}

// --- THEME (luu vao cookie vi khong co localStorage o trinh duyet Java cu) ---

function getTheme() {
    try {
        if (window.localStorage && window.localStorage.getItem) {
            var t = window.localStorage.getItem('wap_theme');
            if (t) return t;
        }
    } catch (e) {}
    return getCookie('wap_theme') || 'default';
}

function setTheme(name) {
    try {
        if (window.localStorage && window.localStorage.setItem) {
            window.localStorage.setItem('wap_theme', name);
        }
    } catch (e) {}
    setCookie('wap_theme', name, 365);
    applyTheme(name);
}

function applyTheme(name) {
    // Doi mau body va title-head qua style truc tiep
    // vi khong dung CSS variables
    var bg, color, cardBg, border, link, primary, primaryDk;
    if (name === 'dark') {
        bg = '#121212'; color = '#e0e0e0'; cardBg = '#1e1e1e';
        border = '#333333'; link = '#64b5f6'; primary = '#2e7d32'; primaryDk = '#1b5e20';
    } else if (name === 'blue') {
        bg = '#ffffff'; color = '#000000'; cardBg = '#f0f5ff';
        border = '#aaccee'; link = '#0044aa'; primary = '#0066cc'; primaryDk = '#004499';
    } else {
        bg = '#ffffff'; color = '#000000'; cardBg = '#f5f5f5';
        border = '#cccccc'; link = '#0000cc'; primary = '#008000'; primaryDk = '#005500';
    }
    var b = document.body;
    if (b) { b.style.backgroundColor = bg; b.style.color = color; }
    // Set CSS class on body for theme
    if (b) { b.className = 'theme-' + name; }
}

function getCookie(name) {
    var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
}

function setCookie(name, val, days) {
    var exp = '';
    if (days) {
        var d = new Date();
        d.setTime(d.getTime() + days * 86400000);
        exp = '; expires=' + d.toGMTString();
    }
    document.cookie = name + '=' + encodeURIComponent(val) + exp + '; path=/';
}

// --- TRANG CHU ---

function renderHome() {
    for (var i = 0; i < HOME_CATS.length; i++) {
        renderHomeSection(HOME_CATS[i]);
    }
}

function renderHomeSection(cat) {
    var el = document.getElementById('sec-' + cat);
    if (!el) return;
    el.innerHTML = '<div class="wap-card msg-loading">Dang tai...</div>';
    fetchJson('data/index/' + cat + '.json', function (data) {
        if (!data || !data.length) {
            el.innerHTML = '<div class="wap-card">Khong co du lieu.</div>';
            return;
        }
        var html = '';
        var n = data.length < 4 ? data.length : 4;
        for (var j = 0; j < n; j++) html += cardHTML(data[j]);
        el.innerHTML = html || '<div class="wap-card">Khong co du lieu.</div>';
    });
}

// --- TRANG DANH MUC ---

function renderList(cat, page, perPage) {
    var listEl = document.getElementById('post-list');
    var pageEl = document.getElementById('pagination');
    if (!listEl) return;
    page = parseInt(page, 10) || 1;
    perPage = perPage || 10;
    listEl.innerHTML = '<div class="wap-card msg-loading">Dang tai danh sach...</div>';
    fetchJson('data/index/' + cat + '.json', function (data) {
        if (!data || !data.length) {
            listEl.innerHTML = '<div class="wap-card">Khong co du lieu.</div>';
            return;
        }
        var total = Math.ceil(data.length / perPage);
        var slice = data.slice((page - 1) * perPage, page * perPage);
        var html = '';
        for (var i = 0; i < slice.length; i++) html += cardHTML(slice[i]);
        listEl.innerHTML = html || '<div class="wap-card">Khong co du lieu.</div>';
        if (pageEl && total > 1) {
            var p = '<div class="pagination">';
            if (page > 1) p += '<a href="category.html?cat=' + cat + '&page=' + (page - 1) + '" class="btn btn-sec">&laquo; Truoc</a> ';
            p += 'Trang ' + page + '/' + total;
            if (page < total) p += ' <a href="category.html?cat=' + cat + '&page=' + (page + 1) + '" class="btn btn-sec">Sau &raquo;</a>';
            pageEl.innerHTML = p + '</div>';
        }
    });
}

// --- TIM KIEM ---

function renderSearch(q) {
    var listEl = document.getElementById('post-list');
    var pageEl = document.getElementById('pagination');
    if (!listEl) return;
    if (pageEl) pageEl.innerHTML = '';
    q = q.toLowerCase();
    listEl.innerHTML = '<div class="wap-card msg-loading">Dang tim kiem...</div>';
    var results = [];
    var pending = ALL_CATS.length;
    function done() {
        if (pending > 0) return;
        if (!results.length) {
            listEl.innerHTML = '<div class="wap-card msg-error">Khong tim thay ket qua.</div>';
            return;
        }
        var html = '<div class="search-summary">Tim thay <b>' + results.length + '</b> ket qua:</div>';
        for (var k = 0; k < results.length; k++) html += cardHTML(results[k]);
        listEl.innerHTML = html;
    }
    for (var i = 0; i < ALL_CATS.length; i++) {
        (function (cat) {
            fetchJson('data/index/' + cat + '.json', function (data) {
                pending--;
                if (data && data.length) {
                    for (var j = 0; j < data.length; j++) {
                        var it = data[j];
                        if (it && it.title && it.title.toLowerCase().indexOf(q) !== -1) {
                            results.push(it);
                        } else if (it && it.vendor && it.vendor.toLowerCase().indexOf(q) !== -1) {
                            results.push(it);
                        }
                    }
                }
                done();
            });
        })(ALL_CATS[i]);
    }
}

// --- TRANG CHI TIET ---

function renderDetail(id) {
    var el = document.getElementById('post-detail');
    if (!el) return;
    el.innerHTML = '<div class="wap-card msg-loading">Dang tai bai viet...</div>';
    fetchJson('data/items/' + id + '.json', function (item) {
        if (!item) {
            el.innerHTML = '<div class="wap-card msg-error">Bai viet khong ton tai!</div>';
            return;
        }
        var html = '<div class="title-head">' + esc((item.title || '').toUpperCase()) + '</div>';
        html += '<div class="wap-card">';
        html += '<div class="detail-meta">';
        html += 'Hang: <b>' + esc(item.vendor || 'N/A') + '</b> | ';
        html += 'Man hinh: <b>' + esc(item.screen || 'N/A') + '</b><br>';
        html += 'Phien ban: <b>' + esc(item.version || '1.0') + '</b> | ';
        html += 'Cap nhat: <b>' + esc(item.date || 'N/A') + '</b>';
        html += '</div>';

        if (item.blocks) {
            for (var i = 0; i < item.blocks.length; i++) {
                var bl = item.blocks[i];
                if (bl.type === 'text') {
                    html += '<p class="detail-text">' + esc(bl.value || '').replace(/\n/g, '<br>') + '</p>';
                } else if (bl.type === 'image') {
                    html += '<div class="detail-img-wrap"><img src="' + esc(bl.value || '') + '" class="detail-img" alt="">';
                    if (bl.caption) html += '<div class="detail-img-cap">' + esc(bl.caption) + '</div>';
                    html += '</div>';
                }
            }
        }
        html += '</div>';

        if (item.downloads) {
            for (var d = 0; d < item.downloads.length; d++) {
                var grp = item.downloads[d];
                html += '<div class="title-head">TAI VE: ' + esc(grp.groupTitle || '') + '</div>';
                html += '<div class="wap-card">';
                for (var f = 0; f < grp.files.length; f++) {
                    var fi = grp.files[f];
                    html += '<a href="' + esc(fi.url || '#') + '" class="btn-dl">[TAI] ' + esc(fi.label || fi.url) + '</a>';
                }
                html += '</div>';
            }
        }

        el.innerHTML = html;
    });
}

// --- KHOI DONG ---

function initApp() {
    if (APP_STARTED) return;
    APP_STARTED = true;

    applyTheme(getTheme());
    renderHeader();
    renderFooter();

    var cat = getParam('cat') || 'gameloft';
    var id = getParam('id');
    var q = getParam('q');
    var page = getParam('page') || '1';

    // Trang chi tiet
    if (document.getElementById('post-detail') && id) {
        renderDetail(id);
    }
    // Trang danh muc / tim kiem
    else if (document.getElementById('post-list')) {
        var titleEl = document.getElementById('cat-title');
        if (q) {
            if (titleEl) setText(titleEl, 'TIM KIEM: ' + q.toUpperCase());
            renderSearch(q.trim());
        } else {
            if (titleEl) setText(titleEl, 'DANH MUC: ' + cat.toUpperCase());
            renderList(cat, page, 10);
        }
    }
    // Trang chu
    else if (document.getElementById('sec-gameloft')) {
        renderHome();
    }
}

// Tuong thich: su dung ca DOMContentLoaded lau onload de khoi dong
// Tranh khoi dong 2 lan bang APP_STARTED
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', initApp, false);
} else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', function () {
        if (document.readyState === 'complete') initApp();
    });
}
window.onload = initApp;
