// Unified data arrays with state tracking
let dauSachList = [];
let sachList = [];
let nganTuList = [];
let selectedISBN = null;
let isEditingDauSach = false;
let originalDauSachData = null;

// Reference data
let ngonNguList = [];
let theLoaiList = [];
let tacGiaList = [];

function loadDauSachForEdit(dauSach) {
    isEditingDauSach = true;
    originalDauSachData = { ...dauSach };
    
    let ngayXuatBan = dauSach.NGAYXUATBAN;
    if (ngayXuatBan) {
        const date = new Date(ngayXuatBan);
        if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            ngayXuatBan = `${day}/${month}/${year}`;
        }
    }
    
    document.getElementById('isbn').value = dauSach.ISBN;
    document.getElementById('tenSach').value = dauSach.TENSACH;
    document.getElementById('khoSach').value = dauSach.KHOSACH;
    document.getElementById('nhaXB').value = dauSach.NHAXB;
    document.getElementById('gia').value = dauSach.GIA;
    document.getElementById('noiDung').value = dauSach.NOIDUNG;
    document.getElementById('ngayXuatBan').value = ngayXuatBan;
    document.getElementById('lanXuatBan').value = dauSach.LANXUATBAN;
    document.getElementById('soTrang').value = dauSach.SOTRANG;
    document.getElementById('maNgonNgu').value = dauSach.MANGONNGU;
    document.getElementById('maTL').value = dauSach.MATL;
    document.getElementById('maTacGia').value = dauSach.MATACGIA;

    const hinhAnhInput = document.getElementById('hinhAnhPath');
    if (dauSach.HINHANHPATH) {
        let previewDiv = document.getElementById('imagePreview');
        if (!previewDiv) {
            previewDiv = document.createElement('div');
            previewDiv.id = 'imagePreview';
            previewDiv.style.marginTop = '10px';
            hinhAnhInput.parentNode.appendChild(previewDiv);
        }
        
        previewDiv.innerHTML = `
            <img src="${dauSach.HINHANHPATH}" alt="Hình ảnh hiện tại" 
                 style="max-width: 200px; max-height: 200px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px;">
            <p style="margin-top: 5px; font-size: 0.9em; color: #666;">
                Hình ảnh hiện tại - Chọn file mới để thay đổi
            </p>
        `;
        
        hinhAnhInput.removeAttribute('required');
    }
    
    // Ẩn nút thêm/ghi, hiện nút xác nhận/hủy
    $('#addDauSachBtn, #ghiDauSachBtn').hide();
    $('#confirmEditDauSachBtn, #cancelEditDauSachBtn').show();
    $('#addTitle').hide();
    $('#editTitle').show();
    $('#dauSachTempList').hide();
    
    // Disable ISBN input
    document.getElementById('isbn').disabled = true;
}

function resetDauSachForm() {
    isEditingDauSach = false;
    originalDauSachData = null;
    
    // Reset form
    document.getElementById('addDauSachForm').reset();
    document.getElementById('addDauSachForm').classList.remove('was-validated');
    
    // Hiện nút thêm/ghi, ẩn nút xác nhận/hủy
    $('#addDauSachBtn, #ghiDauSachBtn').show();
    $('#confirmEditDauSachBtn, #cancelEditDauSachBtn').hide();
    $('#addTitle').show();
    $('#editTitle').hide();
    $('#dauSachTempList').show();

    // Xóa preview image nếu có
    const previewDiv = document.getElementById('imagePreview');
    if (previewDiv) {
        previewDiv.remove();
    }
    
    // Làm input hình ảnh required trở lại
    document.getElementById('hinhAnhPath').setAttribute('required', 'required');
    

    // Enable ISBN input
    document.getElementById('isbn').disabled = false;
}

