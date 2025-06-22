const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, getUserPool } = require('../../configs/database');
const moment = require('moment');
const puppeteer = require('puppeteer');
const { pushToUndoStack, popUndoStack, clearUndoStack, isEmpty } = require('../../public/js/adminjs/isbn_book/isbn_book_undo');
const xlsx = require('xlsx');

const DauSachRepository = require('../../repositories/DauSachRepository'); 
const SachRepository = require('../../repositories/SachRepository'); 
const NgonNguRepository = require('../../repositories/NgonNguRepository'); 
const TheLoaiRepository = require('../../repositories/TheLoaiRepository'); 
const TacGiaRepository = require('../../repositories/TacGiaRepository'); 
const NganTuRepository = require('../../repositories/NganTuRepository'); 
const NhanVienRepository = require('../../repositories/NhanVienRepository'); 

const systemConfig = require('../../configs/system');

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

// [GET] /admin/isbn_book
module.exports.index = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const dauSachList = await DauSachRepository.getAll(pool); 
    const ngonNguList = await NgonNguRepository.getAll(pool);
    const theLoaiList = await TheLoaiRepository.getAll(pool);
    const tacGiaList = await TacGiaRepository.getAll(pool);

    res.render('admin/pages/dausach_sach/index', {
        dauSachList: dauSachList,
        ngonNguList: ngonNguList,
        theLoaiList: theLoaiList,
        tacGiaList: tacGiaList,
        pageTitle: 'Quản Lý Đầu Sách và Sách',
        isEmptyStack: isEmpty()
    });
};

// [GET] /admin/isbn_book/getData   
module.exports.getData = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const ngonNguList = await NgonNguRepository.getAll(pool);
    const theLoaiList = await TheLoaiRepository.getAll(pool);
    const tacGiaList = await TacGiaRepository.getAll(pool);

    res.json({ ngonNguList, theLoaiList, tacGiaList });
};

// [GET] /admin/isbn_book/dauSach   
module.exports.getDauSach = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    let dauSach = await DauSachRepository.getDauSach(pool, req.query.isbn);
    dauSach.MATACGIA = dauSach.MATACGIA ? dauSach.MATACGIA.split(',') : []; // Chuyển đổi chuỗi MATACGIA thành mảng

    res.json({ success: true, dauSach });
};

// [GET] /admin/isbn_book/book
module.exports.getBooks = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        const { selectedISBN } = req.query;
        const sachList = await SachRepository.getBooksByISBN(pool, selectedISBN);
        const updatedSachList = await Promise.all(sachList.map(async (sach) => {
            const nganTu = await NganTuRepository.getById(pool, sach.maNganTu);
            return {
                ...sach,
                ke: nganTu.ke
            };
        }));
        const nganTuList = await NganTuRepository.getAll(pool); 

        res.json({ 
            success: true, 
            sachList: updatedSachList,
            nganTuList: nganTuList
        });
    } catch (error) {
        res.json({
            success: false
        })
    }
};

// [POST] /admin/isbn_book/book/delete
module.exports.deleteBook = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    
    try {
        const { maSach } = req.body;
        const params = [
            { name: 'MASACH', type: sql.NChar, value: maSach }
        ];

        const sach = await SachRepository.getByMaSach(pool, maSach);
        await executeStoredProcedure(pool, 'sp_XoaSach', params);

        pushToUndoStack('delete_sach', sach);

        res.status(200).json({
            success: true,
            isEmptyStack: isEmpty()
        })
    } catch (error) {
        req.flash('error', error);
        res.status(500).send('Có lỗi xảy ra khi xóa sách!');
    }
};

