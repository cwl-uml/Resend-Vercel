import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { customSender, fromPrefix, replyTo, to, subject, htmlContent, accessKey } = req.body;

  // 驗證金鑰
  if (process.env.APP_SECRET && accessKey !== process.env.APP_SECRET) {
    return res.status(401).json({ error: '金鑰無效或權限不足' });
  }

  if (!to || !subject || !htmlContent) {
    return res.status(400).json({ error: '收件人、主旨與內文為必填' });
  }

  const prefix = (fromPrefix || 'mail').trim();
  const actualEmail = `${prefix}@niceshop.vip`;

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

    if (replyTo && replyTo.trim()) {
      payload.reply_to = replyTo.trim();
    }

    const data = await resend.emails.send(payload);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message || '郵件發送異常' });
  }
}
