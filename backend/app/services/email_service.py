import resend
from app.core.config import settings

class EmailService:
    def __init__(self):
        self.is_configured = bool(settings.RESEND_API_KEY)
        if self.is_configured:
            resend.api_key = settings.RESEND_API_KEY

    def send_supplier_followup(self, to_email: str, subject: str, body: str) -> bool:
        """
        Send a follow-up email to a supplier regarding ITC mismatches.
        If RESEND_API_KEY is not configured, logs to stdout (Demo Mode).
        """
        if not self.is_configured:
            print(f"--- DEMO MODE: Email to {to_email} ---")
            print(f"Subject: {subject}")
            print(f"Body: {body[:100]}...")
            print("---------------------------------------")
            return True
            
        try:
            params = {
                "from": "Kredge Reports <reports@kredge.in>",
                "to": [to_email],
                "subject": subject,
                "html": body,
            }
            
            response = resend.Emails.send(params)
            print(f"Email sent via Resend API: {response}")
            return True
            
        except Exception as e:
            print(f"Failed to send email via Resend: {str(e)}")
            return False

email_service = EmailService()
