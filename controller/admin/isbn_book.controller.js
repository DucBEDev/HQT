const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction, getUserPool } = require('../../configs/database');
const moment = require('moment');
const puppeteer = require('puppeteer');

const DauSachRepository = require('../../repositories/DauSachRepository'); 
const SachRepository = require('../../repositories/SachRepository'); 
const NgonNguRepository = require('../../repositories/NgonNguRepository'); 
const TheLoaiRepository = require('../../repositories/TheLoaiRepository'); 
const TacGiaRepository = require('../../repositories/TacGiaRepository'); 
const NganTuRepository = require('../../repositories/NganTuRepository'); 

const systemConfig = require('../../configs/system');

// [GET] /admin/isbn_book
module.exports.index = async (req, res) => {
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

    const dauSachList = await DauSachRepository.getAll(pool); 
    const ngonNguList = await NgonNguRepository.getAll(pool);
    const theLoaiList = await TheLoaiRepository.getAll(pool);
    const tacGiaList = await TacGiaRepository.getAll(pool);

    res.render('admin/pages/dausach_sach/index', {
        dauSachList: dauSachList,
        ngonNguList: ngonNguList,
        theLoaiList: theLoaiList,
        tacGiaList: tacGiaList,
        pageTitle: 'Quản Lý Đầu Sách và Sách'
    });
};

// [GET] /admin/isbn_book/getData   
module.exports.getData = async (req, res) => {
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

    const ngonNguList = await NgonNguRepository.getAll(pool);
    const theLoaiList = await TheLoaiRepository.getAll(pool);
    const tacGiaList = await TacGiaRepository.getAll(pool);

    res.json({ ngonNguList, theLoaiList, tacGiaList });
};

// [GET] /admin/isbn_book/book
module.exports.getBooks = async (req, res) => {
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

    const { selectedISBN } = req.query;
    const sachList = await SachRepository.getBooksByISBN(pool, selectedISBN);
    const updatedSachList = await Promise.all(sachList.map(async (sach) => {
        const nganTu = await NganTuRepository.getById(pool, sach.maNganTu);
        return {
            ...sach,
            ke: nganTu.ke
        };
    }));
    const nganTuList = await NganTuRepository.getAll(pool); 

    res.json({ 
        success: true, 
        sachList: updatedSachList,
        nganTuList: nganTuList
    });
};

