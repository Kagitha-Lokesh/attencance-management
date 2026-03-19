const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const oauth2Client = new google.auth.OAuth2();

app.post('/send-email', async (req, res) => {
  const { accessToken, to, subject, body } = req.body;
  console.log("TOKEN RECEIVED:", accessToken);

  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const message = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body,
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Gmail API Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));