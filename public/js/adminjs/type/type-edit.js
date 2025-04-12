document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editTypeForm');
    const tenTLInput = document.getElementById('tenTL');

    // Chặn nhập số và ký tự đặc biệt trong ô tên thể loại
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