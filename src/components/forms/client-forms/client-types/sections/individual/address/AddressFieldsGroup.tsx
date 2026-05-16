import { AddressInput } from "@/components/forms/client-forms/client-types/sections/individual/address/AddressInput";
import { FormInput } from "@/components/forms/shared";
import type { AddressFieldPrefix } from "@/types";

export const AddressFieldsGroup = ({
	prefix,
}: {
	prefix: AddressFieldPrefix;
}) => {
	return (
		<div className="space-y-4 flex-col items-stretch h-full">
			<AddressInput
				label="Адрес (улица, номер дома)"
				name={`${prefix}.address`}
				prefix={prefix}
				placeholder="Начните вводить адрес..."
				required
			/>
			<div className="grid grid-cols-2 gap-3">
				<FormInput required name={`${prefix}.country`} label="Страна" />
				<FormInput required name={`${prefix}.city`} label="Город" />
			</div>
			<div className="grid grid-cols-2 gap-3">
				<FormInput required name={`${prefix}.region`} label="Регион" />
				<FormInput required name={`${prefix}.index`} label="Индекс" />
			</div>
		</div>
	);
};
