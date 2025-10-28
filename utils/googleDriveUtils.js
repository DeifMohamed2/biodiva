/**
 * Google Drive PDF Integration Utility
 * 
 * This utility helps extract Google Drive file IDs from URLs
 * and provides helper functions for PDF management
 */

/**
 * Extract Google Drive file ID from various URL formats
 * @param {string} url - Google Drive URL
 * @returns {string|null} - File ID or null if not found
 */
function extractGoogleDriveFileId(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }

    // Common Google Drive URL patterns
    const patterns = [
        // https://drive.google.com/file/d/FILE_ID/view
        /\/file\/d\/([a-zA-Z0-9-_]+)\//,
        // https://drive.google.com/open?id=FILE_ID
        /[?&]id=([a-zA-Z0-9-_]+)/,
        // https://docs.google.com/document/d/FILE_ID/edit
        /\/document\/d\/([a-zA-Z0-9-_]+)\//,
        // https://docs.google.com/spreadsheets/d/FILE_ID/edit
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\//,
        // https://docs.google.com/presentation/d/FILE_ID/edit
        /\/presentation\/d\/([a-zA-Z0-9-_]+)\//
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

/**
 * Generate secure Google Drive embed URL
 * @param {string} fileId - Google Drive file ID
 * @param {object} options - Embed options
 * @returns {string} - Secure embed URL
 */
function generateSecureEmbedUrl(fileId, options = {}) {
    if (!fileId) {
        throw new Error('File ID is required');
    }

    const baseUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    const params = new URLSearchParams();

    // Add security parameters
    if (options.preventDownload !== false) {
        params.append('usp', 'embed_facebook');
    }

    if (options.width) {
        params.append('width', options.width);
    }

    if (options.height) {
        params.append('height', options.height);
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Validate Google Drive file ID format
 * @param {string} fileId - File ID to validate
 * @returns {boolean} - True if valid format
 */
function isValidGoogleDriveFileId(fileId) {
    if (!fileId || typeof fileId !== 'string') {
        return false;
    }

    // Google Drive file IDs are typically 25-44 characters long
    // and contain alphanumeric characters, hyphens, and underscores
    const pattern = /^[a-zA-Z0-9-_]{25,44}$/;
    return pattern.test(fileId);
}

/**
 * Get file type from Google Drive URL
 * @param {string} url - Google Drive URL
 * @returns {string} - File type (document, spreadsheet, presentation, file)
 */
function getGoogleDriveFileType(url) {
    if (!url) {
        return 'file';
    }

    if (url.includes('/document/')) {
        return 'document';
    } else if (url.includes('/spreadsheets/')) {
        return 'spreadsheet';
    } else if (url.includes('/presentation/')) {
        return 'presentation';
    } else {
        return 'file';
    }
}

/**
 * Convert Google Drive sharing URL to direct embed URL
 * @param {string} sharingUrl - Google Drive sharing URL
 * @returns {string|null} - Direct embed URL or null if invalid
 */
function convertToEmbedUrl(sharingUrl) {
    const fileId = extractGoogleDriveFileId(sharingUrl);
    if (!fileId) {
        return null;
    }

    return generateSecureEmbedUrl(fileId);
}

// Example usage and testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        extractGoogleDriveFileId,
        generateSecureEmbedUrl,
        isValidGoogleDriveFileId,
        getGoogleDriveFileType,
        convertToEmbedUrl
    };
}

// Test cases
if (typeof window === 'undefined' && require.main === module) {
    console.log('Testing Google Drive utility functions...');
    
    const testUrls = [
        'https://drive.google.com/file/d/1qfp_Buy12ntWOlmYnUzKBvS5FNecvP7d/view?usp=sharing',
        'https://docs.google.com/document/d/1qfp_Buy12ntWOlmYnUzKBvS5FNecvP7d/edit',
        'https://drive.google.com/open?id=1qfp_Buy12ntWOlmYnUzKBvS5FNecvP7d'
    ];

    testUrls.forEach(url => {
        const fileId = extractGoogleDriveFileId(url);
        const embedUrl = fileId ? generateSecureEmbedUrl(fileId) : null;
        const fileType = getGoogleDriveFileType(url);
        
        console.log(`URL: ${url}`);
        console.log(`File ID: ${fileId}`);
        console.log(`Embed URL: ${embedUrl}`);
        console.log(`File Type: ${fileType}`);
        console.log('---');
    });
}
