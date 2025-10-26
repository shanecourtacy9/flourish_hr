import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const URL = `${environment.url}/api`;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private http: HttpClient
  ) { }

  /**
   * Send push notification for programme date change
   * @param programmeId 
   * @param oldDate 
   * @param newDate 
   * @param programmeName 
   */
  sendProgrammeDateChangeNotification(programmeId: string, oldDate: string, newDate: string, programmeName: string): Observable<any> {
    return this.http.post(`${URL}/scheduledProgrammes/${programmeId}/notifyDateChange`, {
      oldDate,
      newDate,
      programmeName
    });
  }

  /**
   * Send push notification for programme details change
   * @param programmeId 
   * @param changes 
   * @param programmeName 
   */
  sendProgrammeDetailsChangeNotification(programmeId: string, changes: any, programmeName: string): Observable<any> {
    return this.http.post(`${URL}/scheduledProgrammes/${programmeId}/notifyDetailsChange`, {
      changes,
      programmeName
    });
  }
}
