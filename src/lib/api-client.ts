/**
 * Client-side finance API. Talks to the Expo Router server routes, attaching
 * the better-auth session cookie so the server can authenticate the user.
 * All finance data lives in Turso (server-side) so it syncs across every
 * family member's device.
 */

import { Platform } from 'react-native';

import { API_BASE_URL } from '@/constants/api';
import { authClient } from '@/lib/auth-client';
import type {
  Balance,
  Category,
  CategoryType,
  Currency,
  Home,
  HomeRole,
  Member,
  MonthBucket,
  MonthlySummary,
  TransactionView,
} from '@/lib/db-types';

export class ApiClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Query = Record<string, string | number | undefined>;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
};

function getSessionCookie(): string {
  const client = authClient as unknown as { getCookie?: () => string };
  try {
    return client.getCookie?.() ?? '';
  } catch {
    return '';
  }
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options;
  const isWeb = Platform.OS === 'web';

  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }

  const cookie = getSessionCookie();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isWeb && cookie) headers.Cookie = cookie;

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: isWeb ? 'include' : 'omit',
    });
  } catch {
    throw new ApiClientError('No pudimos conectar con el servidor. Revisa tu conexión.', 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiClientError(extractApiErrorMessage(data, response.status), response.status);
  }
  return data as T;
}

function extractApiErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const err = obj.error;
    if (typeof err === 'string' && err.trim()) return err.trim();
    if (err && typeof err === 'object') {
      const nested = err as Record<string, unknown>;
      if (typeof nested.message === 'string' && nested.message.trim()) {
        return nested.message.trim();
      }
    }
    if (typeof obj.message === 'string' && obj.message.trim()) {
      return obj.message.trim();
    }
  }
  if (status === 401) return 'Sesión no válida o expirada';
  if (status === 403) return 'No tienes permiso para esta acción';
  if (status === 404) return 'No se encontró el recurso en el servidor';
  if (status === 413) return 'La imagen es demasiado grande';
  if (status === 422) return 'El servidor rechazó la solicitud (datos inválidos)';
  if (status >= 500) return `Error del servidor (${status})`;
  if (status > 0) return `Error de la solicitud (${status})`;
  return 'Ocurrió un error inesperado';
}

// --- DTO mappers (numeric unix seconds -> Date, ints -> booleans) -----------

type HomeDTO = { id: string; name: string; currency: string; inviteCode: string; createdAt: number };
type MemberDTO = {
  id: string;
  homeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: HomeRole;
  joinedAt: number;
};
type CategoryDTO = {
  id: string;
  homeId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  createdBy: string | null;
  createdAt: number;
};

function toHome(dto: HomeDTO): Home {
  return { ...dto, currency: dto.currency, createdAt: new Date(dto.createdAt * 1000) } as Home;
}
function toMember(dto: MemberDTO): Member {
  return { ...dto, joinedAt: new Date(dto.joinedAt * 1000) } as Member;
}
function toCategory(dto: CategoryDTO): Category {
  return { ...dto, isDefault: !!dto.isDefault, createdAt: new Date(dto.createdAt * 1000) } as Category;
}

export type HomeDetail = {
  home: Home;
  membership: Member;
  members: Member[];
  categories: Category[];
  recentTransactions: TransactionView[];
  balance: Balance;
};

export type CreateTransactionInput = {
  homeId: string;
  type: CategoryType;
  amount: number;
  categoryId?: string | null;
  description?: string;
  date?: number;
};

export type UpdateTransactionInput = Partial<Omit<CreateTransactionInput, 'homeId'>>;

export type CreateCategoryInput = {
  homeId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
};

export type UpdateCategoryInput = { name?: string; icon?: string; color?: string };

export type AnalyzeReceiptCategory = {
  id: string;
  name: string;
  type: CategoryType;
};

export type AnalyzeReceiptResult = {
  type: CategoryType;
  amountCents: number;
  description: string;
  categoryId: string | null;
};

