import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const API = 'http://127.0.0.1:3000';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('getProfile() sin token -> lanza Error("No access token")', () => {
    expect(() => service.getProfile()).toThrowError('No access token');
  });

  it('getProfile() con token -> GET /api/me con Authorization', (done) => {
    localStorage.setItem('spotify_access_token', 'token-123');

    service.getProfile().subscribe({
      next: (profile) => {
        expect(profile).toEqual({ user_id: 'u1' } as any);
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne(`${API}/api/me`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush({ user_id: 'u1' });
  });

  it('getProfile() con 401/TOKEN_EXPIRED -> refresh -> guarda tokens -> retry GET /api/me con token nuevo', (done) => {
    localStorage.setItem('spotify_access_token', 'old-token');
    localStorage.setItem('spotify_refresh_token', 'refresh-1');

    const saveSpy = spyOn(service, 'saveTokens').and.callThrough();

    service.getProfile().subscribe({
      next: (profile) => {
        expect(profile).toEqual({ user_id: 'u1', user_name: 'name1' } as any);
        expect(saveSpy).toHaveBeenCalled();
        expect(localStorage.getItem('spotify_access_token')).toBe('new-access');
        expect(localStorage.getItem('spotify_refresh_token')).toBe('new-refresh');
        expect(localStorage.getItem('user_id')).toBe('u1');
        expect(localStorage.getItem('user_name')).toBe('name1');
        done();
      },
      error: done.fail,
    });

    const first = httpMock.expectOne(`${API}/api/me`);
    expect(first.request.headers.get('Authorization')).toBe('Bearer old-token');
    first.flush({ code: 'TOKEN_EXPIRED' }, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne(`${API}/api/auth/refresh`);
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.body).toEqual({ refresh_token: 'refresh-1' });
    refresh.flush({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      user_id: 'u1',
      user_name: 'name1',
    });

    const retry = httpMock.expectOne(`${API}/api/me`);
    expect(retry.request.method).toBe('GET');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({ user_id: 'u1', user_name: 'name1' });
  });

  it('si refresh falla -> llama handleExpiredToken() y propaga error', (done) => {
    localStorage.setItem('spotify_access_token', 'old-token');
    localStorage.setItem('spotify_refresh_token', 'refresh-1');

    // Importante: NO ejecutamos la redirección real ni el logout HTTP aquí;
    // solo verificamos que se invoca el handler.
    const expiredSpy = spyOn(service, 'handleExpiredToken').and.stub();

    service.getProfile().subscribe({
      next: () => done.fail('Expected error'),
      error: (err) => {
        expect(expiredSpy).toHaveBeenCalled();
        expect(err).toBeTruthy();
        done();
      },
    });

    const first = httpMock.expectOne(`${API}/api/me`);
    first.flush({ code: 'TOKEN_EXPIRED' }, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne(`${API}/api/auth/refresh`);
    refresh.flush({ message: 'refresh failed' }, { status: 500, statusText: 'Server Error' });
  });
});

