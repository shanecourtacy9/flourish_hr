import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class StressThermometerService {
  private baseUrl = `${environment.url}/api/pulse-instruments`;

  constructor(private http: HttpClient) {}

  list(companyId: string): Observable<any> {
    return this.http.get(this.baseUrl, { params: { companyId } });
  }

  getAggregates(companyId: string, surveyId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${surveyId}/aggregates`, {
      params: { companyId },
    });
  }

  getResponses(companyId: string, surveyId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${surveyId}/responses`, {
      params: { companyId },
    });
  }
}

