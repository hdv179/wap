/* ==========================================================================
   APP ROUTER
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
