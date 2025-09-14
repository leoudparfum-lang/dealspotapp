import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, User, Headphones } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
  senderName?: string;
}

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveChat({ isOpen, onClose }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => disconnectWebSocket();
  }, [isOpen, isAuthenticated]);

  const connectWebSocket = () => {
    try {
      // In development, use ws://, in production use wss://
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        // Send welcome message from support
        addMessage({
          id: Date.now().toString(),
          text: "Hallo! Ik ben hier om u te helpen. Waar kan ik u mee van dienst zijn?",
          sender: 'support',
          timestamp: new Date(),
          senderName: 'Customer Support'
        });
      };
      
      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        addMessage(message);
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        toast({
          title: "Verbindingsfout",
          description: "Er kon geen verbinding gemaakt worden met de chat service",
          variant: "destructive",
        });
      };
    } catch (error) {
      // Fallback: simulate chat without WebSocket
      setIsConnected(true);
      simulateWelcomeMessage();
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const simulateWelcomeMessage = () => {
    addMessage({
      id: Date.now().toString(),
      text: "Hallo! Ik ben hier om u te helpen. Waar kan ik u mee van dienst zijn?",
      sender: 'support',
      timestamp: new Date(),
      senderName: 'Customer Support'
    });
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
      senderName: user?.firstName || 'U'
    };

    addMessage(userMessage);

    // Send via WebSocket or simulate response
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(userMessage));
    } else {
      // Simulate support response for demo
      simulateSupportResponse(newMessage);
    }

    setNewMessage("");
  };

  const simulateSupportResponse = (userText: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      
      // Simple keyword-based responses
      let response = "Bedankt voor uw bericht. Een van onze medewerkers zal u zo spoedig mogelijk helpen.";
      
      if (userText.toLowerCase().includes('bestelling')) {
        response = "Ik zie dat u een vraag heeft over uw bestelling. Kunt u mij uw bestelnummer geven?";
      } else if (userText.toLowerCase().includes('voucher')) {
        response = "Voor vragen over vouchers kan ik u helpen. Kunt u beschrijven wat het probleem is?";
      } else if (userText.toLowerCase().includes('reservering')) {
        response = "Ik help u graag met uw reservering. Heeft u een reserveringsnummer?";
      } else if (userText.toLowerCase().includes('problemen') || userText.toLowerCase().includes('probleem')) {
        response = "Het spijt me dat u problemen ondervindt. Kunt u het probleem nader omschrijven?";
      }
      
      addMessage({
        id: Date.now().toString(),
        text: response,
        sender: 'support',
        timestamp: new Date(),
        senderName: 'Customer Support'
      });
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] p-0" data-testid="live-chat-modal" aria-describedby="chat-description">
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Headphones className="h-5 w-5 text-primary" />
              <DialogTitle data-testid="chat-modal-title">
                Live Chat Support
              </DialogTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                {isConnected ? "Online" : "Offline"}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p id="chat-description" className="text-sm text-muted-foreground mt-1">
            Stel uw vraag en onze klantenservice helpt u direct
          </p>
        </DialogHeader>

        <div className="flex flex-col h-[500px]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.sender}-${message.id}`}
                >
                  <div className={`flex max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`text-xs ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Headphones className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`rounded-lg p-3 ${message.sender === 'user' ? 'bg-primary text-primary-foreground ml-2' : 'bg-muted text-foreground mr-2'}`}>
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-end space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                        <Headphones className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted text-foreground rounded-lg p-3 mr-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-75" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isAuthenticated ? "Typ uw bericht..." : "Log in om te chatten..."}
                disabled={!isAuthenticated}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isAuthenticated}
                size="sm"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground mt-2">
                U moet ingelogd zijn om de chat te kunnen gebruiken
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}