// [POST] /admin/isbn_book/book/update
module.exports.update = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { oldMaSach, newMaSach, tinhTrang, choMuon, maNganTu, isbn } = req.body;

    try {
        if (oldMaSach != newMaSach && await SachRepository.checkExist(pool, newMaSach)) {
            return res.status(400).json({
                success: false, 
                message: 'Mã sách đã tồn tại!'
            });
        }

        // Lấy thông tin sách cũ để lưu vào undo stack
        const oldSach = await SachRepository.getByMaSach(pool, oldMaSach);
        const cleanMaSachCu = oldMaSach.trim();
        const cleanMaSachMoi = newMaSach.trim();
        const cleanISBN = isbn.trim();

        // Chuẩn bị tham số cho stored procedure
        const params = [
            { name: 'MASACHCU', type: sql.NChar, value: cleanMaSachCu },
            { name: 'MASACHMOI', type: sql.NChar, value: cleanMaSachMoi },
            { name: 'ISBN', type: sql.NChar, value: cleanISBN },
            { name: 'TINHTRANG', type: sql.Bit, value: tinhTrang },
            { name: 'CHOMUON', type: sql.Bit, value: choMuon },
            { name: 'MANGANTU', type: sql.Int, value: maNganTu || null }
        ];

        await executeStoredProcedureWithTransaction(pool, 'sp_SuaSach', params);
        pushToUndoStack('edit_sach', { oldData: oldSach, newData: { maSach: cleanMaSachMoi, isbn: cleanISBN, tinhTrang, choMuon, maNganTu } });

        res.status(200).json({
            success: true,
            isEmptyStack: isEmpty()
        })
    } catch (error) {
        req.flash('error', error);
        res.status(500).send('Có lỗi xảy ra khi sửa sách!');
    }
};

