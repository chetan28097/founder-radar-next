import {
  SearchResponse,
  ProfileDossier,
  ResearchResponse,
  OutreachDraftResponse,
  Watchlist,
  SavedFounder,
  HealthResponse,
  RecentSearch,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `API error: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthResponse>(res);
  },

  async searchFounders(params: {
    query?: string;
    employer?: string;
    role?: string;
    location?: string;
    country?: string;
    limit?: number;
    cursor?: string;
  }): Promise<SearchResponse> {
    const res = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query || undefined,
        employer: params.employer || undefined,
        role: params.role || undefined,
        location: params.location || undefined,
        country: params.country || undefined,
        limit: params.limit || 10,
        cursor: params.cursor || undefined,
      }),
    });
    return handleResponse<SearchResponse>(res);
  },

  async getProfileDossier(profileId: string): Promise<ProfileDossier> {
    const res = await fetch(`${API_BASE}/api/profiles/${encodeURIComponent(profileId)}`);
    return handleResponse<ProfileDossier>(res);
  },

  async analyzeResearch(params: {
    profile_id: string;
    custom_question?: string;
    tone?: string;
  }): Promise<ResearchResponse> {
    const res = await fetch(`${API_BASE}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<ResearchResponse>(res);
  },

  async generateOutreach(params: {
    profile_id: string;
    tone?: string;
    sender_context?: string;
  }): Promise<OutreachDraftResponse> {
    const res = await fetch(`${API_BASE}/api/research/outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<OutreachDraftResponse>(res);
  },

  async getSavedFounders(): Promise<SavedFounder[]> {
    const res = await fetch(`${API_BASE}/api/saved`);
    return handleResponse<SavedFounder[]>(res);
  },

  async saveFounder(data: {
    profile_id: string;
    name: string;
    headline?: string;
    current_company?: string;
    current_title?: string;
    location?: string;
    watchlist_id?: string;
    notes?: string;
    tags?: string[];
    raw_profile?: any;
  }): Promise<SavedFounder> {
    const res = await fetch(`${API_BASE}/api/saved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<SavedFounder>(res);
  },

  async removeSavedFounder(profileId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/saved/${encodeURIComponent(profileId)}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async updateNotes(profileId: string, notes: string): Promise<{ success: boolean; notes: string }> {
    const res = await fetch(`${API_BASE}/api/saved/${encodeURIComponent(profileId)}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    return handleResponse<{ success: boolean; notes: string }>(res);
  },

  async getWatchlists(): Promise<Watchlist[]> {
    const res = await fetch(`${API_BASE}/api/watchlists`);
    return handleResponse<Watchlist[]>(res);
  },

  async createWatchlist(data: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<Watchlist> {
    const res = await fetch(`${API_BASE}/api/watchlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Watchlist>(res);
  },

  async addToWatchlist(watchlistId: string, profileId: string): Promise<{ success: boolean }> {
    const res = await fetch(
      `${API_BASE}/api/watchlists/${encodeURIComponent(watchlistId)}/members/${encodeURIComponent(profileId)}`,
      { method: 'POST' }
    );
    return handleResponse<{ success: boolean }>(res);
  },

  async removeFromWatchlist(watchlistId: string, profileId: string): Promise<{ success: boolean }> {
    const res = await fetch(
      `${API_BASE}/api/watchlists/${encodeURIComponent(watchlistId)}/members/${encodeURIComponent(profileId)}`,
      { method: 'DELETE' }
    );
    return handleResponse<{ success: boolean }>(res);
  },

  async getRecentSearches(): Promise<RecentSearch[]> {
    const res = await fetch(`${API_BASE}/api/recent-searches`);
    return handleResponse<RecentSearch[]>(res);
  },
};
