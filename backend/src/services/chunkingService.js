const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_CHUNK_OVERLAP = 120;

const splitTextIntoChunks = (text, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP) => {
  if (!text || !text.trim()) {
    return [];
  }

  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;

  while (start < normalizedText.length) {
    let end = start + chunkSize;
    if (end >= normalizedText.length) {
      end = normalizedText.length;
    }

    let chunk = normalizedText.slice(start, end);

    if (end < normalizedText.length) {
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > chunkSize * 0.5) {
        chunk = chunk.slice(0, lastSpace);
        end = start + lastSpace;
      }
    }

    if (!chunk.trim()) {
      break;
    }

    chunks.push(chunk.trim());

    if (end >= normalizedText.length) {
      break;
    }

    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
};

module.exports = {
  splitTextIntoChunks,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_CHUNK_OVERLAP
};
