# WAP Java - Phien ban tuong thich trinh duyet Java cu

## Nhung thay doi so voi ban goc

### HTML
- Bo `<!DOCTYPE html>` → dung `<html>` thuan tuy (XHTML-lite)
- Bo `<meta charset="UTF-8">` → doi sang `<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">`
- Bo `<meta name="viewport" content="width=device-width, initial-scale=1.0">` → doi sang `<meta name="viewport" content="width=240">` (phu hop Nokia S40/S60)
- Bo tat ca emoji trong HTML (trinh duyet Java khong hien thi duoc)
- HTML entity hoa cac ky tu dac biet: `&amp;` `&laquo;` `&raquo;` v.v.
- Header va Footer giu nguyen trong HTML (khong XHR load template) → nhanh hon, it loi hon

### CSS
- **Bo hoan toan CSS custom properties** (`--var`) — khong duoc ho tro
- Tat ca mau sac dung gia tri cu the (hex)
- Bo `:root {}` block
- Bo `box-sizing: border-box` (dung cach khac)
- Them fallback cho float-based layout (clearfix bang `overflow: hidden`)
- Giu CSS nhe, don gian, khong dung `calc()`, `flex`, `grid`
- Theme (dark/blue) duoc ap dung bang JavaScript truc tiep qua `element.style`

### JavaScript
- **Khong dung `let`/`const`** → chi dung `var`
- **Khong dung arrow functions** → chi dung `function()`
- **Khong dung template literals** → dung noi chuoi `+`
- **Khong dung `Array.forEach`, `Array.map`** → dung `for` loop
- **Khong dung `Promise`/`async`/`await`** → dung callback
- **Khong dung `fetch()`** → dung XHR voi fallback `ActiveXObject` (cho IE Mobile)
- Header va Footer render **inline** qua JavaScript, **khong dung XHR load template file** → tranh loi khi mang cham
- Theme luu cookie (localStorage fallback) vi trinh duyet Java co the khong co localStorage
- `parseJson()` co fallback `new Function()` cho trinh duyet khong co `window.JSON`

### Ket cau file
```
wap-java/
├── index.html        ← Trang chu
├── category.html     ← Trang danh muc / tim kiem
├── detail.html       ← Trang chi tiet bai viet
├── main.js           ← JavaScript tuong thich cu
├── style.css         ← CSS khong dung variables
├── assets/
│   ├── images/       ← Hinh anh (copy nguyen)
│   └── files/        ← File JAR tai ve (copy nguyen)
└── data/
    ├── index/        ← JSON danh sach danh muc
    └── items/        ← JSON chi tiet tung bai

## Trinh duyet duoc test/nham toi
- Opera Mini 4.x - 7.x (Java)
- UC Browser for Java
- Nokia S40 built-in browser
- MIDP 2.0 compatible browsers
- Internet Explorer Mobile 6
```
