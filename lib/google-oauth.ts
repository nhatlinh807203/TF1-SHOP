import { OAuth2Client } from "google-auth-library";

export function getGoogleOAuthConfig() {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  const callbackUrl = process.env.AUTH_GOOGLE_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error(
      "AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, and AUTH_GOOGLE_CALLBACK_URL must be configured.",
    );
  }

  return {
    clientId,
    callbackUrl,
    client: new OAuth2Client(clientId, clientSecret, callbackUrl),
  };
}

export const GOOGLE_STATE_COOKIE = "tf1shop_google_state";
export const GOOGLE_NONCE_COOKIE = "tf1shop_google_nonce";
