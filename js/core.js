/* ==========================================================================
   CORE UTILS, HTTP & THEME MANAGER
   ========================================================================== */
var JSON_CACHE = {};
var DEFAULT_IMAGE = 'assets/images/default.png';
var IS_CLOUDFLARE = false;

if (!String.prototype.trim) {
    String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g, ''); };
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
    if (window.JSON && typeof window.JSON.parse === 'function') return window.JSON.parse(text);
    try { return (new Function('return ' + text))(); } catch (e) { return null; }
}

function stringifyJson(obj) {
    if (window.JSON && typeof window.JSON.stringify === 'function') return window.JSON.stringify(obj);
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
    path = path.replace(/(^|\/)index\.html$/i, '$1').replace(/\.html$/i, '');
    if (path === '' || path === '/') path = './';
    return path + query;
}

function formatUrl(url) {
    return IS_CLOUDFLARE ? stripHtmlExtension(url) : url;
}

function getUrlParam(param) {
    var query = window.location.search || '';
    if (!query) return '';
    var pairs = query.replace(/^\?/, '').split('&');
    for (var i = 0; i < pairs.length; i++) {
        var parts = pairs[i].split('=');
        if (parts[0] === param) {
            var val = parts[1] || '';
            try { return decodeURIComponent(val.replace(/\+/g, ' ')); } catch (e) { return unescape(val); }
        }
    }
    return '';
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function setTextContent(el, text) {
    if (!el) return;
    if (typeof el.textContent !== 'undefined') el.textContent = text;
    else if (typeof el.innerText !== 'undefined') el.innerText = text;
    else el.innerHTML = escapeHtml(text);
}

function loadTextFile(url, success, error) {
    var xhr = null;
    try { xhr = new XMLHttpRequest(); } catch (e1) {
        try { xhr = new ActiveXObject('Msxml2.XMLHTTP'); } catch (e2) {
            try { xhr = new ActiveXObject('Microsoft.XMLHTTP'); } catch (e3) {
                if (error) error('XHR not supported'); return;
            }
        }
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (!IS_CLOUDFLARE) {
                try {
                    var cfRay = xhr.getResponseHeader('CF-Ray');
                    var server = xhr.getResponseHeader('Server') || '';
                    if (cfRay || server.toLowerCase().indexOf('cloudflare') !== -1) IS_CLOUDFLARE = true;
                } catch (e) {}
            }
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || xhr.status === 0) {
                if (success) success(xhr.responseText);
            } else if (error) { error(xhr.status); }
        }
    };
    xhr.open('GET', formatUrl(url), true);
    xhr.send(null);
}

function fetchJson(url, callback) {
    if (JSON_CACHE[url]) { if (callback) callback(JSON_CACHE[url]); return; }
    loadTextFile(url + '?v=' + new Date().getTime(), function (text) {
        var data = parseJson(text);
        if (data) { JSON_CACHE[url] = data; if (callback) callback(data); }
        else { if (callback) callback(null, 'JSON Parse Error'); }
    }, function (err) { if (callback) callback(null, err); });
}

function detectOsFromUrl(url, label) {
    var str = (url + ' ' + (label || '')).toLowerCase();
    if (str.indexOf('.apk') !== -1 || str.indexOf('android') !== -1) return 'Android';
    if (str.indexOf('.jar') !== -1 || str.indexOf('.jad') !== -1 || str.indexOf('java') !== -1 || str.indexOf('j2me') !== -1) return 'Java (J2ME)';
    if (str.indexOf('.sis') !== -1 || str.indexOf('.sisx') !== -1 || str.indexOf('symbian') !== -1) return 'Symbian';
    if (str.indexOf('.zip') !== -1 || str.indexOf('.rar') !== -1 || str.indexOf('.7z') !== -1) return 'Archive (ZIP/RAR)';
    if (str.indexOf('.ipa') !== -1 || str.indexOf('ios') !== -1) return 'iOS';
    return 'Tệp tin';
}

/* Quản lý Theme */
function initTheme() {
    var theme = 'default';
    try {
        if (window.localStorage && window.localStorage.getItem) theme = window.localStorage.getItem('hdv179_theme') || 'default';
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', theme);
}

function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    try {
        if (window.localStorage && window.localStorage.setItem) window.localStorage.setItem('hdv179_theme', themeName);
    } catch (e) {}
}

initTheme();
