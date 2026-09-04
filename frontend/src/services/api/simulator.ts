import axios from 'axios';
import type {
  SimulatorSessionResponse,
  SimulatorEventCreate,
  SimulatorEventResponse,
  LatestSimulatorEventResponse,
  SimulatorResetResponse
} from './types';

/**
 * API base URL. See the note in analysis.ts for how this is resolved
 * between local dev (Vite proxy) and production (VITE_API_BASE_URL).
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function createSimulatorSession(targetEmail: string): Promise<SimulatorSessionResponse> {
  try {
    const res = await axios.post<SimulatorSessionResponse>(`${API_BASE}/simulator/session`, {
      target_email: targetEmail
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to initialize simulator session.');
  }
}

export async function recordSimulatorEvent(payload: SimulatorEventCreate): Promise<SimulatorEventResponse> {
  try {
    const res = await axios.post<SimulatorEventResponse>(`${API_BASE}/simulator/events`, payload);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to record simulator event.');
  }
}

export async function getLatestSimulatorEvent(): Promise<LatestSimulatorEventResponse> {
  try {
    const res = await axios.get<LatestSimulatorEventResponse>(`${API_BASE}/simulator/events/latest`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to retrieve latest simulator status.');
  }
}

export async function resetSimulator(): Promise<SimulatorResetResponse> {
  try {
    const res = await axios.post<SimulatorResetResponse>(`${API_BASE}/simulator/reset`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to reset simulator environment.');
  }
}
