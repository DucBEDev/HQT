const danhSachDocGia = [];
let currentMaDG = 0;

async function getNextMaDG() {
    try {
        if (danhSachDocGia.length == 0) {
            const response = await fetch(`/Library/admin/reader/next-id`);
            const data = await response.json();
            if (data.success) {
                currentMaDG = data.nextId;
                document.getElementById('maDG').value = currentMaDG;
            }
        } 
        else {
            currentMaDG = parseInt(danhSachDocGia[danhSachDocGia.length - 1].maDG) + 1;
            document.getElementById('maDG').value = currentMaDG;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Không thể lấy mã độc giả tiếp theo!');
    }
}

getNextMaDG();

document.getElementById('btnThem').addEventListener('click', function() {
    const form = document.getElementById('addDocGiaForm');
    const dienThoaiInput = document.getElementById('dienThoai');
    const soCMNDInput = document.getElementById('soCMND');

    // Kiểm tra độ dài số điện thoại và số CCCD
    const dienThoaiValue = dienThoaiInput.value;
    const soCMNDValue = soCMNDInput.value;

    if (dienThoaiValue.length !== 10) {
        alert('Số điện thoại phải đúng 10 chữ số!');
        dienThoaiInput.classList.add('is-invalid');
        return;
    }

    if (soCMNDValue.length !== 12) {
        alert('Số CCCD phải đúng 12 chữ số!');
        soCMNDInput.classList.add('is-invalid');
        return;
    }

    if (form.checkValidity()) {
        const docGia = {
            maDG: document.getElementById('maDG').value,
            hoDG: document.getElementById('hoDG').value,
            tenDG: document.getElementById('tenDG').value,
            emailDG: document.getElementById('emailDG').value,
            soCMND: soCMNDValue,
            gioiTinh: document.getElementById('gioiTinh').value,
            ngaySinh: document.getElementById('ngaySinh').value,
            diaChiDG: document.getElementById('diaChiDG').value,
            dienThoai: dienThoaiValue,
            ngayLamThe: document.getElementById('ngayLamThe').value,
            ngayHetHan: document.getElementById('ngayHetHan').value,
            hoatDong: document.getElementById('hoatDong').checked ? 1 : 0
        };

        if (danhSachDocGia.some(dg => dg.maDG === docGia.maDG)) {
            alert('Mã độc giả đã tồn tại trong danh sách!');
            return;
        }

        danhSachDocGia.push(docGia);
        hienThiDanhSachDocGia();
        form.reset();
        getNextMaDG();
    } else {
        form.reportValidity();
    }
});

document.getElementById('btnGhi').addEventListener('click', function() {
    if (danhSachDocGia.length === 0) {
        alert('Vui lòng thêm ít nhất một độc giả trước khi ghi!');
        return;
    }

    fetch(`/Library/admin/reader/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(danhSachDocGia)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Ghi dữ liệu thành công!');
            window.location.href = `/Library/admin/reader`;
        } else {
            alert('Có lỗi xảy ra: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi ghi dữ liệu!');
    });
});

function xoaDocGia(maDG) {
    if (confirm('Bạn có chắc chắn muốn xóa độc giả này khỏi danh sách?')) {
        danhSachDocGia = danhSachDocGia.filter(dg => dg.maDG !== maDG);
        hienThiDanhSachDocGia();
    }
}

function hienThiDanhSachDocGia() {
    const tbody = document.getElementById('danhSachDocGia');
    tbody.innerHTML = '';

    danhSachDocGia.forEach(dg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dg.maDG}</td>
            <td>${dg.hoDG} ${dg.tenDG}</td>
            <td>${dg.emailDG}</td>
            <td>${dg.soCMND}</td>
            <td>${dg.gioiTinh}</td>
            <td>${new Date(dg.ngaySinh).toLocaleDateString('vi-VN')}</td>
            <td>${dg.diaChiDG}</td>
            <td>${dg.dienThoai}</td>
            <td>${new Date(dg.ngayLamThe).toLocaleDateString('vi-VN')}</td>
            <td>${new Date(dg.ngayHetHan).toLocaleDateString('vi-VN')}</td>
            <td>${dg.hoatDong ? 'Hoạt động' : 'Không hoạt động'}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="xoaDocGia('${dg.maDG}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Validate
function restrictEmailInput(input) {
    input.addEventListener('input', function(e) {
        const value = this.value;
        const filteredValue = value.replace(/\s/g, '');
        if (value !== filteredValue) {
            this.value = filteredValue;
        }
    });
}

function restrictDateInput(input, isBirthDate = false) {
    input.addEventListener('input', function(e) {
        const value = this.value;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (value && !dateRegex.test(value)) {
            this.classList.add('is-invalid');
        } else {
            const date = new Date(value);
            const currentDate = new Date();
            if (isNaN(date.getTime())) {
                this.classList.add('is-invalid');
            } else if (isBirthDate && date > currentDate) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        }
    });
}

function validateCardDates(startInput, endInput) {
    startInput.addEventListener('input', validateCardDateFields);
    endInput.addEventListener('input', validateCardDateFields);

    function validateCardDateFields() {
        const startDate = startInput.value;
        const endDate = endInput.value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const currentDate = new Date();

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                startInput.classList.add('is-invalid');
                endInput.classList.add('is-invalid');
            } else if (start < currentDate || end <= start) {
                startInput.classList.add('is-invalid');
                endInput.classList.add('is-invalid');
            } else {
                startInput.classList.remove('is-invalid');
                startInput.classList.add('is-valid');
                endInput.classList.remove('is-invalid');
                endInput.classList.add('is-valid');
            }
        }
    }
}

// Áp dụng các hàm chặn nhập vào các input
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addDocGiaForm');
    const hoDGInput = document.getElementById('hoDG');
    const tenDGInput = document.getElementById('tenDG');
    const emailDGInput = document.getElementById('emailDG');
    const dienThoaiInput = document.getElementById('dienThoai');
    const soCMNDInput = document.getElementById('soCMND');
    const diaChiDGInput = document.getElementById('diaChiDG');
    const ngaySinhInput = document.getElementById('ngaySinh');
    const ngayLamTheInput = document.getElementById('ngayLamThe');
    const ngayHetHanInput = document.getElementById('ngayHetHan');

    // Chặn nhập số và ký tự đặc biệt trong ô tên
    window.restrictNameInput(hoDGInput);
    window.restrictNameInput(tenDGInput);

    // Chặn nhập chữ và ký tự đặc biệt trong ô số điện thoại
    window.restrictPhoneInput(dienThoaiInput);

    // Chặn nhập chữ và ký tự đặc biệt trong ô số CCCD
    window.restrictCitizenIdInput(soCMNDInput);

    // Chặn nhập ký tự đặc biệt nguy hiểm trong ô địa chỉ
    window.restrictSpecialCharInput(diaChiDGInput);

    // Chặn nhập khoảng trắng trong ô email
    restrictEmailInput(emailDGInput);

    // Validate ngày sinh (không cho phép lớn hơn ngày hiện tại)
    restrictDateInput(ngaySinhInput, true);

    // Validate ngày làm thẻ và ngày hết hạn
    validateCardDates(ngayLamTheInput, ngayHetHanInput);

    // Form submission validation
    form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
    });
});
// End Validate

