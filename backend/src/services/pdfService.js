const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const uploadDir = path.join(__dirname, '../../uploads');

const ensureUploadDirectory = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const sanitizeText = (text = '') => {
  return text.replace(/\s+/g, ' ').trim();
};

const extractPdfText = async (fileBuffer) => {
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const data = await parser.getText();
    return sanitizeText(data.text || '');
  } finally {
    await parser.destroy();
  }
};

module.exports = {
  ensureUploadDirectory,
  extractPdfText
};
