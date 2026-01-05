"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
} from "livekit-client";
import {
  X,
  Loader2,
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  Phone,
  Square,
  History,
  Trash2,
  ChevronLeft,
  MessageSquare,
  Check,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ConversationHistory {
  id: string;
  session_id: string;
  messages: StoredMessage[];
  started_at: string;
  ended_at: string | null;
}

interface LiveAvatarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SessionData {
  sessionId: string;
  sessionToken: string;
  livekitUrl: string;
  livekitToken: string;
  conversationId?: string;
}

type ViewMode = "live" | "history" | "viewing";

export default function LiveAvatarModal({ isOpen, onClose }: LiveAvatarProps) {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("live");
  const [history, setHistory] = useState<ConversationHistory[]>([]);
  const [selectedHistory, setSelectedHistory] =
    useState<ConversationHistory | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live session state
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "speaking" | "listening" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);
  const roomRef = useRef<Room | null>(null);
  const sessionDataRef = useRef<SessionData | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load history when modal opens
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/liveavatar");
      if (response.ok) {
        const data = await response.json();
        // Filter out conversations with no messages
        setHistory(
          data.filter(
            (c: ConversationHistory) => c.messages && c.messages.length > 0
          )
        );
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Save message to database
  const saveMessage = useCallback(async (message: ChatMessage) => {
    if (!sessionDataRef.current?.conversationId) return;

    try {
      await fetch("/api/liveavatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: sessionDataRef.current.conversationId,
          message: {
            role: message.role,
            content: message.content,
          },
        }),
      });
    } catch (err) {
      console.error("Failed to save message:", err);
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    console.log("Cleaning up LiveAvatar session...");

    // Remove all audio elements
    audioElementsRef.current.forEach((el) => {
      el.pause();
      el.srcObject = null;
      el.remove();
    });
    audioElementsRef.current = [];

    // Disconnect from room
    if (roomRef.current) {
      try {
        roomRef.current.disconnect(true);
      } catch (e) {
        console.error("Error disconnecting room:", e);
      }
      roomRef.current = null;
    }

    // End session on server
    if (sessionDataRef.current) {
      try {
        await fetch("/api/liveavatar", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken: sessionDataRef.current.sessionToken,
            conversationId: sessionDataRef.current.conversationId,
          }),
        });
      } catch (err) {
        console.error("Failed to end session:", err);
      }
      sessionDataRef.current = null;
    }

    // Reset state
    setStatus("idle");
    setMessages([]);
    setError(null);
    setInput("");
    setIsMuted(false);
    setCurrentTranscript("");
    isClosingRef.current = false;
  }, []);

  // Initialize session and connect to LiveKit
  const initializeSession = useCallback(async () => {
    if (status !== "idle" || isClosingRef.current) return;

    setStatus("connecting");
    setError(null);

    try {
      // Get session from our API (FULL mode)
      const response = await fetch("/api/liveavatar", {
        method: "POST",
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || errData.details || "Failed to create avatar session"
        );
      }

      const data: SessionData = await response.json();

      if (!data.livekitUrl || !data.livekitToken) {
        throw new Error("Invalid session data - missing LiveKit credentials");
      }

      sessionDataRef.current = data;
      console.log("Session created:", data.sessionId);

      // Create and connect to LiveKit room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // Handle remote tracks (avatar video/audio)
      room.on(
        RoomEvent.TrackSubscribed,
        (
          track: RemoteTrack,
          publication: RemoteTrackPublication,
          participant: RemoteParticipant
        ) => {
          console.log("Track subscribed:", track.kind, track.sid);

          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
          }

          if (track.kind === Track.Kind.Audio) {
            const audioElement = track.attach();
            audioElement.volume = 1;
            audioElement.autoplay = true;
            document.body.appendChild(audioElement);
            audioElementsRef.current.push(audioElement);
          }
        }
      );

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        console.log("Track unsubscribed:", track.kind);
        const elements = track.detach();
        elements.forEach((el) => {
          if (el instanceof HTMLAudioElement) {
            const idx = audioElementsRef.current.indexOf(el);
            if (idx > -1) audioElementsRef.current.splice(idx, 1);
          }
          el.remove();
        });
      });

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log("Room disconnected:", reason);
        if (!isClosingRef.current) {
          setStatus("idle");
        }
      });

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log("Connection state:", state);
      });

      // Handle data messages from avatar
      room.on(
        RoomEvent.DataReceived,
        (
          payload: Uint8Array,
          participant?: RemoteParticipant,
          _kind?: unknown,
          topic?: string
        ) => {
          try {
            const decoder = new TextDecoder();
            const rawMessage = decoder.decode(payload);
            console.log("=== DATA RECEIVED ===");
            console.log("Topic:", topic);
            console.log("From:", participant?.identity);
            console.log("Raw:", rawMessage);

            const message = JSON.parse(rawMessage);
            const eventType = message.event_type || message.type;
            console.log("Event type:", eventType);

            switch (eventType) {
              case "user.speak_started":
                console.log("-> User started speaking");
                setStatus("listening");
                setCurrentTranscript("Listening...");
                break;

              case "user.speak_ended":
                console.log("-> User stopped speaking");
                setCurrentTranscript("Processing...");
                break;

              case "user.transcription": {
                console.log("-> User transcription received");
                const text = message.text;
                console.log("User text:", text);
                if (text) {
                  const userMsg: ChatMessage = {
                    id: `user-${Date.now()}`,
                    role: "user",
                    content: text,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, userMsg]);
                  saveMessage(userMsg);
                  setCurrentTranscript("");
                }
                break;
              }

              case "avatar.speak_started":
                console.log("-> Avatar started speaking");
                setStatus("speaking");
                break;

              case "avatar.speak_ended":
                console.log("-> Avatar stopped speaking");
                setStatus("connected");
                break;

              case "avatar.transcription": {
                console.log("-> Avatar transcription received");
                const text = message.text;
                console.log("Avatar text:", text);
                if (text) {
                  const assistantMsg: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: text,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, assistantMsg]);
                  saveMessage(assistantMsg);
                }
                break;
              }

              case "avatar_start_talking":
              case "avatar_stop_talking":
                // HeyGen events - already handled
                break;

              default:
                console.log("-> Unknown event type:", eventType);
            }
          } catch (err) {
            console.error("Failed to parse data message:", err);
          }
        }
      );

      // Connect to the room
      console.log("Connecting to LiveKit room...");
      await room.connect(data.livekitUrl, data.livekitToken);
      console.log("Connected to room!");

      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      console.log("Microphone enabled");

      setStatus("connected");
    } catch (err) {
      console.error("LiveAvatar init error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      setStatus("error");
    }
  }, [status, saveMessage]);

  // Send text message to avatar
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !roomRef.current) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    saveMessage(userMsg);

    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        event_type: "avatar.speak_response",
        text: input.trim(),
      })
    );

    try {
      await roomRef.current.localParticipant.publishData(data, {
        reliable: true,
        topic: "agent-control",
      });
      console.log("Command sent to avatar: avatar.speak_response");
    } catch (err) {
      console.error("Failed to send command:", err);
    }

    setInput("");
  }, [input, saveMessage]);

  // Interrupt avatar
  const interruptAvatar = useCallback(async () => {
    if (!roomRef.current) return;

    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        event_type: "avatar.interrupt",
      })
    );

    try {
      await roomRef.current.localParticipant.publishData(data, {
        reliable: true,
        topic: "agent-control",
      });
      console.log("Avatar interrupted");
    } catch (err) {
      console.error("Failed to interrupt avatar:", err);
    }
  }, []);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!roomRef.current) return;

    const newMuted = !isMuted;
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
      setIsMuted(newMuted);
    } catch (err) {
      console.error("Failed to toggle microphone:", err);
    }
  }, [isMuted]);

  // Handle close
  const handleClose = useCallback(async () => {
    await cleanup();
    setViewMode("live");
    setSelectedHistory(null);
    setSelectedIds(new Set());
    onClose();
  }, [cleanup, onClose]);

  // Delete selected conversations
  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/liveavatar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationIds: Array.from(selectedIds),
        }),
      });

      if (response.ok) {
        setHistory((prev) => prev.filter((c) => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error("Failed to delete conversations:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete all conversations
  const deleteAll = async () => {
    if (history.length === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/liveavatar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      });

      if (response.ok) {
        setHistory([]);
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error("Failed to delete all conversations:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Select all
  const selectAll = () => {
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(history.map((c) => c.id)));
    }
  };

  // View a history conversation
  const viewConversation = (conversation: ConversationHistory) => {
    setSelectedHistory(conversation);
    setViewMode("viewing");
  };

  // Initialize on open
  useEffect(() => {
    if (
      isOpen &&
      viewMode === "live" &&
      status === "idle" &&
      !isClosingRef.current
    ) {
      initializeSession();
    }
  }, [isOpen, viewMode, status, initializeSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isOpen) {
        cleanup();
      }
    };
  }, [isOpen, cleanup]);

  if (!isOpen) return null;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return (
        date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
        ` at ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      );
    }
  };

  // Get preview text from messages
  const getPreview = (messages: StoredMessage[]) => {
    if (!messages || messages.length === 0) return "No messages";
    const firstUserMsg = messages.find((m) => m.role === "user");
    if (firstUserMsg) {
      return firstUserMsg.content.length > 50
        ? firstUserMsg.content.slice(0, 50) + "..."
        : firstUserMsg.content;
    }
    return messages[0].content.length > 50
      ? messages[0].content.slice(0, 50) + "..."
      : messages[0].content;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-linear-to-r from-[#0794d4]/5 to-transparent">
          <div className="flex items-center gap-3">
            {viewMode !== "live" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setViewMode("live");
                  setSelectedHistory(null);
                }}
                className="h-9 w-9 rounded-xl text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="w-10 h-10 bg-[#0794d4] rounded-xl flex items-center justify-center">
              {viewMode === "history" ? (
                <History className="w-5 h-5 text-white" />
              ) : viewMode === "viewing" ? (
                <MessageSquare className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {viewMode === "history"
                  ? "Chat History"
                  : viewMode === "viewing"
                  ? "Past Conversation"
                  : "iProf Tutor - Live Session"}
              </h2>
              {viewMode === "live" && (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status === "connected"
                        ? "bg-green-500"
                        : status === "speaking"
                        ? "bg-blue-500 animate-pulse"
                        : status === "listening"
                        ? "bg-orange-500 animate-pulse"
                        : status === "connecting"
                        ? "bg-yellow-500 animate-pulse"
                        : status === "error"
                        ? "bg-red-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <span className="text-xs text-gray-500">
                    {status === "connecting"
                      ? "Connecting..."
                      : status === "connected"
                      ? "Ready - speak or type"
                      : status === "speaking"
                      ? "Avatar speaking..."
                      : status === "listening"
                      ? "Listening..."
                      : status === "error"
                      ? "Error"
                      : "Initializing..."}
                  </span>
                </div>
              )}
              {viewMode === "history" && (
                <p className="text-xs text-gray-500">
                  {history.length} past session{history.length !== 1 ? "s" : ""}
                </p>
              )}
              {viewMode === "viewing" && selectedHistory && (
                <p className="text-xs text-gray-500">
                  {formatDate(selectedHistory.started_at)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === "live" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  loadHistory();
                  setViewMode("history");
                }}
                className="h-10 w-10 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title="View History"
              >
                <History className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-10 w-10 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* History View */}
        {viewMode === "history" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* History Actions */}
            {history.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                    className="text-xs text-gray-600"
                  >
                    {selectedIds.size === history.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                  {selectedIds.size > 0 && (
                    <span className="text-xs text-gray-500">
                      {selectedIds.size} selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deleteSelected}
                      disabled={isDeleting}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="w-3 h-3 mr-1" />
                      )}
                      Delete Selected
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteAll}
                    disabled={isDeleting}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete All
                  </Button>
                </div>
              </div>
            )}

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-[#0794d4] animate-spin mb-3" />
                  <p className="text-sm text-gray-400">Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">
                    No past sessions
                  </p>
                  <p className="text-sm text-gray-400 text-center">
                    Your avatar conversation history will appear here
                  </p>
                  <Button
                    onClick={() => setViewMode("live")}
                    className="mt-4 bg-[#0794d4] hover:bg-[#0794d4]/90"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Start Live Session
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedIds.has(conversation.id)
                          ? "border-[#0794d4] bg-[#0794d4]/5"
                          : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelection(conversation.id);
                        }}
                        className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedIds.has(conversation.id)
                            ? "border-[#0794d4] bg-[#0794d4]"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {selectedIds.has(conversation.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => viewConversation(conversation)}
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getPreview(conversation.messages)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDate(conversation.started_at)}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {conversation.messages.length} message
                            {conversation.messages.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Back to Live Button */}
            {history.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-white">
                <Button
                  onClick={() => setViewMode("live")}
                  className="w-full bg-[#0794d4] hover:bg-[#0794d4]/90"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Back to Live Session
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Viewing Past Conversation */}
        {viewMode === "viewing" && selectedHistory && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto space-y-4">
                {selectedHistory.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user" ? "bg-[#0794d4]" : "bg-gray-200"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        message.role === "user"
                          ? "bg-[#0794d4] text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          message.role === "user"
                            ? "text-white/60"
                            : "text-gray-400"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-white">
              <Button
                onClick={() => setViewMode("history")}
                variant="outline"
                className="w-full"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to History
              </Button>
            </div>
          </div>
        )}

        {/* Live Session View */}
        {viewMode === "live" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Video Section */}
            <div className="w-1/2 bg-gray-900 relative flex flex-col">
              <div className="flex-1 relative">
                {status === "connecting" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-[#0794d4] animate-spin mb-3" />
                    <p className="text-sm text-gray-400">
                      Starting live session...
                    </p>
                  </div>
                )}

                {status === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                      <X className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-sm text-red-400 text-center mb-4">
                      {error}
                    </p>
                    <Button
                      onClick={() => {
                        setStatus("idle");
                        setError(null);
                        initializeSession();
                      }}
                      className="bg-[#0794d4] hover:bg-[#0794d4]/90"
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={false}
                  className={`w-full h-full object-cover ${
                    status === "connected" ||
                    status === "speaking" ||
                    status === "listening"
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />

                {(status === "speaking" || status === "listening") && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[#0794d4] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-[#0794d4] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-[#0794d4] rounded-full animate-bounce" />
                      </div>
                      <span className="text-xs text-white/80">
                        {status === "speaking" ? "Speaking..." : "Listening..."}
                      </span>
                    </div>
                  </div>
                )}

                {currentTranscript && status === "listening" && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-sm text-white/90 italic">
                        "{currentTranscript}"
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {(status === "connected" ||
                status === "speaking" ||
                status === "listening") && (
                <div className="p-4 bg-gray-800/50 flex items-center justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMicrophone}
                    className={`h-12 w-12 rounded-full ${
                      isMuted
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                  {status === "speaking" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={interruptAvatar}
                      className="h-12 w-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                      title="Interrupt"
                    >
                      <Square className="w-5 h-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white"
                    title="End session"
                  >
                    <Phone className="w-5 h-5 rotate-135" />
                  </Button>
                </div>
              )}
            </div>

            {/* Chat Section */}
            <div className="w-1/2 flex flex-col bg-gray-50">
              <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <h3 className="text-sm font-medium text-gray-700">
                  Conversation
                </h3>
                <p className="text-xs text-gray-400">
                  {messages.length > 0
                    ? `${messages.length} message${
                        messages.length !== 1 ? "s" : ""
                      }`
                    : "Speak or type to interact"}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && status === "connected" && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-12 h-12 bg-[#0794d4]/10 rounded-full flex items-center justify-center mb-3">
                      <Mic className="w-6 h-6 text-[#0794d4]" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      Ready to chat!
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Start speaking or type a message below
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user" ? "bg-[#0794d4]" : "bg-gray-200"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        message.role === "user"
                          ? "bg-[#0794d4] text-white rounded-br-sm"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          message.role === "user"
                            ? "text-white/60"
                            : "text-gray-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {currentTranscript && (
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#0794d4]/50">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-[#0794d4]/50 text-white rounded-br-sm">
                      <p className="text-sm leading-relaxed italic">
                        {currentTranscript}...
                      </p>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 h-11 rounded-xl border-gray-200 focus:border-[#0794d4] focus:ring-[#0794d4]"
                    disabled={
                      status !== "connected" &&
                      status !== "speaking" &&
                      status !== "listening"
                    }
                  />
                  <Button
                    type="submit"
                    disabled={
                      !input.trim() ||
                      (status !== "connected" &&
                        status !== "speaking" &&
                        status !== "listening")
                    }
                    className="h-11 w-11 rounded-xl bg-[#0794d4] hover:bg-[#0794d4]/90 disabled:bg-gray-200"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                <p className="text-xs text-gray-400 text-center mt-2">
                  💡 Tip:{" "}
                  {isMuted
                    ? "Unmute your mic to speak"
                    : "Just speak - the avatar is listening!"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
