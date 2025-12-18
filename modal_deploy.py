"""
Cancel Membership - Modal Serverless Deployment
Sends cancellation requests to info@keepitcut.com via Gmail SMTP
"""

import modal
import os

app = modal.App("cancel-membership")

# Use same Gmail credentials as your other Modal functions
gmail_secret = modal.Secret.from_name("gmail-credentials")

# Node.js image with dependencies
image = modal.Image.debian_slim().pip_install("fastapi").apt_install("nodejs", "npm").run_commands(
    "npm install -g express nodemailer"
)

@app.function(
    image=image,
    secrets=[gmail_secret],
    scaledown_window=300
)
@modal.concurrent(max_inputs=10)
@modal.fastapi_endpoint(method="POST")
def cancel(request: dict):
    """
    Endpoint for membership cancellation requests.
    Sends email to info@keepitcut.com with customer details.
    """
    import subprocess
    import json

    # Node.js code inline (to avoid file mounting complexity)
    nodejs_code = """
const nodemailer = require('nodemailer');

const payload = JSON.parse(process.argv[1]);
const gmailAddress = process.env.GMAIL_ADDRESS;
const gmailPassword = process.env.GMAIL_APP_PASSWORD;

async function sendEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailAddress,
      pass: gmailPassword
    }
  });

  const htmlContent = `
    <h2>Membership Cancellation Request</h2>
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Phone:</strong> ${payload.phone}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    <p><strong>Reason:</strong> ${payload.reason || 'Not provided'}</p>
    <p><strong>Membership Renewal Date:</strong> ${payload.renewal_date || 'Unknown'}</p>
    <hr>
    <p><em>Sent from Keep It Cut AI Voice Agent</em></p>
  `;

  await transporter.sendMail({
    from: `Keep It Cut Voice Agent <${gmailAddress}>`,
    to: 'info@keepitcut.com',
    subject: `Membership Cancellation Request - ${payload.name}`,
    html: htmlContent
  });

  console.log(JSON.stringify({ success: true }));
}

sendEmail().catch(err => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
"""

    # Write Node.js code to temp file
    with open('/tmp/send_email.js', 'w') as f:
        f.write(nodejs_code)

    # Run Node.js script with payload
    result = subprocess.run(
        ['node', '/tmp/send_email.js', json.dumps(request)],
        capture_output=True,
        text=True,
        env={
            'GMAIL_ADDRESS': os.environ.get('GMAIL_ADDRESS'),
            'GMAIL_APP_PASSWORD': os.environ.get('GMAIL_APP_PASSWORD')
        }
    )

    if result.returncode != 0:
        return {
            "success": False,
            "error": result.stderr or "Failed to send email"
        }

    return {
        "success": True,
        "message": "Cancellation request received. Please allow up to 2 business days for a response and refund if necessary.",
        "renewal_date": request.get("renewal_date")
    }


@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "cancel-membership"}