export const financeApi = {
  async listHomes(): Promise<{ home: Home; membership: Member }[]> {
    const data = await apiFetch<{ homes: { home: HomeDTO; membership: MemberDTO }[] }>('/api/homes');
    return data.homes.map((h) => ({ home: toHome(h.home), membership: toMember(h.membership) }));
  },

  async createHome(name: string, currency: Currency = 'PEN'): Promise<{ home: Home; membership: Member }> {
    const data = await apiFetch<{ home: HomeDTO; membership: MemberDTO }>('/api/homes', {
      method: 'POST',
      body: { name, currency },
    });
    return { home: toHome(data.home), membership: toMember(data.membership) };
  },

  async joinHome(inviteCode: string): Promise<{ home: Home; membership: Member }> {
    const data = await apiFetch<{ home: HomeDTO; membership: MemberDTO }>('/api/homes/join', {
      method: 'POST',
      body: { inviteCode },
    });
    return { home: toHome(data.home), membership: toMember(data.membership) };
  },

  async getHomeDetail(homeId: string): Promise<HomeDetail> {
    const data = await apiFetch<{
      home: HomeDTO;
      membership: MemberDTO;
      members: MemberDTO[];
      categories: CategoryDTO[];
      recentTransactions: TransactionView[];
      balance: Balance;
    }>(`/api/homes/${homeId}`);
    return {
      home: toHome(data.home),
      membership: toMember(data.membership),
      members: data.members.map(toMember),
      categories: data.categories.map(toCategory),
      recentTransactions: data.recentTransactions,
      balance: data.balance,
    };
  },

  async leaveHome(homeId: string): Promise<void> {
    await apiFetch(`/api/homes/${homeId}`, { method: 'DELETE' });
  },

  async listCategories(homeId: string, type?: CategoryType): Promise<Category[]> {
    const data = await apiFetch<{ categories: CategoryDTO[] }>('/api/categories', {
      query: { homeId, type },
    });
    return data.categories.map(toCategory);
  },

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const data = await apiFetch<{ category: CategoryDTO }>('/api/categories', {
      method: 'POST',
      body: input,
    });
    return toCategory(data.category);
  },

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const data = await apiFetch<{ category: CategoryDTO }>(`/api/categories/${id}`, {
      method: 'PATCH',
      body: input,
    });
    return toCategory(data.category);
  },

  async deleteCategory(id: string): Promise<void> {
    await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
  },

  async listTransactions(
    homeId: string,
    opts?: { limit?: number; month?: string; memberId?: string },
  ): Promise<TransactionView[]> {
    const data = await apiFetch<{ transactions: TransactionView[] }>('/api/transactions', {
      query: { homeId, limit: opts?.limit, month: opts?.month, memberId: opts?.memberId },
    });
    return data.transactions;
  },

  async getTransaction(id: string): Promise<TransactionView> {
    const data = await apiFetch<{ transaction: TransactionView }>(`/api/transactions/${id}`);
    return data.transaction;
  },

  async createTransaction(input: CreateTransactionInput): Promise<TransactionView> {
    const data = await apiFetch<{ transaction: TransactionView }>('/api/transactions', {
      method: 'POST',
      body: input,
    });
    return data.transaction;
  },

  async updateTransaction(id: string, input: UpdateTransactionInput): Promise<TransactionView> {
    const data = await apiFetch<{ transaction: TransactionView }>(`/api/transactions/${id}`, {
      method: 'PATCH',
      body: input,
    });
    return data.transaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
  },

  async listMonths(homeId: string, opts?: { memberId?: string }): Promise<MonthBucket[]> {
    const data = await apiFetch<{ months: MonthBucket[] }>('/api/transactions/months', {
      query: { homeId, memberId: opts?.memberId },
    });
    return data.months;
  },

  async getMonthlyReport(homeId: string, month: string): Promise<MonthlySummary> {
    const data = await apiFetch<{ summary: MonthlySummary }>('/api/reports', {
      query: { homeId, month },
    });
    return data.summary;
  },

  async analyzeReceipt(input: {
    imageBase64?: string;
    mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
    categories: AnalyzeReceiptCategory[];
    ocrText?: string;
  }): Promise<AnalyzeReceiptResult> {
    try {
      const data = await apiFetch<{ analysis: AnalyzeReceiptResult }>('/api/scan-receipt', {
        method: 'POST',
        body: input,
      });
      return data.analysis;
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        throw new ApiClientError(
          'El escáner aún no está disponible en el servidor. Despliega el API con npm run deploy:api.',
          404,
        );
      }
      throw err;
    }
  },
};
