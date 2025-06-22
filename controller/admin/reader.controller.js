const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, executeStoredProcedureWithTransactionAndReturnCode, getUserPool } = require('../../configs/database');
const puppeteer = require('puppeteer');
const moment = require('moment');
const XLSX = require('xlsx');

const DocGiaRepository = require('../../repositories/DocGiaRepository');
const NhanVienRepository = require('../../repositories/NhanVienRepository');

const systemConfig = require('../../configs/system');
const DocGia = require('../../models/DocGia');
const { pushToUndoStack, popUndoStack, clearUndoStack, updateAfterDeleteUndo, isEmpty } = require('../../public/js/adminjs/reader/reader-undo');

// Hàm chuyển đổi chuỗi DD/MM/YYYY thành đối tượng Date
function parseDate(dateStr) {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        throw new Error(`Định dạng ngày không hợp lệ: ${dateStr}. Yêu cầu: DD/MM/YYYY`);
    }
    const [day, month, year] = dateStr.split("/").map(Number);

    // Tạo Date sử dụng UTC để không bị lệch múi giờ
    const date = new Date(Date.UTC(year, month - 1, day));
    return date;
}


// [GET] /admin/reader
module.exports.index = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const list = await DocGiaRepository.getAll(pool);
 
    res.render('admin/pages/docgia/index', {
        readerList: list,
        pageTitle: 'Quản lý độc giả',
        isEmptyStack: isEmpty()
    });
}

// [DELETE] /admin/reader/delete/:maDG
module.exports.delete = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maDG } = req.params; 
    const reader = await DocGiaRepository.getById(pool, maDG);
    const params = [
        { name: 'USER_TYPE', type: sql.VarChar(10), value: 'DOCGIA' },
        { name: 'ID', type: sql.Int, value: maDG }
    ];

    try {
        await executeStoredProcedure(pool, 'sp_XoaTaiKhoanMoi', params);
        pushToUndoStack('delete', reader);
        res.redirect(`${systemConfig.prefixAdmin}/reader`);
    } catch (error) {
        console.error('Error deleting type:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa đọc giả!');
    }
};

// [PATCH] /admin/reader/change-status/:newStatus/:maDG
module.exports.changeStatus = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { newStatus, maDG } = req.params;
    const newStatusBool = newStatus === 'true' ? true : false;

    await DocGiaRepository.changeStatus(pool, maDG, newStatusBool);

    res.redirect(`${systemConfig.prefixAdmin}/reader`);
}

// [GET] /admin/reader/create
module.exports.create = async (req, res) => {
    res.render('admin/pages/docgia/create', {
        pageTitle: 'Thêm độc giả',
    });
}

