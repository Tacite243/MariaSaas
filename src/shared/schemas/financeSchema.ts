import { z } from 'zod';

export const financeSchema = z.object({
    rate: z.number().min(0),
    date: z.string().optional(),
    setById: z.string().uuid()
});

export type FinanceInput = z.infer<typeof financeSchema>;