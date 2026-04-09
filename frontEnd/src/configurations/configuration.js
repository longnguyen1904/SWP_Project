export const OAuthConfig = {
  clientId: "717141299175-t9nip96r7esj02q394h1s31o9rr6armd.apps.googleusercontent.com",
  redirectUri: `${window.location.origin}/authenticate`,
  authUri: "https://accounts.google.com/o/oauth2/v2/auth",
};

export const APIConfig = {
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
};
