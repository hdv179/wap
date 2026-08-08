/* ==========================================================================
   APP ENTRY POINT & EVENT LISTENERS
   ========================================================================== */
var APP_STARTED = false;

function initApp() {
    if (APP_STARTED) return;
    APP_STARTED = true;
    routePageData();
}

// Bắt sự kiện DOM Ready
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', initApp, false);
} else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', function () {
        if (document.readyState === 'complete') initApp();
    });
}
window.onload = initApp;

// Lắng nghe sự kiện Click & Submit link để tối ưu trên Cloudflare
function handleGlobalLinks(e) {
    if (!IS_CLOUDFLARE) return;
    e = e || window.event;
    var target = e.target || e.srcElement;
    while (target && target.tagName !== 'A') target = target.parentNode;

    if (target && target.tagName === 'A') {
        var href = target.getAttribute('href');
        if (!href || href.indexOf('http') === 0 || href.indexOf('#') === 0 || target.hasAttribute('download')) return;
        var cleanedUrl = stripHtmlExtension(href);
        if (cleanedUrl && cleanedUrl !== href && cleanedUrl !== window.location.pathname) {
            if (e.preventDefault) e.preventDefault(); else e.returnValue = false;
            window.location.href = cleanedUrl;
        }
    }
}

if (document.addEventListener) {
    document.addEventListener('click', handleGlobalLinks, false);
} else if (document.attachEvent) {
    document.attachEvent('onclick', handleGlobalLinks);
}
