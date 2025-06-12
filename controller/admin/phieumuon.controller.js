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
    console.log("Editing phieumuon ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const { maPhieu } = req.params; // MAPHIEU from URL
    //const { hinhThuc, maSach1, tinhTrangMuon1, maSach2, tinhTrangMuon2, maSach3, tinhTrangMuon3 } = req.body;
    const nhanvien = req.session.username; // Assuming MADG is stored in session for the logged-in user
    console.log(nhanvien)
    const madg = req.body.maDG

    // Phân tích ctPhieuMuonList từ req.body
        const books = [];
        Object.keys(req.body).forEach(key => {
            const match = key.match(/ctPhieuMuonList\[(\d+)\]\.(\w+)/);
            if (match) {
                const index = parseInt(match[1], 10);
                const prop = match[2];
                if (!books[index]) {
                    books[index] = {};
                }
                books[index][prop] = req.body[key];
            }
        });

        // Làm sạch dữ liệu: cắt bỏ khoảng trắng và chuyển đổi tinhTrangMuon
        books.forEach(book => {
            if (book.maSach) {
                book.maSach = book.maSach.trim(); // Loại bỏ khoảng trắng thừa
            }
            if (book.tinhTrangMuon) {
                book.tinhTrangMuon = book.tinhTrangMuon === 'true' ? 1 : 0; // Chuyển 'true'/'false' thành 1/0
            } else {
                book.tinhTrangMuon = 1; // Giá trị mặc định nếu không cung cấp
            }
        });

        console.log(books)

        // Ánh xạ dữ liệu thành các tham số riêng lẻ
        const maSach1 = books[0]?.maSach || null;
        const tinhTrangMuon1 = books[0]?.tinhTrangMuon ?? 1;
        const maSach2 = books[1]?.maSach || null;
        const tinhTrangMuon2 = books[1]?.tinhTrangMuon ?? 1;
        const maSach3 = books[2]?.maSach || null;
        const tinhTrangMuon3 = books[2]?.tinhTrangMuon ?? 1;

        // Lấy hinhThuc từ req.body
        const hinhThuc = req.body.hinhThuc;


    console.log(req.body)


    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        const params = [
            { name: 'MAPHIEU', type: sql.BigInt, value: maPhieu },
            { name: 'MADG', type: sql.BigInt, value: madg },
            { name: 'HINHTHUC', type: sql.Bit, value: hinhThuc },
            { name: 'MASACH1', type: sql.NChar(20), value: maSach1 },
            { name: 'TINHTRANGMUON1', type: sql.Bit, value: tinhTrangMuon1 },
            { name: 'MASACH2', type: sql.NChar(20), value: maSach2 },
            { name: 'TINHTRANGMUON2', type: sql.Bit, value: tinhTrangMuon2 },
            { name: 'MASACH3', type: sql.NChar(20), value: maSach3 },
            { name: 'TINHTRANGMUON3', type: sql.Bit, value: tinhTrangMuon3 }
        ];

        // Gọi stored procedure với params
        const result = await executeStoredProcedure(pool, 'sp_SuaPhieuMuon', params);

        // Check if stored procedure executed successfully
        if (result.returnValue === 0) {
            req.flash('success', 'Chỉnh sửa phiếu mượn thành công!');
            return res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
        } else {
            throw new Error('Lỗi khi gọi stored procedure');
        }
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
    console.log(req.params.maPhieu)
    console.log(req.params.maSach)

    const { maPhieu, maSach } = req.params;
    const empId = req.session.empId; // Assuming the employee ID is stored in the session
    console.log("Employee ID:", empId);
    const params = [
        { name: 'MAPHIEU', type: sql.BigInt, value: maPhieu },
        { name: 'MASACH', type: sql.NChar(20), value: maSach },
        { name: 'MANVNS', type: sql.Int, value: empId } // Assuming MANV is the employee ID
    ];
    console.log("Params for stored procedure:", params);
    const kq = await executeStoredProcedureWithTransaction(pool, "sp_TraSach", params );
    console.log(kq)
    res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
};


