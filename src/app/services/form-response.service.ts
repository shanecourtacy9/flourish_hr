import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { catchError, finalize, map, mapTo, tap } from "rxjs/operators";
import { BehaviorSubject } from "rxjs";
@Injectable({
  providedIn: "root",
})
export class FormResponseService {
  loading: any;
  url = `${environment.url}/api/form`;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  constructor(private http: HttpClient) {}

  /**
   *
   * @param id
   */
  getResponseByProgrammeId(id) {
    this.loadingSubject.next(true);

    return this.http.get(`${this.url}/programme/${id}`).pipe(
      map((res) => res["documents"]),
      finalize(() => {
        this.loadingSubject.next(false);
      }),
      catchError((e) => {
        this.loadingSubject.next(false);

        let error = e.error.message;
        throw error;
      })
    );
  }
  /**
   *
   * @param note id
   * @param changed fields
   */
  updateResponse(id, changedFields) {
    return this.http.put(`${this.url}/${id}`, changedFields).pipe(
      mapTo(true),
      catchError((e) => {
        let error = e.error.message;
        throw error;
      })
    );
  }
}
