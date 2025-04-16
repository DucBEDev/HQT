// Arrays for display data (view)
let dauSachDisplayList = [];
let sachDisplayList = [];
let nganTuList = [];
let selectedISBN = null;
let currentISBN = '';
let currentSach = '';

let ngonNguList = [];
let theLoaiList = [];
let tacGiaList = [];

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

    fetch('/Library/admin/isbn_book/getData')
        .then(response => response.json())
        .then(data => {
            ngonNguList = data.ngonNguList;
            theLoaiList = data.theLoaiList;
            tacGiaList = data.tacGiaList;
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
    
        const formData = new FormData();
        dauSachSubmitList.forEach((ds, index) => {
            formData.append(`dauSach[${index}][isbn]`, ds.isbn);
            formData.append(`dauSach[${index}][tenSach]`, ds.tenSach);
            formData.append(`dauSach[${index}][khoSach]`, ds.khoSach);
            formData.append(`dauSach[${index}][nhaXB]`, ds.nhaXB);
            formData.append(`dauSach[${index}][gia]`, ds.gia);
            formData.append(`dauSach[${index}][noiDung]`, ds.noiDung);
            formData.append(`dauSach[${index}][ngayXuatBan]`, ds.ngayXuatBan);
            formData.append(`dauSach[${index}][lanXuatBan]`, ds.lanXuatBan);
            formData.append(`dauSach[${index}][soTrang]`, ds.soTrang);
            formData.append(`dauSach[${index}][maNgonNgu]`, ds.maNgonNgu);
            formData.append(`dauSach[${index}][maTL]`, ds.maTL);
            formData.append(`dauSach[${index}][maTacGia]`, ds.maTacGia);
            if (ds.hinhAnhFile) {
                formData.append('hinhAnhPath', ds.hinhAnhFile, ds.hinhAnhFile.name); 
            }
        });
    
        fetch(`/Library/admin/isbn_book/write`, {
            method: 'POST',
            body: formData
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
        const sach = sachSubmitList.find(s => s.maSach === maSach);
        const currentRow = $('#sachList tr[data-ma-sach="' + maSach + '"]');
        const currentIndex = currentRow.index(); // Lưu vị trí của row hiện tại
        currentRow.remove();

        if (sach && sach.type == 'add') {
            sachSubmitList = sachSubmitList.filter(s => s.maSach !== maSach);
            sachDisplayList = sachDisplayList.filter(s => s.maSach !== maSach);
        }
        else if (sach && sach.type == 'edit') {
            sachSubmitList = sachSubmitList.filter(s => s.maSach !== maSach);
            const oldData = sachDisplayList.find(s => s.maSach === maSach);

            const tr = document.createElement('tr');
            tr.setAttribute('data-ma-sach', sach.maSach);

            tr.innerHTML = `
                <td class="align-middle" name="maSach">${oldData.maSach}</td>
                <td class="align-middle" name="tinhTrang">${oldData.tinhTrang ? 'Tốt' : 'Hỏng'}</td>
                <td class="align-middle" name="choMuon">${oldData.choMuon ? 'Có' : 'Không'}</td>
                <td class="align-middle" name="maNganTu">${oldData.maNganTu ? nganTuList.find(nt => nt.maNganTu == oldData.maNganTu).ke : 'Chưa gán'}</td>
                <td class="align-middle">
                    <button type="button" class="btn btn-sm btn-dark btn-small edit-sach-btn">Sửa</button>
                    <button type="button" class="btn btn-sm btn-danger btn-small delete-sach-btn" data-ma-sach="${oldData.maSach}" data-toggle="modal" data-target="#DeleteSachModal">Xóa</button>
                </td>`;

            // Chèn tr mới vào đúng vị trí cũ
            const tbody = $('#sachList');
            const rows = tbody.children();
            if (currentIndex === 0) {
                tbody.prepend(tr);
            } else if (currentIndex >= rows.length) {
                tbody.append(tr);
            } else {
                $(rows[currentIndex]).before(tr);
            }
        }
    });
});

