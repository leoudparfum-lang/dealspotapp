import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Headphones, Send } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hallo! Hoe kan ik u vandaag helpen?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Bedankt voor uw bericht! Een van onze medewerkers zal zo spoedig mogelijk reageren.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg z-30"
        onClick={() => setIsOpen(true)}
        data-testid="button-chat-open"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-24 right-4 w-80 max-w-[calc(100vw-2rem)] shadow-lg z-40" data-testid="chat-widget">
      <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-foreground rounded-full flex items-center justify-center">
              <Headphones className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium" data-testid="text-chat-title">Klantenservice</p>
              <p className="text-xs opacity-90" data-testid="text-chat-status">Online nu</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-white hover:bg-opacity-20 rounded-full p-1"
            onClick={() => setIsOpen(false)}
            data-testid="button-chat-close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-64 p-4" data-testid="chat-messages">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}
                data-testid={`message-${msg.id}`}
              >
                <div
                  className={`max-w-xs rounded-lg p-3 ${
                    msg.isBot
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString("nl-NL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Typ uw bericht..."
              className="flex-1 text-sm"
              data-testid="input-chat-message"
            />
            <Button 
              size="sm" 
              onClick={sendMessage}
              disabled={!message.trim()}
              data-testid="button-chat-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
