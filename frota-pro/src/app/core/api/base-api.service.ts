import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export abstract class BaseApiService {
  protected readonly apiUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}
}
