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
    console.log("Employee ID:", empId);
    const empData = await NhanVienRepository.getById(pool, empId);
    
    const sachList = await DauSachRepository.getAllWithQuantity(pool); 
    sachList.sort((a, b) => a.TENSACH.localeCompare(b.TENSACH));
    
    const docGiaList = await DocGiaRepository.getAll(pool);
    const maPhieu = await PhieuMuonRepository.getNextId(pool);

    res.render('admin/pages/phieumuon/create', {
        sachList, 
        docGiaList,
        pageTitle: 'Tạo Phiếu Mượn',
        empName: `${empData.hoNV} ${empData.tenNV}`,
        empId: empId,
        maPhieu : maPhieu
    });
};

// [POST] /phieumuon/create
module.exports.createPost = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const { maPhieu, maDG, hinhThuc, maNV } = req.body;

    console.log(req.body);

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

        for (i = 0; i < ctPhieuMuonList.length; i++) 
        {
            // Lưu PhieuMuon
            const paramsPhieu = [
            { name: 'MAPHIEU', type: sql.NVarChar, value: maPhieu },
            { name: 'SOLUONGSACH', type: sql.Int, value: ctPhieuMuonList.length-i },
            { name: 'MADG', type: sql.NVarChar, value: maDG },
            { name: 'HINHTHUC', type: sql.NVarChar, value: hinhThuc },
            { name: 'MANV', type: sql.NVarChar, value: maNV },
            { name: 'MASACH', type: sql.NChar, value: ctPhieuMuonList[i]?.maSach || null },
            { name: 'TINHTRANGMUON', type: sql.Bit, value: ctPhieuMuonList[i]?.tinhTrangMuon || null }
            ];

            console.log("Params for stored procedure:", paramsPhieu);

            await executeStoredProcedure(pool, 'sp_LapPhieuMuon', paramsPhieu);

        }

        req.flash('success', 'Tạo phiếu mượn thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
    } 
    catch (error) 
    {
        console.error('Error creating phieu muon:', error);
        req.flash('error', error.message || 'Lỗi khi tạo phiếu mượn!');
        res.redirect('back');
        
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

    let trangThai = true;
    if (ctpmList.length > 0) {
        for (const ctpm of ctpmList) 
        {
            if (ctpm.tra == null || ctpm.tra == false) 
                {trangThai = false; break;}

        }
    }
                    
                
            

    console.log("phieuMuon ", phieuMuon);
    console.log("ctpmList ", ctpmList);
    
    res.render('admin/pages/phieumuon/detail', { 
        phieuMuon,
        pageTitle: 'Chi tiết phiếu mượn',
        sachList,
        ctpmList,
        ngayTra : ctpmList[0]?.ngayTra.toISOString().split('T')[0] || null,
        trangThai : trangThai,
        dgData,
        empData
    });
};

// [PATCH] /phieumuon/edit/:maPhieu
module.exports.edit = async (req, res) => {
    console.log("Editing phieumuon ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    console.log(req.body)


    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        
    } catch (error) {
        console.error('Error editing borrowing slip:', error);
        req.flash('error', error.message || 'Lỗi khi chỉnh sửa phiếu mượn!');
        return res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
    }
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

    const { maPhieu, maSach } = req.params;
    const empId = req.session.empId; // Assuming the employee ID is stored in the session
    
    const params = [
        { name: 'MAPHIEU', type: sql.BigInt, value: maPhieu },
        { name: 'MASACH', type: sql.NChar(20), value: maSach },
        { name: 'MANVNS', type: sql.Int, value: empId } // Assuming MANV is the employee ID
    ];

    const kq = await executeStoredProcedureWithTransaction(pool, "sp_TraSach", params );

    res.redirect(`back`);
};


