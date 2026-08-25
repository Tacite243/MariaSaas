import { z } from 'zod'

export const lanModeSchema = z.enum(['STANDALONE', 'SERVER', 'CLIENT'])

export const lanConfigSchema = z.object({
  lanMode: lanModeSchema,
  lanServerPort: z.number().int().min(1024).max(65535).optional(),
  lanClientHost: z.string().optional().nullable(),
  lanClientToken: z.string().optional().nullable()
})

export const lanPairSchema = z.object({
  host: z.string().min(1),
  token: z.string().min(8)
})

export type LanConfigInput = z.infer<typeof lanConfigSchema>
export type LanPairInput = z.infer<typeof lanPairSchema>
