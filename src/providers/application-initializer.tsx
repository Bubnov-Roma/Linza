"use client";

import { useRef } from "react";
import { useApplicationStore } from "@/store/use-application.store";
import type { ClientApplication } from "@/types";

export function ApplicationInitializer({
	initialData,
	displayName,
	children,
}: {
	userId: string | null;
	initialData: ClientApplication | null;
	displayName: string | null;
	children: React.ReactNode;
}) {
	const { setInitialState } = useApplicationStore();
	const isInitialized = useRef(false);

	if (!isInitialized.current) {
		setInitialState(
			initialData?.status || "NO_APPLICATION",
			initialData?.applicationData || null,
			displayName
		);
		isInitialized.current = true;
	}

	return <>{children}</>;
}
