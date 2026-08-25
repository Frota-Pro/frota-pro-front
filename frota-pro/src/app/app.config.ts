import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
  LOCALE_ID,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { GoogleChartsModule } from 'angular-google-charts';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { authErrorInterceptor } from './core/auth/auth-error.interceptor';
import { apiErrorInterceptor } from './core/api/api-error.interceptor';

// '@angular/common/locales/pt' é o pt-BR (Brasil é o "padrão" do CLDR pra
// português — Portugal fica em 'pt-PT'). Registra os dados de formatação
// (separador de milhar ".", decimal "," etc.) pros pipes date/currency/number.
registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        authErrorInterceptor,
        apiErrorInterceptor
      ])
    ),
    { provide: LOCALE_ID, useValue: 'pt-BR' },

    importProvidersFrom(GoogleChartsModule),
  ],
};
