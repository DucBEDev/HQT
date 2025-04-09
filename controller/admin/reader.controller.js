const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');

const DocGiaRepository = require('../../repositories/DocGiaRepository');

const systemConfig = require('../../configs/system');

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
    await DocGiaRepository.delete(maDG);

    res.redirect(`${systemConfig.prefixAdmin}/reader`);
}

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

        const params = [
            { name: 'HODG', type: sql.NVarChar, value: cleanHoDG },
            { name: 'TENDG', type: sql.NVarChar, value: cleanTenDG },
            { name: 'EMAILDG', type: sql.NVarChar, value: reader.emailDG },
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

// [GET] /reader/next-id
module.exports.getNextId = async (req, res) => {
    const nextId = await DocGiaRepository.getNextId();
    res.json({ success: true, nextId });
}
