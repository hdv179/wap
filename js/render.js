/* ==========================================================================
   RENDER TEMPLATES & UI COMPONENTS
   ========================================================================== */
var HOME_CATEGORIES = ['gameloft', 'teamobi', 'gameonline', 'gameoffline', 'gameviethoa', 'trinhduyet', 'ungdung', 'hinhnen', 'nhacchuong', 'chude', 'doctruyen', 'thuthuat'];
var ALL_CATEGORIES = HOME_CATEGORIES.slice(0);

function createCardItemHTML(item) {
    var title = escapeHtml(item && item.title ? item.title : 'Không có tiêu đề');
    var thumb = escapeHtml(item && item.thumb ? item.thumb : DEFAULT_IMAGE);
    var screen = escapeHtml(item && item.screen ? item.screen : 'N/A');
    var vendor = escapeHtml(item && item.vendor ? item.vendor : 'N/A');
    var id = escapeHtml(item && item.id ? item.id : '');

    return '<div class="wap-card wap-card--row">' +
        '<img src="' + thumb + '" alt="' + title + '" class="wap-card__thumb">' +
        '<div class="wap-card__content">' +
        '<a href="' + formatUrl('detail.html?id=' + id) + '" class="wap-card__title">' + title + '</a>' +
        '<div class="wap-card__meta">Màn hình: ' + screen + ' | Hãng: ' + vendor + '</div>' +
        '</div></div>';
}

function createFallbackItemsHTML() {
    return '<div class="wap-card">Không có dữ liệu để hiển thị.</div>';
}

function renderHomePage() {
    for (var i = 0; i < HOME_CATEGORIES.length; i++) {
        (function(cat) {
            var container = document.getElementById('home-' + cat);
            if (!container) return;
            container.innerHTML = '<div class="wap-card">Đang tải...</div>';
            fetchJson('data/index/' + cat + '.json', function (data, err) {
                if (err || !data || !data.length) { container.innerHTML = createFallbackItemsHTML(); return; }
                var html = '';
                var count = Math.min(4, data.length);
                for (var j = 0; j < count; j++) html += createCardItemHTML(data[j]);
                container.innerHTML = html || createFallbackItemsHTML();
            });
        })(HOME_CATEGORIES[i]);
    }
}

function renderListPage(cat, page, perPage) {
    var listContainer = document.getElementById('post-list');
    var paginationContainer = document.getElementById('pagination');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="wap-card">Đang tải danh sách...</div>';
    page = page || 1;
    perPage = perPage || 10;

    fetchJson('data/index/' + cat + '.json', function (data, err) {
        if (err || !data || !data.length) { listContainer.innerHTML = createFallbackItemsHTML(); return; }

        var totalPages = Math.ceil(data.length / perPage);
        var pageData = data.slice((page - 1) * perPage, page * perPage);
        var html = '';
        for (var i = 0; i < pageData.length; i++) html += createCardItemHTML(pageData[i]);

        listContainer.innerHTML = html || createFallbackItemsHTML();

        if (paginationContainer && totalPages > 1) {
            var nav = '<div class="pagination">';
            if (page > 1) nav += '<a href="' + formatUrl('index.html?cat=' + cat + '&page=' + (page - 1)) + '" class="btn btn-secondary">« Trước</a> ';
            nav += '<span>Trang ' + page + '/' + totalPages + '</span>';
            if (page < totalPages) nav += ' <a href="' + formatUrl('index.html?cat=' + cat + '&page=' + (page + 1)) + '" class="btn btn-secondary">Sau »</a>';
            paginationContainer.innerHTML = nav + '</div>';
        }
    });
}

function renderSearchResults(query) {
    var listContainer = document.getElementById('post-list') || document.body;
    listContainer.innerHTML = '<div class="wap-card">Đang tìm kiếm...</div>';

    var results = [];
    var cleanQuery = removeVietnameseTones(query);
    var categoryIndex = 0;

    function processNextCategory() {
        if (categoryIndex >= ALL_CATEGORIES.length) {
            if (!results.length) {
                listContainer.innerHTML = '<div class="wap-card">Không tìm thấy kết quả cho "<b>' + escapeHtml(query) + '</b>".</div>';
                return;
            }
            var html = '<div class="search-result-summary">Tìm thấy <b>' + results.length + '</b> kết quả:</div>';
            for (var i = 0; i < results.length; i++) html += createCardItemHTML(results[i]);
            listContainer.innerHTML = html;
            return;
        }

        var currentCat = ALL_CATEGORIES[categoryIndex++];
        fetchJson('data/index/' + currentCat + '.json', function (data, err) {
            if (!err && data && data.length) {
                for (var j = 0; j < data.length; j++) {
                    var item = data[j];
                    if (!item) continue;
                    var title = removeVietnameseTones(item.title || '');
                    var vendor = removeVietnameseTones(item.vendor || '');
                    if (title.indexOf(cleanQuery) !== -1 || vendor.indexOf(cleanQuery) !== -1) {
                        results.push(item);
                    }
                }
            }
            processNextCategory();
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
        var defaultScreen = escapeHtml(item.screen || 'N/A');
        var version = escapeHtml(item.version || '1.0');
        var date = escapeHtml(item.date || 'N/A');

        var html = '<div class="title-head">' + title + '</div>' +
            '<div class="wap-card">' +
            '<div class="detail-meta"><b>Hãng:</b> ' + vendor + ' | <b>Màn hình:</b> ' + defaultScreen + '<br><b>Phiên bản:</b> ' + version + ' | <b>Cập nhật:</b> ' + date + '</div>';

        if (item.blocks) {
            for (var i = 0; i < item.blocks.length; i++) {
                var block = item.blocks[i];
                if (block.type === 'text') {
                    html += '<p class="detail-text">' + escapeHtml(block.value || '').replace(/\n/g, '<br>') + '</p>';
                } else if (block.type === 'image') {
                    html += '<div class="detail-image-wrap"><img src="' + escapeHtml(block.value || '') + '" class="detail-image">';
                    if (block.caption) html += '<div class="detail-image-caption"><i>' + escapeHtml(block.caption || '') + '</i></div>';
                    html += '</div>';
                }
            }
        }
        html += '</div>';

      if (item.downloads) {
          for (var j = 0; j < item.downloads.length; j++) {
              var group = item.downloads[j];
              html += '<div class="title-head">' + escapeHtml((group.groupTitle || '').toUpperCase()) + '</div>' +
                      '<div class="wap-card wap-card--downloads">';
      
              for (var k = 0; k < group.files.length; k++) {
                  var fileItem = group.files[k];
                  var fileUrl = escapeHtml(fileItem.url || '#');
                  var fileLabel = escapeHtml(fileItem.label || 'Tải về');
                  var fileScreen = escapeHtml(fileItem.screen || item.screen || 'Tất cả');
                  var fileOs = escapeHtml(fileItem.os || detectOsFromUrl(fileUrl, fileLabel));
      
                  html += '<div class="download-item">' +
                              '<a href="' + fileUrl + '" class="btn-download" download>' +
                                  '<span class="download-title">' + fileLabel + '</span> ' +
                                  '<span class="download-tag">[' + fileScreen + ']</span>' +
                                  '<span class="download-tag">[' + fileOs + ']</span>' +
                              '</a>' +
                          '</div>';
              }
              html += '</div>';
          }
      }
      detailContainer.innerHTML = html;
    });
}
