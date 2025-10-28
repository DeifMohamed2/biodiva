const mongoose = require('mongoose');
const { required } = require('nodemon/lib/config');
const Schema = mongoose.Schema;

const pdfSchema = new Schema(
  {
    pdfName: {
      type: String,
      required: true,
    },

    pdfLink: {
      type: String,
      required: false, // Made optional for Google Drive integration
    },

    // Google Drive integration fields
    googleDriveFileId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },

    googleDriveEmbedUrl: {
      type: String,
      required: false,
    },

    // Security settings
    allowDownload: {
      type: Boolean,
      default: false,
    },

    allowPrint: {
      type: Boolean,
      default: false,
    },

    allowCopy: {
      type: Boolean,
      default: false,
    },

    // Access control
    maxViews: {
      type: Number,
      default: -1, // -1 means unlimited
    },

    viewTimeLimit: {
      type: Number,
      default: -1, // -1 means unlimited (in minutes)
    },

    pdfPhoto: {
      type: String,
      required: false,
    },
    pdfStatus: {
      type: String,
      required: true,
    },
    pdfPrice: {
      type: String,
      required: false,
    },
    pdfGrade: {
      type: String,
      required: true,
    },

    // Analytics
    totalViews: {
      type: Number,
      default: 0,
    },

    uniqueViewers: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Instance methods for PDF model
pdfSchema.methods.generateGoogleDriveEmbedUrl = function () {
  if (this.googleDriveFileId) {
    // Generate secure embed URL that prevents downloading
    return `https://drive.google.com/file/d/${this.googleDriveFileId}/preview`;
  }
  return null;
};

pdfSchema.methods.generateSecureViewUrl = function () {
  if (this.googleDriveFileId) {
    // Use simple preview URL - Google Drive handles embedding securely
    return `https://drive.google.com/file/d/${this.googleDriveFileId}/preview`;
  }
  return this.pdfLink;
};

pdfSchema.methods.canBeViewedBy = function (user) {
  // Check if user has access to this PDF
  const userPDFsPaid = user.PDFsPaid || [];
  const hasGeneralAccess =
    user.hasGeneralPDFAccess && user.hasGeneralPDFAccess();
  return userPDFsPaid.includes(this._id) || hasGeneralAccess;
};

pdfSchema.methods.incrementViewCount = async function () {
  this.totalViews += 1;
  await this.save();
};

pdfSchema.methods.isAccessExpired = function (userViewStartTime) {
  if (this.viewTimeLimit === -1) return false;

  const currentTime = new Date();
  const elapsedMinutes = (currentTime - userViewStartTime) / (1000 * 60);

  return elapsedMinutes > this.viewTimeLimit;
};

const PDF = mongoose.model('PDF', pdfSchema);

module.exports = PDF;
