$(document).ready(function() {
    // Dữ liệu từ server
    const empList = JSON.parse(document.querySelector('#empList').getAttribute('data-emp'));
    const dgList = JSON.parse(document.querySelector('#dgList').getAttribute('data-dg'));
    
    // Toggle password visibility
    function togglePassword(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
    
    $('#toggleNewPassword').click(function() {
        togglePassword('newPassword', 'toggleNewPassword');
    });
    
    $('#toggleConfirmPassword').click(function() {
        togglePassword('confirmPassword', 'toggleConfirmPassword');
    });
    
    // Function để cập nhật dropdown
    function updateUserDropdown() {
        const userType = $('input[name="userType"]:checked').val();
        const $select = $('#userSelect');
        const $label = $('#userTypeLabel');
        
        // Clear existing options
        $select.empty();
        $select.append('<option value="" disabled selected>-- Chọn mã --</option>');
        
        if (userType === 'librarian') {
            $label.text('Mã thủ thư:');
            empList.forEach(function(emp) {
                $select.append(`<option value="${emp.maNV}">${emp.maNV} - ${emp.hoNV + " " + emp.tenNV || 'N/A'}</option>`);
            });
        } else if (userType === 'reader') {
            $label.text('Mã độc giả:');
            dgList.forEach(function(dg) {
                $select.append(`<option value="${dg.maDG}">${dg.maDG} - ${dg.hoDG + " " + dg.tenDG || 'N/A'}</option>`);
            });
        }
    }
    
    // Event handler khi thay đổi radio button
    $('input[name="userType"]').change(function() {
        updateUserDropdown();
        // Reset validation state
        $('#userSelect').removeClass('is-invalid is-valid');
    });
    
    // Khởi tạo dropdown lần đầu
    updateUserDropdown();
    
    // Validation cho confirm password
    function validatePasswords() {
        const newPassword = $('#newPassword').val();
        const confirmPassword = $('#confirmPassword').val();
        const $confirmInput = $('#confirmPassword');
        const $errorDiv = $('#confirmPasswordError');
        
        if (confirmPassword && newPassword !== confirmPassword) {
            $confirmInput.addClass('is-invalid').removeClass('is-valid');
            $errorDiv.text('Mật khẩu xác nhận không khớp');
            return false;
        } else if (confirmPassword) {
            $confirmInput.addClass('is-valid').removeClass('is-invalid');
            return true;
        }
        return true;
    }
    
    // Event handlers cho validation
    $('#confirmPassword, #newPassword').on('input', function() {
        validatePasswords();
    });
    
    // Form submission validation
    $('#changePasswordForm').on('submit', function(e) {
        let isValid = true;
        
        // Validate user selection
        if (!$('#userSelect').val()) {
            $('#userSelect').addClass('is-invalid');
            isValid = false;
        } else {
            $('#userSelect').removeClass('is-invalid').addClass('is-valid');
        }
        
        // Validate new password
        const newPassword = $('#newPassword').val();
        if (!newPassword || newPassword.length < 6) {
            $('#newPassword').addClass('is-invalid');
            isValid = false;
        } else {
            $('#newPassword').removeClass('is-invalid').addClass('is-valid');
        }
        
        // Validate password confirmation
        if (!validatePasswords()) {
            isValid = false;
        }
        
        if (!isValid) {
            e.preventDefault();
            // Scroll to first error
            const firstError = $('.is-invalid').first();
            if (firstError.length) {
                $('html, body').animate({
                    scrollTop: firstError.offset().top - 100
                }, 300);
            }
        }
    });
    
    // Real-time validation feedback
    $('#userSelect').change(function() {
        if ($(this).val()) {
            $(this).removeClass('is-invalid').addClass('is-valid');
        } else {
            $(this).removeClass('is-valid').addClass('is-invalid');
        }
    });
    
    $('#newPassword').on('input', function() {
        const password = $(this).val();
        if (password.length >= 6) {
            $(this).removeClass('is-invalid').addClass('is-valid');
        } else if (password.length > 0) {
            $(this).removeClass('is-valid').addClass('is-invalid');
        } else {
            $(this).removeClass('is-valid is-invalid');
        }
    });
});