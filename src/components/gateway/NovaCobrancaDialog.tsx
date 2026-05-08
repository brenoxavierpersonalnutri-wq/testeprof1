import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { calcularLiquido, formatCPFCNPJ, formatCurrency, formatPhone } from "@/lib/gateway/formatters";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().email("Email inválido").max(255),
  cpf: z.string().trim().min(11, "CPF/CNPJ obrigatório"),
  telefone: z.string().trim().optional(),
  valor: z.number().positive("Valor inválido"),
  descricao: z.string().max(500).optional(),
  metodo: z.enum(["pix", "cartao", "boleto"]),
  parcelas: z.number().int().min(1).max(12),
  vencimento: z.string().optional(),
});

export function NovaCobrancaDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated?: () => void }) {
  const { session } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [valor, setValor] = useState<string>("");
  const [descricao, setDescricao] = useState("");
  const [metodo, setMetodo] = useState<"pix" | "cartao" | "boleto">("pix");
  const [parcelas, setParcelas] = useState(1);
  const [vencimento, setVencimento] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setNome(""); setEmail(""); setCpf(""); setTelefone(""); setValor("");
      setDescricao(""); setMetodo("pix"); setParcelas(1); setVencimento("");
    }
  }, [open]);

  const valorNum = Number(valor.replace(",", ".")) || 0;
  const calc = calcularLiquido(valorNum, metodo, parcelas);

  const submit = async () => {
    const parsed = schema.safeParse({
      nome, email, cpf, telefone, valor: valorNum, descricao, metodo, parcelas,
      vencimento: vencimento || undefined,
    });
    if (!parsed.success) {
      toast({ title: "Verifique os dados", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    if (!session?.user) return;
    setLoading(true);
    const { error } = await supabase.from("gateway_transacoes").insert({
      user_id: session.user.id,
      cliente_nome: nome,
      cliente_email: email,
      cliente_cpf_cnpj: cpf,
      cliente_telefone: telefone || null,
      valor_bruto: valorNum,
      taxa_percentual: calc.perc,
      taxa_fixa: calc.fixa,
      valor_liquido: calc.liquido,
      metodo,
      parcelas: metodo === "cartao" ? parcelas : 1,
      descricao: descricao || null,
      vencimento: vencimento || null,
      status: "pendente",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao criar cobrança", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cobrança criada com sucesso" });
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova cobrança</DialogTitle></DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Cliente</Label>
            <Input placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input placeholder="email@cliente.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="CPF/CNPJ" value={cpf} onChange={(e) => setCpf(formatCPFCNPJ(e.target.value))} />
              <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Cobrança</Label>
            <Input placeholder="Valor (R$)" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
            <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            <Textarea placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Método</Label>
            <RadioGroup value={metodo} onValueChange={(v) => setMetodo(v as any)} className="grid grid-cols-3 gap-2">
              {[
                { v: "pix", l: "Pix" },
                { v: "cartao", l: "Cartão" },
                { v: "boleto", l: "Boleto" },
              ].map((m) => (
                <Label key={m.v} className={`flex items-center gap-2 border rounded-lg p-2.5 cursor-pointer ${metodo === m.v ? "border-primary bg-primary/5" : ""}`}>
                  <RadioGroupItem value={m.v} />
                  <span className="text-sm">{m.l}</span>
                </Label>
              ))}
            </RadioGroup>
            {metodo === "cartao" && (
              <Select value={String(parcelas)} onValueChange={(v) => setParcelas(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}x de {formatCurrency(valorNum / n)} {n === 1 ? "à vista" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Valor</span><span>{formatCurrency(valorNum)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Taxa ({calc.perc}% + {formatCurrency(calc.fixa)})</span><span>-{formatCurrency(calc.taxaValor)}</span></div>
            <div className="flex justify-between font-semibold text-emerald-600 pt-1 border-t"><span>Você recebe</span><span>{formatCurrency(calc.liquido)}</span></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Gerar cobrança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
