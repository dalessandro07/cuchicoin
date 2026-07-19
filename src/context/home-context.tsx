/**
 * Home context. Tracks the current home for the authenticated user and its
 * finance data (members, categories, recent movements, balance). All data is
 * server-backed (Turso) via the finance API, so it syncs across devices.
 *
 *   loading      -> hydrating from the server
 *   needs-home   -> authenticated, home list loaded, no active home selected
 *   in-home      -> a home is selected and its detail is loaded
 */

import { useAuth } from "@/hooks/use-auth";
import { useHomeRealtime } from "@/hooks/use-home-realtime";
import { useKeyedEffect } from "@/hooks/use-mount-effect";
import { financeApi, type HomeDetail } from "@/lib/api-client";
import type {
	Balance,
	Category,
	CategoryType,
	Home,
	Member,
	TransactionView,
} from "@/lib/db-types";
import {
	createContext,
	type ReactNode,
	useCallback,
	useRef,
	useState,
} from "react";

export type HomeStatus = "loading" | "needs-home" | "in-home";

export type HomeMembership = {
	home: Home;
	membership: Member;
};

export type CreateTransactionArgs = {
	type: CategoryType;
	amount: number;
	categoryId?: string | null;
	description?: string;
	date?: number;
};

export type CreateCategoryArgs = {
	name: string;
	type: CategoryType;
	icon: string;
	color: string;
};

export type HomeContextValue = {
	status: HomeStatus;
	homes: HomeMembership[];
	currentHome: Home | null;
	currentMember: Member | null;
	members: Member[];
	categories: Category[];
	recentTransactions: TransactionView[];
	balance: Balance;
	isSyncing: boolean;
	/** Increments on every finance mutation so screens can refetch on-demand. */
	dataVersion: number;
	selectHome: (homeId: string) => Promise<void>;
	clearHome: () => void;
	createHome: (input: {
		name: string;
		currency: "PEN" | "USD";
	}) => Promise<Home>;
	joinHome: (input: { inviteCode: string }) => Promise<Home>;
	leaveHome: () => Promise<void>;
	removeMember: (memberId: string) => Promise<void>;
	refresh: () => Promise<void>;
	syncNow: () => Promise<void>;
	createTransaction: (input: CreateTransactionArgs) => Promise<void>;
	updateTransaction: (
		id: string,
		input: Partial<CreateTransactionArgs>,
	) => Promise<void>;
	deleteTransaction: (id: string) => Promise<void>;
	createCategory: (input: CreateCategoryArgs) => Promise<Category>;
	updateCategory: (
		id: string,
		input: Partial<Omit<CreateCategoryArgs, "type">>,
	) => Promise<Category>;
	deleteCategory: (id: string) => Promise<void>;
};

const EMPTY_BALANCE: Balance = {
	incomeCents: 0,
	expenseCents: 0,
	balanceCents: 0,
};

export const HomeContext = createContext<HomeContextValue | null>(null);

