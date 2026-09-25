import axios from 'axios';
import type { AnalyzeURLRequest, AnalyzeURLResponse } from './types';

/**
 * API base URL.
 * - In local development, Vite proxies `/api` -> the local FastAPI backend (see vite.config.ts).
 * - In production, point VITE_API_BASE_URL at the deployed backend, e.g. https://your-api.vercel.app/api.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function analyzeURL(url: string): Promise<AnalyzeURLResponse> {
  try {
    const response = await axios.post<AnalyzeURLResponse>(`${API_BASE}/analyze-url`, { url } as AnalyzeURLRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Website does not exist or is unreachable.');
    }
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Analysis timed out. The threat intelligence servers took too long to respond.');
    }
    throw new Error('We couldn\'t reach the threat-intelligence service right now. Please check your network connection.');
  }
}
