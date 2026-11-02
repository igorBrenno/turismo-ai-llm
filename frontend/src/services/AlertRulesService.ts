import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import type { AlertRule, AlertRun, AlertTrigger, AlertTriggerStatus } from '../models/AlertRule';
import type { TouristSpot } from '../models/Spot';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const rulesCollection = (uid: string) => collection(db, 'users', uid, 'alert_rules');

export class AlertRulesService {
  // ---------- Regras (o secretário gerencia direto no Firestore) ----------
  public static subscribeRules(uid: string, onChange: (rules: AlertRule[]) => void) {
    return onSnapshot(rulesCollection(uid), (snapshot) => {
      onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AlertRule));
    });
  }

  public static async createRule(uid: string, nome: string, criterio: string) {
    await addDoc(rulesCollection(uid), { nome, criterio, ativo: true, createdAt: serverTimestamp() });
  }

  public static async setRuleActive(uid: string, ruleId: string, ativo: boolean) {
    await updateDoc(doc(db, 'users', uid, 'alert_rules', ruleId), { ativo });
  }

  public static async deleteRule(uid: string, ruleId: string) {
    await deleteDoc(doc(db, 'users', uid, 'alert_rules', ruleId));
  }

  // ---------- Disparos (criados pelo backend) ----------
  public static subscribeTriggers(uid: string, onChange: (triggers: AlertTrigger[]) => void) {
    const q = query(collection(db, 'alert_triggers'), where('owner_uid', '==', uid));
    return onSnapshot(q, (snapshot) => {
      const triggers = snapshot.docs.map((d) => {
        const data = d.data();
        return { ...data, id: d.id, created_at: data.created_at?.toDate?.() ?? null } as AlertTrigger;
      });
      // Ordena no cliente para não exigir índice composto no Firestore
      triggers.sort((a, b) => (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0));
      onChange(triggers);
    });
  }

  public static async setTriggerStatus(triggerId: string, status: AlertTriggerStatus) {
    await updateDoc(doc(db, 'alert_triggers', triggerId), { status });
  }

  // ---------- Execução (backend) ----------
  public static async startRun(spots: TouristSpot[]): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Usuário não autenticado.');

    const response = await fetch(`${API_URL}/api/alert-rules/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ spots: spots.map((s) => ({ place_id: s.id, name: s.name })) }),
    });
    if (!response.ok) throw new Error(`Erro ao iniciar verificação (${response.status}).`);

    const data = await response.json();
    return data.run_id;
  }

  public static subscribeRun(runId: string, onChange: (run: AlertRun) => void) {
    return onSnapshot(doc(db, 'alert_runs', runId), (snapshot) => {
      if (snapshot.exists()) onChange(snapshot.data() as AlertRun);
    });
  }
}