// [DELETE] /admin/isbn_book/book/delete/:maSach
module.exports.deleteBook = async (req, res) => {
    console.log("Deleting book ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }


    const { maSach } = req.params;

    console.log(maSach)

    const params = [
        { name: 'MASACH', type: sql.NChar, value: maSach }
    ];

    try {
        await executeStoredProcedureWithTransaction(pool, 'sp_XoaSach', params);
        req.flash('success', 'Xóa sách thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/isbn_book`);
    } catch (error) {
        req.flash('error', error);
        console.error('Error deleting type:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa sách!');
    }
};

// [POST] /admin/isbn_book/book/create
module.exports.write = async (req, res) => {
    console.log("Creating book ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }


    const sachList = req.body;

    try {
        for (const sach of sachList) {
            // Làm sạch dữ liệu
            const cleanMaSach = sach.maSach.trim();
            const cleanISBN = sach.isbn.trim();

            // Chuẩn bị tham số cho stored procedure
            const params = [
                { name: 'MASACH', type: sql.NChar, value: cleanMaSach },
                { name: 'ISBN', type: sql.NChar, value: cleanISBN },
                { name: 'TINHTRANG', type: sql.Bit, value: sach.tinhTrang === 'true' || sach.tinhTrang === true },
                { name: 'CHOMUON', type: sql.Bit, value: sach.choMuon === 'true' || sach.choMuon === false },
                { name: 'MANGANTU', type: sql.Int, value: sach.maNganTu || null }
            ];

            // Gọi stored procedure để thêm sách
            await executeStoredProcedureWithTransaction(pool, 'sp_ThemSach', params);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error creating sach:', error);
        res.json({ success: false, message: error.message });
    }
}

// [POST] /admin/isbn_book/create
module.exports.createDauSach = async (req, res) => {
    console.log("Creating dauSach ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }


    const dauSachList = Object.values(req.body.dauSach || []).map((ds, index) => ({
        ...ds,
        hinhAnhPath: req.body.hinhAnhUrls ? req.body.hinhAnhUrls[index] : null
    }));

    console.log("dauSachList to save: ", dauSachList);

    // Lưu dauSachList vào DB (giả sử bạn dùng một ORM như Mongoose hoặc Sequelize)
    // await DauSachModel.create(dauSachList);

    res.json({ success: true });
};


// [DELETE] /admin/isbn_book/delete/:isbn
module.exports.deleteTitle = async (req, res) => {
    console.log("Deleting title ----------------------------------------------------------------------------------------------------------------------------------------------------------");
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }


    const { isbn } = req.params;

    const params = [
        { name: 'ISBN', type: sql.NChar, value: isbn }
    ];

    try {
        await executeStoredProcedureWithTransaction(pool, 'sp_XoaDauSach', params);
        req.flash('success', 'Xóa đầu sách thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/isbn_book`);
    } catch (error) {
        req.flash('error', error);
        console.error('Error deleting type:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa đầu sách!');
    }
};

module.exports.getNextISBN = async (req, res) => {
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

    const nextId = 'ISBN000001'; // Giả định logic tạo ISBN
    res.json({ success: true, nextId });
};

// [GET] /admin/isbn_book/report?type=list/most-borrow
module.exports.getReport = async (req, res) => {
    const pool = getUserPool(req.session.id);
        if (!pool) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }


    const type = req.query.type;

    if (type == 'list') {
        const typeList = await TheLoaiRepository.getAll(pool);
        const dauSachList = [];

        for (const type of typeList) {
            const dauSach = await DauSachRepository.getAllBaseOnType(pool, type.maTL);
            
            const categoryData = {
                tenTL: type.tenTL,
                books: dauSach
            };
            dauSachList.push(categoryData);
        }

        res.render('admin/pages/dausach_sach/reportList', { 
            dauSachList: dauSachList,
            printDate: moment().format('DD/MM/YYYY')
        });
    }
    else if (type == 'most-borrow') {
        let { startDate, endDate, quantity } = req.query;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const updatedQuantity = parseInt(quantity);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).send('Ngày không hợp lệ');
            }

            if (isNaN(updatedQuantity) || updatedQuantity <= 0) {
                return res.status(400).send('Số lượng sách không hợp lệ');
            }

            if (start > end) {
                return res.status(400).send('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
            }

            const dauSachList = await DauSachRepository.getAllBaseOnDate(pool, start, end, updatedQuantity);

            res.render('admin/pages/dausach_sach/reportMostBorrow', { 
                printDate: moment().format('DD/MM/YYYY'),
                startDate: moment(start).format('DD/MM/YYYY'),
                endDate: moment(end).format('DD/MM/YYYY'),
                dauSachList: dauSachList,
                quantity: updatedQuantity,
                hasData: dauSachList.length > 0
            });
        } else {
            res.render('admin/pages/dausach_sach/reportMostBorrow', { 
                printDate: moment().format('DD/MM/YYYY'),
                dauSachList: [],
                hasData: false
            });
        }
    }
};

// [POST] /admin/isbn_book/download-report?type=list/most-borrow
module.exports.downloadReport = async (req, res) => {
    try {
        const type = req.query.type;

        const { dauSachList, printDate, quantity, startDate, endDate } = req.body;
        const parsedDauSachList = JSON.parse(dauSachList);

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
                res.render('admin/pages/dausach_sach/reportList', {
                    dauSachList: parsedDauSachList,
                    printDate: printDate
                }, (err, html) => {
                    if (err) reject(err);
                    resolve(html);
                });
            });
        }
        else if (type == 'most-borrow') {
            html = await new Promise((resolve, reject) => {
                res.render('admin/pages/dausach_sach/reportMostBorrow', {
                    printDate: printDate,
                    dauSachList: parsedDauSachList,
                    quantity: quantity,
                    startDate: startDate,
                    endDate: endDate
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
            res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_danh_muc_dau_sach.pdf"');
        }
        else if (type == 'most-borrow') {
            res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_sach_muon_nhieu_nhat.pdf"');
        }

        // Gửi PDF buffer về client
        res.end(pdfBuffer);
    } catch (err) {
        console.error('Lỗi khi tạo PDF:', err);
        res.status(500).send('Lỗi khi tạo PDF: ' + err.message);
    }
};



