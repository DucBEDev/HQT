let danhSachNhanVien = [];
let currentMaNV = 0;

async function getNextMaNV() {
    try {
        if (danhSachNhanVien.length === 0) {
            const response = await fetch(`/Library/admin/staff/next-id`);
            const data = await response.json();
            if (data.success) {
                currentMaNV = data.nextId;
                document.getElementById('maNV').value = currentMaNV;
            }
        } else {
            const currentId = parseInt(danhSachNhanVien[danhSachNhanVien.length - 1].maNV);
            currentMaNV = currentId + 1;
            document.getElementById('maNV').value = currentMaNV;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Không thể lấy mã nhân viên tiếp theo!');
    }
}

getNextMaNV();

document.getElementById('btnThem').addEventListener('click', function() {
    const form = document.getElementById('addStaffForm');
    const hoNVInput = document.getElementById('hoNV');
    const tenNVInput = document.getElementById('tenNV');
    const diaChiInput = document.getElementById('diaChi');
    const dienThoaiInput = document.getElementById('dienThoai');
    const gioiTinhInput = document.getElementById('gioiTinh');
    const emailInput = document.getElementById('email');

    const hoNVValue = hoNVInput.value.trim();
    const tenNVValue = tenNVInput.value.trim();
    const diaChiValue = diaChiInput.value.trim();
    const dienThoaiValue = dienThoaiInput.value.trim();
    const gioiTinhValue = gioiTinhInput.value;
    const emailValue = emailInput.value.trim();

    // Kiểm tra các trường bắt buộc
    if (hoNVValue.length === 0) {
        alert('Họ nhân viên không được để trống!');
        hoNVInput.classList.add('is-invalid');
        return;
    }
    if (tenNVValue.length === 0) {
        alert('Tên nhân viên không được để trống!');
        tenNVInput.classList.add('is-invalid');
        return;
    }
    if (diaChiValue.length === 0) {
        alert('Địa chỉ không được để trống!');
        diaChiInput.classList.add('is-invalid');
        return;
    }
    if (dienThoaiValue.length === 0) {
        alert('Điện thoại không được để trống!');
        dienThoaiInput.classList.add('is-invalid');
        return;
    }
    if (!gioiTinhValue) {
        alert('Vui lòng chọn giới tính!');
        gioiTinhInput.classList.add('is-invalid');
        return;
    }
    if (emailValue.length === 0) {
        alert('Email không được để trống!');
        emailInput.classList.add('is-invalid');
        return;
    }

    if (form.checkValidity()) {
        const nhanVien = {
            maNV: document.getElementById('maNV').value,
            hoNV: hoNVValue,
            tenNV: tenNVValue,
            diaChi: diaChiValue,
            dienThoai: dienThoaiValue,
            gioiTinh: gioiTinhValue === '1', // Chuyển thành boolean
            email: emailValue
        };

        if (danhSachNhanVien.some(nv => nv.maNV === nhanVien.maNV)) {
            alert('Mã nhân viên đã tồn tại trong danh sách!');
            return;
        }

        danhSachNhanVien.push(nhanVien);
        hienThiDanhSachNhanVien();
        form.reset();
        getNextMaNV();
    } else {
        form.reportValidity();
    }
});

document.getElementById('btnGhi').addEventListener('click', function() {
    if (danhSachNhanVien.length === 0) {
        alert('Vui lòng thêm ít nhất một nhân viên trước khi ghi!');
        return;
    }

    fetch(`/Library/admin/staff/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(danhSachNhanVien)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Ghi dữ liệu thành công!');
            window.location.href = `/Library/admin/staff`;
        } else {
            alert('Có lỗi xảy ra: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi ghi dữ liệu!');
    });
});

function xoaNhanVien(maNV) {
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này khỏi danh sách?')) {
        danhSachNhanVien = danhSachNhanVien.filter(nv => nv.maNV !== maNV);
        hienThiDanhSachNhanVien();
        getNextMaNV();
    }
}

function hienThiDanhSachNhanVien() {
    const tbody = document.getElementById('danhSachNhanVien');
    tbody.innerHTML = '';

    danhSachNhanVien.forEach(nv => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${nv.maNV}</td>
            <td>${nv.hoNV} ${nv.tenNV}</td>
            <td>${nv.diaChi}</td>
            <td>${nv.dienThoai}</td>
            <td>${nv.gioiTinh ? 'Nam' : 'Nữ'}</td>
            <td>${nv.email}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="xoaNhanVien('${nv.maNV}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Validate
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addStaffForm');
    const hoNVInput = document.getElementById('hoNV');
    const tenNVInput = document.getElementById('tenNV');
    const dienThoaiInput = document.getElementById('dienThoai');
    const emailInput = document.getElementById('email');

    // Chặn nhập số và ký tự đặc biệt cho họ và tên
    window.restrictNameInput(hoNVInput);
    window.restrictNameInput(tenNVInput);

    // Kiểm tra định dạng email và điện thoại (giả định validation.js có các hàm này)
    dienThoaiInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, ''); // Chỉ cho phép số
    });

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