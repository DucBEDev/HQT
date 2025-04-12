let dauSachList = [];
let sachList = [];
let selectedISBN = null;
let currentISBN = '';

async function getNextISBN() {
    try {
        if (dauSachList.length === 0) {
            const response = await fetch(`/Library/admin/isbn_book/next-id`);
            const data = await response.json();
            if (data.success) {
                currentISBN = data.nextId;
                document.getElementById('isbn').value = currentISBN;
            }
        } else {
            currentISBN = `ISBN${(parseInt(dauSachList[dauSachList.length - 1].isbn.replace('ISBN', '')) + 1).toString().padStart(6, '0')}`;
            document.getElementById('isbn').value = currentISBN;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Không thể lấy ISBN tiếp theo!');
    }
}

getNextISBN();

$(document).ready(function () {
    $('#dataTable').DataTable({
        "language": {
            "search": "Tìm kiếm",
            "lengthMenu": "Hiển thị _MENU_ dòng",
            "info": "Hiển thị từ _START_ đến _END_ trên tổng số _TOTAL_ dòng",
            "paginate": {
                "previous": "Trước",
                "next": "Tiếp"
            }
        }
    });

    // Xử lý chọn đầu sách
    $('#dauSachTableBody').on('click', '.select-dau-sach', function() {
        selectedISBN = $(this).data('isbn');
        $('#selectedDauSach').text(selectedISBN);
        fetch(`/Library/admin/isbn_book/sach?selectedISBN=${selectedISBN}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    sachList = data.sachList;
                    updateSachTable();
                }
            });
    });

    // Xử lý xóa đầu sách
    $('#dauSachTableBody').on('click', '.delete-dau-sach-btn', function() {
        const isbn = $(this).data('isbn');
        $('#delete-dausach-btn').off('click').on('click', function() {
            fetch(`/Library/admin/isbn_book/delete/${isbn}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Xóa đầu sách thành công!');
                        window.location.reload();
                    } else {
                        alert('Có lỗi xảy ra: ' + data.message);
                    }
                });
        });
    });

    // Xử lý thêm đầu sách vào danh sách tạm thời
    $('#addDauSachBtn').on('click', function() {
        addDauSach();
    });

    // Xử lý ghi đầu sách
    $('#ghiDauSachBtn').on('click', function() {
        if (dauSachList.length === 0) {
            alert('Vui lòng thêm ít nhất một đầu sách trước khi ghi!');
            return;
        }
        fetch(`/Library/admin/isbn_book/dausach/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify(dauSachList)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Ghi dữ liệu thành công!');
                window.location.href = `/Library/admin/isbn_book`;
            } else {
                alert('Có lỗi xảy ra: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi ghi dữ liệu!');
        });
    });

    // Xử lý thêm sách
    $('#addSachBtn').on('click', function() {
        if (!selectedISBN) {
            alert('Vui lòng chọn một đầu sách trước khi thêm sách!');
            return;
        }
        addSach();
    });

    // Xử lý xóa sách
    $('#sachList').on('click', '.delete-sach-btn', function() {
        const maSach = $(this).data('ma-sach');
        $('#delete-sach-btn').off('click').on('click', function() {
            fetch(`/Library/admin/isbn_book/sach/delete/${maSach}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Xóa sách thành công!');
                        $(`tr[data-ma-sach="${maSach}"]`).remove();
                    } else {
                        alert('Có lỗi xảy ra: ' + data.message);
                    }
                });
        });
    });

    // Xử lý sửa sách
    $('#sachList').on('click', '.edit-sach-btn', function() {
        const row = $(this).closest('tr');
        const maSach = row.data('ma-sach');
        const tinhTrang = row.find('td:eq(1)').text() === 'Tốt';
        const choMuon = row.find('td:eq(2)').text() === 'Có';
        const maNganTu = row.find('td:eq(3)').text() === 'Chưa gán' ? '' : row.find('td:eq(3)').text();

        row.html(`
            <td><input type="text" name="maSach" value="${maSach}" readonly></td>
            <td><select name="tinhTrang">
                <option value="true" ${tinhTrang ? 'selected' : ''}>Tốt</option>
                <option value="false" ${!tinhTrang ? 'selected' : ''}>Hỏng</option>
            </select></td>
            <td><select name="choMuon">
                <option value="true" ${choMuon ? 'selected' : ''}>Có</option>
                <option value="false" ${!choMuon ? 'selected' : ''}>Không</option>
            </select></td>
            <td><input type="number" name="maNganTu" value="${maNganTu}" placeholder="Nhập mã ngăn tủ"></td>
            <td><button type="button" class="btn btn-sm btn-danger btn-small remove-sach-btn" data-ma-sach="${maSach}">Hủy</button></td>
        `);
    });

    // Xử lý hủy/sửa sách tạm thời
    $('#sachList').on('click', '.remove-sach-btn', function() {
        const maSach = $(this).data('ma-sach');
        sachList = sachList.filter(s => s.maSach !== maSach);
        $(this).closest('tr').remove();
        updateSachInputs();
    });
});

