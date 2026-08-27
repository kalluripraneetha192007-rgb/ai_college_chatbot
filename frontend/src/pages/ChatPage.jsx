import { useEffect, useMemo, useState } from 'react';
import { MessageSquareText, Plus, Send, Sparkles, Search, Trash2, LogOut } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const SUGGESTED_QUESTIONS = [
  'What is the admission process?',
  'How much is the hostel fee?',
  'When is the semester exam schedule?',
  'What scholarships are available?'
];

const ChatPage = () => {
  const { logout, user } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingChats, setFetchingChats] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      setFetchingChats(true);
      const response = await api.get('/chat/history');
      const chatList = response.data?.chats || [];
      setChats(chatList);

      if (chatList.length) {
        setCurrentChatId(chatList[0]._id);
        setMessages(chatList[0].messages || []);
      } else {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to fetch chat history', error);
    } finally {
      setFetchingChats(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat._id === currentChatId) || null,
    [chats, currentChatId]
  );

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages || []);
    }
  }, [selectedChat]);

  const handleNewChat = async () => {
    setCurrentChatId(null);
    setMessages([]);
    setDraft('');
  };

  const handleSelectChat = (chatId) => {
    const chat = chats.find((item) => item._id === chatId);
    setCurrentChatId(chatId);
    setMessages(chat?.messages || []);
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await api.delete(`/chat/${chatId}`);
      const updatedChats = chats.filter((chat) => chat._id !== chatId);
      setChats(updatedChats);

      if (currentChatId === chatId) {
        setCurrentChatId(updatedChats[0]?._id || null);
        setMessages(updatedChats[0]?.messages || []);
      }
    } catch (error) {
      console.error('Failed to delete chat', error);
    }
  };

  const handleSendMessage = async (customMessage) => {
    const messageToSend = (customMessage || draft).trim();
    if (!messageToSend) return;

    setLoading(true);
    setError('');
    const payload = {
      message: messageToSend,
      chatId: currentChatId
    };

    try {
      const response = await api.post('/chat/send', payload);
      const result = response.data;

      const nextMessages = result?.chat?.messages || [
        { role: 'user', content: messageToSend, sources: [] },
        { role: 'assistant', content: result.answer, sources: result.sources || [] }
      ];

      if (!currentChatId && result.chat?._id) {
        setCurrentChatId(result.chat._id);
      }

      setMessages(nextMessages);
      setDraft('');
      await fetchHistory();
    } catch (error) {
      console.error('Failed to send message', error);
      setError(error.response?.data?.message || 'The assistant could not respond. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl h-[92vh] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex">
        <aside className="w-full max-w-xs border-r border-slate-200 bg-slate-50 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary-600">College</p>
              <h1 className="text-xl font-bold text-slate-900">Assistant</h1>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-200"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus size={16} />
            New Chat
          </button>

          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search chats"
              className="w-full bg-transparent outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {fetchingChats ? (
              <div className="text-sm text-slate-500 p-2">Loading chats...</div>
            ) : chats.length ? (
              chats.map((chat) => (
                <div
                  key={chat._id}
                  className={`group flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                    currentChatId === chat._id
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-slate-200 bg-white hover:bg-slate-100'
                  }`}
                  onClick={() => handleSelectChat(chat._id)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{chat.title || 'Untitled chat'}</p>
                    <p className="text-xs text-slate-500">{chat.messages?.length || 0} messages</p>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteChat(chat._id);
                    }}
                    className="ml-2 p-2 rounded-lg text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                    title="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 p-2">No chats yet.</div>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-primary-50 border border-primary-100 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-primary-700">Signed in</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{user?.name || 'Student'}</p>
            <p className="text-xs text-slate-600">{user?.email || 'student@example.com'}</p>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Chat</p>
              <h2 className="text-xl font-bold text-slate-900">College Information Assistant</h2>
            </div>
            <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Online</div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            {!messages.length ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-xl text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                    <MessageSquareText size={28} />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-slate-900">Ask about college information</h3>
                  <p className="mt-2 text-slate-600">Get answers from the college knowledge base with source references.</p>

                  <div className="mt-6 grid gap-3 text-left md:grid-cols-2">
                    {SUGGESTED_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        onClick={() => handleSendMessage(question)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 hover:border-primary-200 hover:bg-primary-50"
                      >
                        <span className="inline-flex items-center gap-2"><Sparkles size={14} className="text-primary-600" />{question}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>

                    {message.sources?.length > 0 && (
                      <div className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-left text-xs text-slate-700">
                        <span className="font-semibold text-slate-800">Source: </span>
                        {message.sources.map((source, sourceIndex) => (
                          <span key={`${source.title}-${sourceIndex}`}>
                            {sourceIndex > 0 && ' | '}
                            <span className="font-medium text-slate-800">{source.title}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  Assistant is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4 bg-white">
            {error && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={1}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about admissions, fees, scholarships, exam dates..."
                className="flex-1 resize-none bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !draft.trim()}
                className="rounded-xl bg-primary-600 p-3 text-white disabled:opacity-50 hover:bg-primary-700"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
