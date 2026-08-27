const { Pinecone } = require('@pinecone-database/pinecone');

const apiKey = process.env.PINECONE_API_KEY || '';
const indexName = process.env.PINECONE_INDEX || '';

let index = null;

if (apiKey && indexName) {
  try {
    const pinecone = new Pinecone({ apiKey });
    index = pinecone.Index(indexName);
  } catch (error) {
    console.warn('Pinecone initialization failed:', error.message);
  }
}

const getIndex = () => {
  if (!index) {
    throw new Error('Pinecone is not configured.');
  }

  return index;
};

const createEmbeddings = async (chunks) => {
  const idx = getIndex();

  return Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await createEmbedding(chunk.text);
      return {
        id: chunk.id,
        values: embedding,
        metadata: {
          documentId: chunk.documentId,
          filename: chunk.filename,
          title: chunk.title,
          category: chunk.category,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text
        }
      };
    })
  );
};

const storeDocumentChunks = async (document, chunks) => {
  const idx = getIndex();

  const vectors = await createEmbeddings(
    chunks.map((text, chunkIndex) => ({
      id: `${document._id.toString()}-chunk-${chunkIndex}`,
      documentId: document._id.toString(),
      filename: document.filename,
      title: document.title,
      category: document.category,
      chunkIndex,
      text
    }))
  );

  await idx.upsert(vectors);
  return vectors.length;
};

const similaritySearch = async (query, topK = 5) => {
  const idx = getIndex();
  const queryEmbedding = await createEmbedding(query);

  const response = await idx.query({
    vector: queryEmbedding,
    topK: Math.max(topK * 3, 12),
    includeMetadata: true
  });

  const queryTokens = new Set(tokenize(query));
  const rerankedMatches = (response.matches || []).map((match) => {
    const textTokens = new Set(tokenize([
      match.metadata?.text,
      match.metadata?.title,
      match.metadata?.category
    ].join(' ')));
    const overlap = [...queryTokens].filter((token) => textTokens.has(token)).length;

    return {
      ...match,
      overlap,
      score: overlap * 10 + Number(match.score || 0)
    };
  });

  const strongestOverlap = Math.max(...rerankedMatches.map((match) => match.overlap), 0);

  return rerankedMatches
    .filter((match) => match.overlap > 0 && match.overlap >= Math.max(1, strongestOverlap - 1))
    .sort((firstMatch, secondMatch) => secondMatch.score - firstMatch.score)
    .slice(0, topK);
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'about', 'according', 'does', 'for', 'how', 'in',
  'is', 'it', 'of', 'on', 'the', 'to', 'what', 'when', 'where', 'which', 'with'
]);

const tokenize = (text) => (String(text || '').toLowerCase().match(/[a-z0-9]+/g) || [])
  .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const deleteDocumentVectors = async (documentId) => {
  const idx = getIndex();

  const records = await idx.listPaginated({ prefix: `${documentId}-chunk-` });
  const ids = records.vectors?.map((vector) => vector.id) || [];

  if (ids.length) {
    await idx.deleteMany(ids);
  }

  return ids.length;
};

async function createEmbedding(text) {
  const { createEmbedding: generateEmbedding } = require('./embeddingService');
  return generateEmbedding(text);
}

module.exports = {
  createEmbeddings,
  storeDocumentChunks,
  similaritySearch,
  deleteDocumentVectors
};
