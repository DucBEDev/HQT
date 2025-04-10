// Show alert
const showAlert = document.querySelector("[show-alert]");

if (showAlert) {
    const time = parseInt(showAlert.getAttribute("data-time"));
    const closeAlert = showAlert.querySelector("[close-alert]");

    setTimeout(() => {
        showAlert.classList.add("alert-hidden");
    }, time);

    closeAlert.addEventListener("click", () => {
        showAlert.classList.add("alert-hidden");
    });
}
// End Show alert

$(document).ready(function () {
    // Delete item
    $('#dataTable').on('click', '.delete-reader-btn', function() {
        const readerId = $(this).data('reader-id');
        $('#delete-link').on('click', function(e) {
            e.preventDefault(); 
            $('#delete-reader-item').attr('action', `/Library/admin/reader/delete/${readerId}?_method=DELETE`);
            $('#delete-reader-item').submit(); 
        });
    });
    // End delete item

    // Change Status item
    $('#dataTable').on('click', '[class^="change-status"]', function(e) {
        e.preventDefault();
        const $link = $(this);// Lấy phần tử <a> hiện tại
        const fullClassName = $link.attr('class');
        const subPath = fullClassName.split('-')[2]; 
        
        const id = $link.data('id');
        const currentStatus = $link.data('status');
        console.log(currentStatus, typeof(currentStatus));
        const newStatus = currentStatus === true ? false : true;
        
        $.ajax({
            url: `/Library/admin/${subPath}/change-status/${newStatus}/${id}?_method=PATCH`,
            type: 'POST',
            success: function(response) {
                // Tìm badge trong phần tử hiện tại
                const $badge = $link.find('.badge');

                // Cập nhật giao diện và data
                if (currentStatus === false) {
                    $badge.removeClass('badge-danger').addClass('badge-success').text('Hoạt động');
                    $link.data('status', true); 
                } else {
                    $badge.removeClass('badge-success').addClass('badge-danger').text('Ngừng hoạt động');
                    $link.data('status', false); 
                }
            },
            error: function(error) {
                alert("Lỗi khi thay đổi trạng thái.");
            }
        });
    });
    // End Change Status item
});


$(document).ready(function () {
    // Delete item
    $('#dataTable').on('click', '.delete-type-btn', function() {
        const typeId = $(this).data('type-id');
        $('#delete-link').on('click', function(e) {
            e.preventDefault(); 
            $('#delete-type-item').attr('action', `/Library/admin/type/delete/${typeId}?_method=DELETE`);
            $('#delete-type-item').submit(); 
        });
    });
});

$(document).ready(function () {
    // Delete item
    $('#dataTable').on('click', '.delete-staff-btn', function() {
        const staffId = $(this).data('staff-id');
        $('#delete-link').on('click', function(e) {
            e.preventDefault(); 
            $('#delete-staff-item').attr('action', `/Library/admin/staff/delete/${staffId}?_method=DELETE`);
            $('#delete-staff-item').submit(); 
        });
    });
});


$(document).ready(function () {
    // Delete item
    $('#dataTable').on('click', '.delete-author-btn', function() {
        const authorId = $(this).data('author-id');
        $('#delete-link').on('click', function(e) {
            e.preventDefault(); 
            $('#delete-author-item').attr('action', `/Library/admin/author/delete/${authorId}?_method=DELETE`);
            $('#delete-author-item').submit(); 
        });
    });
});