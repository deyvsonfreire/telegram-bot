import { z } from 'zod';

export const CreateSessionSchema = z.object({
  type: z.enum(['bot', 'user']),
  label: z.string().min(1),
  phoneNumber: z.string().optional(),
  apiId: z.string().optional(),
  apiHash: z.string().optional(),
});

export const CollectMembersSchema = z.object({
  dialogId: z.number(),
  limit: z.number().min(1).max(1000).default(200),
});

export const ExportDataSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  filters: z.object({
    dialogIds: z.array(z.number()).optional(),
    includePhones: z.boolean().default(false),
    onlyContacts: z.boolean().default(false),
    dateRange: z.object({
      from: z.string().datetime(),
      to: z.string().datetime(),
    }).optional(),
  }),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type CollectMembersInput = z.infer<typeof CollectMembersSchema>;
export type ExportDataInput = z.infer<typeof ExportDataSchema>;
