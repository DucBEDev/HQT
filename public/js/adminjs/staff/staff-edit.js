document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editStaffForm');
    const hoNVInput = document.getElementById('hoNV');
    const tenNVInput = document.getElementById('tenNV');
    const diaChiInput = document.getElementById('diaChi');
    const dienThoaiInput = document.getElementById('dienThoai');
    const emailInput = document.getElementById('email');

    // Chặn nhập số và ký tự đặc biệt trong ô họ và tên
    window.restrictNameInput(hoNVInput);
    window.restrictNameInput(tenNVInput);

    window.restrictSpecialCharInput(diaChiInput);

    // Kiểm tra định dạng email và điện thoại
    window.restrictNumberInput(dienThoaiInput, 10);
    window.restrictEmailInput(emailInput);

    // Form submission validation and handling
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        const maNVInput = document.getElementById('maNV');
        const hoNVValue = hoNVInput.value.trim();
        const tenNVValue = tenNVInput.value.trim();
        const diaChiValue = diaChiInput.value.trim();
        const dienThoaiValue = dienThoaiInput.value.trim();
        const gioiTinhInput = document.getElementById('gioiTinh');
        const gioiTinhValue = gioiTinhInput.value;
        const emailValue = emailInput.value.trim();

        // Kiểm tra các trường bắt buộc
        if (hoNVValue.length === 0 || tenNVValue.length === 0) {
            alert('Họ và tên nhân viên không được để trống!');
            hoNVInput.classList.add('is-invalid');
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
                maNV: maNVInput.value, // Using 'id' for consistency with hidden ID system
                hoNV: hoNVValue,
                tenNV: tenNVValue,
                diaChi: diaChiValue,
                dienThoai: dienThoaiValue,
                gioiTinh: gioiTinhValue === '1', // Chuyển thành boolean
                email: emailValue + "@gmail.com"
            };

            fetch(`/Library/admin/staff/edit/${maNVInput.value}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(nhanVien)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Sửa thông tin thành công!');
                    window.location.href = `/Library/admin/staff`;
                } else {
                    alert('Có lỗi xảy ra: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Có lỗi xảy ra khi sửa dữ liệu!');
            });
        } else {
            form.classList.add('was-validated');
            form.reportValidity();
        }
    });
});