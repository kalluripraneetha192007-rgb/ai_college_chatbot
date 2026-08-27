const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect, adminOnly } = require('../middleware/auth');
const { getAllDocuments, getDocumentById, uploadDocument, deleteDocument } = require('../controllers/documentController');
const { ensureUploadDirectory } = require('../services/pdfService');
const { DOCUMENT_CATEGORIES } = require('../models/Document');

const router = express.Router();
const uploadPath = ensureUploadDirectory();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return cb(new Error('Only PDF files are allowed.'));
    }

    if (req.body.category && !DOCUMENT_CATEGORIES.includes(req.body.category)) {
      return cb(new Error('Invalid document category.'));
    }

    cb(null, true);
  }
});

router.get('/', protect, getAllDocuments);
router.get('/:id', protect, getDocumentById);
router.post(
  '/upload',
  protect,
  adminOnly,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadDocument
);
router.delete('/:id', protect, adminOnly, deleteDocument);

module.exports = router;
