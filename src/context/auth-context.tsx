import { createContext, useCallback, useMemo, type ReactNode } from 'react';
import { authClient } from '@/lib/auth-client';
import { resolveAuthError } from '@/lib/auth-errors';
import type { LoginForm, RegisterForm } from '@/lib/validators';

export interface AppSession {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

type AuthContextValue = {
  status: AuthStatus;
  session: AppSession | null;
  signIn: (input: LoginForm) => Promise<void>;
  signUp: (input: RegisterForm) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function sessionToAppSession(session: NonNullable<ReturnType<typeof authClient.useSession>['data']>): AppSession {
  const user = session.user as Record<string, unknown>;
  return {
    user: {
      id: session.user.id,
      firstName: (user.firstName as string) ?? session.user.name?.split(' ')[0] ?? '',
      lastName: (user.lastName as string) ?? session.user.name?.split(' ').slice(1).join(' ') ?? '',
      email: session.user.email,
      phone: (user.phone as string) ?? undefined,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  const status: AuthStatus = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';

  const appSession: AppSession | null = session ? sessionToAppSession(session) : null;

  const signIn = useCallback(async (input: LoginForm) => {
    console.log('[Auth] Iniciando sesión para:', input.email);
    const { error } = await authClient.signIn.email({
      email: input.email,
      password: input.password,
    });
    if (error) {
      console.error('[Auth] Error en signIn:', error);
      throw new Error(resolveAuthError(error));
    }
    console.log('[Auth] Sesión iniciada correctamente');
  }, []);

  const signUp = useCallback(async (input: RegisterForm) => {
    console.log('[Auth] Registrando usuario:', input.email);
    const { error } = await (authClient.signUp.email as (p: Record<string, unknown>) => ReturnType<typeof authClient.signUp.email>)({
      email: input.email,
      password: input.password,
      name: `${input.firstName.trim()} ${input.lastName.trim()}`,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone,
    });
    if (error) {
      console.error('[Auth] Error en signUp:', error);
      throw new Error(resolveAuthError(error));
    }
    console.log('[Auth] Usuario registrado correctamente');
  }, []);

  const signOut = useCallback(async () => {
    console.log('[Auth] Cerrando sesión...');
    await authClient.signOut();
    console.log('[Auth] Sesión cerrada correctamente');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session: appSession, signIn, signUp, signOut }),
    [status, appSession, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
