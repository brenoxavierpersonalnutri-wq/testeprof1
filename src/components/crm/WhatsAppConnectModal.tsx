import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, RefreshCcw, CheckCircle2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConnectionState = "disconnected" | "generating" | "scanning" | "connected" | "error";

export function WhatsAppConnectModal({ isOpen, onClose }: WhatsAppConnectModalProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const { toast } = useToast();

  const callVps = useCallback(
    async (action: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-qr?action=${action}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      return res.json();
    },
    []
  );

  // Check status on open
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const data = await callVps("status");
        if (data.connected) {
          setConnectionState("connected");
        } else {
          setConnectionState("disconnected");
        }
      } catch {
        setConnectionState("disconnected");
      }
    })();
  }, [isOpen, callVps]);

  // Poll for status while scanning
  useEffect(() => {
    if (connectionState !== "scanning") return;
    const interval = setInterval(async () => {
      try {
        const data = await callVps("status");
        if (data.connected) {
          setConnectionState("connected");
          toast({
            title: "WhatsApp Conectado!",
            description: "A partir de agora as mensagens aparecerão no painel.",
          });
        } else if (data.qr) {
          setQrCodeData(data.qr);
        }
      } catch {
        // keep polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [connectionState, callVps, toast]);

  const handleConnect = async () => {
    setConnectionState("generating");
    setErrorMsg("");
    try {
      const data = await callVps("qr");
      if (data.qr) {
        setQrCodeData(data.qr);
        setConnectionState("scanning");
      } else if (data.connected) {
        setConnectionState("connected");
      } else {
        throw new Error(data.error || "Falha ao gerar QR Code");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao conectar com o servidor");
      setConnectionState("error");
    }
  };

  const handleDisconnect = async () => {
    try {
      await callVps("disconnect");
      setConnectionState("disconnected");
      setQrCodeData(null);
      toast({
        title: "Desconectado",
        description: "Sua sessão do WhatsApp foi encerrada.",
        variant: "destructive",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao desconectar.",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && connectionState !== "connected") {
      setConnectionState("disconnected");
      setQrCodeData(null);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            Conexão WhatsApp
          </DialogTitle>
          <DialogDescription>
            Conecte seu WhatsApp para habilitar automação e gerenciar as mensagens dos seus leads pelo CRM.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-xl border border-border mt-2 min-h-[320px] transition-all">
          {connectionState === "disconnected" && (
            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
              <div className="h-24 w-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                <MessageCircle className="h-10 w-10 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">WhatsApp Desconectado</h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
                Escaneie o QR Code para sincronizar e automatizar seus atendimentos.
              </p>
              <Button onClick={handleConnect} className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg">
                Gerar QR Code
              </Button>
            </div>
          )}

          {connectionState === "generating" && (
            <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
              <RefreshCcw className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
              <h4 className="text-base font-medium">Gerando QR Code...</h4>
              <p className="text-sm text-muted-foreground mt-2">Conectando ao servidor...</p>
            </div>
          )}

          {connectionState === "scanning" && (
            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
              <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 relative overflow-hidden group">
                {qrCodeData ? (
                  <img src={qrCodeData} alt="QR Code WhatsApp" className="h-40 w-40 object-contain" />
                ) : (
                  <div className="h-40 w-40 flex items-center justify-center">
                    <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/20 to-transparent translate-y-[-100%] animate-[scan_2s_ease-in-out_infinite]" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Leia o QR Code</h4>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e aponte a câmera.
              </p>
            </div>
          )}

          {connectionState === "connected" && (
            <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-pulse" />
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Conectado!</h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
                Seu WhatsApp está operante. As mensagens recebidas aparecerão no CRM.
              </p>
              <Button onClick={handleDisconnect} variant="outline" className="w-full text-destructive hover:bg-destructive/10 border-destructive/20">
                <LogOut className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            </div>
          )}

          {connectionState === "error" && (
            <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
              <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <MessageCircle className="h-10 w-10 text-destructive" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-destructive">Erro na Conexão</h4>
              <p className="text-sm text-muted-foreground mb-4 max-w-[250px]">
                {errorMsg || "Não foi possível conectar ao servidor."}
              </p>
              <Button onClick={handleConnect} className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg">
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
