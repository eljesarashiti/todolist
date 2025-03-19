import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createContext(opts: CreateNextContextOptions) {
  return { prisma };
}

export type Context = inferAsyncReturnType<typeof createContext>;