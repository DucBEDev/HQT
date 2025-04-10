const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');
const TacGiaRepository = require('../../repositories/TacGiaRepository'); // Giả định bạn sẽ tạo repository tương ứng
const systemConfig = require('../../configs/system');
const TacGia = require('../../models/TacGia');

// [GET] /author
module.exports.index = async (req, res) => {
    const list = await TacGiaRepository.getAll();

    res.render('admin/pages/tacgia/index', {
        authorList: list,
        pageTitle: 'Quản lý tác giả',
    });
};

// [DELETE] /author/delete/:maTacGia
module.exports.delete = async (req, res) => {
    console.log("Called");

    const { maTacGia } = req.params; // Lấy giá trị maTacGia từ req.params
    console.log(maTacGia);

    // Định dạng params thành mảng chứa một đối tượng
    const params = [
        { name: 'MATACGIA', type: sql.Int, value: maTacGia }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_XoaTacGia', params);
        res.redirect(`${systemConfig.prefixAdmin}/author`);
    } catch (error) {
        console.error('Error deleting author:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa tác giả!');
    }
};

// [GET] /author/create
module.exports.create = async (req, res) => {
    res.render('admin/pages/tacgia/create', {
        pageTitle: 'Thêm tác giả',
    });
};

// [POST] /author/create
module.exports.createPost = async (req, res) => {
    const authorList = req.body;

    for (const author of authorList) {
        const cleanHoTenTG = author.hoTenTG.trim().replace(/\s+/g, ' ');
        const cleanDiaChiTG = author.diaChiTG.trim().replace(/\s+/g, ' ');

        const params = [
            { name: 'HOTENTG', type: sql.NVarChar, value: cleanHoTenTG },
            { name: 'DIACHITG', type: sql.NVarChar, value: cleanDiaChiTG },
            { name: 'DIENTHOAITG', type: sql.NVarChar, value: author.dienThoaiTG }
        ];
        await executeStoredProcedureWithTransaction('sp_ThemTacGia', params);
    }

    res.json({ success: true });
};


// [GET] /author/edit/:maTacGia
module.exports.edit = async (req, res) => {
    const { maTacGia } = req.params;

    // Giả định có hàm lấy thông tin tác giả từ DB
    const author = await TacGiaRepository.getById(maTacGia); // Bạn cần triển khai hàm này

    res.render('admin/pages/tacgia/edit', {
        author,
        pageTitle: 'Chỉnh sửa tác giả',
    });
};

// [POST] /author/edit/:maTacGia
module.exports.editPost = async (req, res) => {
    const { maTacGia } = req.params;
    const { hoTenTG, diaChiTG, dienThoaiTG } = req.body;

    const author = new TacGia(maTacGia, hoTenTG, diaChiTG, dienThoaiTG)

    const params = [
        { name: 'MATACGIA', type: sql.Int, value: maTacGia },
        { name: 'HOTENTG', type: sql.NVarChar, value: hoTenTG },
        { name: 'DIACHITG', type: sql.NVarChar, value: diaChiTG },
        { name: 'DIENTHOAITG', type: sql.NVarChar, value: dienThoaiTG }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_SuaTacGia', params);
        res.render('admin/pages/tacgia/edit', {
            author: author,
            pageTitle: 'Chỉnh sửa tác giả',
        });
    } catch (error) {
        console.error('Error updating author:', error);
        res.status(500).send('Có lỗi xảy ra khi cập nhật tác giả!');
    }
};


// [GET] /author/next-id
module.exports.getNextId = async (req, res) => {
    const nextId = await TacGiaRepository.getNextId();
    res.json({ success: true, nextId });
};

