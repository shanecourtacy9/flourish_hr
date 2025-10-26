import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject, forkJoin, Observable } from "rxjs";
import { map, catchError, finalize, mapTo } from "rxjs/operators";
const URL = `${environment.url}/api`;
@Injectable({
  providedIn: "root",
})
export class ViewershipService {
  constructor(private http: HttpClient) {}
  public loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  getViewershipStats(startDate, endDate, company): Observable<any> {
    this.loadingSubject.next(true);
    return this.http
      .get(`${URL}/viewership/stats`, {
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
}
