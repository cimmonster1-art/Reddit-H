import type {
  ActionRequest,
  InitResponse,
  MutationResponse,
  ThreadResponse,
  VoteRequest,
} from '../shared/types.js';

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return (await res.json()) as T;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

export const api = {
  init: () => get<InitResponse>('/api/init'),
  thread: (id: string) => get<ThreadResponse>(`/api/thread/${encodeURIComponent(id)}`),
  act: (body: ActionRequest) => post<MutationResponse>('/api/action', body),
  vote: (body: VoteRequest) => post<MutationResponse>('/api/vote', body),
};
