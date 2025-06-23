const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, getUserPool } = require('../../configs/database');

const TheLoaiRepository = require('../../repositories/TheLoaiRepository');

const systemConfig = require('../../configs/system');
const TheLoai = require('../../models/TheLoai');
const { pushToUndoStack, popUndoStack, clearUndoStack, isEmpty } = require('../../public/js/adminjs/type/type-undo');

// [GET] /type
module.exports.index = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    try {
        await pool.connect(); // Có thể ném lỗi nếu thông tin login sai
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const list = await TheLoaiRepository.getAll(pool);
 
    res.render('admin/pages/theloai/index', {
        typeList: list,
        pageTitle: 'Quản lý thể loại',
        isEmptyStack: isEmpty()
    });
}

// [DELETE] /type/delete/:maTL
module.exports.delete = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    try {
        await pool.connect(); // Có thể ném lỗi nếu thông tin login sai
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maTL } = req.params; 

    const type = await TheLoaiRepository.getById(pool, maTL); 

    const params = [
        { name: 'MATL', type: sql.NVarChar, value: maTL }
    ];

    try {
        await executeStoredProcedureWithTransaction(pool, 'sp_XoaTheLoai', params);
        pushToUndoStack('delete', type);

        req.flash("success", "Xóa thể loại thành công!");
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
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    try {
        await pool.connect(); // Có thể ném lỗi nếu thông tin login sai
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        const typeList = req.body;

        let duplicateTypes = [];
        for (const type of typeList) {
            if (await TheLoaiRepository.checkExist(pool, type)) {
                console.log(type)
                duplicateTypes.push(type);
            }
        }

        if (duplicateTypes.length > 0) {
            return res.status(400).json({
                success: false, 
                message: 'Các thể loại sau mã thể loại trùng với mã thể loại khác của thể loại đã có trong database: ' + duplicateTypes.map(a => a.maTL).join(', ')
            });
        }

        for (const type of typeList) {
            const cleanTenTL = type.tenTL.trim().replace(/\s+/g, ' ');

            const params = [
                { name: 'MATL', type: sql.NVarChar, value: type.maTL },
                { name: 'TENTL', type: sql.NVarChar, value: cleanTenTL }
            ];
            await executeStoredProcedureWithTransaction(pool, 'sp_ThemTheLoai', params);
        }
        pushToUndoStack('create', typeList);

        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.json({
            success: false
        })
    }
}

// [GET] /type/edit/:maTL
module.exports.edit = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    try {
        await pool.connect(); // Có thể ném lỗi nếu thông tin login sai
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maTL } = req.params;
    const type = await TheLoaiRepository.getById(pool, maTL); 
    res.render('admin/pages/theloai/edit', {
        type,
        pageTitle: 'Chỉnh sửa thể loại',
    });
};

// [POST] /type/edit/:maTL
module.exports.editPost = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    try {
        await pool.connect(); // Có thể ném lỗi nếu thông tin login sai
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        const type = req.body;

        if (type.originalMaTL != type.maTL && await TheLoaiRepository.checkExist(pool, type)) {
            return res.status(400).json({
                success: false, 
                message: 'Các thể loại sau mã thể loại trùng với mã thể loại khác của thể loại đã có trong database: ' + type.maTL
            });
        }

        const oldType = await TheLoaiRepository.getById(pool, type.originalMaTL); 

        const cleanTenTL = type.tenTL.trim().replace(/\s+/g, ' ');

        const params = [
            { name: 'MATLCU', type: sql.NVarChar, value: type.originalMaTL },
            { name: 'MATLMOI', type: sql.NVarChar, value: type.maTL },
            { name: 'TENTL', type: sql.NVarChar, value: cleanTenTL }
        ];

        await executeStoredProcedureWithTransaction(pool,'sp_SuaTheLoai', params);
        pushToUndoStack('edit',  {maTLCu: oldType.maTL, maTLMoi: type.maTL, tenTLCu: oldType.tenTL} );
        
        res.status(200).json({
            success: true
        })
    } catch (error) {
        console.error('Error editing type:', error);
        res.status(500).send('Có lỗi xảy ra khi sửa thể loại!');
    }
};

module.exports.undo = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    try {
        await pool.connect(); // Có thể ném lỗi nếu thông tin login sai
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

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
                await executeStoredProcedureWithTransaction(pool,'sp_XoaTheLoai', params);
            }
        } else if (action === 'delete') {
            // Undo delete: Thêm lại thể loại đã xóa
            const params = [
                { name: 'MATL', type: sql.NVarChar, value: data.maTL },
                { name: 'TENTL', type: sql.NVarChar, value: data.tenTL }
            ];
            await executeStoredProcedureWithTransaction(pool,'sp_ThemTheLoai', params);
        } else if (action === 'edit') {
            // Undo edit: Khôi phục tên cũ
            const params = [
                { name: 'MATLCU', type: sql.NVarChar, value: data.maTLMoi },
                { name: 'MATLMOI', type: sql.NVarChar, value: data.maTLCu },
                { name: 'TENTL', type: sql.NVarChar, value: data.tenTLCu }
            ];
            console.log("Params to undo edit: ", params);
            await executeStoredProcedureWithTransaction(pool,'sp_SuaTheLoai', params);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error in undo:', error);
        res.json({ success: false, message: 'Không thể thực hiện undo!' });
    }
};

// [POST] /type/clear-undo
module.exports.clearUndo = async (req, res) => {
    try {
        clearUndoStack();
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing undo stack:', error);
        res.json({ success: false, message: 'Không thể xóa stack undo!' });
    }
};

// [GET] /type/next-id
module.exports.getNextId = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    try {
        await pool.connect(); // Có thể ném lỗi nếu thông tin login sai
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    const nextId = await TheLoaiRepository.getNextId(pool);
    res.json({ success: true, nextId });
}
