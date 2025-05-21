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
    console.log("Creating phieumuon ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }


    const sachList = await DauSachRepository.getAllWithQuantity(pool); 
    const docGiaList = await DocGiaRepository.getAll(pool);
    const nhanVienList = await NhanVienRepository.getAll(pool);
    // const nextPhieuMuonId = await getNextPhieuMuonId(); // Giả định hàm tạo mã phiếu
    res.render('admin/pages/phieumuon/create', {
        sachList, docGiaList, nhanVienList,
        pageTitle: 'Tạo Phiếu Mượn'
    });
};

// [POST] /phieumuon/create
module.exports.createPost = async (req, res) => {
    console.log("Creating phieumuon post ----------------------------------------------------------------------------------------------------------------------------------------------------------");
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
    console.log(ctPhieuMuonList)
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
    const sachList = await DauSachRepository.getAllWithQuantity(pool);

    console.log(ctpmList)
    console.log(phieuMuon)
    
    res.render('admin/pages/phieumuon/detail', { 
        phieuMuon,
        pageTitle: 'Chi tiết phiếu mượn',
        sachList,
        ctpmList,
        ngayTra : ctpmList[0]?.ngayTra.toISOString().split('T')[0] || null,
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

// [PATCH] /phieumuon/lostBook/:maPhieu
module.exports.lostBook = async (req, res) => {
    console.log(req.params.maPhieu)
    res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
};

// [POST] /phieumuon/returnBook/:maPhieu
module.exports.returnBook = async (req, res) => {
    console.log("Returning book ----------------------------------------------------------------------------------------------------------------------------------------------------------");

    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

    console.log(req.params.maPhieu)
    await PhieuMuonRepository.bookReturn(pool, req.params.maPhieu);
    res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
};

// [DELETE] /phieumuon/delete/:maPhieu
module.exports.delete = async (req, res) => {
    console.log("Deleting phieumuon ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

    console.log(req.params.maPhieu)
    const params = 
    [
        { name: 'MAPHIEU', type: sql.BigInt, value: req.params.maPhieu }
    ]
    await executeStoredProcedureWithTransaction(pool, 'sp_XoaPhieuMuon', params);
    res.redirect(`${systemConfig.prefixAdmin}/phieumuon`);
};

