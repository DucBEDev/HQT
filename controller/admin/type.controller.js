const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');

const TheLoaiRepository = require('../../repositories/TheLoaiRepository');

const systemConfig = require('../../configs/system');
const TheLoai = require('../../models/TheLoai');

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

    // Định dạng params thành mảng chứa một đối tượng
    const params = [
        { name: 'MATL', type: sql.NVarChar, value: maTL }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_XoaTheLoai', params);
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
    console.log(type)
    const typeEdit = new TheLoai(type.maTL, type.tenTL)
    console.log(typeEdit)

    const params = [
        { name: 'MATL', type: sql.NVarChar, value: typeEdit.maTL },
        { name: 'TENTL', type: sql.NVarChar, value: typeEdit.tenTL }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_SuaTheLoai', params);
        res.render('admin/pages/theloai/edit', {
            type: typeEdit,
            pageTitle: 'Chỉnh sửa thể loại',
        });
    } catch (error) {
        console.error('Error editing type:', error);
        res.status(500).send('Có lỗi xảy ra khi sửa thể loại!');
    }
};


// [GET] /type/next-id
module.exports.getNextId = async (req, res) => {
    const nextId = await TheLoaiRepository.getNextId();
    res.json({ success: true, nextId });
}
