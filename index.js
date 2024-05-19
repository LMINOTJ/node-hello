const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const directTransport = require('nodemailer-direct-transport');
const os = require('os');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// const fromHost = "idx-dropletapp-09325681203.cluster-wxkvpdxct5e4sxx4nbgdioeb46.cloudworkstations.dev";
// const from = 'mail' + '@' + fromHost;

const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDirectoryExists('sent');
ensureDirectoryExists('failed');

const logEmailResult = (directory, filename, data) => {
  const filePath = path.join(directory, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

app.post('/send-email', (req, res) => {
  const { to, subject, html, fromName, fromHost } = req.body;

  if (!to || !subject || !html || !fromName || !fromHost ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transport = nodemailer.createTransport(directTransport({
    name: fromHost
  }));

  const mailOptions = {
    from: `${fromName} <info@${fromHost}>`,
    to,
    subject,
    html
  };

  transport.sendMail(mailOptions, (err, info) => {
    const timestamp = new Date().toISOString();
    const filename = `${timestamp}-${to}.json`;

    if (err) {
      logEmailResult('failed', filename, { to, subject, fromName, error: err });
      return res.status(500).json({ error: 'Failed to send email', details: err });
    }

    logEmailResult('sent', filename, { to, subject, fromName, info });
    res.json({ message: 'Email sent successfully', info });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
