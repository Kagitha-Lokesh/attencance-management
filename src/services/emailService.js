export async function sendAttendanceEmail(settings, type, userName, accessToken) {
  console.log("SENDING EMAIL WITH TOKEN:", accessToken);
  if (!accessToken) {
    console.error("ERROR: No accessToken provided to sendAttendanceEmail!");
    throw new Error("You must be logged in with Google to send emails.");
  }
  const now = new Date();

  const vars = {
    '{{name}}': userName,
    '{{date}}': now.toLocaleDateString('en-IN'),
    '{{time}}': type === 'login' ? (settings?.timeConfig?.loginTime || '--:--') : (settings?.timeConfig?.logoutTime || '--:--'),
    '{{day}}': now.toLocaleDateString('en-IN', { weekday: 'long' }),
  };

  const cfg = type === 'login' ? settings.loginEmail : settings.logoutEmail;

  let body = cfg.body;
  let subject = cfg.subject;

  Object.entries(vars).forEach(([k, v]) => {
    body = body.replaceAll(k, v);
    subject = subject.replaceAll(k, v);
  });

  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken,
      to: cfg.recipients,
      subject,
      body,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to send email');
  }

  return res.json();
}
