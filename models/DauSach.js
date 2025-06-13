class DauSach {
    constructor(isbn, tenSach, khoSach, noiDung, hinhAnhPath, ngayXuatBan, lanXuatBan, soTrang, gia, nhaXB, maNgonNgu, maTL, isDeleted) {
        this.isbn = isbn;
        this.tenSach = tenSach;
        this.khoSach = khoSach;
        this.noiDung = noiDung;
        this.hinhAnhPath = hinhAnhPath;
        this.ngayXuatBan = ngayXuatBan;
        this.lanXuatBan = lanXuatBan;
        this.soTrang = soTrang;
        this.gia = gia;
        this.nhaXB = nhaXB;
        this.maNgonNgu = maNgonNgu;
        this.maTL = maTL;
        this.isDeleted = isDeleted;
    }
}

module.exports = DauSach;