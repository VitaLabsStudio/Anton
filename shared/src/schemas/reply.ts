import { z } from 'zod';

export const ReplyContentSchema = z.object({
  content: z
    .string()
    .min(10, 'Reply too short')
    .max(1000, 'Reply exceeds maximum length')
    .refine((val) => val.includes('—Antone (Vita)'), 'Reply must include signature')
    .refine(
      (val) => !/(cure|prevent|treat|clinically proven)/i.test(val),
      'Reply contains prohibited medical claims'
    ),
  utmCode: z.string().regex(/^[a-z0-9_-]+$/, 'Invalid UTM code'),
});
