// lib/emails/resend.ts
import { Resend } from "resend";

const resend  = new Resend(process.env.RESEND_API_KEY);
const FROM    = "Bettie de Savage Club <onboarding@resend.dev>"; // ← remplacer par ton domaine vérifié
const APP_URL = process.env.NEXTAUTH_URL || "https://savage-club.vercel.app";

// ── Reset password ─────────────────────────────────────────────────────────
export async function sendResetPasswordEmail(email: string, token: string) {
  const resetLink = `${APP_URL}/auth/reset-password/${token}`;

  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: "Réinitialisation de votre mot de passe — Savage Club",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1E0A3C;color:#fff;border-radius:16px;">
        <h1 style="color:#F59E0B;font-size:24px;margin-bottom:4px;">Savage Club</h1>
        <p style="color:#A78BFA;font-size:13px;margin-bottom:28px;">Un message de Bettie 👋</p>

        <p style="color:#fff;font-size:15px;line-height:1.6;margin-bottom:24px;">
          Vous avez demandé à réinitialiser votre mot de passe.<br/>
          Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
        </p>

        <a href="${resetLink}"
          style="display:inline-block;background:#F59E0B;color:#000;font-weight:bold;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px;">
          Réinitialiser mon mot de passe →
        </a>

        <p style="color:#ffffff50;font-size:12px;margin-top:28px;line-height:1.6;">
          Ce lien expire dans <strong style="color:#ffffff80;">1 heure</strong>.<br/>
          Si vous n'avez pas fait cette demande, ignorez cet email — votre compte est en sécurité.
        </p>

        <div style="border-top:1px solid #ffffff15;margin-top:28px;padding-top:16px;">
          <p style="color:#ffffff30;font-size:11px;margin:0;">
            © Savage Club · Vous recevez cet email car vous avez un compte sur savage-club.vercel.app
          </p>
        </div>
      </div>
    `,
  });
}

// ── Confirmation de réservation ────────────────────────────────────────────
export async function sendBookingConfirmationEmail(
  email: string,
  recipientName: string,
  creatorName: string,
  date: string,
  type: "AUDIO_CALL" | "VIDEO_CALL"
) {
  const typeLabel = type === "AUDIO_CALL" ? "appel audio 🎙️" : "appel vidéo 📹";

  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: `Votre ${typeLabel} avec ${creatorName} est confirmé — Savage Club`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1E0A3C;color:#fff;border-radius:16px;">
        <h1 style="color:#F59E0B;font-size:24px;margin-bottom:4px;">Savage Club</h1>
        <p style="color:#A78BFA;font-size:13px;margin-bottom:28px;">Bettie vous confirme votre rendez-vous 🎉</p>

        <p style="color:#fff;font-size:15px;line-height:1.6;margin-bottom:16px;">
          Bonjour <strong>${recipientName}</strong>,<br/>
          Votre ${typeLabel} avec <strong style="color:#F59E0B;">${creatorName}</strong> est confirmé !
        </p>

        <div style="background:#2A1356;border:1px solid #ffffff15;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#F59E0B;font-weight:bold;font-size:16px;margin:0 0 4px 0;">📅 ${date}</p>
          <p style="color:#ffffff60;font-size:13px;margin:0;">Vous recevrez un rappel 5 minutes avant l'appel.</p>
        </div>

        <a href="${APP_URL}/parametres?section=reservations"
          style="display:inline-block;background:#F59E0B;color:#000;font-weight:bold;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px;">
          Voir mes réservations →
        </a>

        <p style="color:#ffffff30;font-size:11px;margin-top:28px;">
          © Savage Club · savage-club.vercel.app
        </p>
      </div>
    `,
  });
}

