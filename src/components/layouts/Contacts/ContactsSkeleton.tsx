export default function ContactsSkeleton() {
	return (
		<div className="container mx-auto px-4 max-w-6xl space-y-12 animate-pulse pt-4">
			<div className="space-y-4 max-w-2xl">
				<div className="h-16 sm:h-20 bg-foreground/5 rounded-2xl w-3/4" />
				<div className="h-6 sm:h-8 bg-foreground/5 rounded-lg w-1/2" />
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
				<div className="lg:col-span-5 flex flex-col gap-8">
					<div className="grid grid-cols-1 gap-4">
						<div className="h-22 bg-foreground/5 rounded-2xl" />
						<div className="h-22 bg-foreground/5 rounded-2xl" />
						<div className="grid grid-cols-3 gap-3">
							<div className="h-24 bg-foreground/5 rounded-2xl" />
							<div className="h-24 bg-foreground/5 rounded-2xl" />
							<div className="h-24 bg-foreground/5 rounded-2xl" />
						</div>
					</div>
					<div className="h-90 bg-foreground/5 rounded-[32px]" />
				</div>
				<div className="lg:col-span-7 h-112.5 lg:h-182.5 bg-foreground/5 rounded-[32px] w-full" />
			</div>
		</div>
	);
}
