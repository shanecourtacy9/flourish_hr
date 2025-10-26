import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject, forkJoin, Observable } from "rxjs";
import { map, catchError, finalize, mapTo } from "rxjs/operators";
const URL = `${environment.url}/api`;
@Injectable({
  providedIn: "root",
})
export class ScheduledSessionService {
  constructor(private http: HttpClient) {}
  public loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  /**
   * get total users numbers
   */
  getTotalNumbersDocuments(type, startDate, endDate) {
    return this.http
      .get(`${URL}/scheduledSessions/count`, {
        params: new HttpParams()
          .set("type", type)
          .set("startDate", startDate)
          .set("endDate", endDate),
      })
      .pipe(
        map((res) => res["documentNumbers"]),
        catchError((err) => {
          throw err;
        })
      );
  }

  getUtilisation(startDate, endDate, company): Observable<any> {
    this.loadingSubject.next(true);
    return this.http
      .get(`${URL}/scheduledSessions/utilisation`, {
        params: new HttpParams()
          .set("startDate", startDate)
          .set("company", company)
          .set("endDate", endDate),
      })
      .pipe(
        map((res) => res["data"]),
        finalize(() => {
          this.loadingSubject.next(false);
        })
      );
  }

  getFeedback(startDate, endDate): Observable<any> {
    this.loadingSubject.next(true);
    return this.http
      .get(`${URL}/scheduledSessions/commentTitleRating`, {
        params: new HttpParams()
          .set("startDate", startDate)
          .set("endDate", endDate),
      })
      .pipe(
        map((res) => res),
        finalize(() => {
          this.loadingSubject.next(false);
        })
      );
  }
}
