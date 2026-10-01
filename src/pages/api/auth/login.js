import { authenticateStudent, resolveSheetNames } from '@/utils/googleSheet';
import { setSessionCookie } from '@/lib/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { slug, regno, password } = req.body;

  if (!slug || !regno || !password) {
    return res.status(400).json({ error: '必須填寫表格代號、登記編號及密碼' });
  }

  try {
    // Dynamically resolve sheet names for this spreadsheet ID
    const { infoSheetName, dataSheetName } = await resolveSheetNames(slug);

    const result = await authenticateStudent(
      slug,
      dataSheetName,
      regno,
      password
    );

    if (result.error) {
      return res.status(401).json({ error: result.error });
    }

    // Set JWT Cookie
    const sessionPayload = {
      role: 'USER',
      regno: String(regno).trim().toLowerCase(),
      formSlug: slug,
      infoSheetName,
      dataSheetName,
      rowNumber: result.rowNumber,
      studentInfo: result.studentInfo,
      isLocked: result.isLocked
    };

    setSessionCookie(res, sessionPayload);

    return res.status(200).json({
      success: true,
      studentInfo: result.studentInfo,
      isLocked: result.isLocked,
      submitted: result.submitted
    });
  } catch (error) {
    console.error('[API Student Login Error]:', error);
    return res.status(500).json({ error: '系統進行驗證時出現伺服器內部錯誤，請稍後重試。若問題持續，請聯絡系統管理員' });
  }
}
