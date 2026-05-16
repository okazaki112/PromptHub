import type { Context } from 'hono';
import { z } from 'zod';
import { error, ErrorCode } from './response.js';

export async function parseJsonBody<T extends z.ZodTypeAny>(
  c: Context,
  schema: T,
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; response: Response }
> {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return {
      success: false,
      response: error(c, 400, ErrorCode.BAD_REQUEST, 'Invalid JSON request body'),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join('; ');

    return {
      success: false,
      response: error(c, 422, ErrorCode.VALIDATION_ERROR, message),
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}
