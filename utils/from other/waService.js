
const path = require('path');
const fs = require('fs');
const wasender = require('./wasender');

// Default session API key for the admin WhatsApp session
// IMPORTANT: Replace 'YOUR_SESSION_API_KEY' with the actual session API key from your Wasender dashboard
// This ensures only the specific WhatsApp session can send messages, avoiding conflicts
const DEFAULT_ADMIN_SESSION_API_KEY = 'a7f245143432998561312ebab2dfc1819ddff96d4a73f5bbc913bcac34614126';
// Base URL to serve public files (Excel, etc.)
const APP_BASE_URL =  'https://elkablycentersystem.online';

function normalizeEgyptNumber(rawPhone, countryCode = '20') {
  const phoneAsString = (typeof rawPhone === 'string' ? rawPhone : String(rawPhone || '')).trim();
  if (!phoneAsString) return null;
  let cleaned = phoneAsString.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  let cc = String(countryCode || '20').replace(/^0+/, '');
  let combined = `${cc}${cleaned}`.replace(/\D/g, '');
  if (!combined.startsWith('2')) combined = `2${combined}`; // ensure leading country indicator for EG
  return combined;
}

function toJid(phone, countryCode = '20') {
  const normalized = normalizeEgyptNumber(phone, countryCode);
  if (!normalized) return null;
  return `${normalized}@s.whatsapp.net`;
}

/**
 * Validates that a session API key is provided and not the placeholder
 * @param {string} sessionApiKey - The session API key to validate
 * @returns {string} - The validated session API key
 * @throws {Error} - If the session API key is invalid or missing
 */
async function validateSessionApiKey(sessionApiKey) {
  if (!sessionApiKey || sessionApiKey === 'YOUR_SESSION_API_KEY') {
    throw new Error('Invalid or missing session API key');
  }
  return sessionApiKey;
}

async function getAdminSessionApiKey() {
  return await validateSessionApiKey(DEFAULT_ADMIN_SESSION_API_KEY);
}

/**
 * Get the current session status using the session API key
 * @param {string} sessionApiKey - The session API key to check
 * @returns {Object} - Session info with status
 */
async function getSessionStatus(sessionApiKey = DEFAULT_ADMIN_SESSION_API_KEY) {
  try {
    const validApiKey = await validateSessionApiKey(sessionApiKey);
    const sessionsResponse = await wasender.getAllSessions();
    if (!sessionsResponse.success) {
      return { success: false, message: 'Failed to get sessions', status: 'UNKNOWN' };
    }
    
    const sessions = sessionsResponse.data || [];
    const session = sessions.find(s => s.api_key === validApiKey);
    
    if (!session) {
      return { success: false, message: 'Session not found for the provided API key', status: 'NOT_FOUND' };
    }
    
    return { 
      success: true, 
      data: session,
      status: session.status || 'DISCONNECTED'
    };
  } catch (error) {
    return { success: false, message: error.message, status: 'ERROR' };
  }
}

