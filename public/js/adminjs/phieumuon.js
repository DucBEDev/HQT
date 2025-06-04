let selectedBooks = [];
let hinhThuc = 1;

// async function getNextMaPhieu() {
//     try {
//         const response = await fetch(`/Library/admin/phieumuon/next-id`);
//         const data = await response.json();
//         if (data.success) {
//             document.getElementById('maPhieu').value = data.nextId;
//         }
//     }
//     catch (error) {
//         console.error('Error:', error);
//         alert('Không thể lấy mã phiếu mượn tiếp theo!');
//     }
// }

// getNextMaPhieu();

function removeAccents(str) {
    if (!str) return '';
    str = String(str);
    
    // Sử dụng normalize để xử lý dấu tốt hơn
    return str.normalize('NFD')
             .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
             .replace(/đ/g, 'd')
             .replace(/Đ/g, 'D');
}

$(document).ready(function() {
    const books = $('.product-detail-item').map(function () {
        const maSach = $(this).data('ma-sach');
        const tenSach = $(this).data('ten-sach');
        const isbn = $(this).data('isbn');
        
        return {
            el: this,
            maSach: maSach,
            tenSach: tenSach,
            isbn: isbn,
            // Thêm các trường đã loại bỏ dấu để tìm kiếm
            maSachNormalized: removeAccents(String(maSach || '')).toLowerCase(),
            tenSachNormalized: removeAccents(String(tenSach || '')).toLowerCase(),
            isbnNormalized: removeAccents(String(isbn || '')).toLowerCase()
        };
    }).get();
    
    const fuse = new Fuse(books, {
        keys: [
            // Tìm kiếm trên cả dữ liệu gốc và đã chuẩn hóa
            { name: 'maSach', weight: 0.2 },
            { name: 'maSachNormalized', weight: 0.2 },
            { name: 'tenSach', weight: 0.3 },
            { name: 'tenSachNormalized', weight: 0.3 },
            { name: 'isbn', weight: 0.05 },
            { name: 'isbnNormalized', weight: 0.05 }
        ],
        threshold: 0.4, // Tăng threshold để kết quả linh hoạt hơn
        distance: 150, // Tăng distance
        ignoreLocation: true,
        minMatchCharLength: 1, // Giảm xuống 1 để tìm được ngay cả 1 ký tự
        includeScore: true, // Bao gồm điểm số để debug
        useExtendedSearch: true,
        // Thêm các option này để tìm kiếm tốt hơn
        findAllMatches: true,
        includeMatches: true
    });

    // Tìm kiếm sách
    $('#sachSearch').on('input', function () {
        const searchRaw = $(this).val().trim();
        
        if (searchRaw === '') {
            // Hiển thị tất cả sách khi không có từ khóa
            $('.product-detail-item').show();
            return;
        }

        // Tạo query tìm kiếm linh hoạt hơn
        let searchQueries = [];
        
        // Tìm kiếm chính xác
        searchQueries.push(searchRaw);
        
        // Tìm kiếm loại bỏ dấu
        const searchNormalized = removeAccents(searchRaw).toLowerCase();
        if (searchNormalized !== searchRaw.toLowerCase()) {
            searchQueries.push(searchNormalized);
        }
        
        // Tìm kiếm fuzzy (với ký tự đại diện)
        if (searchRaw.length >= 2) {
            searchQueries.push(`'${searchRaw}`); // Exact match
            searchQueries.push(`^${searchRaw}`); // Starts with
        }

        let allResults = [];
        
        // Thực hiện tìm kiếm với từng query
        searchQueries.forEach(query => {
            const results = fuse.search(query);
            allResults = allResults.concat(results);
        });

        // Loại bỏ kết quả trùng lặp và sắp xếp theo điểm số
        const uniqueResults = [];
        const seenItems = new Set();
        
        allResults
            .sort((a, b) => a.score - b.score) // Điểm số thấp hơn = khớp tốt hơn
            .forEach(result => {
                const itemKey = result.item.maSach + '|' + result.item.tenSach;
                if (!seenItems.has(itemKey)) {
                    seenItems.add(itemKey);
                    uniqueResults.push(result);
                }
            });

        // Hiển thị kết quả
        $('.product-detail-item').hide();
        
        if (uniqueResults.length > 0) {
            uniqueResults.forEach(result => {
                const $item = $(result.item.el);
                $item.show();
                // Debug: log điểm số (có thể xóa sau khi test)
                console.log(`${result.item.maSach} - ${result.item.tenSach}: ${result.score}`);
            });
        } else {
            // Nếu không tìm thấy kết quả, thử tìm kiếm đơn giản hơn
            console.log('Không tìm thấy kết quả chính xác, thử tìm kiếm đơn giản...');
            
            books.forEach(book => {
                const $item = $(book.el);
                const searchLower = searchNormalized;
                
                // Tìm kiếm đơn giản trong tên sách và mã sách
                if (book.tenSachNormalized.includes(searchLower) || 
                    book.maSachNormalized.includes(searchLower) ||
                    book.isbnNormalized.includes(searchLower)) {
                    $item.show();
                }
            });
        }
    });
    

    // Chọn sách
    $(document).on('click', '.product-detail-item', function() {
        const sach = {
            maSach: $(this).data('ma-sach'),
            tenSach: $(this).data('ten-sach'),
            isbn: $(this).data('isbn'),
            tinhTrangHienTai: $(this).data('tinh-trang') === true
        };
        addBook(sach);
    });

    // Xử lý submit form
    $('#addPhieuMuonForm').on('submit', function(e) {
        if (selectedBooks.length === 0) {
            e.preventDefault();
            alert('Vui lòng chọn ít nhất một cuốn sách trước khi lưu phiếu mượn!');
            return false;
        }
        updateSelectedBooksInputs();
    });

    $('#hinhThuc').on('change', function() {
        hinhThuc = $(this).val();
        selectedBooks = [];
        updateSelectedBooks();
    });
});

