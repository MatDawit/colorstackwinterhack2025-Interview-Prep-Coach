/**
 * Passport OAuth strategies
 * Configures Google and GitHub strategies, linking accounts by email where possible.
 */
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../db_connection";
import {
  Strategy as GitHubStrategy,
  Profile as GitHubProfile,
} from "passport-github2";

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google account has no email"), undefined);
          }

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
        callbackURL: process.env.GITHUB_CALLBACK_URL!,
        scope: ["user:email"],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GitHubProfile,
        done: any
      ) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(
              new Error("GitHub account has no accessible email"),
              undefined
            );
          }

          const githubId = profile.id;
          const githubLogin = profile.username;

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
