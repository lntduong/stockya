/**
 * DNSE (Entrade) API - Nguồn dữ liệu chứng khoán Việt Nam
 * Hỗ trợ toàn bộ 3 sàn: HOSE, HNX, UPCOM
 * Giá trả về theo đơn vị VNĐ gốc (ví dụ: 25750 cho HDB 25.75)
 */

const DNSE_BASE = 'https://services.entrade.com.vn/chart-api/v2/ohlcs/stock';

import { getStockName, getStockExchange } from './stock-names';

export interface StockOverview {
  ticker: string;
  price: number;
  percentChange: number;
  volume: number;
  referencePrice: number;
  ceilingPrice: number;
  floorPrice: number;
  pe?: number;
  eps?: number;
  name?: string;
  exchange?: string;
}

export interface StockHistoryData {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Xác định sàn giao dịch dựa trên giá trần/sàn so với tham chiếu
 * HOSE: biên độ ±7%, HNX: ±10%, UPCOM: ±15%
 */
function detectExchange(refPrice: number, ceilPrice: number): string {
  if (refPrice <= 0) return 'HOSE';
  const ratio = (ceilPrice - refPrice) / refPrice;
  if (Math.abs(ratio - 0.07) < 0.01) return 'HOSE';
  if (Math.abs(ratio - 0.10) < 0.01) return 'HNX';
  if (Math.abs(ratio - 0.15) < 0.01) return 'UPCOM';
  return 'HOSE';
}

export async function getStockOverview(symbol: string): Promise<StockOverview> {
  const code = symbol.toUpperCase();

  try {
    // Lấy 5 phiên gần nhất để có đủ dữ liệu tính tham chiếu
    const now = Math.floor(Date.now() / 1000);
    const fiveDaysAgo = now - 7 * 24 * 60 * 60; // Lùi 7 ngày để đảm bảo có ít nhất 2 phiên (qua cuối tuần)

    const res = await fetch(
      `${DNSE_BASE}?resolution=1D&symbol=${code}&from=${fiveDaysAgo}&to=${now}`,
      { next: { revalidate: 10 } }
    );

    if (!res.ok) throw new Error(`DNSE API returned ${res.status}`);

    const json = await res.json();
    const { t, o, h, l, c, v } = json;

    if (!t || t.length === 0) {
      throw new Error(`No data returned for ${code}`);
    }

    const lastIdx = t.length - 1;
    // Giá hiện tại (phiên mới nhất) — DNSE trả về dạng nghìn đồng (VD: 25.75)
    const priceInK = c[lastIdx];
    const volumeRaw = v[lastIdx];

    // Giá tham chiếu = giá đóng cửa phiên trước
    const refPriceInK = lastIdx > 0 ? c[lastIdx - 1] : priceInK;

    // Quy đổi sang VNĐ gốc (nhân 1000) để giữ tương thích với toàn bộ UI hiện có
    const price = Math.round(priceInK * 1000);
    const referencePrice = Math.round(refPriceInK * 1000);

    // Tính biên độ trần/sàn (ước lượng HOSE ±7% làm mặc định)
    // Sau khi tính, dùng kết quả để phát hiện sàn chính xác
    const ceilingPrice = Math.round(referencePrice * 1.07);
    const floorPrice = Math.round(referencePrice * 0.93);

    const change = price - referencePrice;
    const percentChange = referencePrice > 0 ? (change / referencePrice) * 100 : 0;

    // Lấy tên và sàn giao dịch từ bảng tra cứu tĩnh
    const knownExchange = getStockExchange(code);
    const exchange = knownExchange || detectExchange(referencePrice, ceilingPrice);

    return {
      ticker: code,
      price,
      percentChange: parseFloat(percentChange.toFixed(2)),
      volume: volumeRaw,
      referencePrice,
      ceilingPrice,
      floorPrice,
      pe: 0,
      eps: 0,
      name: getStockName(code),
      exchange,
    };
  } catch (error) {
    console.error(`[DNSE] Failed to fetch overview for ${code}`, error);
    throw new Error(`Failed to fetch stock overview for ${code}`);
  }
}

export async function getStockHistory(symbol: string, startDate: string, endDate: string): Promise<StockHistoryData[]> {
  const code = symbol.toUpperCase();

  try {
    const p1 = Math.floor(new Date(startDate).getTime() / 1000);
    const p2 = Math.floor(new Date(endDate).getTime() / 1000);

    const res = await fetch(
      `${DNSE_BASE}?resolution=1D&symbol=${code}&from=${p1}&to=${p2}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) throw new Error(`DNSE API returned ${res.status}`);

    const json = await res.json();
    const { t, o, h, l, c, v } = json;

    if (!t || t.length === 0) {
      throw new Error(`No history data for ${code}`);
    }

    const history: StockHistoryData[] = [];
    for (let i = 0; i < t.length; i++) {
      if (o[i] !== null && o[i] !== undefined) {
        const date = new Date(t[i] * 1000);
        history.push({
          time: date.toISOString().split('T')[0],
          // Nhân 1000 để giữ đơn vị VNĐ gốc, tương thích với toàn bộ logic hiện tại
          open: Math.round(o[i] * 1000),
          high: Math.round(h[i] * 1000),
          low: Math.round(l[i] * 1000),
          close: Math.round(c[i] * 1000),
          volume: v[i] || 0,
        });
      }
    }

    return history;
  } catch (error) {
    console.error(`[DNSE] Failed to fetch history for ${code}`, error);
    throw new Error(`Failed to fetch stock history for ${code}`);
  }
}
