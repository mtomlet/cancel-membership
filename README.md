# Cancel Membership - Email Setup

## Quick Start (No Email Setup - Testing Only)

```bash
npm install
npm start
```

This will run on port 3000 and **log emails to console** instead of sending them. Good for local testing.

---

## Email Setup Options

### Option 1: SendGrid (Recommended - Free)

**Why:** Industry standard, 100 emails/day free forever

**Setup (2 minutes):**
1. Go to [sendgrid.com/free](https://sendgrid.com/free)
2. Sign up (free account)
3. Go to Settings → API Keys → Create API Key
4. Copy the key
5. Create `.env` file:
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@keepitcut.com
PORT=3015
```
6. Restart server: `npm start`

**Verify:** Email will be sent to `info@keepitcut.com`

---

### Option 2: Webhook (Zero Email Setup)

Use a webhook service to forward to email.

**Setup with Zapier (Free - 5 min):**
1. Go to [zapier.com](https://zapier.com) → Sign up free
2. Create new Zap:
   - Trigger: Webhooks → Catch Hook
   - Action: Gmail → Send Email
3. Copy webhook URL
4. Add to `.env`:
```bash
WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/
PORT=3015
```
5. Test: POST to `/cancel` → Email arrives at info@keepitcut.com

---

### Option 3: Make.com (Easiest - Visual)

**Setup (3 min):**
1. Go to [make.com](https://www.make.com) → Free account
2. Create new scenario:
   - Webhook → Custom webhook
   - Email → Send an email
3. Map fields: `data.name`, `data.email`, `data.reason`
4. Set To: `info@keepitcut.com`
5. Copy webhook URL to `.env`:
```bash
WEBHOOK_URL=https://hook.us1.make.com/xxxxxxxxxxxxx
PORT=3015
```

---

## Testing Locally

```bash
# Install dependencies
npm install

# Run server (logs to console)
npm start

# Test with curl
curl -X POST http://localhost:3015/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "555-1234",
    "email": "john@example.com",
    "reason": "Moving out of state",
    "renewal_date": "2025-01-15"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cancellation request received. Please allow up to 2 business days for a response and refund if necessary.",
  "renewal_date": "2025-01-15",
  "notification_method": "sendgrid"
}
```

---

## Retell AI Integration

**Custom Function JSON:**
```json
{
  "name": "cancel_membership",
  "description": "Cancel a customer's membership. Collects their information and sends cancellation request to info@keepitcut.com. Customer can continue using membership until renewal date.",
  "url": "https://your-deployment-url.com/cancel",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameters": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Customer's full name"
      },
      "phone": {
        "type": "string",
        "description": "Customer's phone number"
      },
      "email": {
        "type": "string",
        "description": "Customer's email address"
      },
      "reason": {
        "type": "string",
        "description": "Reason for cancelling membership"
      },
      "renewal_date": {
        "type": "string",
        "description": "Membership renewal date if known (format: YYYY-MM-DD)"
      }
    },
    "required": ["name", "phone", "email"]
  }
}
```

**Agent Prompt Addition:**
```
=== CANCEL MEMBERSHIP ===

When a customer wants to cancel their membership:

1. Collect required information:
   - Full name
   - Phone number
   - Email address
   - Reason for cancelling (ask: "May I ask why you'd like to cancel?")

2. Call cancel_membership() with all collected information

3. After successful submission, tell them:
   "Your cancellation request has been submitted to our team. Please allow up to 2 business days for a response and refund if necessary. You can continue using your membership until {renewal_date if known, otherwise 'the end of your current billing period'}."

4. Ask: "Is there anything else I can help you with today?"
```

---

## Deployment to Modal

See `deploy.py` for Modal deployment configuration.

---

## Email Format

Email sent to `info@keepitcut.com`:

**Subject:** Membership Cancellation Request - [Customer Name]

**Body:**
```
Membership Cancellation Request

Name: John Doe
Phone: 555-1234
Email: john@example.com
Reason: Moving out of state
Membership Renewal Date: 2025-01-15

---
Sent from Keep It Cut AI Voice Agent
```
