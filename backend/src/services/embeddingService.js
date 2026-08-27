const createEmbedding = async (text) => {
  const vector = Array.from({ length: 1024 }, () => 0);
  const tokens = String(text || '').toLowerCase().match(/[a-z0-9]+/g) || [];

  tokens.forEach((token, index) => {
    const hash = hashToken(token);
    vector[hash] += 1;

    if (index > 0) {
      vector[hashToken(`${tokens[index - 1]} ${token}`)] += 0.5;
    }
  });

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
  return magnitude ? vector.map((value) => value / magnitude) : vector;
};

const hashToken = (token) => {
  let hash = 2166136261;

  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % 1024;
};

module.exports = {
  createEmbedding
};