function updateSachTable() {
    const tbody = document.getElementById('sachList');
    tbody.innerHTML = '';
    console.log("Chay vao day")

    // Only show non-deleted books
    sachList.filter(sach => sach.state !== 'deleted').forEach(sach => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-ma-sach', sach.maSach);

        // Get shelf information for display
        const keDisplay = sach.maNganTu ? 
            nganTuList.find(nt => nt.maNganTu == sach.maNganTu)?.ke || 'Không tìm thấy' :
            'Chưa gán';

        tr.innerHTML = `
            <td class="align-middle" name="maSach">${sach.maSach}</td>
            <td class="align-middle" name="tinhTrang">${sach.tinhTrang ? 'Tốt' : 'Hỏng'}</td>
            <td class="align-middle" name="choMuon">${sach.choMuon ? 'Có' : 'Không'}</td>
            <td class="align-middle" name="maNganTu">${keDisplay}</td>
            <td class="align-middle">
                <button type="button" class="btn btn-sm btn-dark btn-small edit-sach-btn">Sửa</button>
                <button type="button" class="btn btn-sm btn-danger btn-small delete-sach-btn" data-ma-sach="${sach.maSach}" data-toggle="modal" data-target="#DeleteSachModal">Xóa</button>
            </td>`;
        tbody.appendChild(tr);
    });

    // Add a visual indicator for changes
    sachList.filter(sach => sach.state === 'added').forEach(sach => {
        const row = $(`#sachList tr[data-ma-sach="${sach.maSach}"]`);
        if (row.length) {
            row.addClass('table-success');
        }
    });
}


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

    // Load reference data
    fetch('/Library/admin/isbn_book/getData')
        .then(response => response.json())
        .then(data => {
            ngonNguList = data.ngonNguList;
            theLoaiList = data.theLoaiList;
            tacGiaList = data.tacGiaList;
        });

    // Handle book category selection
    $('#dauSachTableBody').on('click', '.select-dau-sach', function() {
        selectedISBN = $(this).data('isbn');
        $('#selectedDauSach').text(selectedISBN);
        
        Promise.all([
            fetch(`/Library/admin/isbn_book/book?selectedISBN=${selectedISBN}`).then(res => res.json()),
            fetch(`/Library/admin/isbn_book/dauSach?isbn=${selectedISBN}`).then(res => res.json())
        ])
        .then(([sachData, dauSachData]) => {
            console.log('Sách data:', sachData);
            console.log('Đầu sách data:', dauSachData);
            console.log('Type of loadDauSachForEdit:', typeof loadDauSachForEdit);  
            
            // Xử lý dữ liệu sách
            if (sachData.success) {
                sachList = sachData.sachList.map(dt => {
                    dt.maSach = dt.maSach.trim();
                    dt.isbn = dt.isbn.trim();
                    dt.original = { ...dt };
                    dt.state = 'unchanged';
                    return dt;
                });
                nganTuList = sachData.nganTuList;
                updateSachTable();
            }
            
            // Xử lý dữ liệu đầu sách
            if (dauSachData.success) {
                loadDauSachForEdit(dauSachData.dauSach);
            }
        })
        .catch(error => {
            console.error('Lỗi khi load dữ liệu:', error);
            alert('Có lỗi xảy ra khi tải dữ liệu: ' + error.message);
        });
    });

    // Add book category to temporary list
    $('#addDauSachBtn').on('click', function() {
        addDauSach();
    });

    // Save book categories
    $('#ghiDauSachBtn').on('click', function() {
        if (dauSachList.length === 0) {
            alert('Vui lòng thêm ít nhất một đầu sách trước khi ghi!');
            return;
        }
    
        const formData = new FormData();
        dauSachList.forEach((ds, index) => {
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
    
        fetch(`/Library/admin/isbn_book/create`, {
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

    // Add book
    $('#addSachBtn').on('click', function() {
        if (!selectedISBN) {
            alert('Vui lòng chọn một đầu sách trước khi thêm sách!');
            return;
        }
        addSach();
    });

    // Edit book
    $('#sachList').on('click', '.edit-sach-btn', function() {
        const row = $(this).closest('tr');
        const maSach = row.data('ma-sach');
        const sach = sachList.find(s => s.maSach === maSach);
        
        // Save original state if not already done
        if (!sach.originalBeforeEdit) {
            sach.originalBeforeEdit = { ...sach };
        }
        
        const tinhTrang = sach.tinhTrang;
        const choMuon = sach.choMuon;
        const maNganTuVal = sach.maNganTu || '';

        row.html(`
            <td><input type="text" class="form-control" name="maSach" value="${maSach}"></td>
            <td><select class="form-control" name="tinhTrang">
                <option value="true" ${tinhTrang ? 'selected' : ''}>Tốt</option>
                <option value="false" ${!tinhTrang ? 'selected' : ''}>Hỏng</option>
            </select></td>
            <td><select class="form-control" name="choMuon">
                <option value="true" ${choMuon ? 'selected' : ''}>Có</option>
                <option value="false" ${!choMuon ? 'selected' : ''}>Không</option>
            </select></td>
            <td><select class="form-control" name="maNganTu">
                ${nganTuList.map(nt => `<option value="${nt.maNganTu}" ${maNganTuVal === nt.maNganTu ? 'selected' : ''}>${nt.ke}</option>`).join('')}
            </select></td>
            <td>
                <button type="button" class="btn btn-sm btn-danger btn-small cancel-edit-sach-btn" data-ma-sach="${maSach}">Hủy</button>
                <button type="button" class="btn btn-sm btn-success btn-small confirm-change-sach-btn" data-ma-sach="${maSach}">Xác nhận</button>
            </td>
        `);
    });

    // Confirm book changes
    $('#sachList').on('click', '.confirm-change-sach-btn', function() {
        const maSach = $(this).data('ma-sach');
        const currentRow = $('#sachList tr[data-ma-sach="' + maSach + '"]');
        const updatedMaSach = currentRow.find('td:eq(0) input[name="maSach"]').val();
        
        // Check if updated ID already exists (excluding the current book)
        if (updatedMaSach !== maSach && sachList.some(s => s.maSach === updatedMaSach)) {
            alert('Mã sách đã tồn tại!');
            return;
        }

        const tinhTrang = currentRow.find('td:eq(1) select[name="tinhTrang"]').val() === 'true';
        const choMuon = currentRow.find('td:eq(2) select[name="choMuon"]').val() === 'true'; 
        const maNganTu = currentRow.find('td:eq(3) select[name="maNganTu"]').val();

        // Get the book object
        const sach = sachList.find(s => s.maSach === maSach);
        
        if (sach) {
            // If it's a newly added book, just update its data in the array
            if (sach.state === 'added') {
                sach.maSach = updatedMaSach;
                sach.tinhTrang = tinhTrang;
                sach.choMuon = choMuon;
                sach.maNganTu = maNganTu;
                updateSachTable();
            } else {
                // For existing books, send update to server immediately
                const updatedSach = {
                    oldMaSach: maSach, // Send old code for reference
                    newMaSach: updatedMaSach,
                    tinhTrang: tinhTrang,
                    choMuon: choMuon,
                    maNganTu: maNganTu,
                    isbn: selectedISBN
                };
                
                fetch('/Library/admin/isbn_book/book/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                    body: JSON.stringify(updatedSach)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update local data if server update successful
                        sach.maSach = updatedMaSach;
                        sach.tinhTrang = tinhTrang;
                        sach.choMuon = choMuon;
                        sach.maNganTu = maNganTu;
                        delete sach.originalBeforeEdit;
                        
                        alert('Cập nhật sách thành công!');
                        updateSachTable();
                    } else {
                        alert('Lỗi khi cập nhật sách: ' + data.message);
                        // Restore original state
                        if (sach.originalBeforeEdit) {
                            Object.assign(sach, sach.originalBeforeEdit);
                            delete sach.originalBeforeEdit;
                        }
                        updateSachTable();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Có lỗi xảy ra khi cập nhật sách!');
                    updateSachTable();
                });
            }
        }
    }); 

    // Cancel edit and restore original state
    $('#sachList').on('click', '.cancel-edit-sach-btn', function() {
        const maSach = $(this).data('ma-sach');
        const sach = sachList.find(s => s.maSach === maSach);
        
        if (sach && sach.originalBeforeEdit) {
            // Restore original state before edit
            Object.assign(sach, sach.originalBeforeEdit);
            delete sach.originalBeforeEdit;
            updateSachTable();
        } else if (sach && sach.state === 'added') {
            // If it's a newly added record, remove it
            sachList = sachList.filter(s => s.maSach !== maSach);
            updateSachTable();
        }
    });
    
    // Delete book confirmation modal handler
    $('#DeleteSachModal').on('show.bs.modal', function (event) {
        const button = $(event.relatedTarget);
        const maSach = button.data('ma-sach');
        $(this).find('#delete-sach-link').data('ma-sach', maSach);
    });
    
    // Confirm delete book
    $('#delete-sach-link').on('click', function() {
        const maSach = $(this).data('ma-sach');
        const sach = sachList.find(s => s.maSach === maSach);
        
        if (sach) {
            if (sach.state === 'added') {
                // If newly added, just remove from array
                sachList = sachList.filter(s => s.maSach !== maSach);
                updateSachTable();
                $('#DeleteSachModal').modal('hide');
            } else {
                // For existing books, call the delete API immediately
                fetch('/Library/admin/isbn_book/book/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                    body: JSON.stringify({ maSach: maSach })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Remove from local list on successful server delete
                        sachList = sachList.filter(s => s.maSach !== maSach);
                        alert('Xóa sách thành công!');
                        updateSachTable();
                    } else {
                        alert('Lỗi khi xóa sách: ' + data.message);
                    }
                    $('#DeleteSachModal').modal('hide');
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Có lỗi xảy ra khi xóa sách!');
                    $('#DeleteSachModal').modal('hide');
                });
            }
        }
    });

    // Submit books form
    $('#addSachForm').on('submit', function(e) {
        e.preventDefault();
        
        if (!selectedISBN) {
            alert('Vui lòng chọn một đầu sách trước khi thêm sách!');
            return;
        }
        
        // Filter only newly added books for the submit
        const newBooks = sachList.filter(s => s.state === 'added');
        
        if (newBooks.length === 0) {
            alert('Không có sách mới nào để ghi!');
            return;
        }
        
        fetch(`/Library/admin/isbn_book/book/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify(newBooks)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Thêm sách mới thành công!');
                
                // Update state of added books to unchanged
                sachList.forEach(sach => {
                    if (sach.state === 'added') {
                        sach.state = 'unchanged';
                    }
                });
                
                updateSachTable();
            } else {
                alert('Có lỗi xảy ra: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi ghi dữ liệu!');
        });
    });

    // Xác nhận chỉnh sửa đầu sách
    $('#confirmEditDauSachBtn').on('click', function() {
        const form = document.getElementById('addDauSachForm');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            form.reportValidity();
            return;
        }
        
        const hinhAnhInput = document.getElementById('hinhAnhPath');
        
        // Tạo FormData để gửi kèm file (nếu có)
        const formData = new FormData();
        formData.append('isbn', document.getElementById('isbn').value);
        formData.append('tenSach', document.getElementById('tenSach').value);
        formData.append('khoSach', document.getElementById('khoSach').value);
        formData.append('nhaXB', document.getElementById('nhaXB').value);
        formData.append('gia', parseFloat(document.getElementById('gia').value));
        formData.append('noiDung', document.getElementById('noiDung').value);
        formData.append('ngayXuatBan', document.getElementById('ngayXuatBan').value);
        formData.append('lanXuatBan', parseInt(document.getElementById('lanXuatBan').value));
        formData.append('soTrang', parseInt(document.getElementById('soTrang').value));
        formData.append('maNgonNgu', document.getElementById('maNgonNgu').value);
        formData.append('maTL', document.getElementById('maTL').value);
        formData.append('maTacGia', document.getElementById('maTacGia').value);
        
        // Kiểm tra xem có file mới được chọn không
        if (hinhAnhInput.files && hinhAnhInput.files.length > 0) {
            // Có file mới - gửi file
            formData.append('hinhAnhPath', hinhAnhInput.files[0]);
            formData.append('hasNewImage', 'true');
        } else {
            // Không có file mới - giữ nguyên ảnh cũ
            formData.append('hasNewImage', 'false');
            // Có thể thêm thông tin về ảnh hiện tại nếu cần
            if (originalDauSachData && originalDauSachData.HINHANHPATH) {
                formData.append('currentImagePath', originalDauSachData.HINHANHPATH);
            }
        }
        
        // Gửi request cập nhật đầu sách
        fetch('/Library/admin/isbn_book/update', {
            method: 'POST',
            body: formData // Sử dụng FormData thay vì JSON
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Cập nhật đầu sách thành công!');
                resetDauSachForm();
                // Reload trang để cập nhật danh sách
                window.location.reload();
            } else {
                alert('Lỗi khi cập nhật đầu sách: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi cập nhật đầu sách!');
        });
    });

    // Hủy chỉnh sửa đầu sách
    $('#cancelEditDauSachBtn').on('click', function() {
        resetDauSachForm();
    });

    $('#DeleteDauSachModal').on('show.bs.modal', function (event) {
        const button = $(event.relatedTarget);
        const isbn = button.data('isbn');
        $(this).find('#delete-dauSach-link').data('isbn', isbn);
    });
    
    // Confirm delete đầu sách
    $('#delete-dauSach-link').on('click', function() {
        const isbn = $(this).data('isbn');
        
        fetch('/Library/admin/isbn_book/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({ isbn: isbn })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Xóa đầu sách thành công!');
                window.location.reload();
            } else {
                alert('Lỗi khi xóa đầu sách: ' + data.message);
            }
            $('#DeleteDauSachModal').modal('hide');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi xóa đầu sách!');
            $('#DeleteDauSachModal').modal('hide');
        });
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
    const hinhAnhFile = hinhAnhInput.files[0];
    const hinhAnhURL = hinhAnhFile ? URL.createObjectURL(hinhAnhFile) : '';

    const dauSach = {
        isbn: document.getElementById('isbn').value,
        tenSach: document.getElementById('tenSach').value,
        khoSach: document.getElementById('khoSach').value,
        nhaXB: document.getElementById('nhaXB').value,
        gia: parseFloat(document.getElementById('gia').value),
        noiDung: document.getElementById('noiDung').value,
        hinhAnhPath: hinhAnhURL,
        hinhAnhFile: hinhAnhFile,
        ngayXuatBan: document.getElementById('ngayXuatBan').value,
        lanXuatBan: parseInt(document.getElementById('lanXuatBan').value),
        soTrang: parseInt(document.getElementById('soTrang').value),
        maNgonNgu: document.getElementById('maNgonNgu').value,
        maTL: document.getElementById('maTL').value,
        maTacGia: document.getElementById('maTacGia').value,
        state: 'added'
    };

    if (dauSachList.some(ds => ds.isbn === dauSach.isbn)) {
        alert('ISBN đã tồn tại trong danh sách!');
        return;
    }

    // Add to list
    dauSachList.push(dauSach);
    
    updateDauSachTempList();
    form.reset();
    form.classList.remove('was-validated');
}

function updateDauSachTempList() {
    const tbody = document.getElementById('dauSachTempList');
    tbody.innerHTML = '';

    dauSachList.forEach(ds => {
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
        const ds = dauSachList.find(ds => ds.isbn === isbn);
        if (ds && ds.hinhAnhPath) {
            URL.revokeObjectURL(ds.hinhAnhPath); 
        }
        dauSachList = dauSachList.filter(ds => ds.isbn !== isbn);
        updateDauSachTempList();
    }
}

function addSach() {
    const lastRow = $('#sachList tr.new-sach-row');
    
    // If we already have a new row being edited, don't add another
    if (lastRow.length > 0) {
        alert('Vui lòng hoàn tất việc thêm sách hiện tại trước khi thêm mới!');
        return;
    }

    const newRow = `
        <tr class="new-sach-row">
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
            <td>
                <button type="button" class="btn btn-sm btn-danger btn-small cancel-add-sach-btn">Hủy</button>
                <button type="button" class="btn btn-sm btn-success btn-small confirm-add-sach-btn">Thêm</button>
            </td>
        </tr>`;

    $('#sachList').append(newRow);
    
    // Add handler for cancel button
    $('.cancel-add-sach-btn').on('click', function() {
        $(this).closest('tr').remove();
    });
    
    // Add handler for confirm button
    $('.confirm-add-sach-btn').on('click', function() {
        const row = $(this).closest('tr');
        const maSach = row.find('td:eq(0) input[name="maSach"]').val();
        
        if (!maSach) {
            alert("Vui lòng nhập mã sách!");
            return;
        }
        
        if (sachList.some(s => s.maSach === maSach)) {
            alert('Mã sách đã tồn tại!');
            return;
        }
        
        const tinhTrang = row.find('td:eq(1) select[name="tinhTrang"]').val() === 'true';
        const choMuon = row.find('td:eq(2) select[name="choMuon"]').val() === 'true';
        const maNganTu = row.find('td:eq(3) select[name="maNganTu"]').val();
        
        // Add new book to list
        sachList.push({
            maSach: maSach,
            isbn: selectedISBN,
            tinhTrang: tinhTrang,
            choMuon: choMuon,
            maNganTu: maNganTu,
            state: 'added',
            original: null // No original state for new items
        });
        
        // Remove the edit row
        row.remove();
        
        // Update the table
        updateSachTable();
    });
}

// Form validation functions
function restrictKhoSachInput(input) {
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
});