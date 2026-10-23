import axios from 'axios';
import FormData from 'form-data';

let cachedToken: { token: string; expiresAt: number } | null = null;

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export function isValidMedicalCertificateType(filename: string, mimeType?: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext && ALLOWED_EXTENSIONS.includes(ext)) {
    return true;
  }
  if (mimeType && ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return true;
  }
  return false;
}

export function getFileExtension(filename: string, mimeType?: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext && ALLOWED_EXTENSIONS.includes(ext)) {
    return ext === 'jpeg' ? 'jpeg' : ext;
  }
  if (mimeType) {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('jpeg')) return 'jpeg';
    if (mimeType.includes('jpg')) return 'jpg';
  }
  return 'pdf';
}

/**
 * Validates whether required Zoho environment variables are configured.
 */
export function validateZohoConfig(): { isValid: boolean; missing: string[] } {
  const required: Record<string, string | undefined> = {
    ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN,
    ZOHO_PARENT_FOLDER_ID: process.env.ZOHO_PARENT_FOLDER_ID,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Refreshes and returns the Zoho OAuth access token (cached in memory).
 */
export async function getZohoAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Zoho WorkDrive configuration missing: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN');
  }

  const response = await axios.post(
    `${accountsUrl}/oauth/v2/token`,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const accessToken = response.data?.access_token;
  if (!accessToken) {
    throw new Error(`Failed to obtain Zoho access token: ${JSON.stringify(response.data)}`);
  }

  const expiresInSec = response.data?.expires_in || 3600;
  cachedToken = {
    token: accessToken,
    expiresAt: now + expiresInSec * 1000,
  };

  return accessToken;
}

/**
 * Format filename as requested:
 * "employeeName" + "_ " + "MC " + "_ " + "date ( dd/mm/yyyy )"
 * (for example => Employee A_MC_20/10/2026.pdf)
 */
export function formatMedicalCertificateFilename({
  employeeName,
  leaveDate,
  extension,
  index = 0,
}: {
  employeeName: string;
  leaveDate?: Date | string;
  extension: string;
  index?: number;
}): string {
  const d = leaveDate ? new Date(leaveDate) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const day = String(validDate.getDate()).padStart(2, '0');
  const month = String(validDate.getMonth() + 1).padStart(2, '0');
  const year = validDate.getFullYear();
  const dateFormatted = `${day}/${month}/${year}`;

  const cleanName = (employeeName || 'Employee').trim();
  const cleanExt = extension.replace(/^\./, '').toLowerCase() || 'pdf';
  const suffix = index > 0 ? `_${index + 1}` : '';

  return `${cleanName}_MC_${dateFormatted}${suffix}.${cleanExt}`;
}

/**
 * Upload a file buffer to Zoho WorkDrive into the target folder.
 */
export async function uploadFileToWorkDrive({
  content,
  filename,
  contentType,
  folderId,
}: {
  content: Buffer;
  filename: string;
  contentType: string;
  folderId?: string;
}): Promise<{ permalink: string; fileId: string; filename: string; directUrl: string }> {
  const targetFolderId = folderId || process.env.ZOHO_PARENT_FOLDER_ID;
  if (!targetFolderId) {
    throw new Error('Zoho WorkDrive target folder ID (ZOHO_PARENT_FOLDER_ID) is not configured.');
  }

  const accessToken = await getZohoAccessToken();
  const apiUrl = process.env.ZOHO_API_URL || 'https://www.zohoapis.com';

  const form = new FormData();
  form.append('parent_id', targetFolderId);
  form.append('filename', filename);
  form.append('content', content, {
    filename,
    contentType,
  });

  const response = await axios.post(
    `${apiUrl}/workdrive/api/v1/upload`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        Accept: 'application/vnd.api+json',
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  );

  const data = response.data?.data;
  const file = Array.isArray(data) ? data[0] : data;

  if (!file) {
    throw new Error(`Failed to upload to Zoho WorkDrive: ${JSON.stringify(response.data)}`);
  }

  const permalink =
    file.attributes?.Permalink ||
    file.attributes?.permalink ||
    `https://workdrive.zoho.com/file/${file.attributes?.resource_id || file.id}`;

  const fileId = file.attributes?.resource_id || file.id;

  return {
    permalink,
    fileId,
    filename,
    directUrl: `/api/leaves/attachment/${fileId}`,
  };
}

/**
 * Downloads a file from Zoho WorkDrive using the /workdrive/api/v1/download/{resourceId} endpoint.
 */
export async function downloadFileFromWorkDrive(resourceId: string): Promise<{
  data: Buffer;
  contentType: string;
  filename: string;
}> {
  const accessToken = await getZohoAccessToken();
  const apiUrl = process.env.ZOHO_API_URL || 'https://www.zohoapis.com';

  const response = await axios.get(
    `${apiUrl}/workdrive/api/v1/download/${resourceId}`,
    {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
      responseType: 'arraybuffer',
    }
  );

  const contentType = String(response.headers['content-type'] || 'application/pdf');
  const contentDisp = response.headers['content-disposition'] || '';

  // Extract filename if present in content-disposition header
  let filename = 'medical_certificate.pdf';
  const utf8Match = contentDisp.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) {
    try {
      filename = decodeURIComponent(utf8Match[1]);
    } catch {
      filename = utf8Match[1];
    }
  } else {
    const regularMatch = contentDisp.match(/filename="?([^";]+)"?/i);
    if (regularMatch) {
      filename = regularMatch[1];
    }
  }

  return {
    data: Buffer.from(response.data),
    contentType,
    filename,
  };
}