async function connectAdminSession(sessionApiKey = DEFAULT_ADMIN_SESSION_API_KEY) {
  try {
    const validApiKey = await validateSessionApiKey(sessionApiKey);
    // For session API key, we need to get the session ID first
    const sessionsResponse = await wasender.getAllSessions();
    if (!sessionsResponse.success) return sessionsResponse;
    const sessions = sessionsResponse.data || [];
    const target = sessions.find(s => s.api_key === validApiKey);
    if (!target) return { success: false, message: 'Session not found for the provided API key' };
    return await wasender.connectSession(target.id);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function getAdminQRCode(sessionApiKey = DEFAULT_ADMIN_SESSION_API_KEY) {
  try {
    const validApiKey = await validateSessionApiKey(sessionApiKey);
    const sessionsResponse = await wasender.getAllSessions();
    if (!sessionsResponse.success) return sessionsResponse;
    const sessions = sessionsResponse.data || [];
    const target = sessions.find(s => s.api_key === validApiKey);
    if (!target) return { success: false, message: 'Session not found for the provided API key' };
    return await wasender.getQRCode(target.id);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Sends a text message via WhatsApp using default session API key
 * @param {string} message - The message text to send
 * @param {string} phone - The recipient phone number
 * @param {boolean} isExcel - Whether the message is Excel related (legacy parameter)
 * @param {string} countryCode - The country code (default: '20' for Egypt)
 * @returns {Object} - Success/failure response with message
 */
async function sendWasenderMessage(message, phone, isExcel = false, countryCode = '20') {
  try {
    const phoneAsString = (typeof phone === 'string' ? phone : String(phone || '')).trim();
    if (!phoneAsString) {
      return { success: false, message: 'No phone number provided' };
    }
    const validApiKey = await validateSessionApiKey( DEFAULT_ADMIN_SESSION_API_KEY);
    const jid = toJid(phoneAsString, countryCode);
    if (!jid) return { success: false, message: 'Invalid phone number' };
    const response = await wasender.sendTextMessage(validApiKey, jid, message);
    return response;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function sendQRMessage(studentCode, phone, countryCode = '20', captionPrefix = 'Scan the QR code to check in') {
  try {
    const validApiKey = await validateSessionApiKey(DEFAULT_ADMIN_SESSION_API_KEY);
    const jid = toJid(phone, countryCode);
    if (!jid) return { success: false, message: 'Invalid phone number' };
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(studentCode)}`;
    const caption = `${captionPrefix}`;
    const response = await wasender.sendImageMessage(validApiKey, jid, qrUrl, caption);
    return response;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function sendExcelFile(buffer, fileName, phone, countryCode = '20', caption = '') {
  try {
    // Ensure export dir exists under public
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
    // Save file locally to be served via static hosting
    const filePath = path.join(exportDir, fileName);
    fs.writeFileSync(filePath, buffer);
    const publicUrlPrimary = `${APP_BASE_URL}/exports/${encodeURIComponent(fileName)}`;
    const publicUrlFallback = `http://localhost:8600/exports/${encodeURIComponent(fileName)}`;

    const validApiKey = await validateSessionApiKey(DEFAULT_ADMIN_SESSION_API_KEY);
    const jid = toJid(phone, countryCode);
    if (!jid) return { success: false, message: 'Invalid phone number' };

    // Preferred path: upload media to Wasender and send by media id/url
    try {
      const upload = await wasender.uploadMedia(validApiKey, Buffer.from(buffer), fileName, 'document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      if (upload?.success) {
        const mediaUrl = upload.data?.url || upload.data?.mediaUrl || publicUrlPrimary;
        const resp = await wasender.sendDocumentMessage(validApiKey, jid, mediaUrl, fileName);
        if (resp?.success) return resp;
      }
    } catch (e) {
      // fallthrough to direct URL
    }

    // Fallback: send document via public URL (primary then localhost)
    let response = await wasender.sendDocumentMessage(validApiKey, jid, publicUrlPrimary, fileName);
    if (!response?.success) {
      try {
        response = await wasender.sendDocumentMessage(validApiKey, jid, publicUrlFallback, fileName);
      } catch (e) {}
    }
    return response;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// Simplest path: save to public and send documentUrl directly (no upload)
async function sendExcelFileSimple(buffer, fileName, phone, countryCode = '20') {
  try {
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
    const filePath = path.join(exportDir, fileName);
    fs.writeFileSync(filePath, buffer);
    const publicUrlPrimary = `${APP_BASE_URL}/exports/${encodeURIComponent(fileName)}`;
    const publicUrlFallback = `http://localhost:8600/exports/${encodeURIComponent(fileName)}`;

    const validApiKey = await validateSessionApiKey(DEFAULT_ADMIN_SESSION_API_KEY);
    const jid = toJid(phone, countryCode);
    if (!jid) return { success: false, message: 'Invalid phone number' };

    let response = await wasender.sendDocumentMessage(validApiKey, jid, publicUrlPrimary, fileName);
    if (!response?.success) {
      try {
        response = await wasender.sendDocumentMessage(validApiKey, jid, publicUrlFallback, fileName);
      } catch (e) {}
    }
    return response;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

module.exports = {
  DEFAULT_ADMIN_SESSION_API_KEY,
  sendWasenderMessage,
  sendQRMessage,
  sendExcelFile,
  toJid,
  normalizeEgyptNumber,
  getAdminSessionApiKey,
  connectAdminSession,
  getAdminQRCode,
  sendExcelFileSimple,
  validateSessionApiKey,
  getSessionStatus,
};


