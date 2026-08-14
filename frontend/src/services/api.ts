const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type AuthCallback = (event: string, session: Session | null) => void;

export interface User {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string };
  app_metadata?: Record<string, unknown>;
  aud?: string;
  created_at?: string;
}

export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

interface QueryResult<T = any> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

interface Filter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'is' | 'not';
  value: unknown;
}

class QueryBuilder {
  private table: string;
  private filters: Filter[] = [];
  private selectStr = '*';
  private orderBy?: { column: string; ascending?: boolean };
  private limitCount?: number;
  private rangeFrom?: number;
  private rangeTo?: number;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'count' = 'select';
  private insertData?: Record<string, unknown> | Record<string, unknown>[];
  private updateData?: Record<string, unknown>;
  private returnSingle = false;
  private returnMaybeSingle = false;
  private isCount = false;
  private isHead = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*', options?: { count?: 'exact'; head?: boolean }) {
    this.selectStr = columns;
    if (options?.count) this.isCount = true;
    if (options?.head) this.isHead = true;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  is(column: string, value: null) {
    this.filters.push({ column, operator: 'is', value });
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === 'is' && value === null) {
      this.filters.push({ column, operator: 'not', value: null });
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single() {
    this.returnSingle = true;
    return this;
  }

  maybeSingle() {
    this.returnMaybeSingle = true;
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]) {
    this.operation = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: Record<string, unknown>) {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async execute(): Promise<QueryResult> {
    const token = this.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const body: Record<string, unknown> = {
      table: this.table,
      operation: this.isCount || this.isHead ? 'count' : this.operation,
      filters: this.filters,
    };

    if (this.operation === 'select' || this.operation === 'insert') {
      body.select = this.selectStr;
    }
    if (this.orderBy) body.order = this.orderBy;
    if (this.limitCount) body.limit = this.limitCount;
    if (this.rangeFrom !== undefined && this.rangeTo !== undefined) {
      body.range = { from: this.rangeFrom, to: this.rangeTo };
    }
    if (this.returnSingle) body.single = true;
    if (this.returnMaybeSingle) body.maybeSingle = true;
    if (this.isHead) body.head = true;
    if (this.insertData) body.data = this.insertData;
    if (this.updateData) body.data = this.updateData;

    try {
      const res = await fetch(`${API_BASE}/db/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

class StorageBucket {
  constructor(private bucket: string) {}

  async upload(
    filePath: string,
    file: File | Blob | ArrayBuffer,
    options?: { upsert?: boolean; contentType?: string }
  ): Promise<QueryResult> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (file instanceof File || file instanceof Blob) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', filePath);
      if (options?.upsert) formData.append('upsert', 'true');

      const res = await fetch(`${API_BASE}/storage/upload/${this.bucket}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return res.json();
    }

    const buffer = file instanceof ArrayBuffer ? file : new ArrayBuffer(0);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    const res = await fetch(`${API_BASE}/storage/upload-buffer/${this.bucket}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: filePath,
        content: base64,
        contentType: options?.contentType,
        upsert: options?.upsert,
      }),
    });
    return res.json();
  }

  getPublicUrl(filePath: string) {
    const publicUrl = `${API_BASE}/storage/public/${this.bucket}/${filePath}`;
    return { data: { publicUrl } };
  }

  async createSignedUrl(filePath: string, _expiresIn: number): Promise<QueryResult> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/storage/signed/${this.bucket}/${filePath}`, { headers });
    return res.json();
  }
}

class StorageClient {
  from(bucket: string) {
    return new StorageBucket(bucket);
  }
}

class FunctionsClient {
  async invoke(name: string, options?: { body?: Record<string, unknown> }): Promise<QueryResult> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/functions/v1/${name}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(options?.body || {}),
    });
    return res.json();
  }
}

class RealtimeChannel {
  constructor(_name: string) {}
  on(_event: string, _config: unknown, _callback: (payload: unknown) => void) {
    return this;
  }
  subscribe() {
    return this;
  }
}

const authListeners: AuthCallback[] = [];
let currentSession: Session | null = null;

function notifyAuthListeners(event: string, session: Session | null) {
  authListeners.forEach((cb) => cb(event, session));
}

async function loadSession(): Promise<Session | null> {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  const res = await fetch(`${API_BASE}/auth/session`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return json.data?.session || null;
}

class AuthClient {
  onAuthStateChange(callback: AuthCallback) {
    authListeners.push(callback);
    loadSession().then((session) => {
      currentSession = session;
      callback('INITIAL_SESSION', session);
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const idx = authListeners.indexOf(callback);
            if (idx >= 0) authListeners.splice(idx, 1);
          },
        },
      },
    };
  }

  async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
    const session = await loadSession();
    currentSession = session;
    return { data: { session }, error: null };
  }

  async getUser(): Promise<{ data: { user: User | null }; error: { message: string } | null }> {
    const token = localStorage.getItem('auth_token');
    if (!token) return { data: { user: null }, error: { message: 'Not authenticated' } };

    const res = await fetch(`${API_BASE}/auth/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async signUp(options: {
    email: string;
    password: string;
    options?: { emailRedirectTo?: string; data?: { full_name?: string } };
  }) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: options.email,
        password: options.password,
        options: options.options,
      }),
    });
    const json = await res.json();
    if (json.data?.session) {
      localStorage.setItem('auth_token', json.data.session.access_token);
      currentSession = json.data.session;
      notifyAuthListeners('SIGNED_IN', json.data.session);
    }
    return { data: json.data, error: json.error };
  }

  async signInWithPassword(options: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    const json = await res.json();
    if (json.data?.session) {
      localStorage.setItem('auth_token', json.data.session.access_token);
      currentSession = json.data.session;
      notifyAuthListeners('SIGNED_IN', json.data.session);
    }
    return { data: json.data, error: json.error };
  }

  async signOut() {
    localStorage.removeItem('auth_token');
    currentSession = null;
    notifyAuthListeners('SIGNED_OUT', null);
    await fetch(`${API_BASE}/auth/signout`, { method: 'POST' });
    return { error: null };
  }
}

class ApiClient {
  auth = new AuthClient();
  storage = new StorageClient();
  functions = new FunctionsClient();

  from(table: string) {
    return new QueryBuilder(table);
  }

  channel(name: string) {
    return new RealtimeChannel(name);
  }

  removeChannel(_channel: RealtimeChannel) {
    // no-op: realtime not supported with MongoDB
  }

  rpc(fnName: string, params?: Record<string, unknown>) {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${API_BASE}/db/rpc/${fnName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params || {}),
    }).then((res) => res.json());
  }
}

export const api = new ApiClient();
export const supabase = api;
export type { QueryResult };
