let danhSachTacGia = [];
let currentMaTacGia = 0;

async function getNextMaTacGia() {
    try {
        if (danhSachTacGia.length === 0) {
            const response = await fetch(`/Library/admin/author/next-id`);
            const data = await response.json();
            if (data.success) {
                currentMaTacGia = data.nextId;
                document.getElementById('maTacGia').value = currentMaTacGia;
            }
        } else {
            const currentId = parseInt(danhSachTacGia[danhSachTacGia.length - 1].maTacGia);
            currentMaTacGia = currentId + 1;
            document.getElementById('maTacGia').value = currentMaTacGia;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Không thể lấy mã tác giả tiếp theo!');
    }
}

getNextMaTacGia();

document.getElementById('btnThem').addEventListener('click', function() {
    const form = document.getElementById('addAuthorForm');
    const hoTenTGInput = document.getElementById('hoTenTG');
    const diaChiTGInput = document.getElementById('diaChiTG');
    const dienThoaiTGInput = document.getElementById('dienThoaiTG');

    const hoTenTGValue = hoTenTGInput.value.trim();
    const diaChiTGValue = diaChiTGInput.value.trim();
    const dienThoaiTGValue = dienThoaiTGInput.value.trim();

    // Kiểm tra các trường bắt buộc
    if (hoTenTGValue.length === 0) {
        alert('Họ tên tác giả không được để trống!');
        hoTenTGInput.classList.add('is-invalid');
        return;
    }
    if (diaChiTGValue.length === 0) {
        alert('Địa chỉ không được để trống!');
        diaChiTGInput.classList.add('is-invalid');
        return;
    }
    if (dienThoaiTGValue.length === 0) {
        alert('Điện thoại không được để trống!');
        dienThoaiTGInput.classList.add('is-invalid');
        return;
    }

    if (form.checkValidity()) {
        const tacGia = {
            maTacGia: document.getElementById('maTacGia').value,
            hoTenTG: hoTenTGValue,
            diaChiTG: diaChiTGValue,
            dienThoaiTG: dienThoaiTGValue
        };

        if (danhSachTacGia.some(tg => tg.maTacGia === tacGia.maTacGia)) {
            alert('Mã tác giả đã tồn tại trong danh sách!');
            return;
        }

        danhSachTacGia.push(tacGia);
        hienThiDanhSachTacGia();
        form.reset();
        getNextMaTacGia();
    } else {
        form.reportValidity();
    }
});

document.getElementById('btnGhi').addEventListener('click', function() {
    if (danhSachTacGia.length === 0) {
        alert('Vui lòng thêm ít nhất một tác giả trước khi ghi!');
        return;
    }

    fetch(`/Library/admin/author/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(danhSachTacGia)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Ghi dữ liệu thành công!');
            window.location.href = `/Library/admin/author`;
        } else {
            alert('Có lỗi xảy ra: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi ghi dữ liệu!');
    });
});

function xoaTacGia(maTacGia) {
    if (confirm('Bạn có chắc chắn muốn xóa tác giả này khỏi danh sách?')) {
        danhSachTacGia = danhSachTacGia.filter(tg => tg.maTacGia !== maTacGia);
        hienThiDanhSachTacGia();
        getNextMaTacGia();
    }
}

function hienThiDanhSachTacGia() {
    const tbody = document.getElementById('danhSachTacGia');
    tbody.innerHTML = '';

    danhSachTacGia.forEach(tg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${tg.maTacGia}</td>
            <td>${tg.hoTenTG}</td>
            <td>${tg.diaChiTG}</td>
            <td>${tg.dienThoaiTG}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="xoaTacGia('${tg.maTacGia}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Validate
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addAuthorForm');
    const hoTenTGInput = document.getElementById('hoTenTG');
    const dienThoaiTGInput = document.getElementById('dienThoaiTG');

    // Chặn nhập số và ký tự đặc biệt cho họ tên
    window.restrictNameInput(hoTenTGInput);

    // Kiểm tra định dạng điện thoại (giả định validation.js có hàm này)
    dienThoaiTGInput.addEventListener('input', function() {
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