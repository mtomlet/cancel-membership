const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// === CONFIGURATION ===
const CONFIG = {
  TO_EMAIL: 'info@keepitcut.com',
  FROM_EMAIL: process.env.GMAIL_ADDRESS || 'kramtelmot@gmail.com',
  GMAIL_ADDRESS: process.env.GMAIL_ADDRESS || 'kramtelmot@gmail.com',
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
};

/**
 * Send email via Gmail SMTP
 */
async function sendEmailViaGmail(emailData) {
  if (!CONFIG.GMAIL_APP_PASSWORD) {
    console.log('⚠️  No Gmail credentials - email would have been sent:');
    console.log(JSON.stringify(emailData, null, 2));
    return { method: 'console_log', success: true };
  }

  // Create Gmail transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: CONFIG.GMAIL_ADDRESS,
      pass: CONFIG.GMAIL_APP_PASSWORD
    }
  });

  // Email HTML content
  const htmlContent = `
    <h2>Membership Cancellation Request</h2>
    <p><strong>Name:</strong> ${emailData.name}</p>
    <p><strong>Phone:</strong> ${emailData.phone}</p>
    <p><strong>Email:</strong> ${emailData.email}</p>
    <p><strong>Reason:</strong> ${emailData.reason || 'Not provided'}</p>
    <p><strong>Membership Renewal Date:</strong> ${emailData.renewal_date || 'Unknown'}</p>
    <hr>
    <p><em>Sent from Keep It Cut AI Voice Agent</em></p>
  `;

  // Send email
  await transporter.sendMail({
    from: `Keep It Cut Voice Agent <${CONFIG.FROM_EMAIL}>`,
    to: CONFIG.TO_EMAIL,
    subject: `Membership Cancellation Request - ${emailData.name}`,
    html: htmlContent
  });

  return { method: 'gmail_smtp', success: true };
}

// === MAIN ENDPOINT ===
app.post('/cancel', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      reason,
      renewal_date  // Optional - membership renewal date if known
    } = req.body;

    // Validate required fields
    if (!name || !phone || !email) {
      return res.json({
        success: false,
        error: 'Missing required fields: name, phone, email'
      });
    }

    console.log(`Processing cancellation for ${name} (${email})`);

    const emailData = {
      name,
      phone,
      email,
      reason: reason || 'Not provided',
      renewal_date: renewal_date || 'Unknown'
    };

    // Send email via Gmail SMTP
    const result = await sendEmailViaGmail(emailData);

    // Success response to Retell AI
    res.json({
      success: true,
      message: 'Cancellation request received. Please allow up to 2 business days for a response and refund if necessary.',
      renewal_date: renewal_date || null,
      notification_method: result.method
    });

  } catch (error) {
    console.error('Cancel membership error:', error);
    res.json({
      success: false,
      error: error.response?.data?.errors?.[0]?.message || error.message
    });
  }
});

// === HEALTH CHECK ===
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'cancel-membership',
  email_configured: !!CONFIG.GMAIL_APP_PASSWORD,
  from_email: CONFIG.FROM_EMAIL,
  to_email: CONFIG.TO_EMAIL
}));

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Cancel membership server running on port ${PORT}`);
  console.log(`From: ${CONFIG.FROM_EMAIL}`);
  console.log(`To: ${CONFIG.TO_EMAIL}`);
  console.log(`Email: ${CONFIG.GMAIL_APP_PASSWORD ? '✅ Configured' : '⚠️  Console log only'}`);
});
