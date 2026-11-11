import { auth } from '../firebaseConfig';
import type { UserReport, UserReportInput } from '../models/Report';

const REPORTS_URL = 'http://localhost:8000/api/reports';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  }
  return { Authorization: `Bearer ${token}` };
}

export class ReportService {
  public static async create(report: UserReportInput): Promise<UserReport> {
    const response = await fetch(REPORTS_URL, {
      method: 'POST',
      headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!response.ok) {
      throw new Error('Não foi possível registrar a denúncia. Tente novamente.');
    }
    return response.json();
  }

  public static async list(): Promise<UserReport[]> {
    const response = await fetch(REPORTS_URL, { headers: await authHeaders() });
    if (!response.ok) {
      throw new Error('Não foi possível carregar as denúncias.');
    }
    return response.json();
  }
}
