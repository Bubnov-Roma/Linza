"use client";

import { FinalBlock } from "@/components/forms/client-forms/client-types/sections/individual/contacts/FinalBlock";
import { ReferralsBlock } from "@/components/forms/client-forms/client-types/sections/individual/contacts/ReferralsBlock";
import {
	SectionColumn,
	SectionWrapper,
} from "@/components/forms/client-forms/shared";
import { SocialsBlock } from "./SocialsBlock";

export const ContactsSection = () => {
	return (
		<SectionWrapper className="lg:grid-cols-2">
			<SectionColumn title="Соцсети и источники" indicatorColor="bg-sky-400">
				<SocialsBlock />
				<ReferralsBlock />
			</SectionColumn>
			<SectionColumn title="Согласие" indicatorColor="bg-rose-500" isLast>
				<FinalBlock />
			</SectionColumn>
		</SectionWrapper>
	);
};
