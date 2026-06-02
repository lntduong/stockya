import { NextResponse } from 'next/server';
import { getAllActiveAlerts, saveAlert } from '@/lib/google-sheets';
import { getStockOverview } from '@/lib/stock-api';

// Đặt thời gian cache bằng 0 để đảm bảo mỗi lần trigger API đều chạy thật (Không cache)
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const alerts = await getAllActiveAlerts();
    if (alerts.length === 0) return NextResponse.json({ message: 'No active alerts found' });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const defaultChatId = process.env.TELEGRAM_USER;
    
    if (!botToken || !defaultChatId) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_USER missing in env' }, { status: 500 });
    }

    const messagesSent = [];

    for (const alert of alerts) {
      try {
        const tenMinutes = 10 * 60 * 1000;
        const now = Date.now();
        
        // Bỏ qua nếu chưa đủ 10 phút kể từ lần báo trước
        if (alert.lastAlertedAt && now - alert.lastAlertedAt < tenMinutes) {
          continue;
        }

        const overview = await getStockOverview(alert.symbol);
        const currentPrice = overview.price; // Đã nhân 1000
        
        let triggered = false;
        let message = '';

        if (alert.minPrice > 0 && currentPrice <= alert.minPrice) {
          triggered = true;
          message = `📉 [STOCKYA CẢNH BÁO CẮT LỖ]\nCổ phiếu *${alert.symbol}* đã giảm mạnh xuống mức giá *${(currentPrice/1000).toFixed(2)}*\nNgưỡng cắt lỗ của bạn là: ${(alert.minPrice/1000).toFixed(2)}`;
        } else if (alert.maxPrice > 0 && currentPrice >= alert.maxPrice) {
          triggered = true;
          message = `🚀 [STOCKYA CẢNH BÁO CHỐT LỜI]\nCổ phiếu *${alert.symbol}* đã tăng vọt lên mức giá *${(currentPrice/1000).toFixed(2)}*\nNgưỡng chốt lời của bạn là: ${(alert.maxPrice/1000).toFixed(2)}`;
        }

        if (triggered) {
          // Gọi API Telegram để gửi tin nhắn
          const chatId = alert.telegramChatId || defaultChatId;
          const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
          
          const tgResponse = await fetch(tgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              chat_id: chatId, 
              text: message,
              parse_mode: 'Markdown'
            })
          });
          
          if (!tgResponse.ok) {
            console.error('Failed to send Telegram message', await tgResponse.text());
          } else {
             // Cập nhật thời gian gửi thông báo để có thể gửi lại sau 10 phút
             await saveAlert({ ...alert, lastAlertedAt: Date.now() });
             messagesSent.push(alert.symbol);
          }
        }
      } catch (err) {
        console.error(`Error processing alert for ${alert.symbol}`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalActiveAlertsScanned: alerts.length, 
      alertsTriggered: messagesSent 
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
