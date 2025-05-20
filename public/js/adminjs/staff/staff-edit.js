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


    // Form submission validation
    form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
    });
});