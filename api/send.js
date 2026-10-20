import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { customSender, fromPrefix, replyTo, to, subject, htmlContent, accessKey } = req.body;

  // 1. 密碼驗證
  if (process.env.APP_SECRET && accessKey !== process.env.APP_SECRET) {
    return res.status(401).json({ error: '存取憑證無效或已過期，請重新登入' });
  }

  if (!to || !subject || !htmlContent) {
    return res.status(400).json({ error: '收件人、主旨與內文為必填' });
  }

  // 2. 寄件人地址組裝：
  // 基礎郵件發信地址維持驗證過的 @niceshop.vip
  const prefix = (fromPrefix || 'mail').trim();
  const actualEmail = `${prefix}@niceshop.vip`;

  // 若有設定自訂寄件人名稱或表頭顯示，組裝成 RFC 格式： "自訂名稱" <prefix@niceshop.vip>
  let fromHeader = actualEmail;
  if (customSender && customSender.trim()) {
    const cleanName = customSender.trim().replace(/[<>"]/g, '');
    fromHeader = `"${cleanName}" <${actualEmail}>`;
  }

  try {
    const payload = {
      from: fromHeader,
      to: [to.trim()],
      subject: subject.trim(),
      html: htmlContent.replace(/\n/g, '<br/>'),
    };

    // 若有設定回覆地址，加入 reply_to 表頭
    if (replyTo && replyTo.trim()) {
      payload.reply_to = replyTo.trim();
    }

    const data = await resend.emails.send(payload);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message || '郵件發送異常' });
  }
}
