const { sql, executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../../configs/database');
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
    const dauSachList = await DauSachRepository.getAll(); 
    const ngonNguList = await NgonNguRepository.getAll();
    const theLoaiList = await TheLoaiRepository.getAll();
    const tacGiaList = await TacGiaRepository.getAll();

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
    const ngonNguList = await NgonNguRepository.getAll();
    const theLoaiList = await TheLoaiRepository.getAll();
    const tacGiaList = await TacGiaRepository.getAll();

    res.json({ ngonNguList, theLoaiList, tacGiaList });
};

// [GET] /admin/isbn_book/book
module.exports.getBooks = async (req, res) => {
    const { selectedISBN } = req.query;
    const sachList = await SachRepository.getBooksByISBN(selectedISBN);
    const updatedSachList = await Promise.all(sachList.map(async (sach) => {
        const nganTu = await NganTuRepository.getById(sach.maNganTu);
        return {
            ...sach,
            ke: nganTu.ke
        };
    }));
    const nganTuList = await NganTuRepository.getAll(); 

    res.json({ 
        success: true, 
        sachList: updatedSachList,
        nganTuList: nganTuList
    });
};

// [DELETE] /admin/isbn_book/book/delete/:maSach
module.exports.deleteBook = async (req, res) => {
    const { maSach } = req.params;

    const params = [
        { name: 'MASACH', type: sql.NChar, value: maSach }
    ];

    try {
        // await executeStoredProcedureWithTransaction('sp_XoaSach', params);
        req.flash('success', 'Xóa sách thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/isbn_book`);
    } catch (error) {
        req.flash('error', error);
        console.error('Error deleting type:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa sách!');
    }
};

// [POST] /admin/isbn_book/book/write
module.exports.write = async (req, res) => {
    console.log(req.body);
    res.json({ success: true });
}

// [POST] /admin/isbn_book/write
module.exports.createDauSach = async (req, res) => {
    const dauSachList = Object.values(req.body.dauSach || []).map((ds, index) => ({
        ...ds,
        hinhAnhPath: req.body.hinhAnhUrls ? req.body.hinhAnhUrls[index] : null
    }));

    console.log("dauSachList to save: ", dauSachList);

    // Lưu dauSachList vào DB (giả sử bạn dùng một ORM như Mongoose hoặc Sequelize)
    // await DauSachModel.create(dauSachList);

    res.json({ success: true });
};

module.exports.createSach = async (req, res) => {
    const sachList = req.body.sachList;
    // Xử lý lưu vào DB
    res.json({ success: true });
};

// [DELETE] /admin/isbn_book/delete/:isbn
module.exports.deleteTitle = async (req, res) => {
    const { isbn } = req.params;

    const params = [
        { name: 'ISBN', type: sql.NChar, value: isbn }
    ];

    try {
        // await executeStoredProcedureWithTransaction('sp_XoaDauSach', params);
        req.flash('success', 'Xóa đầu sách thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/isbn_book`);
    } catch (error) {
        req.flash('error', error);
        console.error('Error deleting type:', error);
        res.status(500).send('Có lỗi xảy ra khi xóa đầu sách!');
    }
};

module.exports.getNextISBN = async (req, res) => {
    const nextId = 'ISBN000001'; // Giả định logic tạo ISBN
    res.json({ success: true, nextId });
};

// [GET] /admin/isbn_book/report
module.exports.getReport = async (req, res) => {
    const typeList = await TheLoaiRepository.getAll();
    const dauSachList = [];

    for (const type of typeList) {
        const dauSach = await DauSachRepository.getAllBaseOnType(type.maTL);
        const categoryData = {
            tenTL: type.tenTL,
            books: dauSach
        };
        dauSachList.push(categoryData);
    }

    res.render('admin/pages/dausach_sach/report', { 
        dauSachList: dauSachList,
        printDate: moment().format('DD/MM/YYYY')
    });
};

// [POST] /admin/isbn_book/download-report
module.exports.downloadReport = async (req, res) => {
    try {
        const { dauSachList, printDate } = req.body;
        const parsedDauSachList = JSON.parse(dauSachList);

        // Khởi tạo Puppeteer với các options cần thiết
        const browser = await puppeteer.launch({
            headless: 'new',  
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Render template với dữ liệu từ form
        const html = await new Promise((resolve, reject) => {
            res.render('admin/pages/dausach_sach/report', {
                dauSachList: parsedDauSachList,
                printDate: printDate
            }, (err, html) => {
                if (err) reject(err);
                resolve(html);
            });
        });

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
        res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_dau_sach.pdf"');

        // Gửi PDF buffer về client
        res.end(pdfBuffer);
    } catch (err) {
        console.error('Lỗi khi tạo PDF:', err);
        res.status(500).send('Lỗi khi tạo PDF: ' + err.message);
    }
};
