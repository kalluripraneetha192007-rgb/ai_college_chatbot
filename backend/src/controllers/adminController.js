const User = require('../models/User');
const Chat = require('../models/Chat');

const getAdminOverview = async (req, res) => {
  try {
    const [users, chats] = await Promise.all([
      User.find({}, 'name email role createdAt').sort({ createdAt: -1 }).lean(),
      Chat.find({}).populate('userId', 'name email').sort({ updatedAt: -1 }).limit(20).lean()
    ]);

    const messages = chats.flatMap((chat) => chat.messages.map((message) => ({
      chatId: chat._id,
      user: chat.userId?.name || chat.userId?.email || 'Unknown user',
      email: chat.userId?.email || '',
      role: message.role,
      content: message.content,
      feedback: message.feedback || null,
      timestamp: message.timestamp
    }))).sort((first, second) => new Date(second.timestamp) - new Date(first.timestamp)).slice(0, 50);

    const feedbackSummary = messages.reduce((summary, message) => {
      if (message.feedback === 'helpful') summary.helpful += 1;
      if (message.feedback === 'not-helpful') summary.notHelpful += 1;
      return summary;
    }, { helpful: 0, notHelpful: 0 });

    res.status(200).json({ users, messages, feedbackSummary });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load admin overview.', error: error.message });
  }
};

module.exports = { getAdminOverview };
