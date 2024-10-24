// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

export interface CuratorData {
	lastSixMonthGraphData: { [key: string]: number };
	activeBounties: {
		count: number;
		amount: string;
	};
	allBounties: {
		count: number;
		amount: string;
	};
	childBounties: {
		count: number;
		totalAmount: string;
		unclaimedAmount: string;
	};
}