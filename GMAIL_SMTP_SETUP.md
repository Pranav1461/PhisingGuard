# Gmail SMTP Setup for PhishGuard Email Simulator

This guide explains how to configure Gmail SMTP to send **real phishing simulation emails** from your PhishGuard application.

## Prerequisites
- A Gmail account (your personal or test Gmail)
- Google Account access

---

## Step 1: Enable 2-Step Verification

Google requires 2-Step Verification before you can create App Passwords.

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Under "How you sign in to Google", click **2-Step Verification**
3. Follow the prompts to enable it (you'll need your phone)

---

## Step 2: Generate Gmail App Password

**App Passwords** let applications access your Gmail without your actual password.

1. Visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Or: Google Account → Security → 2-Step Verification → App passwords (at bottom)

2. **App name**: Type `PhishGuard Simulator` (or any name you'll remember)

3. Click **Create**

4. Google will show you a **16-character password** like: `abcd efgh ijkl mnop`

5. **COPY THIS PASSWORD** — you'll only see it once!

---

## Step 3: Configure PhishGuard `.env`

Open your `.env` file in the PhishGuard project root and update these lines:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USER=your-actual-gmail@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SIMULATOR_SENDER_EMAIL=PhishGuard Security <your-actual-gmail@gmail.com>
SIMULATOR_FRONTEND_URL=https://phising-guard-beta.vercel.app
```

**Replace**:
- `your-actual-gmail@gmail.com` → Your actual Gmail address
- `abcdefghijklmnop` → The 16-character App Password (remove spaces!)

**Example**:
```env
SMTP_USER=pranav.testing@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SIMULATOR_SENDER_EMAIL=PhishGuard Security <pranav.testing@gmail.com>
```

---

## Step 4: Test the Configuration

### Backend Test
1. Start your FastAPI backend:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Open the API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

3. Find the `/simulator/send-email` endpoint

4. Click **"Try it out"** and test with:
   ```json
   {
     "target_email": "your-test-email@gmail.com",
     "template_id": "nordvault-security"
   }
   ```

5. Check your test inbox for the phishing simulation email!

### Frontend Test
1. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open [http://localhost:5173/simulator](http://localhost:5173/simulator)

3. Go to **"Dispatch Email"** tab

4. Enter your test email and click **"Launch Simulation"**

5. Check your inbox!

---

## Step 5: How the Real-Time Flow Works

Once SMTP is configured, here's what happens:

1. **You dispatch** an email via the PhishGuard simulator
2. **Real email arrives** in the target's Gmail inbox with:
   - ⚠️ Red warning banner: "DO NOT CLICK - EDUCATIONAL TEST"
   - Realistic phishing lure (fake security alert)
   - Unique tracking link with session_id
3. **Target clicks** the link → opens your fake login page
4. **Target enters credentials** → captured in real-time
5. **Your dashboard** shows:
   - Username entered
   - Password length
   - Timestamp
   - Session status: "submitted"

---

## Troubleshooting

### Error: "Application-specific password required"
→ You need to create an App Password (Step 2)

### Error: "Username and Password not accepted"
→ Check your `SMTP_USER` and `SMTP_PASSWORD` in `.env`
→ Make sure you removed spaces from the App Password

### Error: "Connection timeout"
→ Check your firewall/antivirus isn't blocking port 587
→ Try using port 465 with `SMTP_USE_TLS=false` and SSL

### Emails going to Spam
→ This is expected for phishing simulations
→ Tell your test recipients to check their Spam folder

---

## Security Notes

⚠️ **IMPORTANT**:
- **Never commit** your `.env` file to Git (already in `.gitignore`)
- **Use a test Gmail** account, not your personal one
- The App Password only works for this app, not full Gmail access
- You can revoke the App Password anytime in Google Account settings

---

## Alternative: Resend API

If you don't want to use Gmail, you can use Resend (email API service):

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Update `.env`:
   ```env
   RESEND_API_KEY=re_your_resend_api_key_here
   SIMULATOR_SENDER_EMAIL=PhishGuard Security <onboarding@resend.dev>
   ```

---

## Next Steps

Once SMTP is working:
- Test with your own dummy Gmail accounts
- Watch the **Live Monitor** tab for real-time credential capture
- Review the **Session History** to see who clicked and submitted
- Use this for your CEP project demonstration

**Educational Purpose**: This simulator is for cybersecurity awareness training only. Always include clear disclaimers in emails.