// Hàm thêm sách vào danh sách đã chọn
function addBook(sach) {
    // Kiểm tra giới hạn 3 sách
    if (hinhThuc == 1) {
        if (selectedBooks.length >= 3) {
            alert('Bạn chỉ có thể chọn tối đa 3 cuốn sách!');
            return;
        }
    }

    if (!selectedBooks.some(b => (b.maSach === sach.maSach || b.tenSach === sach.tenSach))) {
        selectedBooks.push({ ...sach, tinhTrangMuon: true }); // Mặc định sách mới
        updateSelectedBooks();
    } else {
        alert('Sách này đã được chọn!');
    }
}

// Hàm xóa sách khỏi danh sách đã chọn
function removeBook(maSach) {
    selectedBooks = selectedBooks.filter(b => b.maSach !== maSach);
    updateSelectedBooks();
}

// Hàm cập nhật danh sách sách đã chọn
function updateSelectedBooks() {
    let html = '';
    selectedBooks.forEach(book => {
        html += `
            <div class="selected-item">
                <span>${book.maSach} - ${book.tenSach}</span>
                <div class="d-flex align-items-center">
                    <label class="mr-2">Tình trạng mượn:</label>
                    <input type="checkbox" class="tinh-trang-muon" data-ma-sach="${book.maSach}" ${book.tinhTrangMuon ? 'checked' : ''} onchange="updateTinhTrangMuon('${book.maSach}', this.checked)">
                    <span class="ml-2">${book.tinhTrangMuon ? 'Mới' : 'Cũ'}</span>
                    <button type="button" class="btn btn-danger btn-sm ml-2" onclick="removeBook('${book.maSach}')">Xóa</button>
                </div>
            </div>`;
    });
    $('#selectedBooks').html(html);
    updateSelectedBooksInputs();
}

// Hàm cập nhật tình trạng mượn
function updateTinhTrangMuon(maSach, isNew) {
    selectedBooks = selectedBooks.map(b => {
        if (b.maSach === maSach) {
            b.tinhTrangMuon = isNew;
        }
        return b;
    });
    updateSelectedBooks();
}

// Hàm cập nhật input ẩn để gửi dữ liệu
function updateSelectedBooksInputs() {
    let inputsHtml = '';
    selectedBooks.forEach((book, index) => {
        inputsHtml += `<input type="hidden" name="ctPhieuMuonList[${index}].maSach" value="${book.maSach}"/>` +
                      `<input type="hidden" name="ctPhieuMuonList[${index}].tinhTrangMuon" value="${book.tinhTrangMuon}"/>`;
    });
    $('#selectedBooksInputs').html(inputsHtml);
}

// Validate
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addPhieuMuonForm');
    const ngayMuonInput = document.getElementById('ngayMuon');

    // Validate ngày mượn (không cho phép nhỏ hơn ngày hiện tại)
    function restrictDateInput(input) {
        input.addEventListener('input', function() {
            const value = this.value;
            const date = new Date(value);
            const currentDate = new Date();
            if (date < currentDate.setHours(0, 0, 0, 0)) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
    }

    restrictDateInput(ngayMuonInput);

    form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
    });
});