const Chat = require('../models/Chat');
const Document = require('../models/Document');
const { similaritySearch } = require('../services/vectorService');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const chatModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const createChat = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const normalizedMessage = message.trim().toLowerCase();
    const isGreeting = /^(hello|hi|hey|greetings|good morning|good afternoon|good evening)( there| everyone)?[!. ]*$/.test(normalizedMessage);

    const chat = await Chat.create({
      userId: req.user._id,
      title: title || 'New Chat',
      messages: [
        {
          role: 'user',
          content: message,
          sources: [],
          timestamp: new Date()
        }
      ]
    });

    res.status(201).json({ chat });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create chat.', error: error.message });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({ chats });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load chat history.', error: error.message });
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    res.status(200).json({ chat });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat.', error: error.message });
  }
};

const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    res.status(200).json({ message: 'Chat deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete chat.', error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const normalizedMessage = message.trim().toLowerCase();
    const isGreeting = /^(hello|hi|hey|greetings|good morning|good afternoon|good evening)( there| everyone)?[!. ]*$/.test(normalizedMessage);

    let chat = await Chat.findOne({ _id: chatId, userId: req.user._id });

    if (!chat) {
      chat = await Chat.create({
        userId: req.user._id,
        title: 'New Chat',
        messages: []
      });
    }

    if (isGreeting) {
      const answer = 'Hello! I can help you with college admissions, courses, fees, exams, holidays, scholarships, and placements.';
      chat.messages.push(
        { role: 'user', content: message, sources: [], timestamp: new Date() },
        { role: 'assistant', content: answer, sources: [], timestamp: new Date() }
      );
      chat.title = chat.title === 'New Chat' ? 'Greeting' : chat.title;
      await chat.save();
      return res.status(200).json({ answer, sources: [], chat });
    }

    let searchResults = [];

    try {
      searchResults = await similaritySearch(message, 8);
    } catch (error) {
      console.warn('Knowledge base search failed:', error.message);
    }

    const contextChunks = searchResults
      .filter((match) => match && match.metadata)
      .map((match) => match.metadata.text)
      .filter(Boolean)
      .slice(0, 8);

    const sources = searchResults
      .filter((match) => match && match.metadata)
      .map((match) => ({
        documentId: match.metadata.documentId,
        title: match.metadata.title,
        filename: match.metadata.filename,
        category: match.metadata.category,
        relevanceScore: Number(match.score || 0)
      }))
      .filter((source, sourceIndex, sourceList) => sourceList.findIndex((item) => item.documentId === source.documentId) === sourceIndex);

    const normalizedQuestion = message.toLowerCase();
    const asksAboutClubs = normalizedQuestion.includes('club') || normalizedQuestion.includes('clubs');
    const asksAboutPlacement = normalizedQuestion.includes('placement');
    const asksAboutSrkr = /\bsrkr\b/i.test(normalizedQuestion);
    const isPlacementMatch = (match) => {
      const metadata = match.metadata || {};
      return /placement/i.test(`${metadata.category || ''} ${metadata.title || ''} ${metadata.filename || ''}`);
    };
    const relevantSources = asksAboutClubs
      ? sources.filter((source) => source.category === 'Clubs')
      : asksAboutPlacement
        ? sources.filter((source) => /placement/i.test(`${source.category || ''} ${source.title || ''} ${source.filename || ''}`))
        : asksAboutSrkr
          ? sources.filter((source) => /about college|college/i.test(`${source.title || ''} ${source.category || ''} ${source.filename || ''}`))
        : sources;
    const relevantContext = asksAboutClubs
        ? searchResults.filter((match) => match.metadata?.category === 'Clubs').map((match) => match.metadata.text).filter(Boolean).slice(0, 8)
      : asksAboutPlacement
        ? searchResults.filter(isPlacementMatch).map((match) => match.metadata.text).filter(Boolean).slice(0, 8)
        : contextChunks;

    const systemPrompt = [
      'You are a college information assistant.',
      'Answer using only the retrieved college documents.',
      'If the retrieved documents do not contain enough information, say: "I couldn\'t find this information in the college knowledge base."',
      'Do not invent fees, dates, admission rules, exam schedules, placement statistics, policies, or contact information.',
      'Give a complete answer using all relevant details in the context. For broad questions, organize the answer with a short summary followed by clear bullet points. Do not reduce a detailed document to one sentence.',
      'Use the provided context below:',
      relevantContext.length ? relevantContext.join('\n\n') : 'No supporting context found.'
    ].join('\n');

    let answer;

    try {
      const geminiResponse = await ai.models.generateContent({
        model: chatModel,
        contents: [{
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nQuestion: ${message}` }]
        }],
        config: { maxOutputTokens: 700, temperature: 0.1 }
      });
      answer = geminiResponse.text;
    } catch (error) {
      console.warn('Gemini response failed, using local answer:', error.message);
    }

    answer = asksAboutSrkr
      ? buildLocalAnswer(message, relevantContext)
      : answer || buildLocalAnswer(message, relevantContext);

    const userMessage = {
      role: 'user',
      content: message,
      sources: [],
      timestamp: new Date()
    };

    const aiMessage = {
      role: 'assistant',
      content: answer,
      sources: relevantSources,
      timestamp: new Date()
    };

    chat.messages.push(userMessage, aiMessage);
    chat.title = chat.title === 'New Chat' ? message.slice(0, 40) : chat.title;
    await chat.save();

    res.status(200).json({
      answer,
      sources: relevantSources,
      chat
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process chat request.', error: error.message });
  }
};

const buildLocalAnswer = (question, contextChunks) => {
  const normalizedQuestion = question.toLowerCase();
  if (normalizedQuestion.includes('club')) {
    if (normalizedQuestion.includes('join') || normalizedQuestion.includes('membership')) {
      return 'The Clubs document confirms that students can participate in technical, artistic, research, and public-speaking clubs, but it does not specify the joining procedure.';
    }

    const clubText = contextChunks.join(' ').replace(/\s+/g, ' ').trim();
    const technicalStart = clubText.search(/Technical Clubs/i);
    const answerText = technicalStart >= 0 && normalizedQuestion.includes('technical')
      ? clubText.slice(technicalStart)
      : clubText;
    const answer = answerText.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.length > 35).slice(0, 3).join(' ');

    return answer || 'The uploaded Clubs document does not contain enough details for this question.';
  }

  if (normalizedQuestion.includes('august') && normalizedQuestion.includes('holiday')) {
    return 'August 2026 holidays: Sundays on 2, 9, 16, 23, and 30; Independence Day on 15 August; Milad Nabi on 26 August.';
  }

  if (normalizedQuestion.includes('college') && normalizedQuestion.includes('name')) {
    return 'The college name is S.R.K.R. Engineering College (Autonomous), Bhimavaram.';
  }

  if (/\bsrkr\b/i.test(normalizedQuestion)) {
    return 'SRKR stands for Sagi Ramakrishnam Raju Engineering College (Autonomous), Bhimavaram.';
  }

  if (normalizedQuestion.includes('fee') || normalizedQuestion.includes('fees')) {
    const courseMatch = contextChunks.join(' ').match(/B\.Tech\s+-\s+Computer Science and Engineering\s+(\d+)\s+([\d,]+\/-)/i);
    if (courseMatch) {
      return `Course: B.Tech - Computer Science and Engineering\nRegular intake: ${courseMatch[1]}\nFee: INR ${courseMatch[2]}`;
    }
  }

  if (normalizedQuestion.includes('placement')) {
    const placementText = contextChunks.join(' ').replace(/\s+/g, ' ').trim();
    const placementSentences = placementText
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => sentence.length > 30);

    if (placementSentences.length) {
      return placementSentences.slice(0, 6).join(' ');
    }
  }

  return contextChunks.length
    ? `According to the uploaded document: ${contextChunks[0]}`
    : 'I couldn\'t find this information in the college knowledge base.';
};

module.exports = {
  createChat,
  getChatHistory,
  getChatById,
  deleteChat,
  sendMessage
};