// [POST] /admin/isbn_book/book/write
module.exports.write = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        const sachList = req.body;

        let duplicateBooks = [];
        for (const book of sachList) {
            if(await SachRepository.checkExist(pool, book.maSach) == true) {
                duplicateBooks.push(book);
            }
        }

        if (duplicateBooks.length > 0) {
            return res.status(400).json({
                success: false, 
                message: 'Các sách sau có mã sách trùng với mã sách khác của sách đã có trong database: ' + duplicateBooks.map(a => a.maSach).join(', ')
                
            });
        }

        const savedSach = [];
        for (const sach of sachList) {
            const cleanMaSach = sach.maSach.trim();
            const cleanISBN = sach.isbn.trim();

            // Chuẩn bị tham số cho stored procedure
            const params = [
                { name: 'MASACH', type: sql.NChar, value: cleanMaSach },
                { name: 'ISBN', type: sql.NChar, value: cleanISBN },
                { name: 'TINHTRANG', type: sql.Bit, value: sach.tinhTrang === 'true' || sach.tinhTrang === true },
                { name: 'CHOMUON', type: sql.Bit, value: sach.choMuon === 'true' || sach.choMuon === false },
                { name: 'MANGANTU', type: sql.Int, value: sach.maNganTu || null }
            ];

            // Gọi stored procedure để thêm sách
            await executeStoredProcedure(pool, 'sp_ThemSach', params);
            savedSach.push({
                maSach: cleanMaSach,
                isbn: cleanISBN,
                tinhTrang: sach.tinhTrang,
                choMuon: sach.choMuon,
                maNganTu: sach.maNganTu
            });
            
            pushToUndoStack('create_sach', savedSach);
        }

        res.status(200).json({ 
            success: true,
            isEmptyStack: isEmpty()
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// [POST] /admin/isbn_book/create
module.exports.createDauSach = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    
    try {
        const dauSachList = Object.values(req.body.dauSach || []).map((ds, index) => ({
            ...ds,
            hinhAnhPath: req.body.hinhAnhUrls ? req.body.hinhAnhUrls[index] : null
        }));

        let duplicateTitles = [];
        for (const title of dauSachList) {
            if (await DauSachRepository.checkExist(pool, title) == true) {
                duplicateTitles.push(title);
            }
        }

        if (duplicateTitles.length > 0) {
            return res.status(400).json({
                success: false, 
                message: 'Các đầu sách sau có ISBN trùng với ISBN khác của đầu sách đã có trong database: ' + duplicateTitles.map(a => a.isbn).join(', ')
                
            });
        }

        const savedDauSach = [];
        for (const dauSach of dauSachList) {
            // Làm sạch dữ liệu
            const cleanISBN = dauSach.isbn.trim();
            const cleanTenSach = dauSach.tenSach.trim();
            const cleanKhoSach = dauSach.khoSach ? dauSach.khoSach.trim() : null;
            const cleanNoiDung = dauSach.noiDung ? dauSach.noiDung.trim() : null;
            const cleanHinhAnhPath = dauSach.hinhAnhPath ? dauSach.hinhAnhPath.trim() : null;
            const cleanNhaXB = dauSach.nhaXB ? dauSach.nhaXB.trim() : null;
            const cleanMaTL = dauSach.maTL.trim();

            // Xử lý ngày xuất bản (chuyển đổi sang định dạng SQL Server: YYYY-MM-DD)
            
            const date = parseDate(dauSach.ngayXuatBan);
            
            // Chuẩn bị tham số cho stored procedure
            const params = [
                { name: 'ISBN', type: sql.NChar, value: cleanISBN },
                { name: 'TENSACH', type: sql.NVarChar, value: cleanTenSach },
                { name: 'KHOSACH', type: sql.NVarChar, value: cleanKhoSach },
                { name: 'NOIDUNG', type: sql.NVarChar, value: cleanNoiDung },
                { name: 'HINHANHPATH', type: sql.NVarChar(sql.MAX), value: cleanHinhAnhPath },
                { name: 'NGAYXUATBAN', type: sql.SmallDateTime, value: date },
                { name: 'LANXUATBAN', type: sql.Int, value: dauSach.lanXuatBan ? parseInt(dauSach.lanXuatBan) : null },
                { name: 'SOTRANG', type: sql.Int, value: dauSach.soTrang ? parseInt(dauSach.soTrang) : null },
                { name: 'GIA', type: sql.BigInt, value: dauSach.gia ? parseInt(dauSach.gia) : null },
                { name: 'NHAXB', type: sql.NVarChar, value: cleanNhaXB },
                { name: 'MANGONNGU', type: sql.Int, value: dauSach.maNgonNgu ? parseInt(dauSach.maNgonNgu) : null },
                { name: 'MATL', type: sql.NChar, value: cleanMaTL },
                { name: 'MATACGIA', type: sql.NVarChar, value: Array.isArray(dauSach.maTacGia) ? dauSach.maTacGia.join(',') : dauSach.maTacGia }
            ];
            console.log(params)

            // Gọi stored procedure để thêm đầu sách
            await executeStoredProcedure(pool, 'sp_ThemDauSach', params);
            savedDauSach.push({
                isbn: cleanISBN,
                tenSach: cleanTenSach,
                khoSach: cleanKhoSach,
                noiDung: cleanNoiDung,
                hinhAnhPath: cleanHinhAnhPath,
                ngayXuatBan: date,
                lanXuatBan: dauSach.lanXuatBan,
                soTrang: dauSach.soTrang,
                gia: dauSach.gia,
                nhaXB: cleanNhaXB,
                maNgonNgu: dauSach.maNgonNgu,
                maTL: cleanMaTL,
                maTacGia: Array.isArray(dauSach.maTacGia) ? dauSach.maTacGia.join(',') : dauSach.maTacGia
            });
        }

        pushToUndoStack('create_dausach', savedDauSach);

        res.json({ 
            success: true,
            isEmptyStack: isEmpty()
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }

};

// [POST] /admin/isbn_book/update
module.exports.updateDauSach = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        const dauSach = req.body;
    
        if (dauSach.oldisbn != dauSach.isbn && await DauSachRepository.checkExist(pool, dauSach)) {
            return res.status(400).json({
                success: false, 
                message: 'Đầu sách sau có ISBN trùng với ISBN khác của đầu sách đã có trong database: ' + dauSach.isbn
            });
        }

        let imageUrl = "";
        if (req.body.hasNewImage == true) {
            imageUrl = req.body.hinhAnhUrls[0];
        } else {
            imageUrl = req.body.currentImagePath
        }
        const oldDauSach = await DauSachRepository.getDauSach(pool, dauSach.oldisbn);
        console.log("oldDauSach ", oldDauSach)

        const cleanOldISBN = dauSach.oldisbn.trim();
        const cleanISBN = dauSach.isbn.trim();
        const cleanTenSach = dauSach.tenSach.trim();
        const cleanKhoSach = dauSach.khoSach ? dauSach.khoSach.trim() : null;
        const cleanNoiDung = dauSach.noiDung ? dauSach.noiDung.trim() : null;
        const cleanNhaXB = dauSach.nhaXB ? dauSach.nhaXB.trim() : null;
        const cleanMaTL = dauSach.maTL.trim();

        const date = parseDate(dauSach.ngayXuatBan);

        // Chuẩn bị tham số cho stored procedure
        const params = [
            { name: 'OLDISBN', type: sql.NChar, value: cleanOldISBN },
            { name: 'ISBN', type: sql.NChar, value: cleanISBN },
            { name: 'TENSACH', type: sql.NVarChar, value: cleanTenSach },
            { name: 'KHOSACH', type: sql.NVarChar, value: cleanKhoSach },
            { name: 'NOIDUNG', type: sql.NVarChar, value: cleanNoiDung },
            { name: 'HINHANHPATH', type: sql.NVarChar(sql.MAX), value: imageUrl },
            { name: 'NGAYXUATBAN', type: sql.SmallDateTime, value: date },
            { name: 'LANXUATBAN', type: sql.Int, value: dauSach.lanXuatBan ? parseInt(dauSach.lanXuatBan) : null },
            { name: 'SOTRANG', type: sql.Int, value: dauSach.soTrang ? parseInt(dauSach.soTrang) : null },
            { name: 'GIA', type: sql.BigInt, value: dauSach.gia ? parseInt(dauSach.gia) : null },
            { name: 'NHAXB', type: sql.NVarChar, value: cleanNhaXB },
            { name: 'MANGONNGU', type: sql.Int, value: dauSach.maNgonNgu ? parseInt(dauSach.maNgonNgu) : null },
            { name: 'MATL', type: sql.NChar, value: cleanMaTL },
            { name: 'MATACGIA', type: sql.NVarChar, value: Array.isArray(dauSach.maTacGia) ? dauSach.maTacGia.join(',') : dauSach.maTacGia }
        ];
        console.log(params)


        // Gọi stored procedure để thêm đầu sách
        await executeStoredProcedure(pool, 'sp_SuaDauSach', params);
        pushToUndoStack('edit_dausach', { oldData: oldDauSach, newData: dauSach});

        res.json({ 
            success: true,
            isEmptyStack: isEmpty() 
        });
    } catch (error) {
        res.json({
            success: false
        })
    }
};

// [DELETE] /admin/isbn_book/delete/:isbn
module.exports.deleteTitle = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { isbn } = req.body;
    const params = [
        { name: 'ISBN', type: sql.NChar, value: isbn }
    ];

    try {
        // Lấy thông tin đầu sách trước khi xóa để lưu vào undo stack
        const dauSach = await DauSachRepository.getDauSach(pool, isbn);
        console.log("DauSach to delete: ", dauSach)

        await executeStoredProcedureWithTransaction(pool, 'sp_XoaDauSach', params);
        pushToUndoStack('delete_dausach', dauSach);

        res.status(200).json({
            success: true,
            isEmptyStack: isEmpty()
        })
    } catch (error) {
        req.flash('error', error);
        res.status(500).send('Có lỗi xảy ra khi xóa đầu sách!');
    }
};

