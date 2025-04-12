const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');

const DauSachRepository = require('../../repositories/DauSachRepository'); 
const SachRepository = require('../../repositories/SachRepository'); 
const NgonNguRepository = require('../../repositories/NgonNguRepository'); 
const TheLoaiRepository = require('../../repositories/TheLoaiRepository'); 
const TacGiaRepository = require('../../repositories/TacGiaRepository'); 
const NganTuRepository = require('../../repositories/NganTuRepository'); 

const systemConfig = require('../../configs/system');
const DauSach = require('../../models/DauSach');
const Sach = require('../../models/Sach');

// [GET] /admin/isbn_book
module.exports.index = async (req, res) => {
    const dauSachList = await DauSachRepository.getAll(); 
    const ngonNguList = await NgonNguRepository.getAll();
    const theLoaiList = await TheLoaiRepository.getAll();
    const tacGiaList = await TacGiaRepository.getAll();

    res.render('admin/pages/dausach_sach/index', {
        dauSachList: dauSachList,
        ngonNguList: ngonNguList,
        theLoaiList: theLoaiList,
        tacGiaList: tacGiaList,
        pageTitle: 'Quản Lý Đầu Sách và Sách'
    });
};

// [GET] /admin/isbn_book/book
module.exports.getBooks = async (req, res) => {
    const { selectedISBN } = req.query;
    const sachList = await SachRepository.getBooksByISBN(selectedISBN);
    const updatedSachList = await Promise.all(sachList.map(async (sach) => {
        const nganTu = await NganTuRepository.getById(sach.maNganTu);
        return {
            ...sach,
            ke: nganTu.ke
        };
    }));
    const nganTuList = await NganTuRepository.getAll(); 

    res.json({ 
        success: true, 
        sachList: updatedSachList,
        nganTuList: nganTuList
    });
};

// [GET] /admin/isbn_book/book/next-id
module.exports.getNextId = async (req, res) => {
    const nextId = await SachRepository.getNextId();
    const nganTuList = await NganTuRepository.getAll();

    res.json({ 
        success: true,
        nextId: nextId,
        nganTuList: nganTuList
    });
};

// [DELETE] /admin/isbn_book/book/delete/:maSach
module.exports.deleteBook = async (req, res) => {
    const { maSach } = req.params;

    const params = [
        { name: 'MASACH', type: sql.NChar, value: maSach }
    ];

    try {
        // await executeStoredProcedureWithTransaction('sp_XoaSach', params);
        req.flash('success', 'Xóa sách thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/isbn_book`);
    } catch (error) {
        req.flash('error', error);
        console.error('Error deleting type:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa sách!');
    }
};

module.exports.createDauSach = async (req, res) => {
    const dauSachList = req.body;
    // Xử lý lưu vào DB
    res.json({ success: true });
};

module.exports.createSach = async (req, res) => {
    const sachList = req.body.sachList;
    // Xử lý lưu vào DB
    res.json({ success: true });
};

// [DELETE] /admin/isbn_book/delete/:isbn
module.exports.deleteTitle = async (req, res) => {
    const { isbn } = req.params;

    const params = [
        { name: 'ISBN', type: sql.NChar, value: isbn }
    ];

    try {
        // await executeStoredProcedureWithTransaction('sp_XoaDauSach', params);
        req.flash('success', 'Xóa đầu sách thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/isbn_book`);
    } catch (error) {
        req.flash('error', error);
        console.error('Error deleting type:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa đầu sách!');
    }
};

module.exports.getNextISBN = async (req, res) => {
    const nextId = 'ISBN000001'; // Giả định logic tạo ISBN
    res.json({ success: true, nextId });
};