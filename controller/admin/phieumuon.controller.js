const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');
const PhieuMuonRepository = require('../../repositories/PhieuMuonRepository'); // Giả định bạn sẽ tạo repository tương ứng
const DauSachRepository = require('../../repositories/DauSachRepository'); // Giả định bạn sẽ tạo repository tương ứng
const SachRepository = require('../../repositories/SachRepository'); // Giả định bạn sẽ tạo repository tương ứng
const NhanVienRepository = require('../../repositories/NhanVienRepository'); // Giả định bạn sẽ tạo repository tương ứng
const DocGiaRepository = require('../../repositories/DocGiaRepository'); // Giả định bạn sẽ tạo repository tương ứng
const systemConfig = require('../../configs/system');
const DauSach = require('../../models/DauSach');
const Sach = require('../../models/Sach');


// [GET] /author
module.exports.index = async (req, res) => {
    try {
        const list = await PhieuMuonRepository.getAll();
        res.render('admin/pages/phieumuon/index', {
            phieuMuonList: list,
            pageTitle: 'Quản lý phiếu mượn',
        });
    } catch (error) {
        console.error('Error fetching phieu muon list:', error);
        res.status(500).send('Có lỗi xảy ra khi lấy danh sách phiếu mượn!');
    }
};

module.exports.create = async (req, res) => {
    const sachList = await DauSachRepository.getAllWithQuantity(); // Giả định hàm lấy danh sách sách
    console.log(sachList)
    const docGiaList = await DocGiaRepository.getAll();
    const nhanVienList = await NhanVienRepository.getAll();
    // const nextPhieuMuonId = await getNextPhieuMuonId(); // Giả định hàm tạo mã phiếu
    res.render('admin/pages/phieumuon/create', {
        sachList, docGiaList, nhanVienList,
        pageTitle: 'Tạo Phiếu Mượn'
    });
};

module.exports.createPost = async (req, res) => {
    const { maDG, hinhThuc, maNV } = req.body;
    console.log(req.body)

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
        await executeStoredProcedureWithTransaction('sp_LapPhieuMuon', paramsPhieu);

    
  
        res.json({ success: true });
    } 
    catch (error) {
        // Lấy thông điệp lỗi từ SQL Server
        const errorMessage = error.message || 'Đã xảy ra lỗi không xác định';
        const errorNumber = error.number || 50000; // Mã lỗi từ SQL Server (nếu có)

        // Ánh xạ mã lỗi tùy chỉnh từ stored procedure để trả về thông điệp rõ ràng hơn (tùy chọn)
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
            case 50007:
                customMessage = 'Nhân viên không tồn tại!';
                break;
            default:
                customMessage = errorMessage; // Sử dụng thông điệp gốc nếu không khớp
        }
        console.error('SQL Error:', error); // Ghi log lỗi chi tiết để debug
        res.json({ 
            success: false, 
            message: customMessage,
            errorCode: errorNumber // Tùy chọn: trả về mã lỗi để client xử lý
        });
    }
};

module.exports.getNextId = async (req, res) => {
    try {
        const nextId = await PhieuMuonRepository.getNextId();
        res.json({ success: true, nextId });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};