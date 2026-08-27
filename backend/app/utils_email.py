"""
Envoi d'emails via SMTP standard (compatible Gmail, Outlook, Brevo, etc.).
Ne dépend d'aucun service tiers payant : chaque déploiement configure ses propres
identifiants SMTP dans les variables d'environnement (voir .env.example).
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from .config import settings


class EmailNotConfiguredError(Exception):
    """Levée quand aucun serveur SMTP n'est configuré côté serveur."""
    pass


def send_email(to_email: str, subject: str, html_body: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD or not settings.SMTP_FROM_EMAIL:
        raise EmailNotConfiguredError(
            "L'envoi d'emails n'est pas configuré sur ce serveur (variables SMTP_* manquantes)."
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())


def send_password_reset_email(to_email: str, admin_name: str, reset_link: str) -> None:
    subject = "Réinitialisation de votre mot de passe — Pop's FOOD BENIN"
    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #241F1C;">
        <h2 style="color: #E4241B;">Réinitialisation de mot de passe</h2>
        <p>Bonjour {admin_name},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe administrateur pour Pop's FOOD BENIN.</p>
        <p>
            <a href="{reset_link}"
               style="display: inline-block; background: #E4241B; color: white; padding: 12px 24px;
                      border-radius: 999px; text-decoration: none; font-weight: bold;">
                Réinitialiser mon mot de passe
            </a>
        </p>
        <p style="font-size: 13px; color: #666;">
            Ce lien expire dans {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes.
            Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email —
            votre mot de passe actuel restera inchangé.
        </p>
    </div>
    """
    send_email(to_email, subject, html_body)