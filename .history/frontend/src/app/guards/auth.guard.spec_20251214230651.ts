import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, loginGuard } from './auth.guard';

describe('auth.guard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('authGuard: sin token -> navega a /login y devuelve false', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(result).toBeFalse();
  });

  it('authGuard: con token -> devuelve true y NO navega', () => {
    authService.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(router.navigate).not.toHaveBeenCalled();
    expect(result).toBeTrue();
  });

  it('loginGuard: con token -> navega a /app/feed y devuelve false', () => {
    authService.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      loginGuard({} as any, {} as any)
    );

    expect(router.navigate).toHaveBeenCalledWith(['/app/feed']);
    expect(result).toBeFalse();
  });

  it('loginGuard: sin token -> devuelve true', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      loginGuard({} as any, {} as any)
    );

    expect(router.navigate).not.toHaveBeenCalled();
    expect(result).toBeTrue();
  });
});

