let danhSachDocGia = [];
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
    const hoDGInput = document.getElementById('hoDG');
    const tenDGInput = document.getElementById('tenDG');
    const emailDGInput = document.getElementById('emailDG');
    const soCMNDInput = document.getElementById('soCMND');
    const gioiTinhInput = document.getElementById('gioiTinh');
    const ngaySinhInput = document.getElementById('ngaySinh');
    const diaChiDGInput = document.getElementById('diaChiDG');
    const dienThoaiInput = document.getElementById('dienThoai');
    const ngayLamTheInput = document.getElementById('ngayLamThe');
    const ngayHetHanInput = document.getElementById('ngayHetHan');

    // Lấy giá trị
    const hoDGValue = hoDGInput.value.trim();
    const tenDGValue = tenDGInput.value.trim();
    const emailDGValue = emailDGInput.value.trim();
    const soCMNDValue = soCMNDInput.value.trim();
    const gioiTinhValue = gioiTinhInput.value;
    const ngaySinhValue = ngaySinhInput.value;
    const diaChiDGValue = diaChiDGInput.value.trim();
    const dienThoaiValue = dienThoaiInput.value.trim();
    const ngayLamTheValue = ngayLamTheInput.value;
    const ngayHetHanValue = ngayHetHanInput.value;

    if (!hoDGValue) {
        alert('Họ độc giả không được để trống!');
        hoDGInput.classList.add('is-invalid');
        return;
    }

    if (!tenDGValue) {
        alert('Tên độc giả không được để trống!');
        tenDGInput.classList.add('is-invalid');
        return;
    }

    if (!emailDGValue) {
        alert('Email không được để trống!');
        emailDGInput.classList.add('is-invalid');
        return;
    }

    if (!soCMNDValue) {
        alert('Số CCCD không được để trống!');
        soCMNDInput.classList.add('is-invalid');
        return;
    }

    if (soCMNDValue.length !== 12) {
        alert('Số CCCD phải đúng 12 chữ số!');
        soCMNDInput.classList.add('is-invalid');
        return;
    }

    if (!gioiTinhValue) {
        alert('Giới tính không được để trống!');
        gioiTinhInput.classList.add('is-invalid');
        return;
    }

    if (!ngaySinhValue) {
        alert('Ngày sinh không được để trống!');
        ngaySinhInput.classList.add('is-invalid');
        return;
    }

    if (!diaChiDGValue) {
        alert('Địa chỉ không được để trống!');
        diaChiDGInput.classList.add('is-invalid');
        return;
    }

    if (!dienThoaiValue) {
        alert('Số điện thoại không được để trống!');
        dienThoaiInput.classList.add('is-invalid');
        return;
    }

    if (dienThoaiValue.length !== 10) {
        alert('Số điện thoại phải đúng 10 chữ số!');
        dienThoaiInput.classList.add('is-invalid');
        return;
    }

    if (!ngayLamTheValue) {
        alert('Ngày làm thẻ không được để trống!');
        ngayLamTheInput.classList.add('is-invalid');
        return;
    }

    if (!ngayHetHanValue) {
        alert('Ngày hết hạn không được để trống!');
        ngayHetHanInput.classList.add('is-invalid');
        return;
    }

    if (form.checkValidity()) {
        const docGia = {
            maDG: document.getElementById('maDG').value,
            hoDG: hoDGValue,
            tenDG: tenDGValue,
            emailDG: emailDGValue,
            soCMND: soCMNDValue,
            gioiTinh: gioiTinhValue,
            ngaySinh: ngaySinhValue,
            diaChiDG: diaChiDGValue,
            dienThoai: dienThoaiValue,
            ngayLamThe: ngayLamTheValue,
            ngayHetHan: ngayHetHanValue,
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
        getNextMaDG();
    }
}

function hienThiDanhSachDocGia() {
    const tbody = document.getElementById('danhSachDocGia');
    tbody.innerHTML = '';

    danhSachDocGia.forEach(dg => {
        const tr = document.createElement('tr');
        console.log(dg.ngayHetHan)
        tr.innerHTML = `
            <td>${dg.maDG}</td>
            <td>${dg.hoDG} ${dg.tenDG}</td>
            <td>${dg.emailDG}</td>
            <td>${dg.soCMND}</td>
            <td>${dg.gioiTinh}</td>
            <td>${dg.ngaySinh}</td>
            <td>${dg.diaChiDG}</td>
            <td>${dg.dienThoai}</td>
            <td>${dg.ngayLamThe}</td>
            <td>${dg.ngayHetHan}</td>
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
// Áp dụng các hàm chặn nhập vào các input
function validateCardDates(startInput, endInput) {
    startInput.addEventListener('input', validateCardDateFields);
    endInput.addEventListener('input', validateCardDateFields);

    function parseDate(dateStr) {
        const [day, month, year] = dateStr.split("/").map(Number);
        return new Date(year, month - 1, day);
    }

    function validateCardDateFields() {
        const startDate = startInput.value;
        const endDate = endInput.value;

        if (startDate && endDate) {
            const start = parseDate(startDate);
            const end = parseDate(endDate);
            const currentDate = new Date();

            if (start < currentDate || end <= start) {
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
    window.restrictNumberInput(dienThoaiInput, 10);

    // Chặn nhập chữ và ký tự đặc biệt trong ô số CCCD
    window.restrictNumberInput(soCMNDInput, 12);

    // Chặn nhập ký tự đặc biệt nguy hiểm trong ô địa chỉ
    window.restrictSpecialCharInput(diaChiDGInput);

    // Chặn nhập khoảng trắng trong ô email
    window.restrictEmailInput(emailDGInput);

    window.restrictDateInput(ngaySinhInput, isBirthDay = true);

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

