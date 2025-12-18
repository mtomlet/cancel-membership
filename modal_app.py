"""
Cancel Membership - Modal Serverless Deployment
Sends cancellation requests to techtomlet@gmail.com for TESTING
"""

import modal
import os

app = modal.App("cancel-membership")

gmail_secret = modal.Secret.from_name("gmail-credentials")

image = modal.Image.debian_slim().pip_install("fastapi")


@app.function(image=image, secrets=[gmail_secret])
@modal.fastapi_endpoint(method="POST")
def cancel(request: dict):
    """
    Endpoint for membership cancellation requests.
    Sends email to techtomlet@gmail.com for TESTING.
    """
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    # Validate required fields
    name = request.get("name")
    phone = request.get("phone")
    email = request.get("email")
    reason = request.get("reason", "Not provided")
    renewal_date = request.get("renewal_date", "Unknown")

    if not name or not phone or not email:
        return {
            "success": False,
            "error": "Missing required fields: name, phone, email"
        }

    # Gmail credentials from Modal secret
    gmail_address = os.environ["GMAIL_ADDRESS"]
    gmail_password = os.environ["GMAIL_APP_PASSWORD"]

    # Email content
    html_content = f"""
    <h2>Membership Cancellation Request</h2>
    <p><strong>Name:</strong> {name}</p>
    <p><strong>Phone:</strong> {phone}</p>
    <p><strong>Email:</strong> {email}</p>
    <p><strong>Reason:</strong> {reason}</p>
    <p><strong>Membership Renewal Date:</strong> {renewal_date}</p>
    <hr>
    <p><em>Sent from Keep It Cut AI Voice Agent</em></p>
    """

    # Create email
    msg = MIMEMultipart()
    msg["From"] = f"Keep It Cut Voice Agent <{gmail_address}>"
    msg["To"] = "techtomlet@gmail.com"  # TESTING - change to info@keepitcut.com for production
    msg["Subject"] = f"Membership Cancellation Request - {name}"
    msg.attach(MIMEText(html_content, "html"))

    try:
        # Send via Gmail SMTP
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_address, gmail_password)
            server.sendmail(gmail_address, "techtomlet@gmail.com", msg.as_string())

        return {
            "success": True,
            "message": "Cancellation request received. Please allow up to 2 business days for a response and refund if necessary.",
            "renewal_date": renewal_date if renewal_date != "Unknown" else None
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "cancel-membership"}
