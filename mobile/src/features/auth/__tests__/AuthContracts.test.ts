import {
  AuthError,
  AuthErrorCode,
  AuthResult,
  AuthSession,
  AuthUser,
  SignInCredentials,
  SignUpDetails,
  unavailableAuthService,
  UnavailableAuthService
} from '../index';

describe('Feature 04.1.1 — Authentication Domain Contracts & Architecture', () => {
  describe('AuthUser Domain Model', () => {
    it('creates a valid minimal AuthUser with required fields', () => {
      const user: AuthUser = {
        id: 'usr_2100_core_alpha',
        email: 'passenger@waymark.local',
        displayName: 'Transit Passenger'
      };

      expect(user.id).toBe('usr_2100_core_alpha');
      expect(user.email).toBe('passenger@waymark.local');
      expect(user.displayName).toBe('Transit Passenger');
      expect(user.avatarUrl).toBeUndefined();
      expect(user.emailVerified).toBeUndefined();
    });

    it('supports optional avatarUrl, emailVerified and createdAt fields', () => {
      const user: AuthUser = {
        id: 'usr_2100_verified',
        email: 'pilot@waymark.local',
        displayName: 'Chief Pilot',
        avatarUrl: 'https://cdn.waymark.local/avatars/pilot.png',
        emailVerified: true,
        createdAt: '2026-11-20T10:00:00.000Z'
      };

      expect(user.avatarUrl).toBe('https://cdn.waymark.local/avatars/pilot.png');
      expect(user.emailVerified).toBe(true);
      expect(user.createdAt).toBe('2026-11-20T10:00:00.000Z');
    });

    it('ensures no password or sensitive hash fields exist on AuthUser', () => {
      const user: AuthUser = {
        id: 'usr_test_safe',
        email: 'safe@waymark.local',
        displayName: 'Safe User'
      };

      // Compile-time and runtime check that credentials are not part of user model
      expect((user as unknown as Record<string, unknown>).password).toBeUndefined();
      expect((user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
      expect((user as unknown as Record<string, unknown>).secretKey).toBeUndefined();
    });
  });

  describe('AuthSession Domain Model', () => {
    it('models a genuine provider-issued session with token metadata', () => {
      const user: AuthUser = {
        id: 'usr_session_owner',
        email: 'rider@waymark.local',
        displayName: 'Transit Rider'
      };

      const futureExpiry = Date.now() + 3600 * 1000;
      const session: AuthSession = {
        accessToken: 'opaque_provider_jwt_token_payload',
        refreshToken: 'opaque_provider_refresh_token',
        expiresAt: futureExpiry,
        tokenType: 'Bearer',
        user
      };

      expect(session.accessToken).toBe('opaque_provider_jwt_token_payload');
      expect(session.refreshToken).toBe('opaque_provider_refresh_token');
      expect(session.expiresAt).toBe(futureExpiry);
      expect(session.tokenType).toBe('Bearer');
      expect(session.user.id).toBe('usr_session_owner');
    });

    it('prohibits credentials or passwords within session representations', () => {
      const session: AuthSession = {
        accessToken: 'token_abc',
        expiresAt: Date.now() + 60000,
        user: {
          id: 'u1',
          email: 'test@waymark.local',
          displayName: 'Test'
        }
      };

      expect((session as unknown as Record<string, unknown>).password).toBeUndefined();
    });
  });

  describe('AuthError Domain Modeling', () => {
    const errorCodes: AuthErrorCode[] = [
      'NOT_CONFIGURED',
      'INVALID_CREDENTIALS',
      'NETWORK_UNAVAILABLE',
      'SESSION_EXPIRED',
      'UNAUTHORIZED',
      'RATE_LIMITED',
      'PROVIDER_UNAVAILABLE',
      'UNKNOWN'
    ];

    it.each(errorCodes)('instantiates structured error with code: %s', (code) => {
      const error = new AuthError(code, `Test error message for ${code}`);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthError);
      expect(error.name).toBe('AuthError');
      expect(error.code).toBe(code);
      expect(error.message).toBe(`Test error message for ${code}`);
    });

    it('factory methods create standardized sanitized error instances', () => {
      const notConfigured = AuthError.notConfigured();
      expect(notConfigured.code).toBe('NOT_CONFIGURED');
      expect(notConfigured.message).toContain('not configured');

      const invalidCreds = AuthError.invalidCredentials();
      expect(invalidCreds.code).toBe('INVALID_CREDENTIALS');
      expect(invalidCreds.message).toBe('Invalid email or password.');

      const expired = AuthError.sessionExpired();
      expect(expired.code).toBe('SESSION_EXPIRED');

      const netUnavailable = AuthError.networkUnavailable();
      expect(netUnavailable.code).toBe('NETWORK_UNAVAILABLE');

      const rateLimited = AuthError.rateLimited();
      expect(rateLimited.code).toBe('RATE_LIMITED');

      const provUnavailable = AuthError.providerUnavailable();
      expect(provUnavailable.code).toBe('PROVIDER_UNAVAILABLE');

      const unknownErr = AuthError.unknown('Custom message', { reason: 'timeout' });
      expect(unknownErr.code).toBe('UNKNOWN');
      expect(unknownErr.details).toEqual({ reason: 'timeout' });
    });
  });

  describe('AuthResult Modeling', () => {
    it('models successful authentication outcome', () => {
      const result: AuthResult = {
        success: true,
        session: {
          accessToken: 'token_valid',
          expiresAt: Date.now() + 10000,
          user: { id: 'u_ok', email: 'ok@waymark.local', displayName: 'OK' }
        }
      };

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('models registration requiring out-of-band verification', () => {
      const result: AuthResult = {
        success: true,
        requiresVerification: true,
        user: { id: 'u_pending', email: 'pending@waymark.local', displayName: 'Pending' }
      };

      expect(result.success).toBe(true);
      expect(result.requiresVerification).toBe(true);
      expect(result.session).toBeUndefined();
    });

    it('models failure outcome with typed AuthError', () => {
      const result: AuthResult = {
        success: false,
        error: AuthError.invalidCredentials()
      };

      expect(result.success).toBe(false);
      expect(result.session).toBeUndefined();
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('UnavailableAuthService Implementation Safety Policy', () => {
    let service: UnavailableAuthService;

    beforeEach(() => {
      service = new UnavailableAuthService();
    });

    it('reports not_configured service readiness', () => {
      expect(service.getServiceReadiness()).toBe('not_configured');
      expect(unavailableAuthService.getServiceReadiness()).toBe('not_configured');
    });

    it('getCurrentSession returns null without creating fake sessions', async () => {
      const session = await service.getCurrentSession();
      expect(session).toBeNull();
    });

    it('signIn rejects any credentials with NOT_CONFIGURED error outcome', async () => {
      const credentials: SignInCredentials = {
        email: 'pilot@waymark.local',
        password: 'SuperSecretPassword123!'
      };

      const result = await service.signIn(credentials);

      expect(result.success).toBe(false);
      expect(result.session).toBeUndefined();
      expect(result.user).toBeUndefined();
      expect(result.error).toBeInstanceOf(AuthError);
      expect(result.error?.code).toBe('NOT_CONFIGURED');
    });

    it('signUp rejects registration with NOT_CONFIGURED error outcome and does not invent user accounts', async () => {
      const details: SignUpDetails = {
        email: 'newuser@waymark.local',
        password: 'Password987!',
        displayName: 'New Traveler'
      };

      const result = await service.signUp(details);

      expect(result.success).toBe(false);
      expect(result.session).toBeUndefined();
      expect(result.user).toBeUndefined();
      expect(result.error).toBeInstanceOf(AuthError);
      expect(result.error?.code).toBe('NOT_CONFIGURED');
    });

    it('signOut resolves safely and idempotently without errors', async () => {
      await expect(service.signOut()).resolves.toBeUndefined();
    });

    it('ensures no mock authentication success can be elicited from unavailable service', async () => {
      // Trying common default or test accounts must never succeed
      const testCases: SignInCredentials[] = [
        { email: 'admin@waymark.local', password: 'admin' },
        { email: 'test@waymark.local', password: 'password' },
        { email: 'guest@waymark.local', password: '' }
      ];

      for (const cred of testCases) {
        const res = await service.signIn(cred);
        expect(res.success).toBe(false);
        expect(res.session).toBeUndefined();
        expect(res.error?.code).toBe('NOT_CONFIGURED');
      }
    });
  });
});
