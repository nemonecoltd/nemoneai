import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email/Password",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const res = await fetch('http://127.0.0.1:8081/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            })
          });

          const user = await res.json();

          if (res.ok && user) {
            return {
              id: user.email,
              email: user.email,
              name: user.name,
              image: user.image_url,
            };
          }
        } catch (e) {
          console.error("Login failed:", e);
        }
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: any, account: any, profile?: any }) {
      if (account?.provider === 'google') {
        try {
          await fetch('http://127.0.0.1:8081/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image_url: user.image,
              auth_provider: 'google'
            }),
          });
          console.log("✅ Google User synced to backend:", user.email);
        } catch (e) {
          console.error("❌ User sync failed:", e);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }: { token: any, user?: any, trigger?: any, session?: any }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.image = user.image;
      }
      // Handle update() from client
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.image = session.image;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (session.user) {
        session.user.id = token.sub || token.id;
        session.user.name = token.name;
        session.user.image = token.image;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Custom login page
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
