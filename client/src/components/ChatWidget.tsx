import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Image, Loader2, Cake, Cookie, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  timestamp?: Date;
}

interface QuickReply {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const quickReplies: QuickReply[] = [
  { label: "Custom Cake", value: "I'd like to order a custom cake", icon: <Cake className="h-3 w-3" /> },
  { label: "Sugar Cookies", value: "I'm interested in decorated sugar cookies", icon: <Cookie className="h-3 w-3" /> },
  { label: "Gift Box", value: "I want to create a custom gift box", icon: <Gift className="h-3 w-3" /> },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi there! 🧁 Welcome to Fairytale Farms Bakery! I'm here to help you with custom orders. Whether you're looking for a beautiful birthday cake, decorated sugar cookies, or any of our delicious treats, I'd love to help!\n\nWhat can I help you create today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessageMutation = trpc.chatbot.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, timestamp: new Date() },
      ]);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble responding right now. Please try again or contact us at fairytalefarms.net@gmail.com",
          timestamp: new Date(),
        },
      ]);
    },
  });

  const uploadImageMutation = trpc.chatbot.uploadImage.useMutation({
    onSuccess: (data) => {
      setPendingImages((prev) => [...prev, data.url]);
      setIsUploading(false);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      setIsUploading(false);
      alert("Failed to upload image. Please try again.");
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadImageMutation.mutate({
        sessionId,
        imageData: base64,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = (messageText: string, images: string[] = []) => {
    if ((!messageText.trim() && images.length === 0) || sendMessageMutation.isPending) return;

    setShowQuickReplies(false);
    setInputValue("");
    setPendingImages([]);
    
    const messageContent = images.length > 0 
      ? `${messageText}${messageText ? '\n\n' : ''}[Attached ${images.length} image${images.length > 1 ? 's' : ''} for reference]`
      : messageText;
    
    setMessages((prev) => [...prev, { role: "user", content: messageContent, images, timestamp: new Date() }]);

    const conversationHistory = messages.slice(1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    sendMessageMutation.mutate({
      sessionId,
      message: messageText || "I've attached some inspiration images for my order.",
      conversationHistory,
      imageUrls: images,
    });
  };

  const handleSend = () => {
    sendMessage(inputValue.trim(), [...pendingImages]);
  };

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-pulse"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[400px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="font-semibold">Custom Order Assistant</h3>
                <p className="text-xs text-pink-100">Online • Usually replies instantly</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-md"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
                  }`}
                >
                  {message.images && message.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {message.images.map((img, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={img}
                          alt={`Attached ${imgIndex + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-white/30"
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                <span className={`text-[10px] mt-1 px-1 ${message.role === "user" ? "text-gray-400" : "text-gray-400"}`}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
            ))}
            
            {/* Typing indicator */}
            {sendMessageMutation.isPending && (
              <div className="flex flex-col items-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
                <span className="text-[10px] mt-1 px-1 text-gray-400">Typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {showQuickReplies && messages.length === 1 && !sendMessageMutation.isPending && (
            <div className="border-t border-gray-100 bg-white px-3 py-2">
              <p className="text-xs text-gray-500 mb-2">Quick options:</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pink-600 bg-pink-50 rounded-full border border-pink-200 hover:bg-pink-100 hover:border-pink-300 transition-colors"
                  >
                    {reply.icon}
                    {reply.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pending images preview */}
          {pendingImages.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500 mb-1.5">Attached images:</p>
              <div className="flex flex-wrap gap-2">
                {pendingImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Pending ${index + 1}`}
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || sendMessageMutation.isPending}
                className="h-9 w-9 rounded-full hover:bg-pink-50 text-gray-500 hover:text-pink-500"
                title="Attach inspiration image"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                ) : (
                  <Image className="h-4 w-4" />
                )}
              </Button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 bg-gray-50"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={(!inputValue.trim() && pendingImages.length === 0) || sendMessageMutation.isPending}
                size="icon"
                className="h-9 w-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              💡 Tip: Attach inspiration images for your custom order
            </p>
          </div>
        </div>
      )}
    </>
  );
}
