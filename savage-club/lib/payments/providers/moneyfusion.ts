// lib/payments/providers/moneyfusion.ts
// Basé sur la doc officielle MoneyFusion

const API_URL     = process.env.MONEYFUSION_API_URL!; // depuis votre tableau de bord
const APP_URL     = process.env.NEXTAUTH_URL || "https://savage-club.vercel.app";
const WEBHOOK_URL = `${APP_URL}/api/webhooks/moneyfusion`;

export type MFPaymentResponse = {
  statut:  boolean;
  token:   string;
  message: string;
  url:     string;
};

export type MFStatusResponse = {
  statut: boolean;
  data: {
    _id:               string;
    tokenPay:          string;
    numeroSend:        string;
    nomclient:         string;
    personal_Info:     { paymentId: string; userId: string; type: string }[];
    numeroTransaction: string;
    Montant:           number;
    frais:             number;
    statut:            "pending" | "paid" | "failure" | "no paid";
    moyen:             string;
    return_url:        string;
    createdAt:         string;
  };
  message: string;
};

export type MFWebhookPayload = {
  event:             "payin.session.pending" | "payin.session.completed" | "payin.session.cancelled";
  personal_Info:     { paymentId: string; userId: string; type: string }[];
  tokenPay:          string;
  numeroSend:        string;
  nomclient:         string;
  numeroTransaction: string;
  Montant:           number;
  frais:             number;
  return_url:        string;
  webhook_url:       string;
  createdAt:         string;
};

/**
 * Initier un paiement MoneyFusion
 */
export async function createMFPayment(params: {
  amount:      number;
  phoneNumber: string;
  clientName:  string;
  paymentId:   string;
  userId:      string;
  type:        string;
  returnUrl?:  string;
}): Promise<MFPaymentResponse> {
  const body = {
    totalPrice:   params.amount,
    article:      [{ savage_club: params.amount }], // ← clé différente
    numeroSend:   params.phoneNumber,
    nomclient:    params.clientName,
    personal_Info: [
      {
        paymentId: params.paymentId,
        userId:    params.userId,
        type:      params.type,
      },
    ],
    return_url: `${APP_URL}/payments/confirm`,
  };

  console.log("[MF] Payload envoyé:", JSON.stringify(body));
  const res = await fetch(API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  const text = await res.text(); // ← lire en texte d'abord
  console.log("[MF] Réponse brute:", text);
  
  const data = JSON.parse(text); // ← puis parser
  if (!data.statut) throw new Error(data.message || "Erreur MoneyFusion");
  return data;
}

/**
 * Vérifier le statut d'un paiement par token
 */
export async function checkMFPaymentStatus(token: string): Promise<MFStatusResponse> {
  const res = await fetch(`https://www.pay.moneyfusion.net/paiementNotif/${token}`);
  return res.json();
}
