const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');
const DauSachRepository = require('../../repositories/DauSachRepository'); // Giả định bạn sẽ tạo repository tương ứng
const SachRepository = require('../../repositories/SachRepository'); // Giả định bạn sẽ tạo repository tương ứng
const NgonNguRepository = require('../../repositories/NgonNguRepository'); // Giả định bạn sẽ tạo repository tương ứng
const TheLoaihRepository = require('../../repositories/TheLoaiRepository'); // Giả định bạn sẽ tạo repository tương ứng
const TacGiaRepository = require('../../repositories/TacGiaRepository'); // Giả định bạn sẽ tạo repository tương ứng
const systemConfig = require('../../configs/system');
const DauSach = require('../../models/DauSach');
const Sach = require('../../models/Sach');

module.exports.index = async (req, res) => {
    const dauSachList = await DauSachRepository.getAll(); // Giả định hàm lấy danh sách đầu sách
    const sachList = [];
    const ngonNguList = await NgonNguRepository.getAll();
    const theLoaiList = await TheLoaihRepository.getAll();
    const tacGiaList = await TacGiaRepository.getAll();
    res.render('admin/pages/dausach_sach/index', {
        dauSachList, sachList, ngonNguList, theLoaiList, tacGiaList,
        pageTitle: 'Quản Lý Đầu Sách và Sách'
    });
};

module.exports.getSachByISBN = async (req, res) => {
    const { selectedISBN } = req.query;
    const sachList = await getSachListByISBN(selectedISBN); // Giả định hàm lấy danh sách sách
    res.json({ success: true, sachList });
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

module.exports.deleteDauSach = async (req, res) => {
    const { isbn } = req.params;
    // Xử lý xóa trong DB
    res.json({ success: true });
};

module.exports.deleteSach = async (req, res) => {
    const { maSach } = req.params;
    // Xử lý xóa trong DB
    res.json({ success: true });
};

module.exports.getNextISBN = async (req, res) => {
    const nextId = 'ISBN000001'; // Giả định logic tạo ISBN
    res.json({ success: true, nextId });
};