import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageCircle, X, Send } from 'lucide-react';
import { chatbotService } from '../services/chatbot.service';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: '👋 Hi! I\'m your AI inventory assistant. I can help you with:\n\n• Check stock levels and low inventory\n• View AI-powered demand forecasts\n• Search for items and categories\n• Get insights from order history\n• Answer questions about your inventory\n\nWhat would you like to know?' 
    }
  ]);
  
  
  console.log('✅ Chatbot component rendered');

  const chatMutation = useMutation({
    mutationFn: (query) => chatbotService.sendQuery(query),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { type: 'bot', text: data.response }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { type: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || chatMutation.isPending) return;

    setMessages((prev) => [...prev, { type: 'user', text: query }]);
    chatMutation.mutate(query);
    setQuery('');
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-110 z-50 flex items-center justify-center"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Assistant</h3>
                <p className="text-xs text-emerald-100">Inventory Intelligence</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-xl ${
                    msg.type === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-xl rounded-bl-none shadow-sm border border-slate-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {}
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your question..."
                disabled={chatMutation.isPending}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={chatMutation.isPending || !query.trim()}
                className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
