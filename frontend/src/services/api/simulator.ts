import axios from 'axios';
import type {
  SimulatorTemplateItem,
  EmailDispatchCreate,
  EmailDispatchResponse,
  SimulatorSessionResponse,
  SimulatorEventCreate,
  SimulatorEventResponse,
  LatestSimulatorEventResponse,
  SimulatorSessionDetailResponse,
  SimulatorResetResponse
} from './types';

/**
 * API base URL. See the note in analysis.ts for how this is resolved
 * between local dev (Vite proxy) and production (VITE_API_BASE_URL).
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function getSimulatorTemplates(): Promise<SimulatorTemplateItem[]> {
  try {
    const res = await axios.get<SimulatorTemplateItem[]>(`${API_BASE}/simulator/templates`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to load simulator templates.');
  }
}

export async function sendSimulatorEmail(payload: EmailDispatchCreate): Promise<EmailDispatchResponse> {
  try {
    const res = await axios.post<EmailDispatchResponse>(`${API_BASE}/simulator/send-email`, payload);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to dispatch simulator email.');
  }
}

export async function createSimulatorSession(targetEmail: string, templateId?: string): Promise<SimulatorSessionResponse> {
  try {
    const res = await axios.post<SimulatorSessionResponse>(`${API_BASE}/simulator/session`, {
      target_email: targetEmail,
      template_id: templateId || 'nordvault-security'
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

export async function getSimulatorSessions(): Promise<SimulatorSessionDetailResponse[]> {
  try {
    const res = await axios.get<SimulatorSessionDetailResponse[]>(`${API_BASE}/simulator/sessions`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to retrieve simulation history.');
  }
}

export async function getSimulatorSession(sessionId: string): Promise<SimulatorSessionDetailResponse> {
  try {
    const res = await axios.get<SimulatorSessionDetailResponse>(`${API_BASE}/simulator/sessions/${sessionId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to retrieve session details.');
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

export interface CaptureCredentialsPayload {
  session_id: string;
  username: string;
  password: string;
  user_agent?: string;
}

export interface CaptureCredentialsResponse {
  success: boolean;
  session_id: string;
  message: string;
  captured_username: string;
  captured_password_length: number;
  timestamp: string;
}

export async function captureCredentials(payload: CaptureCredentialsPayload): Promise<CaptureCredentialsResponse> {
  try {
    const res = await axios.post<CaptureCredentialsResponse>(`${API_BASE}/simulator/capture-credentials`, payload);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to capture credentials.');
  }
}
