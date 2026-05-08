import { useState } from "react";
import KanbanBoard from "@/components/crm/KanbanBoard";
import { Button } from "@/components/ui/button";
import { MessageCircle, Bot } from "lucide-react";
import { WhatsAppConnectModal } from "@/components/crm/WhatsAppConnectModal";
import { AIAgentSettingsModal } from "@/components/crm/AIAgentSettingsModal";
import { WhatsAppChatArea } from "@/components/crm/WhatsAppChatArea";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const CRM = () => {
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isAIAgentModalOpen, setIsAIAgentModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const handleCardClick = (contact: any) => {
    setSelectedLead(contact);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header Area */}
      <div className="flex-none p-4 md:px-8 border-b bg-background">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">CRM Kanban</h2>
            <p className="text-muted-foreground text-sm">
              Gerencie seus leads e converse via WhatsApp.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white h-9"
              onClick={() => setIsWhatsAppModalOpen(true)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Conectar WhatsApp
            </Button>
            <Button
              variant="outline"
              className="border-indigo-500/30 text-indigo-600 hover:bg-indigo-50 h-9"
              onClick={() => setIsAIAgentModalOpen(true)}
            >
              <Bot className="mr-2 h-4 w-4" />
              Configurar Agente IA
            </Button>
          </div>
        </div>
      </div>

      <WhatsAppConnectModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      <AIAgentSettingsModal
        isOpen={isAIAgentModalOpen}
        onClose={() => setIsAIAgentModalOpen(false)}
      />

      {/* Split Layout Area */}
      <div className="flex-1 overflow-hidden p-4 md:p-6 md:pb-0">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full rounded-xl border bg-card text-card-foreground shadow-sm"
        >
          <ResizablePanel defaultSize={65} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="p-3 border-b bg-muted/20 font-medium text-sm flex items-center justify-between">
                <span>Quadro de Vendas</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <KanbanBoard
                  onCardClick={handleCardClick}
                  selectedCardId={selectedLead?.id}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="h-full bg-muted/5 flex flex-col">
              <WhatsAppChatArea lead={selectedLead} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default CRM;