function addDauSach() {
    const form = document.getElementById('addDauSachForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const dauSach = {
        isbn: document.getElementById('isbn').value,
        tenSach: document.getElementById('tenSach').value,
        khoSach: document.getElementById('khoSach').value,
        nhaXB: document.getElementById('nhaXB').value,
        gia: document.getElementById('gia').value,
        noiDung: document.getElementById('noiDung').value,
        hinhAnhPath: document.getElementById('hinhAnhPath').value,
        ngayXuatBan: document.getElementById('ngayXuatBan').value,
        lanXuatBan: document.getElementById('lanXuatBan').value,
        soTrang: document.getElementById('soTrang').value,
        maNgonNgu: document.getElementById('maNgonNgu').value,
        maTL: document.getElementById('maTL').value,
        maTacGia: document.getElementById('maTacGia').value
    };

    if (dauSachList.some(ds => ds.isbn === dauSach.isbn)) {
        alert('ISBN đã tồn tại trong danh sách!');
        return;
    }

    dauSachList.push(dauSach);
    updateDauSachTempList();
    form.reset();
    getNextISBN();
}

function updateDauSachTempList() {
    const tempList = document.getElementById('dauSachTempList');
    let html = '';
    dauSachList.forEach(ds => {
        html += `
            <div class="dau-sach-item">
                <span>${ds.isbn} - ${ds.tenSach}${ds.nhaXB ? ' - ' + ds.nhaXB : ''}${ds.gia ? ' - ' + ds.gia : ''}</span>
                <button type="button" class="btn btn-danger btn-sm remove-dau-sach-btn" data-isbn="${ds.isbn}">Xóa</button>
            </div>`;
    });
    tempList.innerHTML = html;

    const inputs = document.getElementById('dauSachInputs');
    let inputsHtml = '';
    dauSachList.forEach((ds, index) => {
        inputsHtml += `<input type="hidden" name="dauSachList[${index}].isbn" value="${ds.isbn}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].tenSach" value="${ds.tenSach}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].khoSach" value="${ds.khoSach}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].nhaXB" value="${ds.nhaXB}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].gia" value="${ds.gia}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].noiDung" value="${ds.noiDung}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].hinhAnhPath" value="${ds.hinhAnhPath}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].ngayXuatBan" value="${ds.ngayXuatBan}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].lanXuatBan" value="${ds.lanXuatBan}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].soTrang" value="${ds.soTrang}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].maNgonNgu" value="${ds.maNgonNgu}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].maTL" value="${ds.maTL}"/>` +
                      `<input type="hidden" name="dauSachList[${index}].maTacGia" value="${ds.maTacGia}"/>`;
    });
    inputs.innerHTML = inputsHtml;

    // Xử lý xóa đầu sách tạm thời
    $('.remove-dau-sach-btn').off('click').on('click', function() {
        const isbn = $(this).data('isbn');
        dauSachList = dauSachList.filter(ds => ds.isbn !== isbn);
        updateDauSachTempList();
    });
}

function addSach() {
    const maSach = 'new_' + Date.now();
    const newRow = `
        <tr class="sach-item" data-ma-sach="${maSach}">
            <td><input type="text" name="maSach" value="${maSach}" readonly></td>
            <td><select name="tinhTrang">
                <option value="true">Tốt</option>
                <option value="false">Hỏng</option>
            </select></td>
            <td><select name="choMuon">
                <option value="true">Có</option>
                <option value="false">Không</option>
            </select></td>
            <td><input type="number" name="maNganTu" placeholder="Nhập mã ngăn tủ"></td>
            <td><button type="button" class="btn btn-sm btn-danger btn-small remove-sach-btn" data-ma-sach="${maSach}">Hủy</button></td>
        </tr>`;
    $('#sachList').append(newRow);
    sachList.push({ maSach, isbn: selectedISBN, tinhTrang: true, choMuon: true, maNganTu: '' });
    updateSachInputs();
}

function updateSachTable() {
    const tbody = document.getElementById('sachList');
    tbody.innerHTML = '';
    sachList.forEach(sach => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-ma-sach', sach.maSach);
        tr.innerHTML = `
            <td class="align-middle">${sach.maSach}</td>
            <td class="align-middle">${sach.tinhTrang ? 'Tốt' : 'Hỏng'}</td>
            <td class="align-middle">${sach.choMuon ? 'Có' : 'Không'}</td>
            <td class="align-middle">${sach.maNganTu ? sach.maNganTu : 'Chưa gán'}</td>
            <td class="align-middle">
                <button type="button" class="btn btn-sm btn-dark btn-small edit-sach-btn">Sửa</button>
                <button type="button" class="btn btn-sm btn-danger btn-small delete-sach-btn" data-ma-sach="${sach.maSach}" data-toggle="modal" data-target="#DeleteSachModal">Xóa</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function updateSachInputs() {
    const inputs = document.getElementById('sachInputs');
    let html = '';
    $('#sachList tr').each(function(index) {
        const maSach = $(this).find('input[name="maSach"]').val() || $(this).data('ma-sach');
        const tinhTrang = $(this).find('select[name="tinhTrang"]').val() || $(this).find('td:eq(1)').text() === 'Tốt';
        const choMuon = $(this).find('select[name="choMuon"]').val() || $(this).find('td:eq(2)').text() === 'Có';
        const maNganTu = $(this).find('input[name="maNganTu"]').val() || $(this).find('td:eq(3)').text() === 'Chưa gán' ? '' : $(this).find('td:eq(3)').text();

        html += `<input type="hidden" name="sachList[${index}].maSach" value="${maSach}"/>` +
                `<input type="hidden" name="sachList[${index}].isbn" value="${selectedISBN}"/>` +
                `<input type="hidden" name="sachList[${index}].tinhTrang" value="${tinhTrang}"/>` +
                `<input type="hidden" name="sachList[${index}].choMuon" value="${choMuon}"/>` +
                `<input type="hidden" name="sachList[${index}].maNganTu" value="${maNganTu}"/>`;
    });
    inputs.innerHTML = html;
}

$('#sachList').on('change', 'input, select', updateSachInputs);