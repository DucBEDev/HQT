document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editStaffForm');
    const hoTenTGInput = document.getElementById('hoTenTG');
    const diaChiTGInput = document.getElementById('diaChiTG');
    const dienThoaiTGInput = document.getElementById('dienThoaiTG');

    // Chặn nhập số và ký tự đặc biệt trong ô họ và tên
    window.restrictNameInput(hoTenTGInput);

    window.restrictSpecialCharInput(diaChiTGInput);

    // Kiểm tra định dạng  điện thoại 
    window.restrictNumberInput(dienThoaiTGInput, 10);

    // Form submission validation
    form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
    });
});

document.getElementById('btnLuu').addEventListener('click', function() {
    const maTGInput = document.getElementById('maTacGia');
    const hoTenTGInput = document.getElementById('hoTenTG');
    const diaChiTGInput = document.getElementById('diaChiTG');
    const dienThoaiTGInput = document.getElementById('dienThoaiTG');

    const maTGValue = maTGInput.value.trim();
    const hoTenTGValue = hoTenTGInput.value.trim();    
    const diaChiTGValue = diaChiTGInput.value.trim();
    const dienThoaiTGValue = dienThoaiTGInput.value.trim();

    // Kiểm tra các trường bắt buộc
    if (hoTenTGValue.length === 0) {
        alert('Họ và tên tác giả không được để trống!');
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

    const tacGia = {
        maTacGia: maTGValue,
        hoTenTG: hoTenTGValue,
        diaChiTG: diaChiTGValue,
        dienThoaiTG: dienThoaiTGValue
    };

    fetch(`/Library/admin/author/edit/${maTGValue}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(tacGia)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Sửa thông tin thành công!');
            window.location.href = `/Library/admin/author`;
        } else {
            alert('Có lỗi xảy ra: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi sửa dữ liệu!');
    });
});