class NhanVien {
    constructor(maNV, hoNV, tenNV, diaChi, dienThoai, gioiTinh, email) {
        this.maNV = maNV;
        this.hoNV = hoNV;
        this.tenNV=tenNV;
        this.diaChi = diaChi;
        this.dienThoai = dienThoai;
        this.gioiTinh = gioiTinh;
        this.email=email;
    }
}

module.exports = NhanVien;