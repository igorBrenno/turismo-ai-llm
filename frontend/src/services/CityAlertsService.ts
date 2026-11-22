import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export class CityAlertsService {
  // Marca um alerta da cidade (deep_analysis_status/{cidade}/alerts/{alerta}) como resolvido
  public static async resolve(cityId: string, alertId: string) {
    await updateDoc(doc(db, 'deep_analysis_status', cityId, 'alerts', alertId), { resolvida: true });
  }
}
