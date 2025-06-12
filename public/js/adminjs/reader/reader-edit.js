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

    // Form submission validation and handling
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        const maDGInput = document.getElementById('maDG');
        const hoDGValue = hoDGInput.value.trim();
        const tenDGValue = tenDGInput.value.trim();
        const emailDGValue = emailDGInput.value.trim();
        const soCMNDValue = soCMNDInput.value.trim();
        const gioiTinhValue = document.getElementById('gioiTinh').value;
        const ngaySinhValue = ngaySinhInput.value;
        const diaChiDGValue = diaChiDGInput.value.trim();
        const dienThoaiValue = dienThoaiInput.value.trim();
        const ngayLamTheValue = ngayLamTheInput.value;
        const ngayHetHanValue = ngayHetHanInput.value;

        // Kiểm tra các trường bắt buộc
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
            document.getElementById('gioiTinh').classList.add('is-invalid');
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
                maDG: maDGInput.value, // Using 'id' for consistency with hidden ID system
                hoDG: hoDGValue,
                tenDG: tenDGValue,
                emailDG: emailDGValue + "@gmail.com",
                soCMND: soCMNDValue,
                gioiTinh: gioiTinhValue === "true",
                ngaySinh: ngaySinhValue,
                diaChiDG: diaChiDGValue,
                dienThoai: dienThoaiValue,
                ngayLamThe: ngayLamTheValue,
                ngayHetHan: ngayHetHanValue,
                hoatDong: document.getElementById('hoatDong').checked ? 1 : 0
            };

            fetch(`/Library/admin/reader/edit/${maDGInput.value}?_method=POST`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(docGia)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Sửa thông tin thành công!');
                    window.location.href = `/Library/admin/reader`;
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