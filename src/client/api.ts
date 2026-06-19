import type {
  ActionRequest,
  InitResponse,
  MutationResponse,
  VoteRequest,
} from '../shared/types.js';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

export const api = {
  init: async (): Promise<InitResponse> => {
    const res = await fetch('/api/init');
    return (await res.json()) as InitResponse;
  },
  act: (body: ActionRequest) => post<MutationResponse>('/api/action', body),
  vote: (body: VoteRequest) => post<MutationResponse>('/api/vote', body),
};
