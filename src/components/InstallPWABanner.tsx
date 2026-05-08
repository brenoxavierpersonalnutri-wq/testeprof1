import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const VISIT_KEY = "bx_visit_count";
const DISMISS_KEY = "bx_install_dismissed";

export default function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Increment visit count
    const count = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_KEY, String(count));

    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;

    if (dismissed || isStandalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (count >= 2) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // For iOS we have no event — show tooltip on 2nd visit
    if (iOS && count >= 2) setShow(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-4 shadow-2xl animate-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <img src="/icons/icon-192.png" alt="Time BX" className="h-12 w-12 rounded-lg" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            Instalar Time Breno Xavier no celular
          </h3>
          {isIOS ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              Toque em <Share className="inline h-3 w-3" /> compartilhar → Adicionar à Tela de Início
            </p>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                Acesso rápido direto da sua tela inicial.
              </p>
              <Button size="sm" onClick={handleInstall} className="mt-2 h-8">
                <Download className="mr-1 h-3 w-3" />
                Instalar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
