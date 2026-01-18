import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[]; // URLs of attached images
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi there! 🧁 Welcome to Fairytale Farms Bakery! I'm here to help you with custom orders. Whether you're looking for a beautiful birthday cake, decorated sugar cookies, or any of our delicious treats, I'd love to help!\n\nWhat can I help you create today?\n\n💡 Tip: You can attach inspiration images using the 📷 button!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessageMutation = trpc.chatbot.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble responding right now. Please try again or contact us at fairytalefarms.net@gmail.com",
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    // Convert to base64
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

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!inputValue.trim() && pendingImages.length === 0) || sendMessageMutation.isPending) return;

    const userMessage = inputValue.trim();
    const images = [...pendingImages];
    
    setInputValue("");
    setPendingImages([]);
    
    // Add user message with images to display
    const messageContent = images.length > 0 
      ? `${userMessage}${userMessage ? '\n\n' : ''}[Attached ${images.length} image${images.length > 1 ? 's' : ''} for reference]`
      : userMessage;
    
    setMessages((prev) => [...prev, { role: "user", content: messageContent, images }]);

    const conversationHistory = messages.slice(1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    sendMessageMutation.mutate({
      sessionId,
      message: userMessage || "I've attached some inspiration images for my order.",
      conversationHistory,
      imageUrls: images,
    });
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
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Custom Order Assistant</h3>
                <p className="text-xs text-pink-100">Let's create something magical together!</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100"
                  }`}
                >
                  {/* Display attached images */}
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
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl px-4 py-2 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending images preview */}
          {pendingImages.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2">
              <div className="flex flex-wrap gap-2">
                {pendingImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`Pending ${index + 1}`}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {/* Image upload button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || sendMessageMutation.isPending}
                className="h-10 w-10 rounded-full border-gray-300 hover:bg-pink-50 hover:border-pink-300"
                title="Attach inspiration image"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                ) : (
                  <Image className="h-4 w-4 text-gray-500" />
                )}
              </Button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={(!inputValue.trim() && pendingImages.length === 0) || sendMessageMutation.isPending}
                size="icon"
                className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
