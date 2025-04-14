// Arrays for display data (view)
let dauSachDisplayList = [];
let sachDisplayList = [];
let nganTuList = [];
let selectedISBN = null;
let currentISBN = '';
let currentSach = '';

// Arrays for submission data (controller)
let dauSachSubmitList = [];
let sachSubmitList = [];


$(document).ready(function () {
    $('#dataSachTable').DataTable({
        "searching": false,
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
        
        fetch(`/Library/admin/isbn_book/book?selectedISBN=${selectedISBN}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const updatedList = data.sachList.map(dt => {
                        dt.maSach = dt.maSach.trim();
                        dt.isbn = dt.isbn.trim();
                        return dt;
                    });
                    sachDisplayList = updatedList;
                    nganTuList = data.nganTuList;
                    currentSach = '';
                    updateSachTable();
                }
            });
    });

    // Xử lý thêm đầu sách vào danh sách tạm thời
    $('#addDauSachBtn').on('click', function() {
        addDauSach();
    });

    // Xử lý ghi đầu sách
    $('#ghiDauSachBtn').on('click', function() {
        if (dauSachSubmitList.length === 0) {
            alert('Vui lòng thêm ít nhất một đầu sách trước khi ghi!');
            return;
        }
        fetch(`/Library/admin/isbn_book/dausach/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify(dauSachSubmitList)
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

    // Xử lý sửa sách
    $('#sachList').on('click', '.edit-sach-btn', function() {
        const row = $(this).closest('tr');
        const maSach = row.data('ma-sach');
        const tinhTrang = row.find('td:eq(1)').text() === 'Tốt';
        const choMuon = row.find('td:eq(2)').text() === 'Có';
        const ke = row.find('td:eq(3)').text() === 'Chưa gán' ? '' : row.find('td:eq(3)').text();

        row.html(`
            <td><input type="text" class="form-control" name="maSach" value="${maSach}" readonly></td>
            <td><select class="form-control" name="tinhTrang">
                <option value="true" ${tinhTrang ? 'selected' : ''}>Tốt</option>
                <option value="false" ${!tinhTrang ? 'selected' : ''}>Hỏng</option>
            </select></td>
            <td><select class="form-control" name="choMuon">
                <option value="true" ${choMuon ? 'selected' : ''}>Có</option>
                <option value="false" ${!choMuon ? 'selected' : ''}>Không</option>
            </select></td>
            <td><select class="form-control" name="maNganTu">
                ${nganTuList.map(nt => `<option value="${nt.maNganTu}" ${ke === nt.ke ? 'selected' : ''}>${nt.ke}</option>`).join('')}
            </select></td>
            <td>
                <button type="button" class="btn btn-sm btn-danger btn-small remove-sach-btn" data-ma-sach="${maSach}">Hủy</button>
                <button type="button" class="btn btn-sm btn-success btn-small confirm-change-sach-btn" data-ma-sach="${maSach}">Xác nhận</button>
            </td>
        `);
    });

    // Xử lý xác nhận thay đổi sách
    $('#sachList').on('click', '.confirm-change-sach-btn', function() {
        const maSach = $(this).data('ma-sach');
        const currentRow = $('#sachList tr[data-ma-sach="' + maSach + '"]');
        const tinhTrang = currentRow.find('td:eq(1) select[name="tinhTrang"]').val() === 'true';
        const choMuon = currentRow.find('td:eq(2) select[name="choMuon"]').val() === 'true'; 
        const maNganTu = currentRow.find('td:eq(3) select[name="maNganTu"]').val();

        // Update display list
        const sach = sachDisplayList.find(s => s.maSach === maSach);
        if (sach) {
            Object.assign(sach, {
                tinhTrang,
                choMuon,
                maNganTu
            });
        }

        // Update submit list
        const submitSach = sachSubmitList.find(s => s.maSach === maSach);
        if (submitSach) {
            Object.assign(submitSach, {
                tinhTrang,
                choMuon,
                maNganTu,
                type: 'edit'
            });
        }
        else {
            sachSubmitList.push({
                maSach,
                isbn: selectedISBN,
                tinhTrang,
                choMuon,
                maNganTu,
                type: 'edit'
            });
        }

        currentRow.find('input, select').prop('disabled', true);
    }); 

    // Xử lý hủy/sửa sách tạm thời
    $('#sachList').on('click', '.remove-sach-btn', function() {
        const maSach = $(this).data('ma-sach');
        const sach = sachDisplayList.find(s => s.maSach === maSach);
        
        if (sach && sach.isTemp) {
            // console.log("sachDisplayList before remove: ", sachDisplayList);
            // console.log("maSach: ", maSach);
            // console.log("sachDisplayList[sachDisplayList.length - 1].maSach: ", sachDisplayList[sachDisplayList.length - 1].maSach);
            if (maSach == sachDisplayList[sachDisplayList.length - 1].maSach) {
                console.log("ABC: ", maSach);
                currentSach = (sachDisplayList.length > 0) ? sachDisplayList[sachDisplayList.length - 1].maSach : '';
            }
            sachDisplayList = sachDisplayList.filter(s => s.maSach !== maSach);
            console.log("Sach display list after remove:", sachDisplayList);
            
            sachSubmitList = sachSubmitList.filter(s => s.maSach !== maSach);
            
            $(this).closest('tr').remove();
            console.log("Sach submit list after remove:", sachSubmitList);
        } 
        else if (sach && sach.maSach) {
            const row = $(this).closest('tr');
            
            row.html(`
                <td class="align-middle">${sach.maSach}</td>
                <td class="align-middle">${sach.tinhTrang ? 'Tốt' : 'Hỏng'}</td>
                <td class="align-middle">${sach.choMuon ? 'Có' : 'Không'}</td>
                <td class="align-middle">${sach.maNganTu ? sach.ke : 'Chưa gán'}</td>
                <td class="align-middle">
                    <button type="button" class="btn btn-sm btn-dark btn-small edit-sach-btn">Sửa</button>
                    <button type="button" class="btn btn-sm btn-danger btn-small delete-sach-btn" data-ma-sach="${sach.maSach}" data-toggle="modal" data-target="#DeleteSachModal">Xóa</button>
                </td>`);
        }
        else {
            sachDisplayList = sachDisplayList.filter(s => s.maSach !== maSach);
            sachSubmitList = sachSubmitList.filter(s => s.maSach !== maSach);
            $(this).closest('tr').remove();
        }
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

    if (dauSachDisplayList.some(ds => ds.isbn === dauSach.isbn)) {
        alert('ISBN đã tồn tại trong danh sách!');
        return;
    }

    // Add to display list
    dauSachDisplayList.push(dauSach);
    
    // Add to submit list
    dauSachSubmitList.push({...dauSach});
    
    updateDauSachTempList();
    form.reset();
}

function updateDauSachTempList() {
    const tempList = document.getElementById('dauSachTempList');
    let html = '';
    dauSachDisplayList.forEach(ds => {
        html += `
            <div class="dau-sach-item">
                <span>${ds.isbn} - ${ds.tenSach}${ds.nhaXB ? ' - ' + ds.nhaXB : ''}${ds.gia ? ' - ' + ds.gia : ''}</span>
                <button type="button" class="btn btn-danger btn-sm remove-dau-sach-btn" data-isbn="${ds.isbn}">Xóa</button>
            </div>`;
    });
    tempList.innerHTML = html;

    // Xử lý xóa đầu sách tạm thời
    $('.remove-dau-sach-btn').off('click').on('click', function() {
        const isbn = $(this).data('isbn');
        // Remove from display list
        dauSachDisplayList = dauSachDisplayList.filter(ds => ds.isbn !== isbn);
        // Remove from submit list
        dauSachSubmitList = dauSachSubmitList.filter(ds => ds.isbn !== isbn);
        updateDauSachTempList();
    });
}

async function addSach() {
    const lastRow = $('#sachList tr:last');

    let maSach = (lastRow.find('td:eq(0) input[name="maSach"]').val()), tinhTrang, choMuon, maNganTu;
    if (maSach !== undefined) {
        if (maSach == "") {
            alert("Vui lòng nhập mã sách!");
            return;
        }
        if (sachDisplayList.some(s => s.maSach == maSach)) {
            alert('Mã sách đã tồn tại!');
            return;
        }
        tinhTrang = lastRow.find('td:eq(1) select[name="tinhTrang"]').val() === 'true';
        choMuon = lastRow.find('td:eq(2) select[name="choMuon"]').val() === 'true';
        maNganTu = lastRow.find('td:eq(3) select[name="maNganTu"]').val();

        sachDisplayList.push({ 
            maSach: maSach, 
            isbn: selectedISBN, 
            tinhTrang: tinhTrang, 
            choMuon: choMuon, 
            maNganTu: maNganTu, 
            isTemp: true
        });
        
        sachSubmitList.push({ 
            maSach: maSach, 
            isbn: selectedISBN, 
            tinhTrang: tinhTrang, 
            choMuon: choMuon, 
            maNganTu: maNganTu, 
            isTemp: true,
            type: 'add'
        });
    }
    else {
        maSach = sachDisplayList[sachDisplayList.length - 1].maSach;
        tinhTrang = sachDisplayList[sachDisplayList.length - 1].tinhTrang;
        choMuon = sachDisplayList[sachDisplayList.length - 1].choMuon;
        maNganTu = sachDisplayList[sachDisplayList.length - 1].maNganTu;
    }

    lastRow.find('input, select').prop('disabled', true);

    const newRow = `
        <tr class="sach-item">
            <td><input type="text" class="form-control" name="maSach" placeholder="Nhập mã sách"></td>
            <td><select class="form-control" name="tinhTrang">
                <option value="true">Tốt</option>
                <option value="false">Hỏng</option>
            </select></td>
            <td><select class="form-control" name="choMuon">
                <option value="true">Có</option>
                <option value="false">Không</option>
            </select></td>
            <td><select class="form-control" name="maNganTu">
                ${nganTuList.map(nt => `<option value="${nt.maNganTu}">${nt.ke}</option>`).join('')}
            </select></td>
            <td><button type="button" class="btn btn-sm btn-danger btn-small remove-sach-btn">Hủy</button></td>
        </tr>`;

    $('#sachList').append(newRow);
}

function updateSachTable() {
    const tbody = document.getElementById('sachList');
    tbody.innerHTML = '';

    sachDisplayList.forEach(sach => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-ma-sach', sach.maSach);
        tr.setAttribute('default', "");
        tr.innerHTML = `
            <td class="align-middle" name="maSach">${sach.maSach}</td>
            <td class="align-middle" name="tinhTrang">${sach.tinhTrang ? 'Tốt' : 'Hỏng'}</td>
            <td class="align-middle" name="choMuon">${sach.choMuon ? 'Có' : 'Không'}</td>
            <td class="align-middle" name="maNganTu">${sach.maNganTu ? sach.ke : 'Chưa gán'}</td>
            <td class="align-middle">
                <button type="button" class="btn btn-sm btn-dark btn-small edit-sach-btn">Sửa</button>
                <button type="button" class="btn btn-sm btn-danger btn-small delete-sach-btn" data-ma-sach="${sach.maSach}" data-toggle="modal" data-target="#DeleteSachModal">Xóa</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

// Modify the form submission for sach
$('#addSachForm').on('submit', function(e) {
    e.preventDefault();
    console.log("bam nut ghi: ", sachSubmitList);
    
    if (!selectedISBN) {
        alert('Vui lòng chọn một đầu sách trước khi thêm sách!');
        return;
    }
    
    if (sachSubmitList.length === 0) {
        alert('Vui lòng thêm ít nhất một sách trước khi ghi!');
        return;
    }
    
    fetch(`/Library/admin/isbn_book/book/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(sachSubmitList)
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

// Add form submission handler for addDauSachForm
$('#addDauSachForm').on('submit', function(e) {
    e.preventDefault();
    
    if (dauSachSubmitList.length === 0) {
        alert('Vui lòng thêm ít nhất một đầu sách trước khi ghi!');
        return;
    }
    
    fetch(`/Library/admin/isbn_book/dausach/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(dauSachSubmitList)
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