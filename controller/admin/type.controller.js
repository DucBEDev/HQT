const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');

const TheLoaiRepository = require('../../repositories/TheLoaiRepository');

const systemConfig = require('../../configs/system');

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
    const { maTL } = req.params;
    await TheLoaiRepository.delete(maTL);

    res.redirect(`${systemConfig.prefixAdmin}/type`);
}

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

    res.json({ success: true });
}

// [GET] /type/next-id
module.exports.getNextId = async (req, res) => {
    const nextId = await TheLoaiRepository.getNextId();
    res.json({ success: true, nextId });
}
