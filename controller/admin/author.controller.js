const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, executeStoredProcedureAndReturnCode, getUserPool } = require('../../configs/database');
const TacGiaRepository = require('../../repositories/TacGiaRepository'); // Giả định bạn sẽ tạo repository tương ứng
const systemConfig = require('../../configs/system');
const TacGia = require('../../models/TacGia');
const { pushToUndoStack, popUndoStack, clearUndoStack } = require('../../public/js/adminjs/author/author-undo');


// [GET] /author
module.exports.index = async (req, res) => {
     const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const list = await TacGiaRepository.getAll(pool);

    res.render('admin/pages/tacgia/index', {
        authorList: list,
        pageTitle: 'Quản lý tác giả',
    });
};

// [DELETE] /author/delete/:maTacGia
module.exports.delete = async (req, res) => {
    console.log("Deletiing author ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maTacGia } = req.params; // Lấy giá trị maTacGia từ req.params
    const author = await TacGiaRepository.getById(pool, maTacGia); // Lấy thông tin tác giả trước khi xóa

    console.log(maTacGia);

    // Định dạng params thành mảng chứa một đối tượng
    const params = [
        { name: 'MATACGIA', type: sql.Int, value: maTacGia }
    ];

    try {
        await executeStoredProcedureWithTransaction(pool, 'sp_XoaTacGia', params);
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
    console.log("Creating author ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

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
        const maTacGia = await executeStoredProcedureAndReturnCode(pool,'sp_ThemTacGia', params);
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
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    const { maTacGia } = req.params;

    // Giả định có hàm lấy thông tin tác giả từ DB
    const author = await TacGiaRepository.getById(pool, maTacGia); // Bạn cần triển khai hàm này

    res.render('admin/pages/tacgia/edit', {
        author,
        pageTitle: 'Chỉnh sửa tác giả',
    });
};

// [POST] /author/edit/:maTacGia
module.exports.editPost = async (req, res) => {
    console.log("Editing author ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maTacGia } = req.params;
    const { hoTenTG, diaChiTG, dienThoaiTG } = req.body;

    const oldAuthor = await TacGiaRepository.getById(pool,maTacGia);
    const author = new TacGia(maTacGia, hoTenTG, diaChiTG, dienThoaiTG)

    const params = [
        { name: 'MATACGIA', type: sql.Int, value: maTacGia },
        { name: 'HOTENTG', type: sql.NVarChar, value: hoTenTG },
        { name: 'DIACHITG', type: sql.NVarChar, value: diaChiTG },
        { name: 'DIENTHOAITG', type: sql.NVarChar, value: dienThoaiTG }
    ];

    try {
        await executeStoredProcedureWithTransaction(pool,'sp_SuaTacGia', params);
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
            // Undo create: Xóa từng tác giả đã thêm
            for (const author of data) {
                console.log(author)
                const params = [
                    { name: 'MATACGIA', type: sql.Int, value: author.maTacGia }
                ];
                await executeStoredProcedureWithTransaction(pool, 'sp_XoaTacGia', params);
            }
        } else if (action === 'delete') {
            // Undo delete: Thêm lại tác giả đã xóa
            const params = [
                { name: 'HOTENTG', type: sql.NVarChar, value: data.hoTenTG },
                { name: 'DIACHITG', type: sql.NVarChar, value: data.diaChiTG },
                { name: 'DIENTHOAITG', type: sql.NVarChar, value: data.dienThoaiTG }
            ];
            await executeStoredProcedure(pool, 'sp_ThemTacGia', params);
        } else if (action === 'edit') {
            // Undo edit: Khôi phục thông tin cũ
            const params = [
                { name: 'MATACGIA', type: sql.Int, value: data.maTacGia },
                { name: 'HOTENTG', type: sql.NVarChar, value: data.hoTenTG },
                { name: 'DIACHITG', type: sql.NVarChar, value: data.diaChiTG },
                { name: 'DIENTHOAITG', type: sql.NVarChar, value: data.dienThoaiTG }
            ];
            await executeStoredProcedureWithTransaction(pool, 'sp_SuaTacGia', params);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error in undo:', error);
        res.json({ success: false, message: 'Không thể thực hiện undo!' });
    }
};


// [POST] /author/clear-undo
module.exports.clearUndo = async (req, res) => {
    console.log("Clearing author undo stack ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    try {
        clearUndoStack();
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing undo stack:', error);
        res.json({ success: false, message: 'Không thể xóa stack undo!' });
    }
};


// [GET] /author/next-id
module.exports.getNextId = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    const nextId = await TacGiaRepository.getNextId();
    res.json({ success: true, nextId });
};

