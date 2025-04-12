const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');

const DocGiaRepository = require('../../repositories/DocGiaRepository');

const systemConfig = require('../../configs/system');
const DocGia = require('../../models/DocGia');

// [GET] /reader
module.exports.index = async (req, res) => {
    const list = await DocGiaRepository.getAll();
 
    res.render('admin/pages/docgia/index', {
        readerList: list,
        pageTitle: 'Quản lý độc giả',
    });
}

// [DELETE] /reader/delete/:maDG
module.exports.delete = async (req, res) => {
    const { maDG } = req.params; 

    const params = [
        { name: 'MADG', type: sql.Int, value: maDG }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_XoaDocGia', params);
        res.redirect(`${systemConfig.prefixAdmin}/reader`);
    } catch (error) {
        console.error('Error deleting type:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa đọc giả!');
    }
};

// [PATCH] /reader/change-status/:newStatus/:maDG
module.exports.changeStatus = async (req, res) => {
    const { newStatus, maDG } = req.params;
    const newStatusBool = newStatus === 'true' ? true : false;

    await DocGiaRepository.changeStatus(maDG, newStatusBool);

    res.redirect(`${systemConfig.prefixAdmin}/reader`);
}

// [GET] /reader/create
module.exports.create = async (req, res) => {
    res.render('admin/pages/docgia/create', {
        pageTitle: 'Thêm độc giả',
    });
}

// [POST] /reader/create
module.exports.createPost = async (req, res) => {
    const readerList = req.body;

    for (const reader of readerList) {
        const cleanHoDG = reader.hoDG.trim().replace(/\s+/g, ' ');
        const cleanTenDG = reader.tenDG.trim().replace(/\s+/g, ' ');
        const cleanDiaChiDG = reader.diaChiDG.trim().replace(/\s+/g, ' ');
        const cleanEmailDG = reader.emailDG.trim().replace(/\s+/g, ' ');

        const params = [
            { name: 'HODG', type: sql.NVarChar, value: cleanHoDG },
            { name: 'TENDG', type: sql.NVarChar, value: cleanTenDG },
            { name: 'EMAILDG', type: sql.NVarChar, value: cleanEmailDG + '@gmail.com' },
            { name: 'SOCMND', type: sql.NVarChar, value: reader.soCMND },
            { name: 'GIOITINH', type: sql.Bit, value: reader.gioiTinh == '1' },
            { name: 'NGAYSINH', type: sql.DateTime, value: reader.ngaySinh },
            { name: 'DIACHIDG', type: sql.NVarChar, value: cleanDiaChiDG },
            { name: 'DIENTHOAI', type: sql.NVarChar, value: reader.dienThoai },
            { name: 'NGAYLAMTHE', type: sql.DateTime, value: reader.ngayLamThe },
            { name: 'NGAYHETHAN', type: sql.DateTime, value: reader.ngayHetHan },
            { name: 'HOATDONG', type: sql.Bit, value: reader.hoatDong == '1' }
        ];
        await executeStoredProcedureWithTransaction('sp_ThemDocGia', params);
    }

    res.json({ success: true });
}



module.exports.edit = async (req, res) => {
    const { maDG } = req.params;
    const docGia = await DocGiaRepository.getById(maDG); 

    docGia.ngaySinh = docGia.ngaySinh.toISOString().split('T')[0]; 
    docGia.ngayLamThe = docGia.ngayLamThe.toISOString().split('T')[0]; 
    docGia.ngayHetHan = docGia.ngayHetHan.toISOString().split('T')[0]; 
    docGia.emailDG = docGia.emailDG.split('@')[0];

    res.render('admin/pages/docgia/edit', {
        docgia: docGia,
        pageTitle: 'Chỉnh sửa độc giả',
    });
};

// [PATCH] /reader/edit/:maDG
module.exports.editPatch = async (req, res) => {
    const { maDG } = req.params;
    const { hoDG, tenDG, emailDG, soCMND, gioiTinh, ngaySinh, diaChiDG, dienThoai, ngayLamThe, ngayHetHan, hoatDong } = req.body;
    const cleanHoDG = hoDG.trim().replace(/\s+/g, ' ');
    const cleanTenDG = tenDG.trim().replace(/\s+/g, ' ');
    const cleanDiaChiDG = diaChiDG.trim().replace(/\s+/g, ' ');
    const cleanEmailDG = emailDG.trim().replace(/\s+/g, ' ');

    const params = [
        { name: 'MADG', type: sql.Int, value: maDG },
        { name: 'HODG', type: sql.NVarChar, value: cleanHoDG },
        { name: 'TENDG', type: sql.NVarChar, value: cleanTenDG },
        { name: 'EMAILDG', type: sql.NVarChar, value: cleanEmailDG + '@gmail.com' },
        { name: 'SOCMND', type: sql.NVarChar, value: soCMND },
        { name: 'GIOITINH', type: sql.Bit, value: gioiTinh == 'true' },
        { name: 'NGAYSINH', type: sql.Date, value: ngaySinh },
        { name: 'DIACHIDG', type: sql.NVarChar, value: cleanDiaChiDG },
        { name: 'DIENTHOAI', type: sql.NVarChar, value: dienThoai },
        { name: 'NGAYLAMTHE', type: sql.Date, value: ngayLamThe },
        { name: 'NGAYHETHAN', type: sql.Date, value: ngayHetHan },
        { name: 'HOATDONG', type: sql.Bit, value: hoatDong == 'true' }
    ];

    try {
        await executeStoredProcedureWithTransaction('sp_SuaDocGia', params);
        res.redirect(`${systemConfig.prefixAdmin}/reader`);
    } catch (error) {
        console.error('Error updating reader:', error);
        res.status(500).send('Có lỗi xảy ra khi cập nhật độc giả!');
    }
};

// [GET] /reader/next-id
module.exports.getNextId = async (req, res) => {
    const nextId = await DocGiaRepository.getNextId();
    res.json({ success: true, nextId });
}
