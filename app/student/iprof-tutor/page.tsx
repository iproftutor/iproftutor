"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Bot,
  Mic,
  MicOff,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Send,
  Video,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LiveAvatarModal from "@/components/LiveAvatarModal";

// Development mode - when true, all features are enabled regardless of subscription
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UserPlan {
  type: "free" | "basic" | "basic_voice" | "premium" | "dev";
  hasVoice: boolean;
  hasAvatar: boolean;
}

export default function IProfTutorPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // In dev mode, all features are unlocked; otherwise would fetch from subscription API
  const [userPlan] = useState<UserPlan>({
    type: DEV_MODE ? "dev" : "premium",
    hasVoice: DEV_MODE ? true : true, // In production, fetch from subscription
    hasAvatar: DEV_MODE ? true : true, // In production, fetch from subscription
  });
  const [userAge, setUserAge] = useState<number>(12);
  const [userLanguage, setUserLanguage] = useState<string>("en");
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  // Load existing conversation on mount
  useEffect(() => {
    const loadConversation = async () => {
      setIsLoadingHistory(true);
      try {
        // Fetch the most recent conversation for this user
        const response = await fetch("/api/chat");
        if (!response.ok) {
          setIsLoadingHistory(false);
          return;
        }

        const conversations = await response.json();

        if (conversations && conversations.length > 0) {
          // Load the most recent conversation
          const latestConversation = conversations[0];
          setConversationId(latestConversation.id);

          // Fetch full conversation with messages
          const fullResponse = await fetch(
            `/api/chat?conversationId=${latestConversation.id}`
          );
          if (fullResponse.ok) {
            const fullConversation = await fullResponse.json();
            if (
              fullConversation.messages &&
              fullConversation.messages.length > 0
            ) {
              const loadedMessages: ChatMessage[] =
                fullConversation.messages.map(
                  (
                    msg: { role: string; content: string; timestamp: string },
                    index: number
                  ) => ({
                    id: `${msg.role}-${index}-${Date.now()}`,
                    role: msg.role as "user" | "assistant",
                    content: msg.content,
                    timestamp: new Date(msg.timestamp),
                  })
                );
              setMessages(loadedMessages);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load conversation:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadConversation();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [input]);

  // Fetch user profile
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("metadata")
          .eq("id", user.id)
          .single();

        if (profile?.metadata) {
          if (profile.metadata.age) setUserAge(Number(profile.metadata.age));
          if (profile.metadata.language)
            setUserLanguage(profile.metadata.language);
        }
      }
    };
    fetchData();
  }, [supabase]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput("");
    setIsLoading(true);

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userInput,
          conversationId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");

      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                );
              }
              if (data.done && data.conversationId) {
                setConversationId(data.conversationId);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      if (autoSpeak && fullContent && userPlan.hasVoice) {
        speakText(fullContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: "Sorry, I encountered an error. Please try again.",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  const clearConversation = async () => {
    try {
      // Delete all conversations for this user
      await fetch("/api/chat", { method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
    setMessages([]);
    setConversationId(null);
  };

  const toggleRecording = () => {
    if (!userPlan.hasVoice) return;

    if (isRecording) {
      setIsRecording(false);
      recognitionRef.current?.stop();
    } else {
      if (
        "webkitSpeechRecognition" in window ||
        "SpeechRecognition" in window
      ) {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = userLanguage === "en" ? "en-US" : userLanguage;

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setInput(transcript);
        };

        recognition.onend = () => setIsRecording(false);
        recognition.onerror = () => setIsRecording(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      }
    }
  };

  const speakText = (text: string) => {
    if (!userPlan.hasVoice) return;
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/`{1,3}[^`]*`{1,3}/g, "code snippet")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^\s*[-*]\s/gm, "")
      .replace(/^\s*\d+\.\s/gm, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.lang = userLanguage === "en" ? "en-US" : userLanguage;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => window.speechSynthesis.cancel();

  const suggestions = [
    "Explain photosynthesis",
    "Help me with fractions",
    "What causes earthquakes?",
    "Tips for memorizing",
  ];

  return (
    <div className="fixed inset-0 left-64 flex flex-col bg-white">
      {/* Header - Fixed */}
      <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0794d4] rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">iProf Tutor</h1>
            <p className="text-xs text-gray-400">AI Learning Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {userPlan.hasVoice && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (autoSpeak) stopSpeaking();
                setAutoSpeak(!autoSpeak);
              }}
              className={`h-8 w-8 ${
                autoSpeak ? "text-[#0794d4]" : "text-gray-400"
              }`}
            >
              {autoSpeak ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={clearConversation}
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Chat Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader size={24} className="text-[#0794d4] mb-3" />
            <p className="text-sm text-gray-400">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-14 h-14 bg-[#0794d4]/10 rounded-2xl flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-[#0794d4]" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-1">
              How can I help you today?
            </h2>
            <p className="text-sm text-gray-400 text-center max-w-sm">
              Ask me anything about your studies. I&apos;m here to help you
              learn and understand.
            </p>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto pb-4">
            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#0794d4] flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      iProf Tutor
                    </span>
                  </div>
                )}
                <MessageContent
                  className={
                    message.role === "user"
                      ? "bg-[#0794d4]! text-white! rounded-2xl rounded-br-sm px-4 py-3 ml-auto max-w-[80%]"
                      : "bg-gray-50! text-gray-800! rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]"
                  }
                >
                  {message.role === "assistant" && !message.content ? (
                    <div className="flex items-center gap-1 py-1">
                      <span className="w-2 h-2 bg-[#0794d4] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-[#0794d4] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-[#0794d4] rounded-full animate-bounce"></span>
                    </div>
                  ) : message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-[15px] leading-relaxed prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-800 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-code:bg-gray-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:my-3 prose-a:text-[#0794d4] prose-strong:text-gray-900 prose-blockquote:border-l-[#0794d4] prose-blockquote:text-gray-600">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                      {message.content}
                    </div>
                  )}
                </MessageContent>
                {message.role === "assistant" && message.content && (
                  <MessageActions className="mt-2 flex gap-1">
                    <MessageAction
                      tooltip="Copy"
                      onClick={() => handleCopy(message.id, message.content)}
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </MessageAction>
                    {userPlan.hasVoice && (
                      <MessageAction
                        tooltip="Listen"
                        onClick={() => speakText(message.content)}
                      >
                        <Volume2 className="w-3.5 h-3.5 text-gray-400" />
                      </MessageAction>
                    )}
                    {userPlan.hasAvatar && (
                      <MessageAction
                        tooltip="Avatar"
                        onClick={() => setIsAvatarOpen(true)}
                      >
                        <Video className="w-3.5 h-3.5 text-gray-400" />
                      </MessageAction>
                    )}
                    <MessageAction tooltip="Helpful">
                      <ThumbsUp className="w-3.5 h-3.5 text-gray-400" />
                    </MessageAction>
                    <MessageAction tooltip="Not helpful">
                      <ThumbsDown className="w-3.5 h-3.5 text-gray-400" />
                    </MessageAction>
                    <MessageAction tooltip="Regenerate">
                      <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                    </MessageAction>
                  </MessageActions>
                )}
              </Message>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <footer className="flex-none px-6 py-4 border-t border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex items-end gap-2 p-2 bg-white border border-gray-200 shadow-sm rounded-2xl focus-within:border-[#0794d4] focus-within:ring-1 focus-within:ring-[#0794d4] transition-all">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleRecording}
                disabled={!userPlan.hasVoice}
                className={`shrink-0 h-9 w-9 rounded-xl ${
                  isRecording
                    ? "bg-red-100 text-red-500"
                    : "text-gray-400 hover:text-[#0794d4] hover:bg-gray-50"
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>

              {userPlan.hasAvatar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAvatarOpen(true)}
                  className="shrink-0 h-9 w-9 rounded-xl text-gray-400 hover:text-[#0794d4] hover:bg-gray-50"
                  title="Open Live Avatar"
                >
                  <Video className="w-4 h-4" />
                </Button>
              )}

              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 min-h-10 max-h-[120px] border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-2 text-gray-900 placeholder:text-gray-400"
                rows={1}
              />

              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="shrink-0 h-9 w-9 rounded-xl bg-[#0794d4] hover:bg-[#0794d4]/90 disabled:bg-gray-200 disabled:text-gray-400"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {!isLoadingHistory && messages.length === 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:border-[#0794d4] hover:text-[#0794d4] text-gray-600 rounded-full text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </footer>

      {/* Live Avatar Modal */}
      <LiveAvatarModal
        isOpen={isAvatarOpen}
        onClose={() => setIsAvatarOpen(false)}
      />
    </div>
  );
}
