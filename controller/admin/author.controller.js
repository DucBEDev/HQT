const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, executeStoredProcedureWithTransactionAndReturnCode } = require('../../configs/database');
const TacGiaRepository = require('../../repositories/TacGiaRepository'); // Giả định bạn sẽ tạo repository tương ứng
const systemConfig = require('../../configs/system');
const TacGia = require('../../models/TacGia');
const { pushToUndoStack, popUndoStack } = require('../../public/js/adminjs/author/author-undo');

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
    const author = await TacGiaRepository.getById(maTacGia); // Lấy thông tin tác giả trước khi xóa

    console.log(maTacGia);

    // Định dạng params thành mảng chứa một đối tượng
    const params = [
        { name: 'MATACGIA', type: sql.Int, value: maTacGia }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_XoaTacGia', params);
        pushToUndoStack('delete', author);
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

    const savedAuthors = [];
    for (const author of authorList) {
        const cleanHoTenTG = author.hoTenTG.trim().replace(/\s+/g, ' ');
        const cleanDiaChiTG = author.diaChiTG.trim().replace(/\s+/g, ' ');

        const params = [
            { name: 'HOTENTG', type: sql.NVarChar, value: cleanHoTenTG },
            { name: 'DIACHITG', type: sql.NVarChar, value: cleanDiaChiTG },
            { name: 'DIENTHOAITG', type: sql.NVarChar, value: author.dienThoaiTG }
        ];
        const maTacGia = await executeStoredProcedureWithTransactionAndReturnCode('sp_ThemTacGia', params);
        savedAuthors.push({
            maTacGia: maTacGia, // Giả định bạn có maTacGia trong author
            hoTenTG: cleanHoTenTG,
            diaChiTG: cleanDiaChiTG,
            dienThoaiTG: author.dienThoaiTG
        });

        
        
    }


    console.log(savedAuthors)
    pushToUndoStack('create', savedAuthors);

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

    const oldAuthor = await TacGiaRepository.getById(maTacGia);
    const author = new TacGia(maTacGia, hoTenTG, diaChiTG, dienThoaiTG)

    const params = [
        { name: 'MATACGIA', type: sql.Int, value: maTacGia },
        { name: 'HOTENTG', type: sql.NVarChar, value: hoTenTG },
        { name: 'DIACHITG', type: sql.NVarChar, value: diaChiTG },
        { name: 'DIENTHOAITG', type: sql.NVarChar, value: dienThoaiTG }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_SuaTacGia', params);
        pushToUndoStack('edit', oldAuthor);
        res.render('admin/pages/tacgia/edit', {
            author: author,
            pageTitle: 'Chỉnh sửa tác giả',
        });
    } catch (error) {
        console.error('Error updating author:', error);
        res.status(500).send('Có lỗi xảy ra khi cập nhật tác giả!');
    }
};


// [POST] /author/undo
module.exports.undo = async (req, res) => {
    const lastAction = popUndoStack();

    if (!lastAction) {
        return res.json({ success: false, message: 'Không có thao tác để undo!' });
    }

    const { action, data } = lastAction;

    try {
        if (action === 'create') {
            // Undo create: Xóa từng tác giả đã thêm
            for (const author of data) {
                console.log(author)
                const params = [
                    { name: 'MATACGIA', type: sql.Int, value: author.maTacGia }
                ];
                await executeStoredProcedureWithTransaction('sp_XoaTacGia', params);
            }
        } else if (action === 'delete') {
            // Undo delete: Thêm lại tác giả đã xóa
            const params = [
                { name: 'HOTENTG', type: sql.NVarChar, value: data.hoTenTG },
                { name: 'DIACHITG', type: sql.NVarChar, value: data.diaChiTG },
                { name: 'DIENTHOAITG', type: sql.NVarChar, value: data.dienThoaiTG }
            ];
            await executeStoredProcedureWithTransaction('sp_ThemTacGia', params);
        } else if (action === 'edit') {
            // Undo edit: Khôi phục thông tin cũ
            const params = [
                { name: 'MATACGIA', type: sql.Int, value: data.maTacGia },
                { name: 'HOTENTG', type: sql.NVarChar, value: data.hoTenTG },
                { name: 'DIACHITG', type: sql.NVarChar, value: data.diaChiTG },
                { name: 'DIENTHOAITG', type: sql.NVarChar, value: data.dienThoaiTG }
            ];
            await executeStoredProcedureWithTransaction('sp_SuaTacGia', params);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error in undo:', error);
        res.json({ success: false, message: 'Không thể thực hiện undo!' });
    }
};


// [GET] /author/next-id
module.exports.getNextId = async (req, res) => {
    const nextId = await TacGiaRepository.getNextId();
    res.json({ success: true, nextId });
};

