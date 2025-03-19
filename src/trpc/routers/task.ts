import { procedure, router } from '../trpc';
import { z } from 'zod';

export const taskRouter = router({
  getAll: procedure.query(async ({ ctx }) => {
    return ctx.prisma.task.findMany();
  }),
  create: procedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(['Low', 'Medium', 'High']).optional(),
      dueDate: z.string().optional().nullable(), 
      category: z.enum(['Personal', 'Home', 'Work']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.task.create({
        data: { 
          title: input.title, 
          description: input.description, 
          priority: input.priority,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          category: input.category,
        },
      });
    }),
  update: procedure
    .input(
      z.object({
        id: z.number(),
        title: z.string(),
        description: z.string().optional(),
        completed: z.boolean(),
        priority: z.enum(['Low', 'Medium', 'High']).optional(),
        dueDate: z.string().optional().nullable(), 
        category: z.enum(['Personal', 'Home', 'Work']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.task.update({
        where: { id: input.id },
        data: { 
          title: input.title, 
          description: input.description, 
          completed: input.completed, 
          priority: input.priority,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          category: input.category,
        },
      });
    }),
  delete: procedure.input(z.number()).mutation(async ({ input, ctx }) => {
    return ctx.prisma.task.delete({ where: { id: input } });
  }),
  deleteCompleted: procedure.mutation(async ({ ctx }) => {
    return ctx.prisma.task.deleteMany({
      where: { completed: true },
    });
  }),
  login: procedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const admin = await ctx.prisma.admin.findUnique({
        where: { username: input.username },
      });
      if (!admin || admin.password !== input.password) {
        throw new Error('Invalid credentials');
      }
      return { id: admin.id, username: admin.username };
    }),
});