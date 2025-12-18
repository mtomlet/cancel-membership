const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// === CONFIGURATION ===
const CONFIG = {
  TO_EMAIL: 'techtomlet@gmail.com',  // TESTING - change to info@keepitcut.com for production
  FROM_EMAIL: 'techtomlet@gmail.com',
  GMAIL_ADDRESS: 'techtomlet@gmail.com',
  GMAIL_APP_PASSWORD: 'ewjutsyubhzxfkox',
};

/**
 * Send email via Gmail SMTP
 */
async function sendEmailViaGmail(emailData) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: CONFIG.GMAIL_ADDRESS,
      pass: CONFIG.GMAIL_APP_PASSWORD
    }
  });

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
    const { name, phone, email, reason, renewal_date } = req.body;

    if (!name || !phone || !email) {
      return res.json({
        success: false,
        error: 'Missing required fields: name, phone, email'
      });
    }

    console.log(`Processing cancellation for ${name} (${email})`);

    await sendEmailViaGmail({ name, phone, email, reason, renewal_date });

    res.json({
      success: true,
      message: 'Cancellation request received. Please allow up to 2 business days for a response and refund if necessary.',
      renewal_date: renewal_date || null
    });

  } catch (error) {
    console.error('Cancel membership error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// === HEALTH CHECK ===
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'cancel-membership'
}));

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Cancel membership server running on port ${PORT}`);
});
