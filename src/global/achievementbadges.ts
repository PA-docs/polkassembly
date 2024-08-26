// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { BadgeName } from '~src/auth/types';

export interface BadgeDetails {
	description: string;
	img: string;
	name: BadgeName;
	requirements: string;
}

export const badgeNames = ['Decentralised Voice', 'Fellow', 'Council Member', 'Active Voter', 'Whale', 'Steadfast Commentor', 'GM Voter', 'Popular Delegate'];

export const badgeDetails: BadgeDetails[] = [
	{
		description: 'Awarded to Polkadot delegates who have significant influence.',
		img: '/assets/badges/decentralised_voice_polkadot.png',
		name: BadgeName.DECENTRALISED_VOICE_POLKADOT,
		requirements: 'Must be a delegate on the Polkadot network.'
	},
	{
		description: 'Awarded to Kusama delegates who have significant influence.',
		img: '',
		name: BadgeName.DECENTRALISED_VOICE_KUSAMA,
		requirements: 'Must be a delegate on the Kusama network.'
	},
	{
		description: 'Rank 1 and above Fellow.',
		img: '',
		name: BadgeName.FELLOW,
		requirements: 'Must achieve a rank of 1 or higher.'
	},
	{
		description: 'Member of the governance council.',
		img: '',
		name: BadgeName.COUNCIL,
		requirements: 'Must be a member of the governance council.'
	},
	{
		description: 'Actively participates in voting on proposals.',
		img: '',
		name: BadgeName.ACTIVE_VOTER,
		requirements: 'Must vote on at least 15% of proposals with a minimum of 5 proposals.'
	},
	{
		description: 'Holds a significant amount of voting power.',
		img: '',
		name: BadgeName.WHALE,
		requirements: 'Must have voting power equal to or greater than 0.05% of the total supply.'
	},
	{
		description: 'Regularly contributes comments.',
		img: '',
		name: BadgeName.STEADFAST_COMMENTOR,
		requirements: 'Must have more than 50 comments.'
	},
	{
		description: 'Regularly votes on proposals.',
		img: '',
		name: BadgeName.GM_VOTER,
		requirements: 'Must have voted on more than 50 proposals.'
	},
	{
		description: 'Received significant delegated tokens.',
		img: '',
		name: BadgeName.POPULAR_DELEGATE,
		requirements: 'Must have received delegated tokens equal to or greater than 0.01% of the total supply.'
	}
];
