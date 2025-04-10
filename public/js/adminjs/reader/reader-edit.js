// Validate functions (tái sử dụng từ reader.js)
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

// Áp dụng validation
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editDocGiaForm');
    const hoDGInput = document.getElementById('hoDG');
    const tenDGInput = document.getElementById('tenDG');
    const emailDGInput = document.getElementById('emailDG');
    const dienThoaiInput = document.getElementById('dienThoai');
    const soCMNDInput = document.getElementById('soCMND');
    const diaChiDGInput = document.getElementById('diaChiDG');
    const ngaySinhInput = document.getElementById('ngaySinh');
    const ngayLamTheInput = document.getElementById('ngayLamThe');
    const ngayHetHanInput = document.getElementById('ngayHetHan');
    const gioiTinhInput = document.getElementById('gioiTinh');

    // Chặn nhập số và ký tự đặc biệt trong ô họ và tên
    window.restrictNameInput(hoDGInput);
    window.restrictNameInput(tenDGInput);

    // Chặn nhập chữ và ký tự đặc biệt trong ô số điện thoại và CCCD
    window.restrictPhoneInput(dienThoaiInput);
    window.restrictCitizenIdInput(soCMNDInput);

    // Chặn nhập ký tự đặc biệt nguy hiểm trong ô địa chỉ
    window.restrictSpecialCharInput(diaChiDGInput);

    // Chặn nhập khoảng trắng trong ô email
    restrictEmailInput(emailDGInput);

    // Validate ngày sinh (không lớn hơn ngày hiện tại)
    restrictDateInput(ngaySinhInput, true);

    // Validate ngày làm thẻ và ngày hết hạn
    validateCardDates(ngayLamTheInput, ngayHetHanInput);

    // Form submission validation
    form.addEventListener('submit', function(event) {
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