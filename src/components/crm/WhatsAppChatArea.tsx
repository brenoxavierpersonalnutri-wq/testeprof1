import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MoreVertical, Search, Paperclip, Phone, Video, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  phone: string;
  name: string;
}

interface WhatsAppChatAreaProps {
  lead: Lead | null;
}

interface Message {
  id: string;
  body: string;
  sender_type: "lead" | "user" | "bot";
  direction: string;
  created_at: string;
  status: string;
}

export function WhatsAppChatArea({ lead }: WhatsAppChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch messages for current lead
  const fetchMessages = async (phone: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("contact_phone", phone)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!lead?.phone) {
      setMessages([]);
      return;
    }

    fetchMessages(lead.phone);

    // Realtime subscription for this contact's messages
    const channel = supabase
      .channel(`messages_${lead.phone}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: `contact_phone=eq.${lead.phone}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lead?.phone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!lead) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted/30 border-l">
        <div className="h-32 w-32 bg-muted rounded-full flex items-center justify-center mb-6">
          <MessageCircleIcon className="h-16 w-16 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2">Nenhuma conversa selecionada</h3>
        <p className="text-sm text-muted-foreground">Clique em um card no Kanban para abrir o chat.</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Erro", description: "Sessão expirada. Faça login novamente.", variant: "destructive" });
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ phone: lead.phone, message: text }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao enviar");
      }
    } catch (err: any) {
      toast({
        title: "Erro ao enviar",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
      setInputText(text); // restore text on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-[#e5ddd5] dark:bg-[#0b141a] border-l rounded-tr-xl rounded-br-xl overflow-hidden relative shadow-inner">
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')",
          backgroundSize: "400px",
        }}
      />

      {/* Header */}
      <div className="h-16 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center px-4 justify-between z-10 shadow-sm border-b dark:border-[#111b21]">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarFallback className="bg-green-100 text-green-700 font-medium">
              {(lead.name || lead.phone).substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm leading-tight text-[#111b21] dark:text-[#e9edef]">
              {lead.name || lead.phone}
            </h3>
            <p className="text-[11px] text-[#667781] dark:text-[#8696a0] leading-tight">
              {lead.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#54656f] dark:text-[#aebac1]">
          <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"><Video className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"><Phone className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"><Search className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"><MoreVertical className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:px-8 space-y-4 z-10 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <span className="bg-white/90 dark:bg-[#182229]/90 text-xs px-3 py-1 rounded-lg text-[#54656f] dark:text-[#8696a0] shadow-sm uppercase tracking-wider">
                Histórico
              </span>
            </div>

            {messages.map((msg) => {
              const isMe = msg.direction === "outbound";
              const isBot = msg.sender_type === "bot";
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 shadow-sm relative ${
                      isMe
                        ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-sm"
                        : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-sm"
                    }`}
                  >
                    {isBot && (
                      <div className="text-[10px] items-center flex gap-1 text-indigo-500 mb-1 font-semibold">
                        🤖 Agente IA enviou:
                      </div>
                    )}
                    <p className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap">
                      {msg.body}
                    </p>
                    <div className="text-[10px] w-full text-right mt-1 opacity-70 text-[#667781] dark:text-[#8696a0]">
                      {formatTime(msg.created_at)}
                      {isMe && <span className="ml-1 text-blue-500 font-bold">✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-3 px-4 flex items-center gap-2 z-10 shadow-sm border-t dark:border-[#111b21]">
        <Button variant="ghost" size="icon" className="text-[#54656f] dark:text-[#aebac1] hover:bg-transparent -ml-2 shrink-0">
          <Paperclip className="h-6 w-6" />
        </Button>
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Digite uma mensagem"
          disabled={sending}
          className="rounded-xl border-none bg-white dark:bg-[#2a3942] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#8696a0] text-[#111b21] dark:text-[#e9edef]"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSend}
          disabled={sending}
          className={`${
            inputText.trim()
              ? "text-green-600 dark:text-[#00a884]"
              : "text-[#54656f] dark:text-[#aebac1]"
          } hover:bg-transparent shrink-0`}
        >
          {sending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Send className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  );
}

function MessageCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
