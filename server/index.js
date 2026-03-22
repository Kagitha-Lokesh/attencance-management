const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const admin = require("firebase-admin");
const crypto = require("crypto");

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require("./serviceAccount.json");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        ...serviceAccount,
        private_key: serviceAccount.private_key.replace(/\\n/g, '\n')
      })
    });
  }
} catch (err) {
  console.error("FIREBASE ADMIN ERROR:", err.message);
  console.error("Backend functionality will be limited.");
}

const db = admin.apps.length ? admin.firestore() : null;


// Encryption Setup
const SECRET = process.env.TOKEN_SECRET || "default_secret_32_chars_long_12345";
const ALGORITHM = 'aes-256-ctr';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, crypto.createHash('sha256').update(SECRET).digest(), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, crypto.createHash('sha256').update(SECRET).digest(), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
}

// Rate Limiting Setup
const requestMap = {};
function rateLimit(uid) {
  const now = Date.now();
  if (!requestMap[uid]) requestMap[uid] = [];
  // Filter requests from the last 60 seconds
  requestMap[uid] = requestMap[uid].filter(t => now - t < 60000);
  if (requestMap[uid].length >= 10) return false; // Max 10 emails per minute
  requestMap[uid].push(now);
  return true;
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI || "http://localhost:3001/auth/google/callback"
);

// Middleware to verify Firebase ID Token
async function verifyUser(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  if (!admin.apps.length) {
    return res.status(503).json({ error: "Backend unconfigured (Service Account missing)" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth Error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}


// Health Check
app.get('/health', (req, res) => {
  res.json({ status: "OK", time: new Date() });
});

// STEP 1 — Generate Consent URL
app.post('/auth/google', verifyUser, (req, res) => {
  const uid = req.user.uid;
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email'],
    prompt: 'consent',
    state: uid
  });

  res.json({ url });
});

// STEP 2 — Handle callback
app.get('/auth/google/callback', async (req, res) => {
  const { code, state: uid } = req.query;

  if (!uid) return res.status(400).send("State (UID) missing");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const { refresh_token } = tokens;

    if (refresh_token) {
      // Save ENCRYPTED refresh token to Firestore
      await db.collection('users').doc(uid).set({
        refreshToken: encrypt(refresh_token),
        updatedAt: new Date()
      }, { merge: true });
      
      console.log(`Saved encrypted refresh token for user: ${uid}`);
    }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/settings?connected=true`);
  } catch (err) {
    console.error("Error getting tokens:", err);
    res.status(500).send("Authentication failed");
  }
});

// STEP 3 — Send email using decrypted refreshToken
app.post('/send-email', verifyUser, async (req, res) => {
  const uid = req.user.uid;
  const { to, subject, body } = req.body;

  // 1. Rate Limiting
  if (!rateLimit(uid)) {
    return res.status(429).json({ error: "TOO_MANY_REQUESTS" });
  }

  try {
    // 2. Get refreshToken from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    const encryptedToken = userDoc.data()?.refreshToken;

    if (!encryptedToken) {
      return res.status(400).json({ error: "GMAIL_NOT_CONNECTED" });
    }

    // 3. Decrypt and Set Credentials
    const refreshToken = decrypt(encryptedToken);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 4. Prepare Message
    const message = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body,
    ].join('\n');

    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    // 5. Send Email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    console.log("EMAIL SENT:", { uid, to, time: new Date() });
    res.json({ success: true });

  } catch (err) {
    console.error("GMAIL ERROR:", err);

    // 6. Handle Revoked/Invalid Tokens
    if (err.code === 401 || err.message?.includes("invalid_grant")) {
      return res.status(401).json({ error: "GMAIL_RECONNECT_REQUIRED" });
    }

    res.status(500).json({ error: err.message });
  }
});

// Disconnect Gmail
app.post('/disconnect-gmail', verifyUser, async (req, res) => {
  const uid = req.user.uid;

  try {
    await db.collection('users').doc(uid).update({
      refreshToken: admin.firestore.FieldValue.delete()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));