export function HomeProvider({ children }: { children: ReactNode }) {
	const { session, status: authStatus } = useAuth();
	const [status, setStatus] = useState<HomeStatus>("loading");
	const [homes, setHomes] = useState<HomeMembership[]>([]);
	const [detail, setDetail] = useState<HomeDetail | null>(null);
	const [isSyncing, setIsSyncing] = useState(false);
	const [dataVersion, setDataVersion] = useState(0);
	const detailRef = useRef<HomeDetail | null>(null);
	detailRef.current = detail;

	const loadForUser = useCallback(async () => {
		const listed = await financeApi.listHomes();
		setHomes(listed);
		setDetail(null);
		setStatus("needs-home");
	}, []);

	const refreshDetail = useCallback(async () => {
		const active = detailRef.current;
		if (!active) return;
		const loaded = await financeApi.getHomeDetail(active.home.id);
		setDetail(loaded);
		setDataVersion((v) => v + 1);
	}, []);

	// Auth-driven external sync. The effect lives inside a reusable hook.
	const sessionUserId = session?.user.id ?? null;
	const key =
		authStatus === "authenticated" && sessionUserId
			? sessionUserId
			: authStatus;
	useKeyedEffect(key, () => {
		if (authStatus === "loading") {
			setStatus("loading");
			return;
		}
		if (authStatus !== "authenticated" || !sessionUserId) {
			setHomes([]);
			setDetail(null);
			setStatus("needs-home");
			return;
		}
		setStatus("loading");
		loadForUser().catch((err) => {
			console.error("[HomeProvider] loadForUser failed:", err);
			setHomes([]);
			setDetail(null);
			setStatus("needs-home");
		});
	});

	const selectHome = useCallback<HomeContextValue["selectHome"]>(
		async (homeId) => {
			const loaded = await financeApi.getHomeDetail(homeId);
			setDetail(loaded);
			setStatus("in-home");
			setDataVersion((v) => v + 1);
		},
		[],
	);

	const clearHome = useCallback<HomeContextValue["clearHome"]>(() => {
		setDetail(null);
		setStatus("needs-home");
	}, []);

	const createHome = useCallback<HomeContextValue["createHome"]>(
		async (input) => {
			const { home, membership } = await financeApi.createHome(
				input.name.trim(),
				input.currency,
			);
			const loaded = await financeApi.getHomeDetail(home.id);
			setHomes((prev) => [{ home, membership }, ...prev]);
			setDetail(loaded);
			setStatus("in-home");
			setDataVersion((v) => v + 1);
			return home;
		},
		[],
	);

	const joinHome = useCallback<HomeContextValue["joinHome"]>(async (input) => {
		const { home, membership } = await financeApi.joinHome(
			input.inviteCode.trim().toUpperCase(),
		);
		const loaded = await financeApi.getHomeDetail(home.id);
		setHomes((prev) => [{ home, membership }, ...prev]);
		setDetail(loaded);
		setStatus("in-home");
		setDataVersion((v) => v + 1);
		return home;
	}, []);

	const leaveHome = useCallback<HomeContextValue["leaveHome"]>(async () => {
		if (!detail) return;
		await financeApi.leaveHome(detail.home.id);
		setDetail(null);
		setStatus("loading");
		await loadForUser();
		setDataVersion((v) => v + 1);
	}, [detail, loadForUser]);

	const removeMember = useCallback<HomeContextValue["removeMember"]>(
		async (memberId) => {
			const activeHomeId = detailRef.current?.home.id;
			if (!activeHomeId) throw new Error("No hay un hogar activo");
			await financeApi.removeMember(activeHomeId, memberId);
			await refreshDetail();
		},
		[refreshDetail],
	);

	/** Reloads the home list and keeps the active home if the user still belongs. */
	const refresh = useCallback<HomeContextValue["refresh"]>(async () => {
		const listed = await financeApi.listHomes();
		setHomes(listed);
		const activeId = detailRef.current?.home.id;
		if (activeId && listed.some((h) => h.home.id === activeId)) {
			const loaded = await financeApi.getHomeDetail(activeId);
			setDetail(loaded);
			setStatus("in-home");
		} else if (activeId) {
			setDetail(null);
			setStatus("needs-home");
		}
		setDataVersion((v) => v + 1);
	}, []);

	const syncNow = useCallback<HomeContextValue["syncNow"]>(async () => {
		setIsSyncing(true);
		try {
			await refreshDetail();
		} finally {
			setIsSyncing(false);
		}
	}, [refreshDetail]);

	const homeId = detail?.home.id ?? null;

	useHomeRealtime(homeId, status === "in-home" && !!homeId, refreshDetail);

	const createTransaction = useCallback<HomeContextValue["createTransaction"]>(
		async (input) => {
			if (!homeId) throw new Error("No hay un hogar activo");
			await financeApi.createTransaction({ homeId, ...input });
			await refreshDetail();
		},
		[homeId, refreshDetail],
	);

	const updateTransaction = useCallback<HomeContextValue["updateTransaction"]>(
		async (id, input) => {
			await financeApi.updateTransaction(id, input);
			await refreshDetail();
		},
		[refreshDetail],
	);

	const deleteTransaction = useCallback<HomeContextValue["deleteTransaction"]>(
		async (id) => {
			await financeApi.deleteTransaction(id);
			await refreshDetail();
		},
		[refreshDetail],
	);

	const createCategory = useCallback<HomeContextValue["createCategory"]>(
		async (input) => {
			if (!homeId) throw new Error("No hay un hogar activo");
			const category = await financeApi.createCategory({ homeId, ...input });
			await refreshDetail();
			return category;
		},
		[homeId, refreshDetail],
	);

	const updateCategory = useCallback<HomeContextValue["updateCategory"]>(
		async (id, input) => {
			const category = await financeApi.updateCategory(id, input);
			await refreshDetail();
			return category;
		},
		[refreshDetail],
	);

	const deleteCategory = useCallback<HomeContextValue["deleteCategory"]>(
		async (id) => {
			await financeApi.deleteCategory(id);
			await refreshDetail();
		},
		[refreshDetail],
	);

	const value: HomeContextValue = {
		status,
		homes,
		currentHome: detail?.home ?? null,
		currentMember: detail?.membership ?? null,
		members: detail?.members ?? [],
		categories: detail?.categories ?? [],
		recentTransactions: detail?.recentTransactions ?? [],
		balance: detail?.balance ?? EMPTY_BALANCE,
		isSyncing,
		dataVersion,
		selectHome,
		clearHome,
		createHome,
		joinHome,
		leaveHome,
		removeMember,
		refresh,
		syncNow,
		createTransaction,
		updateTransaction,
		deleteTransaction,
		createCategory,
		updateCategory,
		deleteCategory,
	};

	return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}
