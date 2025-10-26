import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject, forkJoin, Observable } from "rxjs";
import { map, catchError, finalize, mapTo } from "rxjs/operators";
const URL = `${environment.url}/api/corporateAdmins/users`;
@Injectable({
  providedIn: "root",
})
export class UsersService {
  public loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  constructor(private http: HttpClient) {}

  /**
   * get all corporate admins
   * @param filter
   * @param sortOrder
   * @param pageNumber
   * @param pageSize
   */
  getUsers(filter, sortOrder, pageNumber, pageSize): Observable<any> {
    this.loadingSubject.next(true);
    return this.http
      .get(URL, {
        params: new HttpParams()
          .set("filter", filter)
          .set("sortOrder", sortOrder)
          .set("pageNumber", pageNumber)
          .set("pageSize", pageSize),
      })
      .pipe(
        map((res) => res["documents"]),
        finalize(() => {
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * get total users numbers
   */
  getToalNumbersUsers() {
    return this.http.get(`${URL}/count`).pipe(
      map((res) => res["documentNumbers"]),
      catchError((err) => {
        throw err;
      })
    );
  }

  /**
   * get monthly user report
   */
  getUserMonthlyReport() {
    return this.http.get(`${environment.url}/api/monthlyReports/users`).pipe(
      map((res) => res["documents"]),
      catchError((err) => {
        throw err;
      })
    );
  }

  /**
   * get total onboarded user numbers
   */
  getNumbersOfOnboardedUsers() {
    return this.http.get(`${URL}/count/onboarded`).pipe(
      map((res) => res["onboardedDocumentNumbers"]),
      catchError((err) => {
        throw err;
      })
    );
  }

  /**
   * get total supported user numbers
   */
  getNumbersOfSupportedUsers() {
    return this.http.get(`${environment.url}/api/monthlyReports/supported`).pipe(
      map((res) => res["supportedDocumentNumbers"]),
      catchError((err) => {
        throw err;
      })
    );
  }
  /**
   *
   * @param id
   */
  getUserById(id) {
    return this.http.get(`${URL}/${id}`).pipe(
      map((res) => res["document"]),
      catchError((err) => {
        throw err;
      })
    );
  }

  /**
   * add new corporate admin
   * @param admin
   */
  addUser(userProperties) {
    this.loadingSubject.next(true);
    return this.http.post(URL, userProperties).pipe(
      mapTo(true),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   *
   * @param id
   * @param properties
   */
  updateUser(id, properties) {
    this.loadingSubject.next(true);
    return this.http.put(`${URL}/${id}`, properties).pipe(
      mapTo(true),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  moveUser(user, company) {
    this.loadingSubject.next(true);
    return this.http.post(`${URL}/move`, { user: user, company: company }).pipe(
      mapTo(true),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  batchUploadUsers(users) {
    this.loadingSubject.next(true);
    return this.http.post(`${URL}/batchUpload`, users).pipe(
      map((res) => res["message"]),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  assignMemberships(users) {
    this.loadingSubject.next(true);
    return this.http.post(`${URL}/assignMemberships`, users).pipe(
      map((res) => res["message"]),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }
  firstLoading(filter, sortOrder, pageNumber, pageSize) {
    return forkJoin([
      this.getToalNumbersUsers(),
      this.getUsers(filter, sortOrder, pageNumber, pageSize),
      this.getNumbersOfOnboardedUsers(),
      this.getNumbersOfSupportedUsers(),
    ]).pipe(
      catchError((err) => {
        throw err;
      })
    );
  }
}
