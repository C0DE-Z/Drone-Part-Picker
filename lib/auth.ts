import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username || user.name || null,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
  async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
    // include name/username for convenience
    const u = user as (typeof user & { username?: string | null })
    token.name = u.username || user.name || null
      }
      // Allow updating session name on update triggers
      if (trigger === 'update' && session?.user?.name) {
        token.name = session.user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        // prefer token.name (may be username), else existing
        if (token.name) session.user.name = token.name as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  }
}
