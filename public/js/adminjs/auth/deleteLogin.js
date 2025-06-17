$(document).ready(function () {
    const empList = JSON.parse(document.querySelector('#empList').getAttribute('data-emp'));
    const dgList = JSON.parse(document.querySelector('#dgList').getAttribute('data-dg'));

    function updateUserDropdown() {
        const userType = $('input[name="userType"]:checked').val();
        const $select = $('#userSelect');
        const $label = $('#userTypeLabel');
        $select.empty();
        $select.append('<option value="" disabled selected>-- Chọn mã --</option>');

        if (userType === 'librarian') {
            $label.text('Mã thủ thư:');
            empList.forEach(emp => {
                $select.append(`<option value="${emp.maNV}">${emp.maNV} - ${emp.hoNV + " " + emp.tenNV}</option>`);
            });
        } else {
            $label.text('Mã độc giả:');
            dgList.forEach(dg => {
                $select.append(`<option value="${dg.maDG}">${dg.maDG} - ${dg.hoDG + " " + dg.tenDG}</option>`);
            });
        }
    }

    // Cập nhật dropdown khi load và khi thay đổi radio
    updateUserDropdown();
    $('input[name="userType"]').change(updateUserDropdown);

    // Validation đơn giản
    $('#deleteLoginForm').on('submit', function (e) {
        if (!$('#userSelect').val()) {
            $('#userSelect').addClass('is-invalid');
            e.preventDefault();
        } else {
            $('#userSelect').removeClass('is-invalid');
        }
    });
});