// [POST] /admin/reader/create
module.exports.createPost = async (req, res) => {
    try {
        const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

        const readerList = req.body;

        const savedReaders = [];
        for (const reader of readerList) {
            const cleanHoDG = reader.hoDG.trim().replace(/\s+/g, ' ');
            const cleanTenDG = reader.tenDG.trim().replace(/\s+/g, ' ');
            const cleanDiaChiDG = reader.diaChiDG.trim().replace(/\s+/g, ' ');
            const cleanEmailDG = reader.emailDG.trim().replace(/\s+/g, ' ');
            let gioiTinh;

            if (reader.gioiTinh == 'Nam') {
                gioiTinh = 1;
            } else if (reader.gioiTinh == 'Nữ') {
                gioiTinh = 0;
            }

            const ngaySinh = parseDate(reader.ngaySinh);
            const ngayLamThe = parseDate(reader.ngayLamThe);
            const ngayHetHan = parseDate(reader.ngayHetHan);

            const params = [
                { name: 'USER_TYPE', type: sql.VarChar(10), value: 'DOCGIA' },
                { name: 'HODG', type: sql.NVarChar, value: cleanHoDG },
                { name: 'TENDG', type: sql.NVarChar, value: cleanTenDG },
                { name: 'EMAILDG', type: sql.NVarChar, value: cleanEmailDG + '@gmail.com' },
                { name: 'SOCMND', type: sql.NVarChar, value: reader.soCMND },
                { name: 'GIOITINH_DG', type: sql.Bit, value: gioiTinh },
                { name: 'NGAYSINH', type: sql.DateTime, value: ngaySinh },
                { name: 'DIACHIDG', type: sql.NVarChar, value: cleanDiaChiDG },
                { name: 'DIENTHOAI_DG', type: sql.NVarChar, value: reader.dienThoai },
                { name: 'NGAYLAMTHE', type: sql.DateTime, value: ngayLamThe },
                { name: 'NGAYHETHAN', type: sql.DateTime, value: ngayHetHan },
                { name: 'HOATDONG', type: sql.Bit, value: reader.hoatDong == '1' },
                { name: 'PASS', type: sql.NVarChar, value: "1111" },
            ];

            const result = await executeStoredProcedure(pool, 'sp_TaoTaiKhoanMoi', params);
            const maDG = result.recordset && result.recordset[0] ? result.recordset[0].ID : null;
            savedReaders.push({
                maDG: maDG,
                hoDG: cleanHoDG,
                tenDG: cleanTenDG,
                emailDG: cleanEmailDG + '@gmail.com',
                soCMND: reader.soCMND,
                gioiTinh: reader.gioiTinh == '1',
                ngaySinh: reader.ngaySinh,
                diaChiDG: cleanDiaChiDG,
                dienThoai: reader.dienThoai,
                ngayLamThe: reader.ngayLamThe,
                ngayHetHan: reader.ngayHetHan,
                hoatDong: reader.hoatDong == '1'
            });
        }
        req.flash('success', 'Tạo đọc giả thành công!');

        pushToUndoStack('create', savedReaders);

        res.json({ success: true });
    }
    catch (error) {
        console.error('Error creating reader:', error);
        req.flash('error', 'Có lỗi xảy ra khi tạo đọc giả!');

        res.status(500).json({ success: false, message: error.message });
    }
    
}

// [GET] /admin/reader/edit/:maDG
module.exports.edit = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maDG } = req.params;
    const docGia = await DocGiaRepository.getById(pool, maDG); 
    docGia.emailDG = docGia.emailDG.split('@')[0];

    res.render('admin/pages/docgia/edit', {
        docgia: docGia,
        pageTitle: 'Chỉnh sửa độc giả',
    });
};

// [POST] /reader/edit/:maDG
module.exports.editPatch = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        const { maDG } = req.params;
        const oldReader = await DocGiaRepository.getById(pool, maDG);
        let { hoDG, tenDG, emailDG, soCMND, gioiTinh, ngaySinh, diaChiDG, dienThoai, ngayLamThe, ngayHetHan, hoatDong } = req.body;
        const cleanHoDG = hoDG.trim().replace(/\s+/g, ' ');
        const cleanTenDG = tenDG.trim().replace(/\s+/g, ' ');
        const cleanDiaChiDG = diaChiDG.trim().replace(/\s+/g, ' ');
        const cleanEmailDG = emailDG.trim().replace(/\s+/g, ' ');

        ngaySinh = parseDate(ngaySinh);
        ngayLamThe = parseDate(ngayLamThe);
        ngayHetHan = parseDate(ngayHetHan);

        const params = [
            { name: 'MADG', type: sql.Int, value: maDG },
            { name: 'HODG', type: sql.NVarChar, value: cleanHoDG },
            { name: 'TENDG', type: sql.NVarChar, value: cleanTenDG },
            { name: 'EMAILDG', type: sql.NVarChar, value: cleanEmailDG + '@gmail.com' },
            { name: 'SOCMND', type: sql.NVarChar, value: soCMND },
            { name: 'GIOITINH', type: sql.Bit, value: gioiTinh == 'true' },
            { name: 'NGAYSINH', type: sql.Date, value: ngaySinh },
            { name: 'DIACHIDG', type: sql.NVarChar, value: cleanDiaChiDG },
            { name: 'DIENTHOAI', type: sql.NVarChar, value: dienThoai },
            { name: 'NGAYLAMTHE', type: sql.Date, value: ngayLamThe },
            { name: 'NGAYHETHAN', type: sql.Date, value: ngayHetHan },
            { name: 'HOATDONG', type: sql.Bit, value: hoatDong == '1' }
        ];

        await executeStoredProcedureWithTransaction(pool, 'sp_SuaDocGia', params);
        pushToUndoStack('edit', oldReader);

        res.status(200).json({
            success: true
        });
    } catch (error) {
        console.error('Error updating reader:', error);
        res.status(500).send('Có lỗi xảy ra khi cập nhật độc giả!');
    }
};