module.exports.getNextISBN = async (req, res) => {
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

    const nextId = 'ISBN000001'; // Giả định logic tạo ISBN
    res.json({ success: true, nextId });
};

// [POST] /admin/isbn_book/undo
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
        if (action === 'create_sach') {
            // Undo create sach: Xóa mềm các sách đã thêm
            for (const sach of Array.isArray(data) ? data : [data]) {
                const params = [
                    { name: 'MASACH', type: sql.NChar, value: sach.maSach }
                ];
                await executeStoredProcedure(pool, 'sp_XoaSach', params);
            }
        } else if (action === 'delete_sach') {
            // Undo delete sach: Thêm lại sách đã xóa
            const params = [
                { name: 'MASACH', type: sql.NChar, value: data.maSach },
                { name: 'ISBN', type: sql.NChar, value: data.isbn },
                { name: 'TINHTRANG', type: sql.Bit, value: data.tinhTrang },
                { name: 'CHOMUON', type: sql.Bit, value: data.choMuon },
                { name: 'MANGANTU', type: sql.Int, value: data.maNganTu }
            ];
            await executeStoredProcedure(pool, 'sp_ThemSach', params);
        } else if (action === 'edit_sach') {
            // Undo edit sach: Khôi phục thông tin cũ
            const oldData = data.oldData;
            console.log("oldData ", oldData)
            const newData = data.newData  
            console.log("newData ", newData)
            const params = [
                { name: 'MASACHCU', type: sql.NChar, value: newData.maSach },
                { name: 'MASACHMOI', type: sql.NChar, value: oldData.maSach },
                { name: 'ISBN', type: sql.NChar, value: oldData.isbn },
                { name: 'TINHTRANG', type: sql.Bit, value: oldData.tinhTrang },
                { name: 'CHOMUON', type: sql.Bit, value: oldData.choMuon },
                { name: 'MANGANTU', type: sql.Int, value: oldData.maNganTu }
            ];
            await executeStoredProcedureWithTransaction(pool, 'sp_SuaSach', params);
        } else if (action === 'create_dausach') {
            // Undo create dausach: Xóa mềm các đầu sách đã thêm
            for (const dauSach of Array.isArray(data) ? data : [data]) {
                const params = [
                    { name: 'ISBN', type: sql.NChar, value: dauSach.isbn }
                ];
                await executeStoredProcedure(pool, 'sp_XoaDauSach', params);
            }
        } else if (action === 'delete_dausach') {
            // Undo delete dausach: Thêm lại đầu sách đã xóa
            const params = [
                { name: 'ISBN', type: sql.NChar, value: data.ISBN },
                { name: 'TENSACH', type: sql.NVarChar, value: data.TENSACH },
                { name: 'KHOSACH', type: sql.NVarChar, value: data.KHOSACH },
                { name: 'NOIDUNG', type: sql.NVarChar, value: data.NOIDUNG },
                { name: 'HINHANHPATH', type: sql.NVarChar, value: data.HINHANHPATH },
                { name: 'NGAYXUATBAN', type: sql.SmallDateTime, value: data.NGAYXUATBAN },
                { name: 'LANXUATBAN', type: sql.Int, value: data.LANXUATBAN },
                { name: 'SOTRANG', type: sql.Int, value: data.SOTRANG },
                { name: 'GIA', type: sql.BigInt, value: parseInt(data.GIA) },
                { name: 'NHAXB', type: sql.NVarChar, value: data.NHAXB },
                { name: 'MANGONNGU', type: sql.Int, value: data.MANGONNGU },
                { name: 'MATL', type: sql.NChar, value: data.MATL },
                { name: 'MATACGIA', type: sql.NVarChar, value: Array.isArray(data.MATACGIA) ? data.MATACGIA.join(',') : data.MATACGIA }
            ];
            await executeStoredProcedure(pool, 'sp_ThemDauSach', params);
        } else if (action === 'edit_dausach') {
            // Undo edit dausach: Khôi phục thông tin cũ
            const oldData = data.oldData;
            console.log("oldData ", oldData)
            const newData = data.newData;
            console.log("newData ", newData)
            const params = [
                { name: 'OLDISBN', type: sql.NChar, value: newData.isbn },
                { name: 'ISBN', type: sql.NChar, value: oldData.ISBN },
                { name: 'TENSACH', type: sql.NVarChar, value: oldData.TENSACH },
                { name: 'KHOSACH', type: sql.NVarChar, value: oldData.KHOSACH },
                { name: 'NOIDUNG', type: sql.NVarChar, value: oldData.NOIDUNG },
                { name: 'HINHANHPATH', type: sql.NVarChar, value: oldData.HINHANHPATH },
                { name: 'NGAYXUATBAN', type: sql.SmallDateTime, value: oldData.NGAYXUATBAN },
                { name: 'LANXUATBAN', type: sql.Int, value: oldData.LANXUATBAN },
                { name: 'SOTRANG', type: sql.Int, value: oldData.SOTRANG },
                { name: 'GIA', type: sql.BigInt, value: parseInt(oldData.GIA) },
                { name: 'NHAXB', type: sql.NVarChar, value: oldData.NHAXB },
                { name: 'MANGONNGU', type: sql.Int, value: oldData.MANGONNGU },
                { name: 'MATL', type: sql.NChar, value: oldData.MATL },
                { name: 'MATACGIA', type: sql.NVarChar, value: Array.isArray(oldData.MATACGIA) ? oldData.MATACGIA.join(',') : oldData.MATACGIA }
            ];
            console.log("params ", params)
            await executeStoredProcedure(pool, 'sp_SuaDauSach', params);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error in undo:', error);
        res.json({ success: false, message: 'Không thể thực hiện undo!' });
    }
};

