import { Consultation } from "@/types/consultation";

/**
 * Taxa da PagTrust aplicada sobre o valor bruto do ticket.
 * Ex.: ticket de R$ 997 → líquido de ~R$ 935 (taxa de 6,22%).
 * Aplicada a TODOS os produtos para refletir o valor que efetivamente cai.
 */
export const PAGTRUST_FEE_RATE = 0.0622;
export const PAGTRUST_NET_FACTOR = 1 - PAGTRUST_FEE_RATE; // 0.9378

/** Aplica a taxa da PagTrust e retorna o valor líquido. */
export function applyPagtrustFee(gross: number): number {
    return Math.round(gross * PAGTRUST_NET_FACTOR);
}

/**
 * Valor LÍQUIDO contado para a meta de faturamento (já descontada a taxa PagTrust).
 * Regra boleto: apenas a entrada de R$ 97 é considerada (também líquida).
 * Se deu sinal e o resíduo ainda não foi pago, conta apenas o sinal (líquido).
 */
export function getMetaValue(c: Consultation): number {
    if (c.paymentMethod === "boleto") {
        // Boleto: valor fixo de R$ 97 sem desconto de taxa
        return 97;
    }

    let gross = 0;
    if (c.gaveSignal && !c.signalResiduePaid) {
        gross = c.signalValue || 0;
    } else {
        gross = c.ticketValue || 0;
    }

    return applyPagtrustFee(gross);
}
