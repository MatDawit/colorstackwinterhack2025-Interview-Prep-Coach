import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../db_connection";
import { Strategy as GitHubStrategy, Profile as GitHubProfile} from "passport-github2";

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!, // should match your Google Console redirect URI
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google account has no email"), undefined);
          }

          // Upsert user by googleId first, or by email if you want to link accounts
          const googleId = profile.id;

          const user = await prisma.user.upsert({
            where: { email },
            update: {
              googleId,
              name: profile.displayName ?? undefined,
            },
            create: {
              email,
              googleId,
              name: profile.displayName ?? "",
            },
          });

          return done(null, user);
        } catch (err) {
          return done(err as any, undefined);
        }
      }
    )
  );
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: process.env.GITHUB_CALLBACK_URL!, // must match GitHub OAuth App callback
        scope: ["user:email"],
      },
      async (_accessToken: string, _refreshToken: string, profile: GitHubProfile, done: any) => {
        try {
          // GitHub may not return email unless:
          // - user has public email OR
          // - you request user:email scope (we did)
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error("GitHub account has no accessible email"), undefined);
          }

          const githubId = profile.id;
          const githubLogin = profile.username;

          // Link by email (recommended) so a user can login via Google OR GitHub
          const user = await prisma.user.upsert({
            where: { email },
            update: {
              githubId,
              githubLogin,
              name: profile.displayName ?? undefined,
            },
            create: {
              email,
              githubId,
              githubLogin,
              name: profile.displayName ?? profile.username ?? "",
            },
          });

          return done(null, user);
        } catch (err) {
          return done(err as any, undefined);
        }
      }
    )
  );
  
}