// [POST] /admin/isbn_book/clear-undo
module.exports.clearUndo = async (req, res) => {
    try {
        clearUndoStack();
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing undo stack:', error);
        res.json({ success: false, message: 'Không thể xóa stack undo!' });
    }
};

// [GET] /admin/isbn_book/report?type=list/most-borrow
module.exports.getReport = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const type = req.query.type;

    if (type == 'list') {
        const typeList = await TheLoaiRepository.getAll(pool);  
        const dauSachList = [];

        for (const type of typeList) {
            const dauSach = await DauSachRepository.getAllBaseOnType(pool, type.maTL);
            
            const categoryData = {
                tenTL: type.tenTL,
                books: dauSach
            };
            dauSachList.push(categoryData);
        }

        const empId = req.session.empId;
        const empData = await NhanVienRepository.getById(pool, empId);

        res.render('admin/pages/dausach_sach/reportList', { 
            dauSachList: dauSachList,
            printDate: moment().format('DD/MM/YYYY'),
            empName: `${empData.hoNV} ${empData.tenNV}`
        });
    }
    else if (type == 'most-borrow') {
        let { startDate, endDate, quantity } = req.query;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const updatedQuantity = parseInt(quantity);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).send('Ngày không hợp lệ');
            }

            if (isNaN(updatedQuantity) || updatedQuantity <= 0) {
                return res.status(400).send('Số lượng sách không hợp lệ');
            }

            if (start > end) {
                return res.status(400).send('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
            }

            const dauSachList = await DauSachRepository.getAllBaseOnDate(pool, start, end, updatedQuantity);
            const empId = req.session.empId;
            const empData = await NhanVienRepository.getById(pool, empId);

            res.render('admin/pages/dausach_sach/reportMostBorrow', { 
                printDate: moment().format('DD/MM/YYYY'),
                startDate: moment(start).format('DD/MM/YYYY'),
                endDate: moment(end).format('DD/MM/YYYY'),
                dauSachList: dauSachList,
                quantity: updatedQuantity,
                hasData: dauSachList.length > 0,
                empName: `${empData.hoNV} ${empData.tenNV}`
            });
        } else {
            res.render('admin/pages/dausach_sach/reportMostBorrow', { 
                printDate: moment().format('DD/MM/YYYY'),
                dauSachList: [],
                hasData: false
            });
        }
    }
};

