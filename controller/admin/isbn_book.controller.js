const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, getUserPool } = require('../../configs/database');
const moment = require('moment');
const puppeteer = require('puppeteer');
const { pushToUndoStack, popUndoStack, clearUndoStack } = require('../../public/js/adminjs/isbn_book/isbn_book_undo');

const DauSachRepository = require('../../repositories/DauSachRepository'); 
const SachRepository = require('../../repositories/SachRepository'); 
const NgonNguRepository = require('../../repositories/NgonNguRepository'); 
const TheLoaiRepository = require('../../repositories/TheLoaiRepository'); 
const TacGiaRepository = require('../../repositories/TacGiaRepository'); 
const NganTuRepository = require('../../repositories/NganTuRepository'); 

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
        pageTitle: 'Quản Lý Đầu Sách và Sách'
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

    const dauSach = await DauSachRepository.getDauSach(pool, req.query.isbn);

    res.json({ success: true, dauSach });
};

// [GET] /admin/isbn_book/book
module.exports.getBooks = async (req, res) => {
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

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
};

// [POST] /admin/isbn_book/book/delete
module.exports.deleteBook = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maSach } = req.body;
    console.log(maSach)
    const params = [
        { name: 'MASACH', type: sql.NChar, value: maSach }
    ];

    try {
        const sach = await SachRepository.getByMaSach(pool, maSach);
        //console.log("sach ", sach)
        await executeStoredProcedure(pool, 'sp_XoaSach', params);
        pushToUndoStack('delete_sach', sach);
        res.status(200).json({
            success: true
        })
    } catch (error) {
        req.flash('error', error);
        console.error('Error deleting type:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa sách!');
    }
};

// [POST] /admin/isbn_book/book/update
module.exports.update = async (req, res) => {
    console.log("Updating book ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { oldMaSach, newMaSach, tinhTrang, choMuon, maNganTu, isbn } = req.body;
    console.log(oldMaSach)
    console.log(newMaSach)
    console.log(tinhTrang)
    console.log(choMuon)
    console.log(maNganTu)
    console.log(isbn)

    try {
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

            console.log("params ", params)


        await executeStoredProcedureWithTransaction(pool, 'sp_SuaSach', params);
        pushToUndoStack('edit_sach', { oldData: oldSach, newData: { maSach: cleanMaSachMoi, isbn: cleanISBN, tinhTrang, choMuon, maNganTu } });

        res.status(200).json({
            success: true
        })
    } catch (error) {
        req.flash('error', error);
        console.error('Error deleting type:', error);
        res.status(500).send('Có lỗi xảy ra khi sửa sách!');
    }
};

// [POST] /admin/isbn_book/book/write
module.exports.write = async (req, res) => {
    console.log("Creating book ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const sachList = req.body;
    //console.log(sachList)

    // Nhớ parse thằng ngày xuất bản cho đúng định dạng SQL theo câu lệnh sau
    // const ngayXuatBan = parseDate(...); truyền tham số vào

    try {
        const savedSach = [];
        for (const sach of sachList) {
            //console.log("sach ", sach)
            // Làm sạch dữ liệu
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

            //console.log("params ", params)

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
            // req.flash('success', 'Thêm sách thành công!');
            
            //  res.redirect(`${systemConfig.prefixAdmin}/isbn_book`);
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error creating sach:', error);
        res.json({ success: false, message: error.message });
    }
}

// [POST] /admin/isbn_book/create
module.exports.createDauSach = async (req, res) => {
    console.log("Creating dauSach ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    console.log("req.body ", req.body)

    const dauSachList = Object.values(req.body.dauSach || []).map((ds, index) => ({
        ...ds,
        hinhAnhPath: req.body.hinhAnhUrls ? req.body.hinhAnhUrls[index] : null
    }));

    console.log("dauSachList to save: ", dauSachList);

    try
    {
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
                { name: 'HINHANHPATH', type: sql.NVarChar, value: cleanHinhAnhPath },
                { name: 'NGAYXUATBAN', type: sql.SmallDateTime, value: date },
                { name: 'LANXUATBAN', type: sql.Int, value: dauSach.lanXuatBan ? parseInt(dauSach.lanXuatBan) : null },
                { name: 'SOTRANG', type: sql.Int, value: dauSach.soTrang ? parseInt(dauSach.soTrang) : null },
                { name: 'GIA', type: sql.BigInt, value: dauSach.gia ? parseInt(dauSach.gia) : null },
                { name: 'NHAXB', type: sql.NVarChar, value: cleanNhaXB },
                { name: 'MANGONNGU', type: sql.Int, value: dauSach.maNgonNgu ? parseInt(dauSach.maNgonNgu) : null },
                { name: 'MATL', type: sql.NChar, value: cleanMaTL },
                { name: 'MATACGIA', type: sql.Int, value: parseInt(dauSach.maTacGia) }
            ];

            console.log("params ", params);

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
                maTacGia: dauSach.maTacGia
            });
        }

        pushToUndoStack('create_dausach', savedDauSach);

        res.json({ success: true });
    }
    catch 
    (error) 
    {
        console.error('Error creating dauSach:', error);
        return res.status(500).json({ success: false, message: error.message });
    }

};

