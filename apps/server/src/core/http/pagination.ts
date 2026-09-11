import { z } from "zod";

/** Query de paginación común: `?page=1&pageSize=20` (máximo 100). */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number; totalPages: number };

export const toSkipTake = (p: PaginationQuery) => ({ skip: (p.page - 1) * p.pageSize, take: p.pageSize });

export function toPage<T>(items: T[], total: number, p: PaginationQuery): Page<T> {
  return { items, total, page: p.page, pageSize: p.pageSize, totalPages: Math.max(1, Math.ceil(total / p.pageSize)) };
}
