"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useUnsavedChanges } from "@/store/unsaved-changes.store";

export function UnsavedChangesGuard() {
	const { data: session } = useSession();
	const user = session?.user ?? null;
	const isDirty = useUnsavedChanges((state) => state.isDirty);

	useEffect(() => {
		if (user) return;
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isDirty) {
				e.preventDefault();
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty, user]);

	return null;
}
