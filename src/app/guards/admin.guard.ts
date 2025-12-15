import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const ROLE_CLAIM_KEYS = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/roles',
];

function parseToken(token: string): Record<string, any> | null {
  if (!token.includes('.')) {
    return null;
  }
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%'.concat(('00' + c.charCodeAt(0).toString(16)).slice(-2)))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT token payload', error);
    return null;
  }
}

function hasAdminRole(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const payload = parseToken(token);
  if (!payload) {
    return false;
  }

  let roles: string[] = [];

  for (const key of ROLE_CLAIM_KEYS) {
    const value = payload[key];
    if (!value) {
      continue;
    }

    if (Array.isArray(value)) {
      roles = value;
      break;
    }

    if (typeof value === 'string') {
      // Roles may be comma separated or a single value
      roles = value.split(',').map((role) => role.trim());
      break;
    }
  }

  return roles.some((role) => role?.toLowerCase() === 'admin');
}

/**
 * Guard to restrict admin-only routes.
 * Verifies JWT token exists in local storage and contains the Admin role.
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  const isAdmin = hasAdminRole(token);

  if (!isAdmin) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
