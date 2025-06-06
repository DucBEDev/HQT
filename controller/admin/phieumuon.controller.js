const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, getUserPool } = require('../../configs/database');

const PhieuMuonRepository = require('../../repositories/PhieuMuonRepository'); 
const DauSachRepository = require('../../repositories/DauSachRepository'); 
const NhanVienRepository = require('../../repositories/NhanVienRepository'); 
const DocGiaRepository = require('../../repositories/DocGiaRepository');

const systemConfig = require('../../configs/system');


// [GET] /phieumuon
module.exports.index = async (req, res) => {
    try {
        const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }
        
        const list = await PhieuMuonRepository.getAll(pool);

        for (let i = 0; i < list.length; i++) {
            const dgData = await DocGiaRepository.getById(pool, list[i].maDG);
            const empData = await NhanVienRepository.getById(pool, list[i].maNV);

            list[i]['dgFullName'] = dgData.hoDG + " " + dgData.tenDG;
            list[i]['empFullName'] = empData.hoNV + " " + empData.tenNV;
        }

        res.render('admin/pages/phieumuon/index', {
            phieuMuonList: list,
            pageTitle: 'Quản lý phiếu mượn',
        });
    } catch (error) {
        console.error('Error fetching phieu muon list:', error);
        res.status(500).send('Có lỗi xảy ra khi lấy danh sách phiếu mượn!');
    }
};

// [GET] /phieumuon/create
module.exports.create = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const empId = req.session.empId;
    const empData = await NhanVienRepository.getById(pool, empId);
    
    const sachList = await DauSachRepository.getAllWithQuantity(pool); 
    sachList.sort((a, b) => a.TENSACH.localeCompare(b.TENSACH));
    
    const docGiaList = await DocGiaRepository.getAll(pool);

    res.render('admin/pages/phieumuon/create', {
        sachList, 
        docGiaList,
        pageTitle: 'Tạo Phiếu Mượn',
        empName: `${empData.hoNV} ${empData.tenNV}`,
        empId: empId
    });
};

// [POST] /phieumuon/create
module.exports.createPost = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maDG, hinhThuc, maNV } = req.body;

    const ctPhieuMuonList = [];
    let i = 0;
    while (req.body[`ctPhieuMuonList[${i}].maSach`]) {
        ctPhieuMuonList.push({
            maSach: req.body[`ctPhieuMuonList[${i}].maSach`].trim(), // Loại bỏ khoảng trắng thừa
            tinhTrangMuon: req.body[`ctPhieuMuonList[${i}].tinhTrangMuon`] === 'true' // Chuyển string thành boolean
        });
        i++;
    }
    try {
        // Lưu PhieuMuon
        const paramsPhieu = [
            { name: 'MADG', type: sql.NVarChar, value: maDG },
            { name: 'HINHTHUC', type: sql.NVarChar, value: hinhThuc },
            { name: 'MANV', type: sql.NVarChar, value: maNV },
            { name: 'MASACH1', type: sql.NChar, value: ctPhieuMuonList[0]?.maSach || null },
            { name: 'TINHTRANGMUON1', type: sql.Bit, value: ctPhieuMuonList[0]?.tinhTrangMuon || null },
            { name: 'MASACH2', type: sql.NChar, value: ctPhieuMuonList[1]?.maSach || null },
            { name: 'TINHTRANGMUON2', type: sql.Bit, value: ctPhieuMuonList[1]?.tinhTrangMuon || null },
            { name: 'MASACH3', type: sql.NChar, value: ctPhieuMuonList[2]?.maSach || null },
            { name: 'TINHTRANGMUON3', type: sql.Bit, value: ctPhieuMuonList[2]?.tinhTrangMuon || null }


        ];
        await executeStoredProcedureWithTransaction(pool, 'sp_LapPhieuMuon', paramsPhieu);

        res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
    } 
    catch (error) {
        const errorMessage = error.message || 'Đã xảy ra lỗi không xác định';
        const errorNumber = error.number || 50000;

        // Ánh xạ mã lỗi
        let customMessage;
        switch (errorNumber) {
            case 50001:
                customMessage = 'Độc giả không tồn tại hoặc thẻ không hoạt động!';
                break;
            case 50002:
                customMessage = 'Độc giả có sách mượn quá hạn, không thể mượn thêm!';
                break;
            case 50003:
                customMessage = 'Độc giả chỉ được mượn tối đa 3 cuốn sách!';
                break;
            case 50004:
                customMessage = 'Sách 1 không tồn tại hoặc không thể mượn!';
                break;
            case 50005:
                customMessage = 'Sách 2 không tồn tại hoặc không thể mượn!';
                break;
            case 50006:
                customMessage = 'Sách 3 không tồn tại hoặc không thể mượn!';
                break;
            case 50007:
                customMessage = 'Nhân viên không tồn tại!';
                break;
            case 50008:
                customMessage = 'Phải mượn ít nhất một cuốn sách!';
                break;
            case 50009:
                customMessage = 'Các mã sách không được trùng lặp!';
                break;
            default:
                customMessage = errorMessage;
        }

        console.error('SQL Error:', error);
        res.status(400).json({
            success: false,
            message: customMessage,
            errorCode: errorNumber
        });
    }
};

// [GET] /phieumuon/next-id
module.exports.getNextId = async (req, res) => {
    try {
        const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

        const nextId = await PhieuMuonRepository.getNextId(pool);
        res.json({ success: true, nextId });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// [GET] /phieumuon/detail/:maPhieu
module.exports.detail = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maPhieu } = req.params;
    const { phieuMuon, ctpmList } = await PhieuMuonRepository.getById(pool, maPhieu);
    const dgData = await DocGiaRepository.getById(pool, phieuMuon.maDG);
    const empData = await NhanVienRepository.getById(pool, phieuMuon.maNV);
    const sachList = await DauSachRepository.getAllWithQuantity(pool);
    
    res.render('admin/pages/phieumuon/detail', { 
        phieuMuon,
        pageTitle: 'Chi tiết phiếu mượn',
        sachList,
        ctpmList,
        dgData,
        empData
    });
};

// [PATCH] /phieumuon/edit/:maPhieu
module.exports.edit = async (req, res) => {
    console.log(req.body)
    res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
};

// [PATCH] /phieumuon/lostBook/:maPhieu/:maSach
module.exports.lostBook = async (req, res) => {
    console.log(req.params.maPhieu)
    console.log(req.params.maSach)
    res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
};

// [PATCH] /phieumuon/returnBook/:maPhieu/:maSach
module.exports.returnBook = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    console.log(req.params.maPhieu)
    console.log(req.params.maSach)
    // const kq = await PhieuMuonRepository.bookReturn(pool, req.params.maPhieu);
    // console.log(kq)
    res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
};


