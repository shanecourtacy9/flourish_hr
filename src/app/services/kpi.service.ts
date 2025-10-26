import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class KpiService {
  private baseUrl = `${environment.url}/api/challengeRecords`;
  constructor(private http: HttpClient) {}

  getCompanyChallengeStats(options: {
    startDate?: Date | string;
    endDate?: Date | string;
    company?: string;
    granularity?: "monthly" | "quarterly" | "yearly";
  }): Observable<any> {
    let params = new HttpParams();
    if (options?.startDate)
      params = params.set(
        "startDate",
        typeof options.startDate === "string"
          ? options.startDate
          : (options.startDate as Date).toISOString()
      );
    if (options?.endDate)
      params = params.set(
        "endDate",
        typeof options.endDate === "string"
          ? options.endDate
          : (options.endDate as Date).toISOString()
      );
    if (options?.company) params = params.set("company", options.company);
    if (options?.granularity) params = params.set("granularity", options.granularity);

    return this.http
      .get(`${this.baseUrl}/company-stats`, { params })
      .pipe(map((res) => res));
  }
}