// [POST] /admin/isbn_book/update
module.exports.updateDauSach = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    //console.log("req.body ", req.body)
    const dauSach = req.body;
    console.log(dauSach)
    const oldDauSach = await DauSachRepository.getDauSach(pool, dauSach.oldisbn);

    const cleanOldISBN = dauSach.oldisbn.trim();
    const cleanISBN = dauSach.isbn.trim();
    const cleanTenSach = dauSach.tenSach.trim();
    const cleanKhoSach = dauSach.khoSach ? dauSach.khoSach.trim() : null;
    const cleanNoiDung = dauSach.noiDung ? dauSach.noiDung.trim() : null;
    const cleanHinhAnhPath = dauSach.hinhAnhPath ? dauSach.hinhAnhPath.trim() : null;
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
        { name: 'HINHANHPATH', type: sql.NVarChar, value: cleanHinhAnhPath },
        { name: 'NGAYXUATBAN', type: sql.SmallDateTime, value: date },
        { name: 'LANXUATBAN', type: sql.Int, value: dauSach.lanXuatBan ? parseInt(dauSach.lanXuatBan) : null },
        { name: 'SOTRANG', type: sql.Int, value: dauSach.soTrang ? parseInt(dauSach.soTrang) : null },
        { name: 'GIA', type: sql.BigInt, value: dauSach.gia ? parseInt(dauSach.gia) : null },
        { name: 'NHAXB', type: sql.NVarChar, value: cleanNhaXB },
        { name: 'MANGONNGU', type: sql.Int, value: dauSach.maNgonNgu ? parseInt(dauSach.maNgonNgu) : null },
        { name: 'MATL', type: sql.NChar, value: cleanMaTL },
        { name: 'MATACGIA', type: sql.Int, value: parseInt(dauSach.maTacGia) }
    ];

    console.log("params ", params);

    // Gọi stored procedure để thêm đầu sách
    await executeStoredProcedureWithTransaction(pool, 'sp_SuaDauSach', params);
    pushToUndoStack('edit_dausach', { oldData: oldDauSach, newData: dauSach});

    // const dauSachList = Object.values(req.body.dauSach || []).map((ds, index) => ({
    //     ...ds,
    //     hinhAnhPath: req.body.hinhAnhUrls ? req.body.hinhAnhUrls[index] : null
    // }));

    // console.log("dauSachList to save: ", dauSachList);

    // Lưu dauSachList vào DB (giả sử bạn dùng một ORM như Mongoose hoặc Sequelize)
    // await DauSachModel.create(dauSachList);

    res.json({ success: true });
};


// [DELETE] /admin/isbn_book/delete/:isbn
module.exports.deleteTitle = async (req, res) => {
    console.log("Deleting title ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }


    const { isbn } = req.body;
    console.log("req.body ", req.body)

    const params = [
        { name: 'ISBN', type: sql.NChar, value: isbn }
    ];

    try {
        // Lấy thông tin đầu sách trước khi xóa để lưu vào undo stack
        const dauSach = await DauSachRepository.getDauSach(pool, isbn);
        console.log("dauSach ", dauSach)

        await executeStoredProcedureWithTransaction(pool, 'sp_XoaDauSach', params);
        pushToUndoStack('delete_dausach', dauSach);
        req.flash('success', 'Xóa đầu sách thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/isbn_book`);
        // await executeStoredProcedureWithTransaction(pool, 'sp_XoaDauSach', params);
        
        res.status(200).json({
            success: true
        })
    } catch (error) {
        req.flash('error', error);
        console.error('Error deleting type:', error);
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
            const  oldData  = data.oldData;
            console.log("oldData ", oldData)
            const  newData  = data.newData  
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
                { name: 'MATACGIA', type: sql.Int, value: data.MATACGIA }
            ];
            await executeStoredProcedure(pool, 'sp_ThemDauSach', params);
        } else if (action === 'edit_dausach') {
            // Undo edit dausach: Khôi phục thông tin cũ
            const  oldData  = data.oldData;
            console.log("oldData ", oldData)
            const  newData  = data.newData;
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
                { name: 'MATACGIA', type: sql.Int, value: oldData.MATACGIA }
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

        res.render('admin/pages/dausach_sach/reportList', { 
            dauSachList: dauSachList,
            printDate: moment().format('DD/MM/YYYY')
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

            res.render('admin/pages/dausach_sach/reportMostBorrow', { 
                printDate: moment().format('DD/MM/YYYY'),
                startDate: moment(start).format('DD/MM/YYYY'),
                endDate: moment(end).format('DD/MM/YYYY'),
                dauSachList: dauSachList,
                quantity: updatedQuantity,
                hasData: dauSachList.length > 0
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

        const { dauSachList, printDate, quantity, startDate, endDate } = req.body;
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
                    printDate: printDate
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
                    endDate: endDate
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



