const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');

const TheLoaiRepository = require('../../repositories/TheLoaiRepository');

const systemConfig = require('../../configs/system');
const TheLoai = require('../../models/TheLoai');
const { pushToUndoStack, popUndoStack} = require('../../public/js/adminjs/type/type-undo');

// [GET] /type
module.exports.index = async (req, res) => {
    const list = await TheLoaiRepository.getAll();
 
    res.render('admin/pages/theloai/index', {
        typeList: list,
        pageTitle: 'Quản lý thể loại',
    });
}

// [DELETE] /type/delete/:maTL
module.exports.delete = async (req, res) => {
    console.log("Called");

    const { maTL } = req.params; // Lấy giá trị maTL từ req.params
    console.log(maTL);

    const type = await TheLoaiRepository.getById(maTL); // Lấy thông tin thể loại cũ

    // Định dạng params thành mảng chứa một đối tượng
    const params = [
        { name: 'MATL', type: sql.NVarChar, value: maTL }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_XoaTheLoai', params);
        pushToUndoStack('delete', type);
        res.redirect(`${systemConfig.prefixAdmin}/type`);
    } catch (error) {
        console.error('Error deleting type:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa thể loại!');
    }
};


// [GET] /type/create
module.exports.create = async (req, res) => {
    res.render('admin/pages/TheLoai/create', {
        pageTitle: 'Thêm thể loại',
    });
}

// [POST] /type/create
module.exports.createPost = async (req, res) => {
    const typeList = req.body;

    for (const type of typeList) {
        const params = [
            { name: 'MATL', type: sql.NVarChar, value: type.maTL },
            { name: 'TENTL', type: sql.NVarChar, value: type.tenTL }
        ];
        await executeStoredProcedureWithTransaction('sp_ThemTheLoai', params);
    }
    pushToUndoStack('create', typeList);

    res.json({ success: true });
}


// [GET] /type/edit/:maTL
module.exports.edit = async (req, res) => {
    const { maTL } = req.params;
    console.log(maTL)
    const type = await TheLoaiRepository.getById(maTL); // Hàm lấy thông tin thể loại
    console.log(type)
    res.render('admin/pages/theloai/edit', {
        type,
        pageTitle: 'Chỉnh sửa thể loại',
    });
};

// [POST] /type/edit/:maTL
module.exports.editPost = async (req, res) => {
    const type = req.body;
    const  oldType = await TheLoaiRepository.getById(type.maTL); // Lấy thông tin thể loại cũ
    const typeEdit = new TheLoai(type.maTL, type.tenTL)

    const params = [
        { name: 'MATL', type: sql.NVarChar, value: typeEdit.maTL },
        { name: 'TENTL', type: sql.NVarChar, value: typeEdit.tenTL }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_SuaTheLoai', params);
        pushToUndoStack('edit',  oldType );
        res.render('admin/pages/theloai/edit', {
            type: typeEdit,
            pageTitle: 'Chỉnh sửa thể loại',
        });
    } catch (error) {
        console.error('Error editing type:', error);
        res.status(500).send('Có lỗi xảy ra khi sửa thể loại!');
    }
};


module.exports.undo = async (req, res) => {
    const lastAction = popUndoStack();

    if (!lastAction) {
        return res.json({ success: false, message: 'Không có thao tác để undo!' });
    }

    const { action, data } = lastAction;

    try {
        if (action === 'create') {
            // Undo create: Xóa từng thể loại đã thêm
            for (const tl of data) {
                const params = [{ name: 'MATL', type: sql.NVarChar, value: tl.maTL }];
                await executeStoredProcedureWithTransaction('sp_XoaTheLoai', params);
            }
        } else if (action === 'delete') {
            // Undo delete: Thêm lại thể loại đã xóa
            const params = [
                { name: 'MATL', type: sql.NVarChar, value: data.maTL },
                { name: 'TENTL', type: sql.NVarChar, value: data.tenTL }
            ];
            await executeStoredProcedureWithTransaction('sp_ThemTheLoai', params);
        } else if (action === 'edit') {
            // Undo edit: Khôi phục tên cũ
            const params = [
                { name: 'MATL', type: sql.NVarChar, value: data.maTL },
                { name: 'TENTL', type: sql.NVarChar, value: data.tenTL }
            ];
            await executeStoredProcedureWithTransaction('sp_SuaTheLoai', params);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error in undo:', error);
        res.json({ success: false, message: 'Không thể thực hiện undo!' });
    }
};

// [GET] /type/next-id
module.exports.getNextId = async (req, res) => {
    const nextId = await TheLoaiRepository.getNextId();
    res.json({ success: true, nextId });
}
