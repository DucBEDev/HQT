let selectedBooks = [];

async function getNextMaPhieu() {
    try {
        const response = await fetch(`/Library/admin/phieumuon/next-id`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('maPhieu').value = data.nextId;
        }
    }
    catch (error) {
        console.error('Error:', error);
        alert('Không thể lấy mã phiếu mượn tiếp theo!');
    }
}

getNextMaPhieu();

$(document).ready(function() {
    // Tìm kiếm sách
    $('#sachSearch').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('.product-detail-item').each(function() {
            const maSach = $(this).data('ma-sach').toString().toLowerCase();
            const tenSach = $(this).data('ten-sach').toLowerCase();
            if (maSach.includes(searchTerm) || tenSach.includes(searchTerm)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
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
});

// Hàm thêm sách vào danh sách đã chọn
function addBook(sach) {
    // Kiểm tra giới hạn 3 sách
    if (selectedBooks.length >= 3) {
        alert('Bạn chỉ có thể chọn tối đa 3 cuốn sách!');
        return;
    }

    if (!selectedBooks.some(b => b.maSach === sach.maSach)) {
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