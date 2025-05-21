document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editStaffForm');
    const tenTLInput = document.getElementById('tenTL');

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

document.getElementById('btnLuu').addEventListener('click', function() {
    const maTLInput = document.getElementById('maTL');
    const tenTLInput = document.getElementById('tenTL');

    const maTLValue = maTLInput.value.trim();
    const tenTLValue = tenTLInput.value.trim();

    // Kiểm tra các trường bắt buộc
    if (tenTLValue.length === 0) {
        alert('Tên thể loại không được để trống!');
        tenTLInput.classList.add('is-invalid');
        return;
    }

    const theLoai = {
        maTL: maTLValue,
        tenTL: tenTLValue,
    };

    fetch(`/Library/admin/type/edit/${maTLValue}`, {
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
});