// [GET] /admin/reader/next-id
module.exports.getNextId = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const nextId = await DocGiaRepository.getNextId(pool);
    res.json({ success: true, nextId });
}

// [POST] /admin/reader/undo
module.exports.undo = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const lastAction = popUndoStack();

    if (!lastAction) {
        return res.json({ success: false, message: 'Không có thao tác để undo!' });
    }

    const { action, data } = lastAction;

    try {
        if (action === 'create') {
            // Undo create: Xóa từng độc giả đã thêm
            for (const reader of data) {
                const params = [
                    { name: 'USER_TYPE', type: sql.VarChar(10), value: 'DOCGIA' },
                    { name: 'ID', type: sql.BigInt, value: reader.maDG }

                ];
                console.log("Undo create reader: ", params);
                await executeStoredProcedure(pool, 'sp_XoaTaiKhoanMoi', params);
            }
        } else if (action === 'delete') {
            const oldMaDG = data.maDG; // Lấy mã DG từ dữ liệu đã xóa
            // Undo delete: Thêm lại độc giả đã xóa
            const params = [
                { name: 'USER_TYPE', type: sql.VarChar(10), value: 'DOCGIA' },
                // { name: 'MADG', type: sql.NVarChar, value: data.maDG },
                { name: 'HODG', type: sql.NVarChar, value: data.hoDG },
                { name: 'TENDG', type: sql.NVarChar, value: data.tenDG },
                { name: 'EMAILDG', type: sql.NVarChar, value: data.emailDG },
                { name: 'SOCMND', type: sql.NVarChar, value: data.soCMND },
                { name: 'GIOITINH_DG', type: sql.Bit, value: data.gioiTinh },
                { name: 'NGAYSINH', type: sql.DateTime, value: data.ngaySinh },
                { name: 'DIACHIDG', type: sql.NVarChar, value: data.diaChiDG },
                { name: 'DIENTHOAI_DG', type: sql.NVarChar, value: data.dienThoai },
                { name: 'NGAYLAMTHE', type: sql.DateTime, value: data.ngayLamThe },
                { name: 'NGAYHETHAN', type: sql.DateTime, value: data.ngayHetHan },
                { name: 'HOATDONG', type: sql.Bit, value: data.hoatDong },
                { name: 'PASS', type: sql.NVarChar, value: "1111" }
            ];
            const result = await executeStoredProcedure(pool, 'sp_TaoTaiKhoanMoi', params);
            const newMaDG = result.recordset && result.recordset[0] ? result.recordset[0].ID : null;

            updateAfterDeleteUndo(oldMaDG, newMaDG);

        } else if (action === 'edit') {
            // Undo edit: Khôi phục thông tin cũ
            const params = [
                { name: 'MADG', type: sql.Int, value: data.maDG },
                { name: 'HODG', type: sql.NVarChar, value: data.hoDG },
                { name: 'TENDG', type: sql.NVarChar, value: data.tenDG },
                { name: 'EMAILDG', type: sql.NVarChar, value: data.emailDG },
                { name: 'SOCMND', type: sql.NVarChar, value: data.soCMND },
                { name: 'GIOITINH', type: sql.Bit, value: data.gioiTinh },
                { name: 'NGAYSINH', type: sql.DateTime, value: data.ngaySinh },
                { name: 'DIACHIDG', type: sql.NVarChar, value: data.diaChiDG },
                { name: 'DIENTHOAI', type: sql.NVarChar, value: data.dienThoai },
                { name: 'NGAYLAMTHE', type: sql.DateTime, value: data.ngayLamThe },
                { name: 'NGAYHETHAN', type: sql.DateTime, value: data.ngayHetHan },
                { name: 'HOATDONG', type: sql.Bit, value: data.hoatDong }
            ];
            await executeStoredProcedureWithTransaction(pool, 'sp_SuaDocGia', params);
        } else if (action === 'changeStatus') {
            // Undo changeStatus: Khôi phục trạng thái cũ
            await DocGiaRepository.changeStatus(data.maDG, data.oldStatus);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error in undo:', error);
        res.json({ success: false, message: 'Không thể thực hiện undo!' });
    }
};

