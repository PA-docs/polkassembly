import { FormInstance } from "antd";
import BN from "bn.js";
import { ProposalType } from "~src/global/proposalType";
import { ILastVote } from "~src/types";

export enum EFormType {
	AYE_NAY_FORM = 'aye-nay-form',
	SPLIT_FORM = 'split-form',
	ABSTAIN_FORM = 'abstain-form'
}

export interface IAbstainOptions {
	formName: EFormType;
	form: FormInstance<any>;
	handleSubmit: () => void;
	onBalanceChange: (pre: BN) => void;
	onAyeValueChange?: (pre: BN) => void;
	onNayValueChange?: (pre: BN) => void;
	onAbstainValueChange?: (pre: BN) => void;
	className?: string;
	forSpecificPost?: boolean;
	showConvictionBar?: boolean;
	isUsedInTinderWebView?: boolean;
}

export interface IDefaultOptions {
	theme?: string;
	forSpecificPost?: boolean;
	postEdit?: any;
}

export interface IOptionsWrapper {
	className?: string;
	referendumId?: number | null | undefined;
	onAccountChange: (address: string) => void;
	lastVote: ILastVote | undefined;
	setLastVote: (pre: ILastVote) => void;
	proposalType: ProposalType;
	address: string;
	theme?: string;
	trackNumber?: number;
	forSpecificPost?: boolean;
	postEdit?: any;
}
export interface INetworkWalletErr {
	message: string;
	description: string;
	error: number;
}