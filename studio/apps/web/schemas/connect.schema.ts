import { z } from 'zod'

type CustomConnectorTranslate = (
  path: string,
  vars?: Record<string, string>,
) => string

export function createCustomConnectorSchema(t: CustomConnectorTranslate) {
  return z.object({
    name: z.string().min(1, t('connect.detail.nameRequired')),
    serverUrl: z.string().url(t('connect.detail.invalidUrl')),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
  })
}

export type CustomConnectorInput = z.infer<
  ReturnType<typeof createCustomConnectorSchema>
>