// [GET] /admin/reader/report?type=list/overdue
module.exports.report = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    const type = req.query.type;

    if (type == 'list') {
        const readerList = await DocGiaRepository.getAll(pool);
        const updatedReaderList = readerList.map(dt => {
            hoTen = dt.hoDG + ' ' + dt.tenDG;
            cmnd = dt.soCMND;
            phai = dt.gioiTinh == 1 ? 'Nam' : 'Nữ';
            dienThoai = dt.dienThoai;
            diaChi = dt.diaChiDG;
            ngayLamThe = moment(dt.ngayLamThe).format('DD/MM/YYYY');
            trangThai = dt.hoatDong == 1 ? 'Đang hoạt động' : 'Bị khóa';

            return {
                hoTen,
                cmnd,
                phai,
                dienThoai,
                diaChi,
                ngayLamThe,
                trangThai
            }
        }).sort((a, b) => a.hoTen.localeCompare(b.hoTen, 'vi'))

        const empId = req.session.empId;
        const empData = await NhanVienRepository.getById(pool, empId);

        res.render('admin/pages/docgia/reportList', {
            readerList: updatedReaderList,
            printDate: moment().format('DD/MM/YYYY'),
            empName: `${empData.hoNV} ${empData.tenNV}`
        });
    }
    else if (type == 'overdue') {
        const readerList = await DocGiaRepository.getOverdueReader(pool);
        const soLuong = readerList[0]?.soLuongDocGia || 0;
        console.log("Số lượng độc giả quá hạn: ", soLuong);
        const updatedReaderList = readerList.map(dt => {
            cmnd = dt.soCMND;
            hoTen = dt.hoTen;
            dienThoai = dt.soDT;
            email = dt.email;
            maSach = dt.maSach;
            tenSach = dt.tenSach;
            ngayMuon = moment(dt.ngayMuon).format('DD/MM/YYYY');
            soNgayQuaHan = dt.soNgayQuaHan;

            return {
                cmnd,
                hoTen,
                dienThoai,
                email,
                maSach,
                tenSach,
                ngayMuon,
                soNgayQuaHan
            }
        }).sort((a, b) => b.soNgayQuaHan - a.soNgayQuaHan)

        const empId = req.session.empId;
        const empData = await NhanVienRepository.getById(pool, empId);

        res.render('admin/pages/docgia/reportOverdue', {
            readerList: updatedReaderList,
            printDate: moment().format('DD/MM/YYYY'),
            empName: `${empData.hoNV} ${empData.tenNV}`,
            soLuong: soLuong
        });
    }
}

// [POST] /admin/reader/download-report?type=list/overdue
module.exports.downloadReport = async (req, res) => {
    try {
        const type = req.query.type;

        const { readerList, printDate, empName } = req.body;
        const parsedReaderList = JSON.parse(readerList);
        
        // Khởi tạo Puppeteer với các options cần thiết
        const browser = await puppeteer.launch({
            headless: 'new',  
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        let html = "";
        if (type == 'list') {
            // Render template với dữ liệu từ form
            html = await new Promise((resolve, reject) => {
                res.render('admin/pages/docgia/reportList', {
                    readerList: parsedReaderList,
                    printDate: printDate,
                    empName: empName
                }, (err, html) => {
                    if (err) reject(err);
                    resolve(html);
                });
            });
        } 
        else {
            html = await new Promise((resolve, reject) => {
                res.render('admin/pages/docgia/reportOverdue', {
                    readerList: parsedReaderList,
                    printDate: printDate,
                    empName: empName
                }, (err, html) => {
                    if (err) reject(err);
                    resolve(html);
                });
            });
        }

        // Đặt nội dung HTML và đợi tất cả resources load xong
        await page.setContent(html, { 
            waitUntil: ['networkidle0', 'load', 'domcontentloaded']
        });

        // Ẩn các nút không cần thiết
        await page.evaluate(() => {
            const buttonContainer = document.querySelector('.button-container');
            if (buttonContainer) {
                buttonContainer.style.display = 'none';
            }
        });

        // Đợi một chút để đảm bảo tất cả styles đã được áp dụng
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Tạo PDF với các options chi tiết
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { 
                top: '50px', 
                right: '50px', 
                bottom: '50px', 
                left: '50px' 
            },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">Trang <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
            preferCSSPageSize: true
        });

        // Đóng trình duyệt
        await browser.close();

        // Thiết lập headers cho response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        if (type == 'list') {
            res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_doc_gia.pdf"');
        }
        else {
            res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_doc_gia_qua_han.pdf"');
        }

        // Gửi PDF buffer về client
        res.end(pdfBuffer);
    } catch (err) {
        console.error('Lỗi khi tạo PDF:', err);
        res.status(500).send('Lỗi khi tạo PDF: ' + err.message);
    }
};
    
