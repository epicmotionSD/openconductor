/**
 * NextAuth Configuration for Trinity Agent Platform
 * Integrates with enterprise database schema for user management and trials
 */

import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../db/prisma';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organization: true,
          },
        });

        if (!user) {
          return null;
        }

        // For OAuth users, they might not have a password
        if (user.password) {
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            return null;
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar_url,
          role: user.role,
          organizationId: user.organization_id,
          trialToken: user.trial_token,
          trialAgents: user.trial_agents,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Check if this is a new user signup
      if (account?.provider && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { organization: true },
        });

        // If user doesn't exist, create them with trial access
        if (!existingUser) {
          await createTrialUser(user.email, user.name, user.image, account.provider);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.userId = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.trialToken = (user as any).trialToken;
        token.trialAgents = (user as any).trialAgents;
      }

      // Return previous token if the access token has not expired
      return token;
    },
    async session({ session, token }) {
      // Fetch fresh user data for each session
      if (token.userId) {
        const user = await prisma.user.findUnique({
          where: { id: token.userId as string },
          include: {
            organization: {
              include: {
                subscription_items: {
                  where: { is_active: true },
                },
              },
            },
          },
        });

        if (user) {
          session.user.id = user.id;
          session.user.role = user.role;
          session.user.organizationId = user.organization_id;
          session.user.organization = user.organization;
          session.user.trialToken = user.trial_token;
          session.user.trialAgents = user.trial_agents;
          session.user.trialInteractionsRemaining = user.trial_interactions_remaining as any;
          session.user.lastActivityAt = user.last_activity_at;
        }
      }

      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Update last activity
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { last_activity_at: new Date() },
        });
      }
    },
  },
};

/**
 * Create a new trial user with default organization and trial settings
 */
async function createTrialUser(
  email: string, 
  name: string | null | undefined, 
  avatarUrl: string | null | undefined,
  provider: string
) {
  const trialToken = uuidv4();
  const trialDuration = 14; // days
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + trialDuration);

  // Create organization for the user
  const organization = await prisma.organization.create({
    data: {
      name: `${name || email.split('@')[0]}'s Organization`,
      slug: `org-${uuidv4().substring(0, 8)}`,
      domain: email.split('@')[1],
      plan_type: 'trial',
      trial_ends_at: trialEndDate,
      subscription_status: 'trial',
    },
  });

  // Get default trial limits from system config
  const trialLimitsConfig = await prisma.system_config.findUnique({
    where: { key: 'trinity_agent_trial_limits' },
  });

  const defaultTrialLimits = trialLimitsConfig?.value as any || {
    oracle: 100,
    sentinel: 50,
    sage: 200,
  };

  // Create user with trial access
  const user = await prisma.user.create({
    data: {
      organization_id: organization.id,
      email,
      name: name || email.split('@')[0],
      avatar_url: avatarUrl,
      role: 'owner',
      email_verified: provider === 'email' ? false : true,
      trial_token: trialToken,
      trial_agents: ['oracle', 'sentinel', 'sage'],
      trial_interactions_remaining: defaultTrialLimits,
    },
  });

  console.log(`Created trial user: ${email} with token: ${trialToken}`);
  return user;
}

/**
 * Middleware to check if user has access to specific Trinity Agent
 */
export async function checkAgentAccess(
  userId: string, 
  agentType: 'oracle' | 'sentinel' | 'sage'
): Promise<{ hasAccess: boolean; reason?: string; remainingInteractions?: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: {
        include: {
          subscription_items: {
            where: { 
              is_active: true,
              agent_type: agentType,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return { hasAccess: false, reason: 'User not found' };
  }

  const org = user.organization;
  if (!org) {
    return { hasAccess: false, reason: 'Organization not found' };
  }

  // Check if user has active subscription for this agent
  const activeSubscription = org.subscription_items.find(item => item.agent_type === agentType);
  if (activeSubscription && org.subscription_status === 'active') {
    return { hasAccess: true };
  }

  // Check trial access
  if (org.plan_type === 'trial' && org.trial_ends_at && new Date() <= org.trial_ends_at) {
    const trialInteractions = user.trial_interactions_remaining as any;
    const remaining = trialInteractions?.[agentType] || 0;
    
    if (remaining > 0) {
      return { 
        hasAccess: true, 
        remainingInteractions: remaining 
      };
    } else {
      return { 
        hasAccess: false, 
        reason: 'Trial interactions exhausted for this agent',
        remainingInteractions: 0
      };
    }
  }

  // Trial expired or no subscription
  if (org.plan_type === 'trial' && org.trial_ends_at && new Date() > org.trial_ends_at) {
    return { hasAccess: false, reason: 'Trial expired' };
  }

  return { hasAccess: false, reason: 'No active subscription or trial' };
}

/**
 * Decrement trial interactions when an agent is used
 */
export async function decrementTrialInteraction(
  userId: string,
  agentType: 'oracle' | 'sentinel' | 'sage'
): Promise<{ success: boolean; remainingInteractions?: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  if (!user || !user.organization) {
    return { success: false };
  }

  const trialInteractions = user.trial_interactions_remaining as any;
  const currentCount = trialInteractions?.[agentType] || 0;

  if (currentCount <= 0) {
    return { success: false, remainingInteractions: 0 };
  }

  const newInteractions = {
    ...trialInteractions,
    [agentType]: currentCount - 1,
  };

  await prisma.user.update({
    where: { id: userId },
    data: {
      trial_interactions_remaining: newInteractions,
    },
  });

  return { 
    success: true, 
    remainingInteractions: newInteractions[agentType] 
  };
}

export default NextAuth(authOptions);