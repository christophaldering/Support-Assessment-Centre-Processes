// SendGrid integration for transactional emails
import sgMail from '@sendgrid/mail';

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken,
      },
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }

  return { apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email };
}

async function getSendGridClient() {
  const { apiKey, email } = await getCredentials();
  sgMail.setApiKey(apiKey);
  return { client: sgMail, fromEmail: email };
}

export async function sendAccessApprovedEmail(
  toEmail: string,
  userName: string,
  workspaceName: string,
  workspaceSlug: string,
  baseUrl: string
) {
  const { client, fromEmail } = await getSendGridClient();
  const loginUrl = `${baseUrl}/w/${workspaceSlug}/login`;

  await client.send({
    to: toEmail,
    from: fromEmail,
    subject: `Zugang genehmigt – ${workspaceName}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a1a;">
        <div style="background-color: #0f172a; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">
            Executive Diagnostics Suite
          </h2>
        </div>
        <div style="padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 15px; line-height: 1.6;">
            Guten Tag ${userName},
          </p>
          <p style="font-size: 15px; line-height: 1.6;">
            Ihr Zugang zum Workspace <strong>${workspaceName}</strong> wurde genehmigt.
          </p>
          <p style="font-size: 15px; line-height: 1.6;">
            Sie können sich jetzt über die <strong>Erstanmeldung</strong> registrieren und Ihr persönliches Passwort festlegen:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${loginUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Zur Erstanmeldung
            </a>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Wählen Sie auf der Anmeldeseite den Tab „Erstanmeldung" und geben Sie Ihre E-Mail-Adresse ein, um Ihr Konto zu aktivieren.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">
            Diese E-Mail wurde automatisch versendet. Bei Fragen wenden Sie sich bitte an den Workspace-Administrator.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendDataRoomMagicLinkEmail(
  toEmail: string,
  recipientName: string,
  magicLinkUrl: string,
  expiresAt: Date,
  dataRoomSlug: string
) {
  const { client, fromEmail } = await getSendGridClient();

  const expiryFormatted = expiresAt.toLocaleString("de-DE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  });

  await client.send({
    to: toEmail,
    from: fromEmail,
    subject: `Ihr persönlicher Zugang zum Datenraum – ${dataRoomSlug}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 540px; margin: 0 auto; color: #1a1a1a; background: #ffffff;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #A6473B 0%, #5F1A11 100%); padding: 28px 32px; border-radius: 12px 12px 0 0;">
          <p style="color: rgba(255,255,255,0.7); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 6px; font-weight: 700;">
            Executive Diagnostics Suite
          </p>
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; line-height: 1.3;">
            Ihr Datenraum-Zugang
          </h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
            Guten Tag ${recipientName},
          </p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
            Sie wurden eingeladen, auf den Datenraum <strong style="color: #A6473B;">${dataRoomSlug}</strong> zuzugreifen.
            Mit dem folgenden Link gelangen Sie direkt hinein — ohne Passwort.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${magicLinkUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #A6473B 0%, #5F1A11 100%); color: #ffffff;
                      text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 700;
                      letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(166,71,59,0.35);">
              Jetzt Datenraum öffnen →
            </a>
          </div>

          <!-- Expiry info -->
          <div style="background: #fff8f7; border: 1px solid #fde8e6; border-radius: 8px; padding: 14px 16px; margin: 0 0 24px;">
            <p style="font-size: 13px; color: #5F1A11; margin: 0; font-weight: 600;">
              ⏱ Dieser Link ist gültig bis: ${expiryFormatted} Uhr
            </p>
          </div>

          <!-- Fallback URL -->
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 6px;">
            Falls der Button nicht funktioniert, kopieren Sie bitte diese Adresse in Ihren Browser:
          </p>
          <p style="font-size: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
                     padding: 10px 12px; word-break: break-all; color: #1a2332; margin: 0 0 24px;">
            ${magicLinkUrl}
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 20px;" />

          <!-- GDPR notice -->
          <p style="font-size: 11px; color: #94a3b8; line-height: 1.6; margin: 0;">
            <strong>Datenschutzhinweis:</strong> Diese Einladungsmail wurde auf Ihre E-Mail-Adresse ausgestellt.
            Bitte leiten Sie diesen Link nicht an Dritte weiter. Nach Ablauf des Gültigkeitsdatums ist der Zugang
            automatisch deaktiviert. Bei Fragen wenden Sie sich bitte an den Workspace-Administrator.<br /><br />
            Diese E-Mail wurde automatisch versandt · Executive Diagnostics Suite
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendAccessRejectedEmail(
  toEmail: string,
  userName: string,
  workspaceName: string
) {
  const { client, fromEmail } = await getSendGridClient();

  await client.send({
    to: toEmail,
    from: fromEmail,
    subject: `Zugangsanfrage – ${workspaceName}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a1a;">
        <div style="background-color: #0f172a; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">
            Executive Diagnostics Suite
          </h2>
        </div>
        <div style="padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 15px; line-height: 1.6;">
            Guten Tag ${userName},
          </p>
          <p style="font-size: 15px; line-height: 1.6;">
            Ihre Zugangsanfrage für den Workspace <strong>${workspaceName}</strong> konnte leider nicht genehmigt werden.
          </p>
          <p style="font-size: 15px; line-height: 1.6;">
            Bitte wenden Sie sich bei Fragen direkt an den Workspace-Administrator.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">
            Diese E-Mail wurde automatisch versendet.
          </p>
        </div>
      </div>
    `,
  });
}