// [POST] /reader/clear-undo
module.exports.clearUndo = async (req, res) => {
    try {
        clearUndoStack();
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing undo stack:', error);
        res.json({ success: false, message: 'Không thể xóa stack undo!' });
    }
};

module.exports.downloadExcel = async (req, res) => {
    try {
        const type = req.query.type;
        const { readerList } = req.body;
        const parsedReaderList = JSON.parse(readerList);
        
        let workbook, worksheet, filename;
        
        if (type === 'list') {
            // Tạo workbook cho danh sách độc giả
            workbook = XLSX.utils.book_new();
            
            // Chuẩn bị dữ liệu
            const data = [
                ['STT', 'Họ tên', 'Số CMND', 'Phái', 'Địa chỉ', 'Số ĐT', 'Ngày lập thẻ', 'Trạng thái']
            ];
            
            parsedReaderList.forEach((reader, index) => {
                data.push([
                    index + 1,
                    reader.hoTen,
                    reader.cmnd,
                    reader.phai,
                    reader.diaChi,
                    reader.dienThoai,
                    reader.ngayLamThe,
                    reader.trangThai
                ]);
            });
            
            worksheet = XLSX.utils.aoa_to_sheet(data);
            filename = 'danh_sach_doc_gia.xlsx';
            
        } else if (type === 'overdue') {
            // Tạo workbook cho báo cáo quá hạn
            workbook = XLSX.utils.book_new();
            
            // Chuẩn bị dữ liệu
            const data = [
                ['STT', 'Số CMND', 'Họ tên', 'Số ĐT', 'Email', 'Mã sách', 'Tên sách', 'Ngày mượn', 'Số ngày quá hạn']
            ];
            
            parsedReaderList.forEach((reader, index) => {
                data.push([
                    index + 1,
                    reader.cmnd,
                    reader.hoTen,
                    reader.dienThoai,
                    reader.email,
                    reader.maSach,
                    reader.tenSach,
                    reader.ngayMuon,
                    reader.soNgayQuaHan
                ]);
            });
            
            worksheet = XLSX.utils.aoa_to_sheet(data);
            filename = 'bao_cao_doc_gia_qua_han.xlsx';
        }
        
        // Thiết lập độ rộng cột
        const columnWidths = [
            { wch: 5 },   // STT
            { wch: 15 },  // Số CMND hoặc Họ tên
            { wch: 25 },  // Họ tên hoặc các cột khác
            { wch: 10 },  // Phái
            { wch: 30 },  // Địa chỉ
            { wch: 12 },  // Số ĐT
            { wch: 15 },  // Ngày lập thẻ
            { wch: 15 }   // Trạng thái
        ];
        
        if (type === 'overdue') {
            columnWidths.push({ wch: 15 }); // Thêm cột cho số ngày quá hạn
        }
        
        worksheet['!cols'] = columnWidths;
        
        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, type === 'list' ? 'Danh sách độc giả' : 'Độc giả quá hạn');
        
        // Tạo buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        
        // Thiết lập headers cho response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Length', excelBuffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Gửi Excel buffer về client
        res.end(excelBuffer);
        
    } catch (err) {
        console.error('Lỗi khi tạo Excel:', err);
        res.status(500).send('Lỗi khi tạo Excel: ' + err.message);
    }
};