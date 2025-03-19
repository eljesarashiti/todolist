import { createTRPCReact } from '@trpc/react-query';
import { AppRouter } from '@/trpc/routers';

export const trpc = createTRPCReact<AppRouter>();