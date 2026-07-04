/**
 * Home context. Tracks the current home for the authenticated user.
 *
 *   loading     -> hydrating from DB and (optionally) syncing from cloud
 *   no-home     -> user is authenticated but not a member of any home
 *   in-home     -> user belongs to at least one home; the most recent is loaded
 */

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { categoriesRepository } from '@/lib/categories-repository';
import type { Category, Home, Member } from '@/lib/db-types';
import { homeSync } from '@/lib/home-sync';
import { homesRepository } from '@/lib/homes-repository';
import { membersRepository } from '@/lib/members-repository';
import { useAuth } from '@/hooks/use-auth';

export type HomeStatus = 'loading' | 'no-home' | 'in-home';

export type HomeContextValue = {
  status: HomeStatus;
  currentHome: Home | null;
  currentMember: Member | null;
  members: Member[];
  categories: Category[];
  isSyncing: boolean;
  createHome: (input: { name: string }) => Promise<Home>;
  joinHome: (input: { inviteCode: string }) => Promise<Home>;
  leaveHome: () => Promise<void>;
  refresh: () => Promise<void>;
  syncNow: () => Promise<void>;
};

export const HomeContext = createContext<HomeContextValue | null>(null);

type LoadedHome = {
  home: Home;
  currentMember: Member;
  members: Member[];
  categories: Category[];
};

export function HomeProvider({ children }: { children: ReactNode }) {
  const { session, status: authStatus } = useAuth();
  const [status, setStatus] = useState<HomeStatus>('loading');
  const [loaded, setLoaded] = useState<LoadedHome | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  const loadForUser = useCallback(async (userId: string) => {
    setIsSyncing(true);
    try {
      await homeSync.pull();
    } finally {
      setIsSyncing(false);
    }

    const memberships = await membersRepository.listByUser(userId);
    if (memberships.length === 0) {
      setLoaded(null);
      setStatus('no-home');
      return;
    }

    const activeMember = memberships[0];
    const home = await homesRepository.getById(activeMember.homeId);
    if (!home) {
      await membersRepository.removeByUserAndHome(userId, activeMember.homeId);
      setLoaded(null);
      setStatus('no-home');
      return;
    }
    const [homeMembers, homeCategories] = await Promise.all([
      membersRepository.listByHome(home.id),
      categoriesRepository.listByHome(home.id),
    ]);
    setLoaded({ home, currentMember: activeMember, members: homeMembers, categories: homeCategories });
    setStatus('in-home');
  }, []);

  // Reset / load based on auth state. We use this effect for *external* sync
  // (auth changes) so it's exempt from the no-effect-for-derived-state rule.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus((prev) => (authStatus === 'loading' ? 'loading' : prev === 'loading' ? 'no-home' : prev));

    if (authStatus !== 'authenticated' || !session) {
      setLoaded(null);
      lastUserIdRef.current = null;
      return;
    }
    const userId = session.user.id;
    if (lastUserIdRef.current === userId && loaded) return;
    lastUserIdRef.current = userId;
    setStatus('loading');
    loadForUser(userId).catch((err) => {
      console.error('[HomeProvider] loadForUser failed:', err);
      setLoaded(null);
      setStatus('no-home');
    });
    // loadForUser and loaded are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, session?.user.id]);

  const createHome = useCallback<HomeContextValue['createHome']>(
    async (input) => {
      if (!session) throw new Error('No hay sesión activa');
      const trimmedName = input.name.trim();
      const home = await homesRepository.create({ name: trimmedName });
      const member = await membersRepository.add({
        homeId: home.id,
        userId: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
        role: 'admin',
      });
      await categoriesRepository.seedDefaults(home.id, member.id);
      await homeSync.push();
      await loadForUser(session.user.id);
      return home;
    },
    [session, loadForUser],
  );

  const joinHome = useCallback<HomeContextValue['joinHome']>(
    async (input) => {
      if (!session) throw new Error('No hay sesión activa');
      const code = input.inviteCode.trim().toUpperCase();
      const home = await homesRepository.getByInviteCode(code);
      if (!home) {
        throw new Error('Código de invitación no encontrado');
      }
      const existing = await membersRepository.findByUserAndHome(session.user.id, home.id);
      if (existing) {
        throw new Error('Ya perteneces a este hogar');
      }
      await membersRepository.add({
        homeId: home.id,
        userId: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
        role: 'member',
      });
      await homeSync.push();
      await loadForUser(session.user.id);
      return home;
    },
    [session, loadForUser],
  );

  const leaveHome = useCallback<HomeContextValue['leaveHome']>(async () => {
    if (!session || !loaded) return;
    const { home, currentMember } = loaded;
    const otherAdmins = loaded.members.filter((m) => m.id !== currentMember.id && m.role === 'admin');
    if (currentMember.role === 'admin' && otherAdmins.length === 0) {
      const otherMembers = loaded.members.filter((m) => m.id !== currentMember.id);
      if (otherMembers.length > 0) {
        throw new Error('Promueve a otro miembro a administrador antes de salir');
      }
      await homesRepository.delete(home.id);
    } else {
      await membersRepository.removeByUserAndHome(session.user.id, home.id);
    }
    await homeSync.push();
    await loadForUser(session.user.id);
  }, [session, loaded, loadForUser]);

  const refresh = useCallback<HomeContextValue['refresh']>(async () => {
    if (!session) return;
    await loadForUser(session.user.id);
  }, [session, loadForUser]);

  const syncNow = useCallback<HomeContextValue['syncNow']>(async () => {
    setIsSyncing(true);
    try {
      await homeSync.push();
      if (session) await loadForUser(session.user.id);
    } finally {
      setIsSyncing(false);
    }
  }, [session, loadForUser]);

  const value: HomeContextValue = {
    status,
    currentHome: loaded?.home ?? null,
    currentMember: loaded?.currentMember ?? null,
    members: loaded?.members ?? [],
    categories: loaded?.categories ?? [],
    isSyncing,
    createHome,
    joinHome,
    leaveHome,
    refresh,
    syncNow,
  };

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}
