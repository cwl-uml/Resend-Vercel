import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // 僅接受 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fromPrefix, to, subject, htmlContent, accessKey } = req.body;

  // 簡易安全驗證：檢查自訂防護密碼
  if (process.env.APP_SECRET && accessKey !== process.env.APP_SECRET) {
    return res.status(401).json({ error: '存取密碼錯誤，拒絕發信' });
  }

  if (!fromPrefix || !to || !subject || !htmlContent) {
    return res.status(400).json({ error: '請完整填寫所有必填欄位' });
  }

  // 自動固定發信網域為 niceshop.vip
  const fromAddress = `${fromPrefix.trim()}@niceshop.vip`;

  try {
    const data = await resend.emails.send({
      from: fromAddress,
      to: [to.trim()],
      subject: subject.trim(),
      html: htmlContent.replace(/\n/g, '<br/>'),
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message || '發信失敗' });
  }
}