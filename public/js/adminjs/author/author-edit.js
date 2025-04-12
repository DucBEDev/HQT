document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editStaffForm');
    const hoNVInput = document.getElementById('hoNV');
    const tenNVInput = document.getElementById('tenNV');
    const dienThoaiInput = document.getElementById('dienThoai');
    const gioiTinhInput = document.getElementById('gioiTinh');
    const emailInput = document.getElementById('email');

    // Chặn nhập số và ký tự đặc biệt trong ô họ và tên
    window.restrictNameInput(hoNVInput);
    window.restrictNameInput(tenNVInput);

    // Chỉ cho phép số trong ô điện thoại
    dienThoaiInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    // Form submission validation
    form.addEventListener('submit', function(event) {
        // Kiểm tra các trường bắt buộc
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }

        // Kiểm tra riêng trường gioiTinh
        if (!gioiTinhInput.value) {
            gioiTinhInput.classList.add('is-invalid');
            event.preventDefault();
            event.stopPropagation();
        } else {
            gioiTinhInput.classList.remove('is-invalid');
        }

        form.classList.add('was-validated');
    });
});