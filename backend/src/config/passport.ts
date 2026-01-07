import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../db_connection";

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
}
