$(document).ready(function () {
    // Khởi tạo DataTable
    const table = $('#dataTable').DataTable({
        "searching": false, // Tắt ô tìm kiếm mặc định
        "language": {
            "lengthMenu": "Hiển thị _MENU_ dòng",
            "info": "Hiển thị từ _START_ đến _END_ trên tổng số _TOTAL_ dòng",
            "paginate": {
                "previous": "Trước",
                "next": "Tiếp"
            }
        },
        "columns": [
            { "data": "maDG" }, // Cột 0: Mã độc giả
            { "data": "hoTen" }, // Cột 1: Họ tên
            { "data": "emailDG" }, // Cột 2: Email
            { "data": "dienThoai" }, // Cột 3: Điện thoại
            { "data": null, "orderable": false, "searchable": false } // Cột 5: Hành động (không tìm kiếm, không sắp xếp)
        ]
    });

    // Tìm kiếm khi bấm nút
    $('#searchBtn').on('click', function () {
        const criteria = $('#searchCriteria').val();
        const searchValue = $('#searchInput').val().trim().toLowerCase();

        // Xóa bộ lọc trước đó
        table.search('').columns().search('').draw();

        // Áp dụng bộ lọc dựa trên tiêu chí
        if (searchValue) {
            if (criteria === 'maDG') {
                table.column(0).search(searchValue).draw();
            } else if (criteria === 'hoTen') {
                table.column(1).search(searchValue).draw();
            } else if (criteria === 'email') {
                table.column(2).search(searchValue).draw();
            } else if (criteria === 'dienThoai') {
                table.column(3).search(searchValue).draw();
            }
        } else {
            table.draw();
        }
    });

    // Reset tìm kiếm khi xóa ô input
    $('#searchInput').on('input', function () {
        if (!this.value) {
            table.search('').columns().search('').draw();
        }
    });
});