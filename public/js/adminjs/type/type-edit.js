document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editTypeForm'); // Corrected form ID
    const tenTLInput = document.getElementById('tenTL');

    // Chặn nhập số và ký tự đặc biệt trong ô tên thể loại
    window.restrictNameInput(tenTLInput);

    // Form submission validation and handling
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        const maTLInput = document.getElementById('maTL');
        const tenTLValue = tenTLInput.value.trim();

        // Kiểm tra các trường bắt buộc
        if (tenTLValue.length === 0) {
            alert('Tên thể loại không được để trống!');
            tenTLInput.classList.add('is-invalid');
            return;
        }

        if (form.checkValidity()) {
            const theLoai = {
                maTL: maTLInput.value, // Using 'id' for consistency with hidden ID system
                tenTL: tenTLValue
            };

            fetch(`/Library/admin/type/edit/${maTLInput.value}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(theLoai)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Sửa thông tin thành công!');
                    window.location.href = `/Library/admin/type`;
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