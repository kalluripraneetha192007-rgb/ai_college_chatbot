const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const { extractPdfText } = require('../services/pdfService');
const { splitTextIntoChunks } = require('../services/chunkingService');
const { storeDocumentChunks, deleteDocumentVectors } = require('../services/vectorService');

const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ uploadedAt: -1 }).populate('uploadedBy', 'name email role');
    res.status(200).json({ documents });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents.', error: error.message });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate('uploadedBy', 'name email role');

    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    res.status(200).json({ document });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch document.', error: error.message });
  }
};

const uploadDocument = async (req, res) => {
  let document;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF document.' });
    }

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can upload documents.' });
    }

    const { category, title } = req.body;

    if (!category || !title) {
      return res.status(400).json({ message: 'Document title and category are required.' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const extractedText = await extractPdfText(fileBuffer);

    if (!extractedText) {
      return res.status(400).json({ message: 'This PDF has no extractable text. Please upload a text-based PDF.' });
    }

    document = await Document.create({
      filename: req.file.filename,
      title: title.trim(),
      category,
      uploadedBy: req.user._id,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      text: extractedText,
      chunkCount: 0
    });

    const chunks = splitTextIntoChunks(extractedText);
    const storedChunkCount = await storeDocumentChunks(document, chunks);

    document.chunkCount = storedChunkCount;
    await document.save();

    res.status(201).json({
      message: 'Document uploaded successfully.',
      document
    });
  } catch (error) {
    if (document?._id) {
      await Document.findByIdAndDelete(document._id);
    }

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: 'Document upload failed.', error: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await deleteDocumentVectors(document._id.toString());
    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Document deleted successfully.',
      documentId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document.', error: error.message });
  }
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  uploadDocument,
  deleteDocument
};
