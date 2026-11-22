import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { serializeFirestoreData } from '../utils/downloadFile';

export interface CityExport {
  exportado_em: string;
  cidade: Record<string, unknown> & { place_id: string; nome: string };
  spots: Record<string, unknown>[];
  alertas: Record<string, unknown>[];
}

export class CityExportService {
  // Lê na hora o documento da cidade, todos os spots e todos os alertas (inclusive resolvidos)
  public static async buildCityExport(cityPlaceId: string, cityName: string): Promise<CityExport> {
    const cityRef = doc(db, 'deep_analysis_status', cityPlaceId);
    const [citySnap, spotsSnap, alertsSnap] = await Promise.all([
      getDoc(cityRef),
      getDocs(collection(cityRef, 'spots')),
      getDocs(collection(cityRef, 'alerts')),
    ]);

    return serializeFirestoreData({
      exportado_em: new Date().toISOString(),
      cidade: { place_id: cityPlaceId, nome: cityName, ...(citySnap.data() ?? {}) },
      spots: spotsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      alertas: alertsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    }) as CityExport;
  }
}
