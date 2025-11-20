import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendAgentMessage, executeAgentAction, type ChatMessage, type ProposedAction } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface MessageWithActions extends ChatMessage {
  id: string;
  proposedActions?: ProposedAction[];
  timestamp: Date;
}

export function AgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageWithActions[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ProposedAction | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: MessageWithActions = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendAgentMessage([...chatHistory, { role: "user", content: userMessage.content }]);

      const assistantMessage: MessageWithActions = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        proposedActions: response.proposedActions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.proposedActions && response.proposedActions.length > 0) {
        setPendingAction(response.proposedActions[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message to agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = async (action: ProposedAction) => {
    setIsLoading(true);
    setPendingAction(null);

    try {
      const response = await executeAgentAction(action.actionType, action.actionData);

      const executionMessage: MessageWithActions = {
        id: Date.now().toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, executionMessage]);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });

      toast({
        title: "Action Executed",
        description: "The action has been completed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Execution Failed",
        description: error.message || "Failed to execute action",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectAction = () => {
    setPendingAction(null);
    const rejectionMessage: MessageWithActions = {
      id: Date.now().toString(),
      role: "user",
      content: "Action rejected by user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, rejectionMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        size="icon"
        data-testid="button-open-agent-chat"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">Mission Control AI</DialogTitle>
                  <p className="text-xs text-muted-foreground">Your intelligent assistant</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Messages Area */}
          <ScrollArea ref={scrollRef} className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about your missions, personnel, fleet, or analytics!
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    I can also help you create or update missions.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  {message.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div className={`flex flex-col gap-2 max-w-[80%]`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {message.proposedActions && message.proposedActions.length > 0 && (
                      <div className="space-y-2">
                        {message.proposedActions.map((action, idx) => (
                          <Alert key={idx} className="border-primary/50 bg-primary/5">
                            <AlertDescription className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-sm mb-1">Action Requires Approval</p>
                                <p className="text-xs text-muted-foreground">{action.description}</p>
                              </div>
                              {pendingAction === action && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveAction(action)}
                                    disabled={isLoading}
                                    data-testid="button-approve-action"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleRejectAction}
                                    disabled={isLoading}
                                    data-testid="button-reject-action"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-muted-foreground px-1">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about Mission Control..."
                disabled={isLoading}
                className="flex-1"
                data-testid="input-agent-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Powered by GPT-5 • Actions require your approval
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
