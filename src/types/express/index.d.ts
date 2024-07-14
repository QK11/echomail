import type { Session } from "express-session";

export {};

type SessionData = {
  pkceCodes: {
    verifier: string;
  };
  tokenCache: string;
  idToken: string;
  accessToken: string;
  account: ?{
    homeAccountId: string;
    environment: string;
    tenantId: string;
    username: string;
    localAccountId: string;
    name: string;
    authorityType: string;
    tenantProfiles: {};
    idTokenClaims: {
      aud: string;
      iss: string;
      iat: number;
      nbf: number;
      exp: number;
      name: string;
      oid: string;
      preferred_username: string;
      rh: string;
      sub: string;
      tid: string;
      uti: string;
      ver: string;
    };
    idToken: string;
  };
};

declare global {
  namespace Express {
    interface Request {
      session: Session & Partial<SessionData>;
    }
  }
}
