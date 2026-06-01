import { google } from "googleapis";
import { createServer } from "net";
import { execSync } from "child_process";
import * as readline from "readline";
import * as http from "http";
import { randomBytes } from "crypto";

const SCOPES = {
  gmail: ["https://www.googleapis.com/auth/gmail.readonly"],
  calendar: ["https://www.googleapis.com/auth/calendar.readonly"],
};

const REDIRECT_PORT = 3456;
const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/oauth/callback`;

function getClient() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise<{ clientId: string; clientSecret: string }>((resolve) => {
    console.log("\nTo connect Google services, you need OAuth credentials from Google Cloud Console.");
    console.log("Go to: https://console.cloud.google.com/apis/credentials");
    console.log("Create an OAuth 2.0 Client ID (Desktop app type).\n");

    rl.question("Enter your Client ID: ", (clientId) => {
      rl.question("Enter your Client Secret: ", (clientSecret) => {
        rl.close();
        resolve({ clientId: clientId.trim(), clientSecret: clientSecret.trim() });
      });
    });
  });
}

async function getAccessToken(
  clientId: string,
  clientSecret: string,
  scope: string[]
): Promise<string> {
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  const state = randomBytes(16).toString("hex");

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope,
    state,
  });

  console.log(`\nOpening browser for authorization...`);
  try {
    execSync(`open "${authUrl}"`, { stdio: "pipe" });
  } catch {
    console.log(`Open this URL in your browser:\n${authUrl}\n`);
  }

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url!, `http://127.0.0.1:${REDIRECT_PORT}`);
      const receivedState = url.searchParams.get("state");
      const receivedCode = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<h1>Authorization failed</h1><p>${error}</p>`);
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (receivedState !== state) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<h1>State mismatch</h1>`);
        reject(new Error("State mismatch"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<h1>Authorization successful!</h1><p>You can close this tab.</p>`);
      server.close();
      resolve(receivedCode!);
    });

    server.listen(REDIRECT_PORT, "127.0.0.1");
  });

  const { tokens } = await oauth2.getToken(code);
  return tokens.access_token!;
}

function registerCoralSource(name: string, manifestPath: string, envVar: string, token: string) {
  console.log(`\nRegistering ${name} Coral source...`);
  try {
    execSync(`${envVar}=${token} coral source add --file ${manifestPath} 2>&1`, {
      stdio: "inherit",
      shell: true,
    });
    console.log(`✅ ${name} source registered successfully!\n`);
  } catch (err: any) {
    console.error(`Failed to register ${name}: ${err.message}`);
    console.log(`\nYou can try manually:\n  ${envVar}="${token}" coral source add --file ${manifestPath}\n`);
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   CareOps Real Source Setup              ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const { clientId, clientSecret } = await getClient();

  // Gmail
  console.log("\n── Gmail ──");
  const gmailToken = await getAccessToken(clientId, clientSecret, SCOPES.gmail);
  registerCoralSource("gmail", "coral/sources/community/gmail/manifest.yaml", "GMAIL_ACCESS_TOKEN", gmailToken);

  // Calendar
  console.log("\n── Google Calendar ──");
  const calToken = await getAccessToken(clientId, clientSecret, SCOPES.calendar);
  registerCoralSource(
    "google_calendar",
    "coral/sources/community/google_calendar/manifest.yaml",
    "GOOGLE_CALENDAR_ACCESS_TOKEN",
    calToken
  );

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Setup Complete!                        ║");
  console.log("║   Go to /data-import to use real sources ║");
  console.log("╚══════════════════════════════════════════╝");
}

main().catch(console.error);
