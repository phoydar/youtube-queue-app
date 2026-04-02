import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';

export function jsonError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function parseBody<T>(schema: ZodSchema<T>, data: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join(', ') };
  }
  return { data: result.data };
}
