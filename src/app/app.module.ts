import { BrowserModule } from "@angular/platform-browser";
import { NgModule, ErrorHandler } from "@angular/core";
import {
  LocationStrategy,
  HashLocationStrategy,
  PathLocationStrategy,
} from "@angular/common";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { MaterialsModule } from "./materials/materials.module";
import { JwtModule } from "@auth0/angular-jwt";
import { HttpRequestInterceptor } from "./error/http-loading.interceptor";
import { GlobalErrorHandler } from "./error/global-error-handler";
import { ErrorStateMatcher } from "@angular/material/core";
import { TouchedErrorStateMatcher } from "./error/touched-error-state.matcher";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

export function tokenGetter() {
  return localStorage.getItem("access_token");
}
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MaterialsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
      },
    }),
    NgbModule,
  ],
  providers: [
    // { provide: LocationStrategy, useClass: HashLocationStrategy },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpRequestInterceptor,
      multi: true,
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: ErrorStateMatcher, useClass: TouchedErrorStateMatcher },
    { provide: LocationStrategy, useClass: PathLocationStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