// ── Notification de vérification d'identité ───────────────────────────────
export async function sendIdentityVerifiedEmail(email: string, name: string) {
  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: "Votre identité a été vérifiée ✓ — Savage Club",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1E0A3C;color:#fff;border-radius:16px;">
        <h1 style="color:#F59E0B;font-size:24px;margin-bottom:4px;">Savage Club</h1>
        <p style="color:#A78BFA;font-size:13px;margin-bottom:28px;">Un message de Bettie 🎉</p>

        <p style="color:#fff;font-size:15px;line-height:1.6;margin-bottom:16px;">
          Félicitations <strong>${name}</strong> !<br/>
          Votre identité a été vérifiée par notre équipe. Vos outils créateur sont maintenant débloqués.
        </p>

        <div style="background:#2A1356;border:1px solid #22c55e30;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#22c55e;font-weight:bold;font-size:15px;margin:0;">✓ Compte certifié Savage Club</p>
        </div>

        <a href="${APP_URL}/create"
          style="display:inline-block;background:#F59E0B;color:#000;font-weight:bold;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px;">
          Commencer à publier →
        </a>

        <p style="color:#ffffff30;font-size:11px;margin-top:28px;">
          © Savage Club · savage-club.vercel.app
        </p>
      </div>
    `,
  });
}

// ── Rejet de vérification d'identité ──────────────────────────────────────
export async function sendIdentityRejectedEmail(email: string, name: string, reason: string) {
  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: "Votre demande de vérification — Savage Club",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1E0A3C;color:#fff;border-radius:16px;">
        <h1 style="color:#F59E0B;font-size:24px;margin-bottom:4px;">Savage Club</h1>
        <p style="color:#A78BFA;font-size:13px;margin-bottom:28px;">Un message de Bettie</p>

        <p style="color:#fff;font-size:15px;line-height:1.6;margin-bottom:16px;">
          Bonjour <strong>${name}</strong>,<br/>
          Votre demande de vérification d'identité n'a pas pu être validée.
        </p>

        <div style="background:#2A1356;border:1px solid #ef444430;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#ef4444;font-weight:bold;font-size:13px;margin:0 0 6px 0;">Raison :</p>
          <p style="color:#ffffff80;font-size:14px;margin:0;">${reason}</p>
        </div>

        <a href="${APP_URL}/parametres?section=certification"
          style="display:inline-block;background:#F59E0B;color:#000;font-weight:bold;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px;">
          Soumettre à nouveau →
        </a>

        <p style="color:#ffffff30;font-size:11px;margin-top:28px;">
          © Savage Club · savage-club.vercel.app
        </p>
      </div>
    `,
  });
}

// ── Confirmation de paiement ───────────────────────────────────────────────
export async function sendPaymentConfirmationEmail(
  payerEmail: string,
  payerName: string,
  recipientName: string,
  amount: number,
  type: string
) {
  const typeLabels: Record<string, string> = {
    MESSAGE:        "message privé",
    AUDIO_CALL:     "appel audio",
    VIDEO_CALL:     "appel vidéo",
    CUSTOM_CONTENT: "contenu personnalisé",
  };
  const label = typeLabels[type] ?? "service";

  await resend.emails.send({
    from:    FROM,
    to:      payerEmail,
    subject: `Paiement confirmé — Savage Club`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1E0A3C;color:#fff;border-radius:16px;">
        <h1 style="color:#F59E0B;font-size:24px;margin-bottom:4px;">Savage Club</h1>
        <p style="color:#A78BFA;font-size:13px;margin-bottom:28px;">Bettie confirme votre paiement ✓</p>

        <p style="color:#fff;font-size:15px;line-height:1.6;margin-bottom:16px;">
          Bonjour <strong>${payerName}</strong>,<br/>
          Votre paiement pour un <strong style="color:#F59E0B;">${label}</strong> avec 
          <strong>${recipientName}</strong> a été effectué avec succès.
        </p>

        <div style="background:#2A1356;border:1px solid #ffffff15;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#F59E0B;font-weight:bold;font-size:18px;margin:0;">
            ${amount.toLocaleString("fr-FR")} FCFA
          </p>
          <p style="color:#ffffff60;font-size:13px;margin:4px 0 0 0;">Paiement confirmé</p>
        </div>

        <a href="${APP_URL}/parametres?section=historique"
          style="display:inline-block;background:#F59E0B;color:#000;font-weight:bold;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px;">
          Voir mon historique →
        </a>

        <p style="color:#ffffff30;font-size:11px;margin-top:28px;">
          © Savage Club · savage-club.vercel.app
        </p>
      </div>
    `,
  });
}