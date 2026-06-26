import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import db from './db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile, account }) {
      if (account?.provider === 'google' && profile) {
        const email = profile.email;
        const name = profile.name || email?.split('@')[0] || '';
        const avatarUrl = profile.picture || null;
        const providerId = profile.sub || '';

        if (!email || !providerId) {
          return false;
        }

        // Проверяем, существует ли пользователь
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

        if (user) {
          // Обновляем данные OAuth если нужно
          if (user.auth_provider !== 'google') {
            db.prepare('UPDATE users SET auth_provider = ?, auth_provider_id = ?, avatar_url = ? WHERE id = ?')
              .run('google', providerId, avatarUrl, user.id);
          }
        } else {
          // Создаём нового пользователя
          db.prepare(`
            INSERT INTO users (email, name, auth_provider, auth_provider_id, avatar_url)
            VALUES (?, ?, ?, ?, ?)
          `).run(email, name, 'google', providerId, avatarUrl);
        }

        return true;
      }
      return false;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider;
      }
      if (profile) {
        token.picture = profile.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).provider = token.provider as string;
        
        // Получаем пользователя из БД
        const user = db.prepare('SELECT id, email, name, avatar_url FROM users WHERE email = ?').get(session.user?.email) as any;
        if (user) {
          (session.user as any).id = user.id;
          (session.user as any).avatar_url = user.avatar_url;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});