function addDauSach() {
    const form = document.getElementById('addDauSachForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        form.reportValidity();
        return;
    }

    const hinhAnhInput = document.getElementById('hinhAnhPath');
    const hinhAnhFile = hinhAnhInput.files[0]; // Lấy file từ input
    const hinhAnhURL = hinhAnhFile ? URL.createObjectURL(hinhAnhFile) : ''; // Tạo URL tạm thời

    const dauSach = {
        isbn: document.getElementById('isbn').value,
        tenSach: document.getElementById('tenSach').value,
        khoSach: document.getElementById('khoSach').value,
        nhaXB: document.getElementById('nhaXB').value,
        gia: parseFloat(document.getElementById('gia').value),
        noiDung: document.getElementById('noiDung').value,
        hinhAnhPath: hinhAnhURL, // Lưu URL tạm thời thay vì C:\fakepath\...
        ngayXuatBan: document.getElementById('ngayXuatBan').value,
        lanXuatBan: parseInt(document.getElementById('lanXuatBan').value),
        soTrang: parseInt(document.getElementById('soTrang').value),
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
    
    dauSachSubmitList.push({
        ...dauSach,
        hinhAnhFile: hinhAnhFile 
    });
    
    updateDauSachTempList();
    form.reset();
    form.classList.remove('was-validated');
}

function updateDauSachTempList() {
    const tbody = document.getElementById('dauSachTempList');
    tbody.innerHTML = '';

    dauSachDisplayList.forEach(ds => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                ${ds.hinhAnhPath ? 
                    `<img src="${ds.hinhAnhPath}" alt="Hình ảnh" style="width: 50px; height: 75px; object-fit: cover;">` : 
                    'Chưa có ảnh'}
            </td>
            <td>${ds.isbn}</td>
            <td>${ds.tenSach}</td>
            <td>${ds.khoSach}</td>
            <td>${ds.nhaXB}</td>
            <td>${ds.gia}</td>
            <td>${ds.noiDung}</td>
            <td>${ds.ngayXuatBan}</td>
            <td>${ds.lanXuatBan}</td>
            <td>${ds.soTrang}</td>
            <td>${ngonNguList.find(ng => ng.maNgonNgu === ds.maNgonNgu)?.ngonNgu || ds.maNgonNgu}</td>
            <td>${theLoaiList.find(tl => tl.maTL === ds.maTL)?.tenTL || ds.maTL}</td>
            <td>${tacGiaList.find(tg => tg.maTacGia === ds.maTacGia)?.hoTenTG || ds.maTacGia}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="xoaDauSach('${ds.isbn}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function xoaDauSach(isbn) {
    if (confirm('Bạn có chắc chắn muốn xóa đầu sách này khỏi danh sách?')) {
        const ds = dauSachDisplayList.find(ds => ds.isbn === isbn);
        if (ds && ds.hinhAnhPath) {
            URL.revokeObjectURL(ds.hinhAnhPath); 
        }
        dauSachDisplayList = dauSachDisplayList.filter(ds => ds.isbn !== isbn);
        dauSachSubmitList = dauSachSubmitList.filter(ds => ds.isbn !== isbn);
        updateDauSachTempList();
    }
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

        lastRow.attr('data-ma-sach', maSach);
        lastRow.find('.remove-sach-btn').attr('data-ma-sach', maSach);

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

        tr.innerHTML = `
            <td class="align-middle" name="maSach">${sach.maSach}</td>
            <td class="align-middle" name="tinhTrang">${sach.tinhTrang ? 'Tốt' : 'Hỏng'}</td>
            <td class="align-middle" name="choMuon">${sach.choMuon ? 'Có' : 'Không'}</td>
            <td class="align-middle" name="maNganTu">${sach.maNganTu ? nganTuList.find(nt => nt.maNganTu == sach.maNganTu).ke : 'Chưa gán'}</td>
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

// Validate
restrictKhoSachInput = function (input) {
    input.addEventListener('input', function(e) {
        const value = this.value;
        const filteredValue = value.replace(/[^0-9x]/g, '');
        const errorElementId = input.id + 'Error';

        if (value !== filteredValue) {
            this.value = filteredValue;
            this.classList.add('is-invalid');
            document.getElementById(errorElementId).style.display = 'block';
        } else {
            this.classList.remove('is-invalid');
            document.getElementById(errorElementId).style.display = 'none';
        }
    });
}   

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addDauSachForm');
    const isbnInput = document.getElementById('isbn');
    const tenSachInput = document.getElementById('tenSach');
    const khoSachInput = document.getElementById('khoSach');
    const nhaXBInput = document.getElementById('nhaXB');
    const giaInput = document.getElementById('gia');
    const lanXuatBanInput = document.getElementById('lanXuatBan');
    const soTrangInput = document.getElementById('soTrang');

    window.restrictNumberInput(isbnInput, 15);
    window.restrictNameInput(tenSachInput);
    window.restrictNameInput(nhaXBInput);
    restrictKhoSachInput(khoSachInput);
    window.restrictNumberInput(lanXuatBanInput);
    window.restrictNumberInput(soTrangInput);    
    window.restrictNumberInput(giaInput);
    
    form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
    });
})
// End Validate