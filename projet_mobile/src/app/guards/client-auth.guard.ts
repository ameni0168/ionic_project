import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

export const clientAuthGuard: CanActivateFn = (_route, state) => {
  const api = inject(ApiService);
  const router = inject(Router);
  const redirectTo = state.url || '/post-job';

  if (!api.isLoggedIn()) {
    return router.createUrlTree(['/welcome'], {
      queryParams: { redirectTo },
    });
  }

  if (api.getUserRole() !== 'client') {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { redirectTo },
    });
  }

  return true;
};
