const danhSachTheLoai = [];
let currentMaTL = 0;

async function getNextMaTL() {
    try {
        if (danhSachTheLoai.length == 0) {
            const response = await fetch(`/Library/admin/type/next-id`);
            const data = await response.json();
            if (data.success) {
                currentMaTL = data.nextId;
                document.getElementById('maTL').value = currentMaTL;
            }
        } 
        else {
            const currentId = parseInt(danhSachTheLoai[danhSachTheLoai.length - 1].maTL.substring(2));
            currentMaTL = `TL${(currentId + 1).toString().padStart(3, '0')}`;
            document.getElementById('maTL').value = currentMaTL;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Không thể lấy mã thể loại tiếp theo!');
    }
}

getNextMaTL();

document.getElementById('btnThem').addEventListener('click', function() {
    const form = document.getElementById('addTypeForm');
    const tenTLInput = document.getElementById('tenTL');

    // Kiểm tra độ dài số điện thoại và số CCCD
    const tenTLValue = tenTLInput.value;

    if (tenTLValue.length == 0) {
        alert('Tên thể loại không được để trống!');
        tenTLInput.classList.add('is-invalid');
        return;
    }

    if (form.checkValidity()) {
        const theLoai = {
            maTL: document.getElementById('maTL').value,
            tenTL: document.getElementById('tenTL').value
        };

        if (danhSachTheLoai.some(tl => tl.maTL === theLoai.maTL)) {
            alert('Mã thể loại đã tồn tại trong danh sách!');
            return;
        }

        danhSachTheLoai.push(theLoai);
        hienThiDanhSachTheLoai();
        form.reset();
        getNextMaTL();
    } else {
        form.reportValidity();
    }
});

document.getElementById('btnGhi').addEventListener('click', function() {
    if (danhSachTheLoai.length === 0) {
        alert('Vui lòng thêm ít nhất một thể loại trước khi ghi!');
        return;
    }

    fetch(`/Library/admin/type/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(danhSachTheLoai)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Ghi dữ liệu thành công!');
            window.location.href = `/Library/admin/type`;
        } else {
            alert('Có lỗi xảy ra: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi ghi dữ liệu!');
    });
});

function xoaTheLoai(maTL) {
    if (confirm('Bạn có chắc chắn muốn xóa thể loại này khỏi danh sách?')) {
        danhSachTheLoai = danhSachTheLoai.filter(tl => tl.maTL !== maTL);
        hienThiDanhSachTheLoai();
    }
}

function hienThiDanhSachTheLoai() {
    const tbody = document.getElementById('danhSachTheLoai');
    tbody.innerHTML = '';

    danhSachTheLoai.forEach(tl => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${tl.maTL}</td>
            <td>${tl.tenTL}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="xoaTheLoai('${tl.maTL}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Validate
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addTypeForm');
    const tenTLInput = document.getElementById('tenTL');
    console.log(tenTLInput);

    // Chặn nhập số và ký tự đặc biệt trong ô 
    window.restrictNameInput(tenTLInput);

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

