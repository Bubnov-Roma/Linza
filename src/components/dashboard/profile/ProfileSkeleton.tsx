"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton({
	variant = "form",
}: {
	variant?: "form" | "profile";
}) {
	if (variant === "profile") {
		return (
			<div className="max-w-xl mx-auto px-4 py-6 space-y-5">
				{/* Hero card */}
				<div className="card-hero">
					<div className="flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6">
						<Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shrink-0" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-7 w-40" />
							<Skeleton className="h-4 w-28" />
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex items-center justify-between">
					<div className="tabs-group flex gap-1">
						<Skeleton className="h-9 w-20 rounded-2xl" />
						<Skeleton className="h-9 w-24 rounded-2xl" />
					</div>
					<Skeleton className="h-6 w-20 rounded-full" />
				</div>

				{/* Section cards */}
				{[...Array(3)].map((_, i) => (
					<div key={i} className="card-surface">
						<div className="card-section-header">
							<Skeleton className="h-4 w-24" />
						</div>
						<div className="divide-y divide-foreground/5">
							{[...Array(2)].map((_, j) => (
								<div key={j} className="detail-row">
									<div className="flex items-center gap-3">
										<Skeleton className="w-4 h-4 rounded" />
										<Skeleton className="h-4 w-16" />
									</div>
									<Skeleton className="h-4 w-28" />
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		);
	}

	// variant === "form"
	return (
		<div className="max-w-4xl mx-auto space-y-4">
			<div className="rounded-[32px] border border-foreground/5 bg-card/50 overflow-hidden">
				<div className="px-2 md:px-6 py-10 space-y-8">
					{/* Step title */}
					<Skeleton className="h-8 w-52" />

					{/* Two columns */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						<div className="space-y-5">
							<Skeleton className="h-3 w-28" />
							<div className="space-y-2">
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-11 w-full rounded-xl" />
							</div>
							<div className="grid grid-cols-2 gap-3">
								{[...Array(2)].map((_, i) => (
									<div key={i} className="space-y-2">
										<Skeleton className="h-3 w-20" />
										<Skeleton className="h-11 w-full rounded-xl" />
									</div>
								))}
							</div>
						</div>
						<div className="space-y-5">
							<Skeleton className="h-3 w-36" />
							<div className="grid grid-cols-2 gap-3">
								{[...Array(2)].map((_, i) => (
									<div key={i} className="space-y-2">
										<Skeleton className="h-3 w-20" />
										<Skeleton className="h-11 w-full rounded-xl" />
									</div>
								))}
							</div>
							<div className="space-y-2">
								<Skeleton className="h-3 w-20" />
								<Skeleton className="h-24 w-full rounded-xl" />
							</div>
						</div>
					</div>

					{/* Navigation */}
					<div className="flex items-center justify-between pt-4">
						<Skeleton className="h-10 w-20 rounded-xl" />
						<div className="flex gap-2">
							{[...Array(3)].map((_, i) => (
								<Skeleton key={i} className="w-10 h-10 rounded-xl" />
							))}
						</div>
						<Skeleton className="h-10 w-20 rounded-xl" />
					</div>
				</div>
			</div>
		</div>
	);
}
