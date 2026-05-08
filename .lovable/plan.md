## Problema identificado

**1. Tráfego de Abril/26 está incompleto (R$ 1.042,60)**

O sync automático em `src/pages/Financeiro.tsx` (linhas 180-229) só consulta **UMA conta de anúncios** — a que está salva em `localStorage.metaAdAccountId`. Como você roda anúncios em mais de uma conta Meta, o gasto das outras contas nunca entra no `monthly_data.trafego`.

Além disso, o sync só rebate o **mês atual** (Maio agora), então o valor de Abril ficou "congelado" com a última sincronização parcial e nunca mais foi atualizado.

**2. Webhooks ativos em Abril/26** (consulta no banco):

| Source | Vendas | Total bruto | Período |
|---|---|---|---|
| `PAGTRUST` | 210 | R$ 3.798,94 | 01/abr → 22/abr |
| `PAGTRUST_2` | 314 | R$ 6.287,70 | 22/abr → 30/abr |

São as duas funções `pagtrust-webhook` e `pagtrust-webhook-2`. A 3ª conta que você mencionou ainda **não tem webhook conectado** (nenhum evento chegou). Hoje o usuário não consegue ver isso em lugar nenhum no Financeiro.

## O que vou implementar

### A) Suportar múltiplas contas Meta no sync de tráfego

- Trocar `localStorage.metaAdAccountId` (string única) por `localStorage.metaAdAccountIds` (array JSON), mantendo retrocompatibilidade com o valor antigo.
- No `useEffect` de sync (Financeiro.tsx 180-229): iterar por todas as contas configuradas, somar `spend` de todas e gravar o total em `monthly_data.trafego`.
- Permitir sync **retroativo dos últimos 3 meses** (não só do mês atual), para corrigir Abril automaticamente sem precisar editar manual. Roda 1x na montagem + a cada 5 min só para o mês corrente.
- Adicionar UI simples no topo do Financeiro: campo "Contas de anúncio Meta" (lista de IDs separados por vírgula, com botão Salvar). Mostra também um indicador "Sincronizando X contas…".

### B) Card "Webhooks de Faturamento" no Financeiro

Logo abaixo dos cards de resumo, adicionar um novo bloco mostrando, para o mês/intervalo selecionado, **quais sources de webhook contribuíram para o faturamento**:

```text
┌──────────────────────────────────────────────────┐
│  Webhooks de Faturamento — Abr/26                │
├──────────────────────────────────────────────────┤
│  PAGTRUST      210 vendas   R$ 3.798,94   38%    │
│  PAGTRUST_2    314 vendas   R$ 6.287,70   62%    │
│  HOTMART         0 vendas         —        —     │
│  KIWIFY          0 vendas         —        —     │
├──────────────────────────────────────────────────┤
│  Total bruto consolidado     R$ 10.086,64        │
└──────────────────────────────────────────────────┘
```

Fonte: `SELECT source, COUNT(*), SUM(value) FROM sales_events WHERE created_at BETWEEN ...`. Respeita o filtro de mês/período já existente na página.

Isso te deixa enxergar imediatamente:
- que a 3ª conta PagTrust **ainda não está enviando webhook** (vai aparecer com 0);
- quanto cada conta contribuiu antes de você desativar a antiga.

### C) Pequeno ajuste no consolidador

O `monthly_data.faturamento` de Abril hoje é R$ 18.260,59, mas a soma bruta dos webhooks PagTrust é R$ 10.086,64. A diferença é faturamento manual / Hotmart / Kiwify acumulado. Vou adicionar uma linha "Outros (manual / sem webhook)" no card para deixar essa diferença explícita, evitando confusão quando você comparar os números.

## Arquivos afetados

- `src/pages/Financeiro.tsx` — multi-conta Meta + UI de configuração + montagem do novo card.
- `src/components/dashboard/WebhookSourcesCard.tsx` (novo) — card de breakdown por source.
- `src/lib/metaApi.ts` — sem mudança de assinatura (já aceita `adAccountId` por chamada); apenas será chamado N vezes.

## O que NÃO faço agora

- Não conecto a 3ª conta PagTrust como webhook — isso depende de você cadastrar a URL `…/pagtrust-webhook` (ou um novo `pagtrust-webhook-3`) no painel daquela conta. Se quiser, no próximo passo eu crio a função `pagtrust-webhook-3` idêntica às outras duas e te entrego a URL.
- Não removo a função `pagtrust-webhook` (a que você vai desativar) — ela continua viva até você confirmar que migrou tudo.
