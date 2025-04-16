const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');
const puppeteer = require('puppeteer');
const moment = require('moment');

const DocGiaRepository = require('../../repositories/DocGiaRepository');

const systemConfig = require('../../configs/system');
const DocGia = require('../../models/DocGia');

// [GET] /admin/reader
module.exports.index = async (req, res) => {
    const list = await DocGiaRepository.getAll();
 
    res.render('admin/pages/docgia/index', {
        readerList: list,
        pageTitle: 'Quản lý độc giả',
    });
}

// [DELETE] /admin/reader/delete/:maDG
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

// [PATCH] /admin/reader/change-status/:newStatus/:maDG
module.exports.changeStatus = async (req, res) => {
    const { newStatus, maDG } = req.params;
    const newStatusBool = newStatus === 'true' ? true : false;

    await DocGiaRepository.changeStatus(maDG, newStatusBool);

    res.redirect(`${systemConfig.prefixAdmin}/reader`);
}

// [GET] /admin/reader/create
module.exports.create = async (req, res) => {
    res.render('admin/pages/docgia/create', {
        pageTitle: 'Thêm độc giả',
    });
}

// [POST] /admin/reader/create
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

// [GET] /admin/reader/next-id
module.exports.getNextId = async (req, res) => {
    const nextId = await DocGiaRepository.getNextId();
    res.json({ success: true, nextId });
}

// [GET] /admin/reader/report?type=list/overdue
module.exports.report = async (req, res) => {
    const type = req.query.type;

    if (type == 'list') {
        const readerList = await DocGiaRepository.getAll();
        const updatedReaderList = readerList.map(dt => {
            hoTen = dt.hoDG + ' ' + dt.tenDG;
            cmnd = dt.soCMND;
            phai = dt.gioiTinh == 1 ? 'Nam' : 'Nữ';
            dienThoai = dt.dienThoai;
            diaChi = dt.diaChiDG;
            ngayLamThe = moment(dt.ngayLamThe).format('DD/MM/YYYY');
            trangThai = dt.hoatDong == 1 ? 'Đang hoạt động' : 'Bị khóa';

            return {
                hoTen,
                cmnd,
                phai,
                dienThoai,
                diaChi,
                ngayLamThe,
                trangThai
            }
        }).sort((a, b) => a.hoTen.localeCompare(b.hoTen, 'vi'))

        res.render('admin/pages/docgia/reportList', {
            readerList: updatedReaderList,
            printDate: moment().format('DD/MM/YYYY')
        });
    }
    else if (type == 'overdue') {
        const readerList = await DocGiaRepository.getOverdueReader();
        const updatedReaderList = readerList.map(dt => {
            cmnd = dt.soCMND;
            hoTen = dt.hoTen;
            dienThoai = dt.soDT;
            email = dt.email;
            maSach = dt.maSach;
            tenSach = dt.tenSach;
            ngayMuon = moment(dt.ngayMuon).format('DD/MM/YYYY');
            soNgayQuaHan = dt.soNgayQuaHan;

            return {
                cmnd,
                hoTen,
                dienThoai,
                email,
                maSach,
                tenSach,
                ngayMuon,
                soNgayQuaHan
            }
        }).sort((a, b) => b.soNgayQuaHan - a.soNgayQuaHan)

        res.render('admin/pages/docgia/reportOverdue', {
            readerList: updatedReaderList,
            printDate: moment().format('DD/MM/YYYY')
        });
    }

    
}

// [POST] /admin/reader/download-report?type=list/overdue
module.exports.downloadReport = async (req, res) => {
    try {
        const type = req.query.type;

        const { readerList, printDate } = req.body;
        const parsedReaderList = JSON.parse(readerList);
        
        // Khởi tạo Puppeteer với các options cần thiết
        const browser = await puppeteer.launch({
            headless: 'new',  
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        let html = "";
        if (type == 'list') {
            // Render template với dữ liệu từ form
            html = await new Promise((resolve, reject) => {
                res.render('admin/pages/docgia/reportList', {
                    readerList: parsedReaderList,
                    printDate: printDate
                }, (err, html) => {
                    if (err) reject(err);
                    resolve(html);
                });
            });
        } 
        else {
            html = await new Promise((resolve, reject) => {
                res.render('admin/pages/docgia/reportOverdue', {
                    readerList: parsedReaderList,
                    printDate: printDate
                }, (err, html) => {
                    if (err) reject(err);
                    resolve(html);
                });
            });
        }

        // Đặt nội dung HTML và đợi tất cả resources load xong
        await page.setContent(html, { 
            waitUntil: ['networkidle0', 'load', 'domcontentloaded']
        });

        // Ẩn các nút không cần thiết
        await page.evaluate(() => {
            const buttonContainer = document.querySelector('.button-container');
            if (buttonContainer) {
                buttonContainer.style.display = 'none';
            }
        });

        // Đợi một chút để đảm bảo tất cả styles đã được áp dụng
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Tạo PDF với các options chi tiết
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { 
                top: '50px', 
                right: '50px', 
                bottom: '50px', 
                left: '50px' 
            },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">Trang <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
            preferCSSPageSize: true
        });

        // Đóng trình duyệt
        await browser.close();

        // Thiết lập headers cho response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        if (type == 'list') {
            res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_doc_gia.pdf"');
        }
        else {
            res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_doc_gia_qua_han.pdf"');
        }

        // Gửi PDF buffer về client
        res.end(pdfBuffer);
    } catch (err) {
        console.error('Lỗi khi tạo PDF:', err);
        res.status(500).send('Lỗi khi tạo PDF: ' + err.message);
    }
};
    
