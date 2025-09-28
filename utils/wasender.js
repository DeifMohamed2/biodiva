const axios = require('axios');

// Wasender API configuration
const BASE_URL = 'https://wasenderapi.com/api';
// Access Token for authentication (this is used to access the API)
const ACCESS_TOKEN = '1185|Ly6teYxxGMI3zNdw6MDN4i5eg3D1bPW6j821KhSh321a51ed';
// Single Session API Key for sending messages (replace with your actual session API key)
const SESSION_API_KEY = '14da9136572ff1920fc31e36b7e3c66d99ad4c03efff05391afe83762658222c';

class WasenderClient {
  constructor(accessToken = ACCESS_TOKEN, sessionApiKey = SESSION_API_KEY) {
    this.accessToken = accessToken;
    this.sessionApiKey = sessionApiKey;
    this.http = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
      },
      timeout: 30000,
    });
    // Create session-specific client for message operations
    this.sessionClient = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.sessionApiKey}`,
      },
      timeout: 30000,
    });
  }

  // Internal helpers
  static normalizeSession(session) {
    if (!session || typeof session !== 'object') return null;
    
    const id = session.id ?? session.sessionId ?? session.whatsappSession ?? session.whatsapp_session ?? null;
    const name = session.name ?? '';
    const phone_number = session.phone_number ?? session.phoneNumber ?? session.phone ?? null;
    const status = session.status ?? session.state ?? 'DISCONNECTED';
    const api_key = session.api_key ?? session.apiKey ?? null;
    const account_protection = session.account_protection ?? session.accountProtection ?? false;
    const log_messages = session.log_messages ?? session.logMessages ?? false;
    const webhook_url = session.webhook_url ?? session.webhookUrl ?? null;
    const webhook_enabled = session.webhook_enabled ?? session.webhookEnabled ?? false;
    const webhook_events = session.webhook_events ?? session.webhookEvents ?? [];
    const created_at = session.created_at ?? session.createdAt ?? null;
    const updated_at = session.updated_at ?? session.updatedAt ?? null;
    const last_active_at = session.last_active_at ?? session.lastActiveAt ?? null;
    
    return {
      id,
      name,
      phone_number,
      status,
      api_key,
      account_protection,
      log_messages,
      webhook_url,
      webhook_enabled,
      webhook_events,
      created_at,
      updated_at,
      last_active_at,
    };
  }

  // Create a session-specific client for operations that need the session's API key
  createSessionClient(sessionApiKey) {
    return axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionApiKey}`,
      },
      timeout: 30000,
    });
  }

  // Sessions
  async createSession(payload = {}) {
    try {
      console.log('Creating session with payload:', payload);
      const r = await this.http.post('/whatsapp-sessions', payload);
      const body = r.data;
      console.log('Session creation response:', body);
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to create session' };
      }
      
      const created = body.data;
      const normalized = WasenderClient.normalizeSession(created) ?? created;
      return { success: true, data: normalized };
    } catch (error) {
      console.error('Wasender API Error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        return { success: false, message: 'Authentication failed. Please check your access token.' };
      }
      if (error.response?.status === 400) {
        return { success: false, message: 'Invalid request data', error: error.response.data };
      }
      throw error;
    }
  }

  async getAllSessions() {
    try {
      const r = await this.http.get('/whatsapp-sessions');
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to fetch sessions' };
      }
      
      const sessions = Array.isArray(body.data) ? body.data : [];
      const data = sessions.map(WasenderClient.normalizeSession).filter(Boolean);
      return { success: true, data };
    } catch (error) {
      console.error('Wasender API Error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        return { success: false, message: 'Authentication failed. Please check your access token.' };
      }
      throw error;
    }
  }

  async getSessionDetails(sessionId) {
    try {
      const r = await this.http.get(`/whatsapp-sessions/${sessionId}`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to get session details' };
      }
      
      const raw = body.data ?? body;
      const data = WasenderClient.normalizeSession(raw) ?? raw;
      return { success: true, data };
    } catch (error) {
      console.error('Wasender API Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to get session details', error: error.response?.data };
    }
  }

  async connectSession(sessionId) {
    try {
      console.log(`Connecting session: ${sessionId}`);
      const r = await this.http.post(`/whatsapp-sessions/${sessionId}/connect`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to connect session' };
      }
      
      return { success: true, data: body.data ?? { id: sessionId, status: 'NEED_SCAN' } };
    } catch (error) {
      console.error('Wasender API Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to connect session', error: error.response?.data };
    }
  }

  async getQRCode(sessionId) {
    try {
      console.log(`Getting QR code for session: ${sessionId}`);
      const r = await this.http.get(`/whatsapp-sessions/${sessionId}/qrcode`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to get QR code' };
      }
      
      const qrcode = body.data?.qrCode ?? body.qrCode ?? null;
      return { success: true, data: { qrcode } };
    } catch (error) {
      console.error('Wasender API Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to get QR code', error: error.response?.data };
    }
  }

  // Regenerate QR code (disconnect and reconnect to get fresh QR)
  async regenerateQRCode(sessionId) {
    try {
      console.log(`Regenerating QR code for session: ${sessionId}`);
      
      // First disconnect the session
      await this.disconnectSession(sessionId);
      
      // Wait a moment for disconnection to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then reconnect to get a fresh QR code
      const connectResult = await this.connectSession(sessionId);
      if (!connectResult.success) {
        return { success: false, message: 'Failed to reconnect session for QR regeneration' };
      }
      
      // Get the new QR code
      return await this.getQRCode(sessionId);
    } catch (error) {
      console.error('Wasender QR Regeneration Error:', error);
      return { success: false, message: 'Failed to regenerate QR code', error: error.message };
    }
  }

  async disconnectSession(sessionId) {
    try {
      const r = await this.http.post(`/whatsapp-sessions/${sessionId}/disconnect`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to disconnect session' };
      }
      
      return { success: true, data: body.data ?? { id: sessionId, status: 'DISCONNECTED' } };
    } catch (error) {
      console.error('Wasender API Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to disconnect session', error: error.response?.data };
    }
  }

  async deleteSession(sessionId) {
    try {
      const r = await this.http.delete(`/whatsapp-sessions/${sessionId}`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to delete session' };
      }
      
      return { success: true, data: body.data ?? { id: sessionId, deleted: true } };
    } catch (error) {
      console.error('Wasender API Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to delete session', error: error.response?.data };
    }
  }

  async updateSession(sessionId, data) {
    try {
      const r = await this.http.put(`/whatsapp-sessions/${sessionId}`, data);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to update session' };
      }
      
      const raw = body.data ?? body;
      const normalized = WasenderClient.normalizeSession(raw) ?? raw;
      return { success: true, data: normalized };
    } catch (error) {
      console.error('Wasender API Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to update session', error: error.response?.data };
    }
  }

  async getGlobalStatus() {
    try {
      const r = await this.http.get('/status');
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to get global status' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender API Error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        return { success: false, message: 'Authentication failed. Please check your access token.' };
      }
      throw error;
    }
  }

  // Test authentication
  async testAuth() {
    try {
      const r = await this.http.get('/user');
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Authentication failed' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Auth Test Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Authentication failed', error: error.response?.data };
    }
  }

  // Check if number is on WhatsApp (requires session API key)
  async checkNumberOnWhatsApp(sessionApiKey, jid) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.get(`/on-whatsapp/${jid}`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to check number' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Check Number Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to check number', error: error.response?.data };
    }
  }

  // Regenerate API Key
  async regenerateApiKey(sessionId) {
    try {
      const r = await this.http.post(`/whatsapp-sessions/${sessionId}/regenerate-key`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to regenerate key' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Regenerate Key Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to regenerate key', error: error.response?.data };
    }
  }

  // Send messages (requires session API key)
  async sendTextMessage(sessionApiKey, toJid, text) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/send-message', { to: toJid, text });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send message' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Message Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send message', error: error.response?.data };
    }
  }

  // Simplified method using the configured session API key
  async sendMessage(toJid, text) {
    try {
      if (!this.sessionApiKey) {
        return { success: false, message: 'Session API key not configured' };
      }
      
      const r = await this.sessionClient.post('/send-message', { to: toJid, text });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send message' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Message Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send message', error: error.response?.data };
    }
  }

  // Session management methods using the configured session API key
  async getSessionStatus() {
    try {
      if (!this.sessionApiKey) {
        return { success: false, message: 'Session API key not configured' };
      }
      
      // Use the session API key to get session info
      const r = await this.sessionClient.get('/session-info');
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to get session status' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Get Session Status Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to get session status', error: error.response?.data };
    }
  }

  async getSessionQRCode() {
    try {
      if (!this.sessionApiKey) {
        return { success: false, message: 'Session API key not configured' };
      }
      
      const r = await this.sessionClient.get('/qrcode');
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to get QR code' };
      }
      
      const qrcode = body.data?.qrCode ?? body.qrCode ?? body.data?.qrcode ?? body.qrcode ?? null;
      return { success: true, data: { qrcode } };
    } catch (error) {
      console.error('Wasender Get QR Code Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to get QR code', error: error.response?.data };
    }
  }

  async regenerateSessionQRCode() {
    try {
      if (!this.sessionApiKey) {
        return { success: false, message: 'Session API key not configured' };
      }
      
      // First disconnect the session
      await this.sessionClient.post('/disconnect');
      
      // Wait a moment for disconnection to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then connect to get a fresh QR code
      const connectResult = await this.sessionClient.post('/connect');
      if (!connectResult.data?.success) {
        return { success: false, message: 'Failed to reconnect session for QR regeneration' };
      }
      
      // Get the new QR code
      return await this.getSessionQRCode();
    } catch (error) {
      console.error('Wasender QR Regeneration Error:', error);
      return { success: false, message: 'Failed to regenerate QR code', error: error.message };
    }
  }

  async sendImageMessage(sessionApiKey, toJid, imageUrl, text = '') {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/send-message', { to: toJid, imageUrl, text });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send image' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Image Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send image', error: error.response?.data };
    }
  }

  async sendVideoMessage(sessionApiKey, toJid, videoUrl, text = '') {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/send-message', { to: toJid, videoUrl, text });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send video' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Video Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send video', error: error.response?.data };
    }
  }

  async sendDocumentMessage(sessionApiKey, toJid, documentUrl, fileName) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/send-message', { to: toJid, documentUrl, fileName });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send document' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Document Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send document', error: error.response?.data };
    }
  }

  async sendAudioMessage(sessionApiKey, toJid, audioUrl, text = '') {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/send-message', { to: toJid, audioUrl, text });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send audio' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Audio Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send audio', error: error.response?.data };
    }
  }

  async sendStickerMessage(sessionApiKey, toJid, stickerUrl) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/send-message', { to: toJid, stickerUrl });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send sticker' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Sticker Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send sticker', error: error.response?.data };
    }
  }

  async sendContactCard(sessionApiKey, toJid, contactData) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/send-message', { to: toJid, contact: contactData });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send contact' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Contact Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send contact', error: error.response?.data };
    }
  }

  async sendLocation(sessionApiKey, toJid, latitude, longitude, name = '', address = '') {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/send-message', { 
        to: toJid, 
        location: { latitude, longitude, name, address } 
      });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send location' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Location Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send location', error: error.response?.data };
    }
  }

  async sendQuotedMessage(sessionApiKey, toJid, text, quotedMessageId) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/send-message', { 
        to: toJid, 
        text, 
        quotedMessage: { id: quotedMessageId } 
      });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send quoted message' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Quoted Message Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send quoted message', error: error.response?.data };
    }
  }

  // Upload Media File
  async uploadMedia(sessionApiKey, file, type = 'image') {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      // Many Wasender deployments expect JSON with base64 string, not multipart
      let base64;
      let mime = 'application/octet-stream';
      let filename = 'upload.bin';
      if (file && file.data && file.data.toString) {
        base64 = file.data.toString('base64');
        mime = file.mimetype || mime;
        filename = file.name || filename;
      } else if (Buffer.isBuffer(file)) {
        base64 = file.toString('base64');
      } else if (typeof file === 'string' && file.startsWith('data:')) {
        // Already a data URL
        const r = await sessionClient.post('/upload', { file, type });
        const body = r.data;
        if (!body.success) {
          return { success: false, message: body.error || 'Failed to upload media' };
        }
        return { success: true, data: body.data ?? body };
      }

      const r = await sessionClient.post('/upload', { base64, type, mimetype: mime, filename });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to upload media' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Upload Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to upload media', error: error.response?.data };
    }
  }

  // Decrypt Media File
  async decryptMedia(sessionApiKey, mediaData) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/decrypt-media', mediaData);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to decrypt media' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Decrypt Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to decrypt media', error: error.response?.data };
    }
  }

  // Contacts (requires session API key)
  async getAllContacts(sessionApiKey) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.get('/contacts');
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to get contacts' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Get Contacts Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to get contacts', error: error.response?.data };
    }
  }

  async getContactInfo(sessionApiKey, contactPhone) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.get(`/contacts/${contactPhone}`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to get contact info' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Get Contact Info Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to get contact info', error: error.response?.data };
    }
  }

  async getContactProfilePicture(sessionApiKey, contactPhone) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.get(`/contacts/${contactPhone}/picture`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to get contact picture' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Get Contact Picture Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to get contact picture', error: error.response?.data };
    }
  }

  async blockContact(sessionApiKey, contactPhone) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post(`/contacts/${contactPhone}/block`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to block contact' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Block Contact Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to block contact', error: error.response?.data };
    }
  }

  async unblockContact(sessionApiKey, contactPhone) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post(`/contacts/${contactPhone}/unblock`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to unblock contact' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Unblock Contact Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to unblock contact', error: error.response?.data };
    }
  }

  // Groups (requires session API key)
  async createGroup(sessionApiKey, name, participants) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/groups', { name, participants });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to create group' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Create Group Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to create group', error: error.response?.data };
    }
  }

  async getAllGroups(sessionApiKey) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.get('/groups');
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to get groups' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Get Groups Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to get groups', error: error.response?.data };
    }
  }

  async sendGroupMessage(sessionApiKey, groupJid, text) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/send-message', { to: groupJid, text });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send group message' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Group Message Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send group message', error: error.response?.data };
    }
  }

  async getGroupMetadata(sessionApiKey, groupJid) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.get(`/groups/${groupJid}/metadata`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to get group metadata' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Get Group Metadata Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to get group metadata', error: error.response?.data };
    }
  }

  async getGroupParticipants(sessionApiKey, groupJid) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.get(`/groups/${groupJid}/participants`);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to get group participants' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Get Group Participants Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to get group participants', error: error.response?.data };
    }
  }

  async addGroupParticipants(sessionApiKey, groupJid, participants) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post(`/groups/${groupJid}/participants/add`, { participants });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to add group participants' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Add Group Participants Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to add group participants', error: error.response?.data };
    }
  }

  async removeGroupParticipants(sessionApiKey, groupJid, participants) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post(`/groups/${groupJid}/participants/remove`, { participants });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to remove group participants' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Remove Group Participants Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to remove group participants', error: error.response?.data };
    }
  }

  async updateGroupSettings(sessionApiKey, groupJid, settings) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.put(`/groups/${groupJid}/settings`, settings);
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to update group settings' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Update Group Settings Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to update group settings', error: error.response?.data };
    }
  }

  // Presence
  async sendPresenceUpdate(sessionApiKey, toJid, presence) {
    try {
      const sessionClient = this.createSessionClient(sessionApiKey);
      const r = await sessionClient.post('/send-presence-update', { to: toJid, presence });
      const body = r.data;
      
      if (!body.success) {
        return { success: false, message: body.error || 'Failed to send presence update' };
      }
      
      return { success: true, data: body.data ?? body };
    } catch (error) {
      console.error('Wasender Send Presence Update Error:', error.response?.status, error.response?.data);
      return { success: false, message: 'Failed to send presence update', error: error.response?.data };
    }
  }
}

const wasender = new WasenderClient();
module.exports = wasender;


