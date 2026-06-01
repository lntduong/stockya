/**
 * Bảng tra cứu tên công ty cho các mã cổ phiếu phổ biến trên thị trường Việt Nam.
 * Bao gồm HOSE, HNX, UPCOM.
 * Dữ liệu này được lưu tĩnh (static) để đảm bảo tốc độ tải cực nhanh.
 */

const STOCK_NAMES: Record<string, { name: string; exchange: string }> = {
  // === HOSE ===
  'AAA': { name: 'Nhựa An Phát Xanh', exchange: 'HOSE' },
  'ACB': { name: 'Ngân hàng Á Châu', exchange: 'HOSE' },
  'BCM': { name: 'Tổng Công ty Becamex', exchange: 'HOSE' },
  'BID': { name: 'Ngân hàng BIDV', exchange: 'HOSE' },
  'BVH': { name: 'Tập đoàn Bảo Việt', exchange: 'HOSE' },
  'CTG': { name: 'Ngân hàng VietinBank', exchange: 'HOSE' },
  'CTR': { name: 'Viettel Construction', exchange: 'HOSE' },
  'DGC': { name: 'Hóa chất Đức Giang', exchange: 'HOSE' },
  'DPM': { name: 'Đạm Phú Mỹ', exchange: 'HOSE' },
  'DXG': { name: 'Đất Xanh Group', exchange: 'HOSE' },
  'EIB': { name: 'Ngân hàng Eximbank', exchange: 'HOSE' },
  'FPT': { name: 'FPT Corporation', exchange: 'HOSE' },
  'GAS': { name: 'PV Gas', exchange: 'HOSE' },
  'GEX': { name: 'Tập đoàn Gelex', exchange: 'HOSE' },
  'GVR': { name: 'Cao su Việt Nam', exchange: 'HOSE' },
  'HCM': { name: 'Chứng khoán TP.HCM', exchange: 'HOSE' },
  'HDB': { name: 'Ngân hàng HDBank', exchange: 'HOSE' },
  'HDC': { name: 'Hodeco', exchange: 'HOSE' },
  'HDG': { name: 'Tập đoàn Hà Đô', exchange: 'HOSE' },
  'HHV': { name: 'Đầu tư Hạ tầng Giao thông Đèo Cả', exchange: 'HOSE' },
  'HPG': { name: 'Tập đoàn Hòa Phát', exchange: 'HOSE' },
  'HSG': { name: 'Tập đoàn Hoa Sen', exchange: 'HOSE' },
  'KBC': { name: 'KCN Kinh Bắc', exchange: 'HOSE' },
  'KDC': { name: 'Tập đoàn Kido', exchange: 'HOSE' },
  'KDH': { name: 'Nhà Khang Điền', exchange: 'HOSE' },
  'KOS': { name: 'Kosy Group', exchange: 'HOSE' },
  'LPB': { name: 'Ngân hàng LienVietPostBank', exchange: 'HOSE' },
  'MBB': { name: 'Ngân hàng Quân đội MB', exchange: 'HOSE' },
  'MSB': { name: 'Ngân hàng MSB', exchange: 'HOSE' },
  'MSN': { name: 'Tập đoàn Masan', exchange: 'HOSE' },
  'MWG': { name: 'Thế Giới Di Động', exchange: 'HOSE' },
  'NLG': { name: 'Nam Long Group', exchange: 'HOSE' },
  'NVL': { name: 'Novaland', exchange: 'HOSE' },
  'OCB': { name: 'Ngân hàng Phương Đông', exchange: 'HOSE' },
  'PDR': { name: 'Phát Đạt', exchange: 'HOSE' },
  'PLX': { name: 'Petrolimex', exchange: 'HOSE' },
  'PNJ': { name: 'Vàng bạc Đá quý Phú Nhuận', exchange: 'HOSE' },
  'POW': { name: 'Điện lực Dầu khí', exchange: 'HOSE' },
  'PVD': { name: 'PV Drilling', exchange: 'HOSE' },
  'PVT': { name: 'PV Trans', exchange: 'HOSE' },
  'REE': { name: 'REE Corporation', exchange: 'HOSE' },
  'SAB': { name: 'Sabeco', exchange: 'HOSE' },
  'SCR': { name: 'Bất động sản Sài Gòn Thương Tín', exchange: 'HOSE' },
  'SHB': { name: 'Ngân hàng SHB', exchange: 'HOSE' },
  'SSB': { name: 'Ngân hàng SeABank', exchange: 'HOSE' },
  'SSI': { name: 'Chứng khoán SSI', exchange: 'HOSE' },
  'STB': { name: 'Ngân hàng Sacombank', exchange: 'HOSE' },
  'TCB': { name: 'Ngân hàng Techcombank', exchange: 'HOSE' },
  'TCH': { name: 'Hoàng Huy Group', exchange: 'HOSE' },
  'TPB': { name: 'Ngân hàng TPBank', exchange: 'HOSE' },
  'VCB': { name: 'Ngân hàng Vietcombank', exchange: 'HOSE' },
  'VCI': { name: 'Chứng khoán Bản Việt', exchange: 'HOSE' },
  'VGC': { name: 'Viglacera', exchange: 'HOSE' },
  'VHC': { name: 'Vĩnh Hoàn', exchange: 'HOSE' },
  'VHM': { name: 'Vinhomes', exchange: 'HOSE' },
  'VIB': { name: 'Ngân hàng VIB', exchange: 'HOSE' },
  'VIC': { name: 'Vingroup', exchange: 'HOSE' },
  'VJC': { name: 'Vietjet Air', exchange: 'HOSE' },
  'VNM': { name: 'Vinamilk', exchange: 'HOSE' },
  'VPB': { name: 'Ngân hàng VPBank', exchange: 'HOSE' },
  'VRE': { name: 'Vincom Retail', exchange: 'HOSE' },

  // === HNX ===
  'BCC': { name: 'Xi măng Bỉm Sơn', exchange: 'HNX' },
  'CEO': { name: 'Tập đoàn C.E.O', exchange: 'HNX' },
  'DTD': { name: 'ĐT Phát triển Thành Đạt', exchange: 'HNX' },
  'IDC': { name: 'Tập đoàn IDICO', exchange: 'HNX' },
  'L14': { name: 'Licogi 14', exchange: 'HNX' },
  'PVS': { name: 'Dịch vụ Kỹ thuật Dầu khí', exchange: 'HNX' },
  'SHS': { name: 'Chứng khoán SHS', exchange: 'HNX' },
  'TNG': { name: 'Đầu tư TNG', exchange: 'HNX' },
  'VC3': { name: 'Vinaconex 3', exchange: 'HNX' },

  // === UPCOM ===
  'ACV': { name: 'Tổng Công ty Cảng HKVN', exchange: 'UPCOM' },
  'BSR': { name: 'Lọc hóa dầu Bình Sơn', exchange: 'UPCOM' },
  'DDV': { name: 'DAP ĐÌNH VŨ', exchange: 'UPCOM' },
  'HNG': { name: 'HAGL Agrico', exchange: 'UPCOM' },
  'MCH': { name: 'Masan Consumer Holdings', exchange: 'UPCOM' },
  'OIL': { name: 'Tổng Công ty Dầu Việt Nam', exchange: 'UPCOM' },
  'QNS': { name: 'Đường Quảng Ngãi', exchange: 'UPCOM' },
  'VEA': { name: 'VEAM', exchange: 'UPCOM' },
  'VGI': { name: 'Viettel Global', exchange: 'UPCOM' },
  'VTP': { name: 'Viettel Post', exchange: 'UPCOM' },
};

/**
 * Tra cứu tên công ty theo mã cổ phiếu.
 * Trả về tên đầy đủ nếu có, hoặc fallback về chính mã cổ phiếu đó.
 */
export function getStockName(symbol: string): string {
  const code = symbol.toUpperCase();
  return STOCK_NAMES[code]?.name || code;
}

/**
 * Tra cứu sàn giao dịch theo mã cổ phiếu.
 * Nếu không có trong danh sách, trả về null (để logic detect tự xác định).
 */
export function getStockExchange(symbol: string): string | null {
  const code = symbol.toUpperCase();
  return STOCK_NAMES[code]?.exchange || null;
}
