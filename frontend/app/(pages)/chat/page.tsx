'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Send, Loader2, Sun, Moon, User, Settings, LogOut, PanelLeft, PanelRight, Bot, BrainCircuit, ChevronDown, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const LOADING_MESSAGES = [
  "Firing up the neurons...",
  "Brewing some digital coffee...",
  "Consulting the wise ones...",
  "Calibrating the cosmic ray scanner...",
  "Summoning the spirits of data...",
  "Putting on my thinking cap...",
  "Just a moment, finding my words...",
  "Wrestling a data dragon...",
  "Untangling the web of information...",
  "Polishing my thoughts...",
  "Thinking... therefore, I am... cooking!",
  "Searching for the perfect emoji...",
  "Accessing the mainframe...",
  "Connecting to the cloud of creativity...",
  "Checking for cosmic downloads...",
  "Asking the universe for an answer...",
  "Almost there, just a few more bytes...",
  "Crunching numbers and poetry...",
];

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentChatMessages, setCurrentChatMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const chatEndRef = useRef(null);
  const mainChatRef = useRef(null);
  const pollingInterval = useRef(null);

  const platforms = ['Instagram', 'YouTube', 'Twitter', 'LinkedIn', 'Facebook'];

  // Custom Scrollbar Styles
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: ${isDarkMode ? '#8888884d' : '#8888884d'};
      border-radius: 4px;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
  `;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let interval = null;
    if (isLoading) {
      let currentIndex = 0;
      interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[currentIndex]);
      }, 2000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('flowa_vision_userId');
    const newUserId = storedUserId || crypto.randomUUID();
    localStorage.setItem('flowa_vision_userId', newUserId);
    setUserId(newUserId);

    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/history?userId=${newUserId}`);
        const data = await response.json();
        if (response.ok && data.chats.length > 0) {
          const latestChat = data.chats[0];
          setCurrentChatMessages(latestChat.messages);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };
    if (newUserId) {
      fetchHistory();
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMessages, isLoading]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && !selectedImage) return;

    const newUserMessage = {
      id: Date.now(),
      sender: 'user',
      promptText: prompt,
      userImage: selectedImage,
      platform: selectedPlatform,
    };
    setCurrentChatMessages((prev) => [...prev, newUserMessage]);
    setPrompt('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const postResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          prompt,
          file: selectedImage,
          platform: selectedPlatform,
        }),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(errorData.error || 'Failed to send message.');
      }

      const { taskId } = await postResponse.json();

      pollingInterval.current = setInterval(async () => {
        try {
          const getResponse = await fetch(`/api/chat?taskId=${taskId}&userId=${userId}`);
          const result = await getResponse.json();

          if (result.status === 'completed') {
            clearInterval(pollingInterval.current);
            const newAiMessage = {
              id: Date.now(),
              sender: 'ai',
              promptText: result.data.reply,
              aiImage: result.data.imageUrl,
            };
            setCurrentChatMessages((prev) => [...prev, newAiMessage]);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error checking task status:', error);
          clearInterval(pollingInterval.current);
          const errorMessage = {
            id: Date.now(),
            sender: 'ai',
            promptText: 'An error occurred while fetching the response. Please try again.',
          };
          setCurrentChatMessages((prev) => [...prev, errorMessage]);
          setIsLoading(false);
        }
      }, 2000);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage = {
        id: Date.now(),
        sender: 'ai',
        promptText: `Error: ${error.message}`,
      };
      setCurrentChatMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const getInitials = () => 'FV';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f0f0f] dark:text-white text-neutral-800 font-sans antialiased overflow-hidden">
      <style>{scrollbarStyles}</style>

      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-full sm:w-64' : 'w-0 sm:w-16'}
          ${isSidebarOpen ? 'relative' : 'absolute sm:relative'}
          bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-neutral-800
          flex flex-col p-4 space-y-4`}
      >
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-2 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden sm:flex'}`}>
            <BrainCircuit className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-bold">Flowa Vision</h2>
          </div>
          <div className={`flex items-center ${isSidebarOpen ? 'w-full justify-between' : ''} sm:w-auto sm:justify-end`}>
            {isSidebarOpen && (
              <button
                className="hidden sm:flex p-2 rounded-full transition-colors duration-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                onClick={() => setIsSidebarOpen(false)}
                disabled={isLoading}
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <button
              className="sm:hidden p-2 rounded-full transition-colors duration-200 hover:bg-slate-200 dark:hover:bg-slate-800"
              onClick={() => setIsSidebarOpen(false)}
              disabled={isLoading}
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          {isSidebarOpen ? (
            <button className="w-full justify-start space-x-2 p-2 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm flex items-center" disabled={isLoading}>
              <Bot className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          ) : (
            <button className="sm:hidden p-2 rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800" disabled={isLoading}>
              <Bot className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className={`flex-1 overflow-y-auto custom-scrollbar ${!isSidebarOpen && 'sm:hidden'}`}>
          {isSidebarOpen && <h3 className="text-sm font-semibold text-gray-400 dark:text-neutral-500 mt-4 mb-2">Recent Chats</h3>}
          <p className="text-xs text-gray-500 dark:text-neutral-600 text-center py-4">No recent chats.</p>
        </div>

        <div className={`mt-auto pt-4 flex items-center justify-between border-t border-gray-200 dark:border-neutral-800 ${!isSidebarOpen && 'sm:hidden'}`}>
          <div className="flex items-center space-x-2">
            {isSidebarOpen && <span className="text-sm font-medium">Flowa User</span>}
          </div>
          <div className="flex space-x-2">
            <button className="p-2 rounded-full transition-colors duration-200 hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative">
              <button className="relative h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-sm" disabled={isLoading}>
                <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Open Button on Mobile */}
      {!isSidebarOpen && (
        <div className="absolute top-4 left-2 z-50 sm:hidden">
          <button
            className="p-2 rounded-full transition-colors duration-200 hover:bg-slate-200 dark:hover:bg-slate-800"
            onClick={() => setIsSidebarOpen(true)}
            disabled={isLoading}>
            <PanelRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-neutral-50 dark:bg-[#0a0a0a] transition-all duration-300 ease-in-out ${isSidebarOpen ? 'hidden sm:flex' : 'flex'}`}>
        <div
          ref={mainChatRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar relative"
        >
          {currentChatMessages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 drop-shadow-md bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">FLOWA VISION</h1>
              <p className="text-md sm:text-lg text-gray-400 dark:text-neutral-600 mb-8">How can I help you today?</p>
            </div>
          )}
          {currentChatMessages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'ai' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  <Bot className="w-5 h-5" />
                </div>
              )}
              <div
                className={`prose prose-sm dark:prose-invert max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-sm
                  ${message.sender === 'user'
                    ? 'bg-indigo-500 text-white self-end rounded-br-none'
                    : 'bg-white dark:bg-neutral-950 dark:text-neutral-100 rounded-bl-none border dark:border-neutral-600 border-gray-200'
                  }`}
              >
                {message.sender === 'ai' ? (
                  <>
                    {message.promptText && <ReactMarkdown>{message.promptText}</ReactMarkdown>}
                    {message.aiImage && (
                      <div className="relative mt-2">
                        <img src={message.aiImage} alt="Generated content" className="rounded-lg max-w-full h-auto" />
                        <a
                          href={message.aiImage}
                          download="flowa-vision-image.png"
                          className="absolute bottom-2 right-2 bg-black/50 text-white rounded-full p-2 transition-all duration-200 hover:bg-black/70"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {message.promptText && <p className="text-sm leading-relaxed">{message.promptText}</p>}
                    {message.userImage && (
                      <img src={message.userImage} alt="User upload" className="mt-2 rounded-lg" />
                    )}
                  </>
                )}
              </div>
              {message.sender === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-3 justify-start animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-none p-3 shadow-sm bg-white dark:bg-neutral-950 animate-pulse border dark:border-neutral-600 border-gray-200">
                <p className="text-sm leading-relaxed dark:text-neutral-100">{loadingMessage}</p>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
          <form onSubmit={handleSendMessage} className="flex flex-col space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span className="font-semibold">Platform:</span>
              <div className="relative">
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className={`appearance-none py-1 px-3 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'}`}
                >
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 items-end">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <div className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-slate-200 dark:hover:bg-slate-800`}>
                  <Camera className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              </label>
              <textarea
                className="flex-1 resize-none rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 text-sm text-neutral-800 dark:text-neutral-200 px-4 py-3 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden max-h-[150px]"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={1}
                placeholder="Send a message..."
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300
                  ${isLoading || (!prompt.trim() && !selectedImage) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                disabled={isLoading || (!prompt.trim() && !selectedImage)}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {selectedImage && (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-md mt-2">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 text-xs"
                >
                  &times;
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
