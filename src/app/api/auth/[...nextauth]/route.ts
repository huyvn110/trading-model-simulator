import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // Bắt buộc phải có quyền này để upload ảnh lên Drive của user
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Chặn người lạ, chỉ cho những email trong danh sách vào
      const allowedEmails = process.env.WHITELIST_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
      const userEmail = user.email?.toLowerCase();
      
      if (userEmail && allowedEmails.includes(userEmail)) {
        return true;
      }
      return false; // Đá văng người lạ
    },
    async jwt({ token, account }) {
      // Lưu lại access_token của Google khi user vừa đăng nhập
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Đẩy access_token ra ngoài session để API phía sau xài
      session.accessToken = token.accessToken;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
