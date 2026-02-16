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
