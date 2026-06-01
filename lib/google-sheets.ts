import { google } from 'googleapis';

export interface Watchlist {
  id: string;
  name: string;
  symbols: string;
}

export interface StockAlert {
  symbol: string;
  minPrice: number;
  maxPrice: number;
  isActive: boolean;
  telegramChatId: string;
}

// Cấu hình xác thực Google API
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';

let sheets: any = null;
let spreadsheetId = process.env.GOOGLE_SHEET_ID;

if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && privateKey && spreadsheetId) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheets = google.sheets({ version: 'v4', auth });
}



export async function getWatchlists(): Promise<Watchlist[]> {
  if (!sheets || !spreadsheetId) {
    throw new Error('Google Sheets Credentials or Spreadsheet ID not found in environment variables.');
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A2:C',
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }
    
    return rows.map((row: any[]) => ({
      id: row[0] || '',
      name: row[1] || '',
      symbols: row[2] || '',
    }));
  } catch (error) {
    console.error('Lỗi khi đọc Google Sheets:', error);
    throw error;
  }
}

export async function saveWatchlists(watchlists: Watchlist[]): Promise<void> {
  if (!sheets || !spreadsheetId) {
    throw new Error('Google Sheets Credentials or Spreadsheet ID not found in environment variables.');
  }

  const values = watchlists.map((wl) => [wl.id, wl.name, wl.symbols]);
  
  try {
    // Xóa dữ liệu cũ (A2:C) để tránh bị rác nếu danh sách mới ngắn hơn danh sách cũ
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Sheet1!A2:C',
    });
    
    // Ghi đè danh sách mới
    if (values.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A2:C',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });
    }
  } catch (error) {
    console.error('Lỗi khi ghi Google Sheets:', error);
    throw new Error('Failed to save to Google Sheets');
  }
}

export async function getAlert(symbol: string): Promise<StockAlert | null> {
  if (!sheets || !spreadsheetId) throw new Error('Google Sheets Credentials or Spreadsheet ID not found.');
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Alerts!A2:E',
    });
    
    const rows = response.data.values;
    if (!rows) return null;
    
    const row = rows.find((r: any[]) => r[0] === symbol);
    if (!row) return null;
    
    return {
      symbol: row[0] || symbol,
      minPrice: parseFloat(row[1]) || 0,
      maxPrice: parseFloat(row[2]) || 0,
      isActive: row[3]?.toString().toLowerCase() === 'true',
      telegramChatId: row[4] || '',
    };
  } catch (error) {
    console.error('Lỗi khi đọc tab Alerts (Có thể tab chưa được tạo):', error);
    return null; 
  }
}

export async function saveAlert(alert: StockAlert): Promise<void> {
  if (!sheets || !spreadsheetId) throw new Error('Google Sheets Credentials or Spreadsheet ID not found.');
  
  try {
    let rows: any[] = [];
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Alerts!A2:E',
      });
      rows = response.data.values || [];
    } catch (e) {
      console.warn("Không đọc được tab Alerts. Vui lòng đảm bảo đã tạo tab Alerts.");
    }
    
    const index = rows.findIndex((r: any[]) => r[0] === alert.symbol);
    
    const newRow = [
      alert.symbol, 
      alert.minPrice.toString(), 
      alert.maxPrice.toString(), 
      alert.isActive ? 'true' : 'false', 
      alert.telegramChatId
    ];
    
    if (index >= 0) {
      rows[index] = newRow;
    } else {
      rows.push(newRow);
    }
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Alerts!A2:E',
    });
    
    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Alerts!A2:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows },
      });
    }
  } catch (error) {
    console.error('Lỗi khi ghi tab Alerts:', error);
    throw new Error('Failed to save alert');
  }
}

export async function getAllActiveAlerts(): Promise<StockAlert[]> {
  if (!sheets || !spreadsheetId) return [];
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Alerts!A2:E',
    });
    const rows = response.data.values;
    if (!rows) return [];
    
    return rows.filter((r: any[]) => r[3]?.toString().toLowerCase() === 'true').map((row: any[]) => ({
      symbol: row[0],
      minPrice: parseFloat(row[1]) || 0,
      maxPrice: parseFloat(row[2]) || 0,
      isActive: true,
      telegramChatId: row[4] || '',
    }));
  } catch (error) {
    console.error('Lỗi khi lấy toàn bộ alerts:', error);
    return [];
  }
}
