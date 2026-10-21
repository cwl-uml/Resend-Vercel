import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { customSender, fromEmail, replyTo, to, subject, htmlContent, accessKey } = req.body;

  // 1. 金鑰驗證
  if (process.env.APP_SECRET && accessKey !== process.env.APP_SECRET) {
    return res.status(401).json({ error: '金鑰無效或權限不足' });
  }

  if (!fromEmail || !to || !subject || !htmlContent) {
    return res.status(400).json({ error: '發信地址、收件人、主旨與內文為必填' });
  }

  // 2. 切分多個收件人
  const recipientList = to
    .split(/[,，;；\s]+/)
    .map(email => email.trim())
    .filter(email => email.length > 0);

  if (recipientList.length === 0) {
    return res.status(400).json({ error: '請提供有效的收件人地址' });
  }

  // 3. 組裝顯示寄件人標頭
  const actualEmail = fromEmail.trim();
  let fromHeader = actualEmail;
  if (customSender && customSender.trim()) {
    const cleanName = customSender.trim().replace(/[<>"]/g, '');
    fromHeader = `"${cleanName}" <${actualEmail}>`;
  }

  // 4. 建立 Gmail SMTP 連線
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // 你的 Gmail 信箱 (例如 yourname@gmail.com)
      pass: process.env.GMAIL_APP_PASSWORD, // 剛才產生的 16 碼應用程式密碼
    },
  });

  try {
    const mailOptions = {
      from: fromHeader,
      to: recipientList,
      subject: subject.trim(),
      text: htmlContent, // 同時附上純文字版本，進一步提升防垃圾信評分
      html: htmlContent.replace(/\n/g, '<br/>'),
      replyTo: replyTo && replyTo.trim() ? replyTo.trim() : actualEmail,
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      data: { id: info.messageId }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || '郵件發送異常' });
  }
}
