export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { accessKey } = req.body;
  const secret = process.env.APP_SECRET;

  // 若伺服器未設定 APP_SECRET，預設允許通過；若有設定則嚴格比對
  if (secret && accessKey !== secret) {
    return res.status(401).json({ valid: false, error: '存取金鑰錯誤' });
  }

  return res.status(200).json({ valid: true });
}