// [POST] /admin/isbn_book/download-report?type=list/most-borrow
module.exports.downloadReport = async (req, res) => {
    try {
        const type = req.query.type;

        const { dauSachList, printDate, quantity, startDate, endDate, empName } = req.body;
        const parsedDauSachList = JSON.parse(dauSachList);

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
                res.render('admin/pages/dausach_sach/reportList', {
                    dauSachList: parsedDauSachList,
                    printDate: printDate,
                    empName: empName
                }, (err, html) => {
                    if (err) reject(err);
                    resolve(html);
                });
            });
        }
        else if (type == 'most-borrow') {
            html = await new Promise((resolve, reject) => {
                res.render('admin/pages/dausach_sach/reportMostBorrow', {
                    printDate: printDate,
                    dauSachList: parsedDauSachList,
                    quantity: quantity,
                    startDate: startDate,
                    endDate: endDate,
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
            res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_danh_muc_dau_sach.pdf"');
        }
        else if (type == 'most-borrow') {
            res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_sach_muon_nhieu_nhat.pdf"');
        }

        // Gửi PDF buffer về client
        res.end(pdfBuffer);
    } catch (err) {
        console.error('Lỗi khi tạo PDF:', err);
        res.status(500).send('Lỗi khi tạo PDF: ' + err.message);
    }
};

// [POST] /admin/isbn_book/download-excel?type=list/most-borrow
module.exports.downloadExcel = async (req, res) => {
    try {
        const type = req.query.type;
        const { dauSachList, printDate, quantity, startDate, endDate, empName } = req.body;
        const parsedDauSachList = JSON.parse(dauSachList);

        let workbook = xlsx.utils.book_new();
        let worksheetData = [];

        if (type === 'list') {
            // Header cho báo cáo danh mục
            worksheetData.push(['DANH MỤC ĐẦU SÁCH']);
            worksheetData.push([]);
            worksheetData.push(['STT', 'ISBN', 'Tên sách', 'Ngày XB', 'Số trang', 'Tác giả', 'Ngôn ngữ', 'Số cuốn']);

            let totalBooks = 0;
            let sttCounter = 1;

            parsedDauSachList.forEach(dauSach => {
                // Thêm header thể loại
                worksheetData.push([`Thể loại: ${dauSach.tenTL}`, '', '', '', '', '', '', '']);
                
                dauSach.books.forEach(sach => {
                    const ngayXB = new Date(sach.ngayXuatBan).toLocaleDateString('vi-VN');
                    worksheetData.push([
                        sttCounter++,
                        sach.isbn,
                        sach.tenSach,
                        ngayXB,
                        sach.soTrang,
                        sach.tacGia,
                        sach.ngonNgu,
                        sach.soCuon
                    ]);
                    totalBooks += sach.soCuon;
                });

                // Tổng số sách của thể loại
                const categoryTotal = dauSach.books.reduce((sum, book) => sum + book.soCuon, 0);
                worksheetData.push([`Số đầu sách: ${categoryTotal}`, '', '', '', '', '', '', '']);
                worksheetData.push([]);
            });

            // Tổng cộng
            worksheetData.push([`Số đầu sách thư viện: ${totalBooks}`, '', '', '', '', '', '', '']);
            worksheetData.push([]);
            worksheetData.push([`Ngày lập: ${printDate}`, '', '', '', '', '', '', '']);
            worksheetData.push([]);
            worksheetData.push([`Nhân viên lập: ${empName}`, '', '', '', '', '', '', '']);

        } else if (type === 'most-borrow') {
            // Header cho báo cáo sách mượn nhiều nhất
            worksheetData.push(['BÁO CÁO SÁCH MƯỢN NHIỀU NHẤT']);
            worksheetData.push([`Từ ngày: ${startDate} - Đến ngày: ${endDate}`]);
            worksheetData.push([`Top ${quantity} sách mượn nhiều nhất`]);
            worksheetData.push([]);
            worksheetData.push(['STT', 'ISBN', 'Tên sách', 'Tác giả', 'Thể loại', 'Số lần mượn']);

            parsedDauSachList.forEach((sach, index) => {
                worksheetData.push([
                    index + 1,
                    sach.isbn,
                    sach.tenSach,
                    sach.hoTenTG,
                    sach.tenTL,
                    sach.soLuongMuon || 0
                ]);
            });

            worksheetData.push([]);
            worksheetData.push([`Ngày lập: ${printDate}`, '', '', '', '', '']);
            worksheetData.push([]);
            worksheetData.push([`Nhân viên lập: ${empName}`, '', '', '', '', '']);
        }

        // Tạo worksheet
        const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

        // Styling cho header
        const range = xlsx.utils.decode_range(worksheet['!ref']);
        
        // Merge cell cho tiêu đề
        if (!worksheet['!merges']) worksheet['!merges'] = [];
        worksheet['!merges'].push({
            s: { r: 0, c: 0 },
            e: { r: 0, c: 7 }
        });

        // Thêm worksheet vào workbook
        const sheetName = type === 'list' ? 'Danh mục đầu sách' : 'Sách mượn nhiều nhất';
        xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Tạo buffer
        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Thiết lập headers cho response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Length', excelBuffer.length);
        
        if (type === 'list') {
            res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_danh_muc_dau_sach.xlsx"');
        } else if (type === 'most-borrow') {
            res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_sach_muon_nhieu_nhat.xlsx"');
        }

        // Gửi Excel buffer về client
        res.end(excelBuffer);
    } catch (err) {
        console.error('Lỗi khi tạo Excel:', err);
        res.status(500).send('Lỗi khi tạo Excel: ' + err.message);
    }
};  

