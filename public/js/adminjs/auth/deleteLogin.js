$(document).ready(function () {
    const empList = JSON.parse(document.querySelector('#empList').getAttribute('data-emp'));
    const dgList = JSON.parse(document.querySelector('#dgList').getAttribute('data-dg'));
    
    let currentMode = 'delete'; // Mặc định là chế độ xóa

    // Chuyển đổi chế độ
    function switchMode(mode) {
        currentMode = mode;
        
        if (mode === 'create') {
            // Chuyển sang chế độ tạo
            $('#btnCreateMode').removeClass('btn-outline-primary').addClass('btn-primary active');
            $('#btnDeleteMode').removeClass('btn-danger active').addClass('btn-outline-danger');
            
            $('#createLoginForm').removeClass('d-none');
            $('#deleteLoginForm').addClass('d-none');
            
            $('#cardHeader').removeClass('bg-danger').addClass('bg-success');
            $('#headerIcon').removeClass('fa-user-times').addClass('fa-user-plus');
            $('#headerTitle').text('Tạo Tài Khoản Đăng Nhập');
            
            updateUserDropdown('create');
        } else {
            // Chuyển sang chế độ xóa
            $('#btnDeleteMode').removeClass('btn-outline-danger').addClass('btn-danger active');
            $('#btnCreateMode').removeClass('btn-primary active').addClass('btn-outline-primary');
            
            $('#deleteLoginForm').removeClass('d-none');
            $('#createLoginForm').addClass('d-none');
            
            $('#cardHeader').removeClass('bg-success').addClass('bg-danger');
            $('#headerIcon').removeClass('fa-user-plus').addClass('fa-user-times');
            $('#headerTitle').text('Xóa Tài Khoản Đăng Nhập');
            
            updateUserDropdown('delete');
        }
    }

    // Cập nhật dropdown cho từng chế độ
    function updateUserDropdown(mode) {
        const prefix = mode === 'create' ? 'create' : 'delete';
        const userType = $(`input[name="userType"]:checked`, `#${prefix}LoginForm`).val();
        const $select = $(`#${prefix}UserSelect`);
        const $label = $(`#${prefix}UserTypeLabel`);
        
        $select.empty();
        $select.append('<option value="" disabled selected>-- Chọn mã --</option>');

        if (userType === 'librarian') {
            $label.text('Mã thủ thư:');
            empList.forEach(emp => {
                $select.append(`<option value="${emp.MANV}">${emp.MANV} - ${emp.HONV + " " + emp.TENNV}</option>`);
            });
        } else {
            $label.text('Mã độc giả:');
            dgList.forEach(dg => {
                $select.append(`<option value="${dg.MADG}">${dg.MADG} - ${dg.HODG + " " + dg.TENDG}</option>`);
            });
        }
    }

    // Event handlers cho nút chuyển chế độ
    $('#btnCreateMode').click(function() {
        switchMode('create');
    });

    $('#btnDeleteMode').click(function() {
        switchMode('delete');
    });

    // Event handlers cho radio buttons
    $('#createLoginForm input[name="userType"]').change(function() {
        updateUserDropdown('create');
    });

    $('#deleteLoginForm input[name="userType"]').change(function() {
        updateUserDropdown('delete');
    });

    // Validation cho form tạo tài khoản
    $('#createLoginForm').on('submit', function (e) {
        let isValid = true;
        
        // Kiểm tra user select
        if (!$('#createUserSelect').val()) {
            $('#createUserSelect').addClass('is-invalid');
            isValid = false;
        } else {
            $('#createUserSelect').removeClass('is-invalid');
        }
        
        // Kiểm tra password
        if (!$('#password').val()) {
            $('#password').addClass('is-invalid');
            isValid = false;
        } else {
            $('#password').removeClass('is-invalid');
        }
        
        // Kiểm tra confirm password
        if ($('#password').val() !== $('#confirmPassword').val()) {
            $('#confirmPassword').addClass('is-invalid');
            isValid = false;
        } else {
            $('#confirmPassword').removeClass('is-invalid');
        }
        
        if (!isValid) {
            e.preventDefault();
        }
    });

    // Validation cho form xóa tài khoản
    $('#deleteLoginForm').on('submit', function (e) {
        if (!$('#deleteUserSelect').val()) {
            $('#deleteUserSelect').addClass('is-invalid');
            e.preventDefault();
        } else {
            $('#deleteUserSelect').removeClass('is-invalid');
        }
    });

    // Xử lý xác nhận mật khẩu realtime
    $('#confirmPassword').on('input', function() {
        if ($('#password').val() !== $(this).val()) {
            $(this).addClass('is-invalid');
        } else {
            $(this).removeClass('is-invalid');
        }
    });

    // Khởi tạo ban đầu
    switchMode('create'); // Mặc định chế độ xóa
});