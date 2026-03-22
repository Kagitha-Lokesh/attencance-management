import { auth } from '../firebase';
import { API_URL } from '../config';

export async function sendAttendanceEmail(settings, type, userName, userEmail) {
  const now = new Date();
  const idToken = await auth.currentUser?.getIdToken();

  if (!idToken) throw new Error("User NOT authenticated");

  const vars = {
    '{{name}}': userName,
    '{{date}}': now.toLocaleDateString('en-IN'),
    '{{time}}': now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    '{{day}}': now.toLocaleDateString('en-IN', { weekday: 'long' }),
  };

  const cfg = type === 'login' ? settings.loginEmail : settings.logoutEmail;
  // Note: refreshToken is now handled entirely on the backend for security.
  // We just check if the user HAS connected Gmail via the backend.
  const isGmailConnected = !!settings.refreshToken;

  if (!isGmailConnected) {
    console.warn("Gmail not connected. Email skipped.");
    return { success: false, error: "Gmail not connected" };
  }

  let body = cfg.body;
  let subject = cfg.subject;

  Object.entries(vars).forEach(([k, v]) => {
    body = body.replaceAll(k, v);
    subject = subject.replaceAll(k, v);
  });

  const res = await fetch(`${API_URL}/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify({
      to: cfg.recipients,
      subject: subject,
      body: body
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Backend Email Error:", err);

    if (err.error === "GMAIL_RECONNECT_REQUIRED") {
      alert("Gmail connection expired or revoked. Please reconnect in Settings.");
      // Optional: window.location.href = "/settings";
    }

    throw new Error(err.error || "Email send failed");
  }

  return res.json();
}

