// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import { BN } from 'bn.js';
import { NextApiHandler } from 'next';
import storeApiKeyUsage from '~src/api-middlewares/storeApiKeyUsage';
import withErrorHandling from '~src/api-middlewares/withErrorHandling';
import { isValidNetwork } from '~src/api-utils';
import { postsByTypeRef } from '~src/api-utils/firestore_refs';
import { MessageType } from '~src/auth/types';
import messages from '~src/auth/utils/messages';
import { ProposalType } from '~src/global/proposalType';
import { bountyStatus } from '~src/global/statuses';
import { GET_ALL_BOUNTIES, GET_ALL_CHILD_BOUNTIES_BY_PARENT_INDEX } from '~src/queries';
import fetchSubsquid from '~src/util/fetchSubsquid';
import { getSubSquareContentAndTitle } from '../../posts/subsqaure/subsquare-content';

export interface IBounty {
	proposer: string;
	index: number;
	status: string;
	reward: string;
	payee: string;
	title: string;
	curator: string;
	totalChildBountiesCount: number;
	claimedAmount: string;
	categories: string[];
}

interface ISubsquidBounty {
	proposer: string;
	index: number;
	status: string;
	reward: string;
	payee: string;
	curator: string;
}
const ZERO_BN = new BN(0);
const BOUNTIES_LISTING_LIMIT = 10;

const handler: NextApiHandler<{ bounties: IBounty[]; totalBountiesCount: number } | MessageType> = async (req, res) => {
	storeApiKeyUsage(req);

	try {
		const network = String(req.headers['x-network']);
		if (!network || !isValidNetwork(network)) return res.status(400).json({ message: messages.INVALID_NETWORK });

		const { page = 1 } = req.body;

		if (Number.isNaN(page)) return res.status(400).json({ message: messages.INVALID_PARAMS });

		const subsquidBountiesRes = await fetchSubsquid({
			network,
			query: GET_ALL_BOUNTIES,
			variables: {
				limit: 10,
				offset: BOUNTIES_LISTING_LIMIT * (page - 1)
			}
		});
		if (!subsquidBountiesRes?.data?.bounties?.length) return res.status(200).json({ message: 'No bounty data found' });

		const subsquidBountiesData = subsquidBountiesRes?.data?.bounties;
		const totalBounties = subsquidBountiesRes?.data?.totalBounties?.totalCount || 0;

		const bountiesIndexes = subsquidBountiesData.map((bounty: { index: number }) => bounty?.index);

		const bountiesDocs = await postsByTypeRef(network, ProposalType.BOUNTIES).where('id', 'in', bountiesIndexes).get();

		const bountiesPromises = subsquidBountiesData.map(async (subsquidBounty: ISubsquidBounty) => {
			const subsquidChildBountiesRes = await fetchSubsquid({
				network,
				query: GET_ALL_CHILD_BOUNTIES_BY_PARENT_INDEX,
				variables: {
					parentBountyIndex_eq: subsquidBounty?.index
				}
			});

			const subsquidChildBountyData = subsquidChildBountiesRes?.data?.proposals || [];
			const totalChildBountiesCount = subsquidChildBountiesRes?.data?.proposalsConnection?.totalCount || 0;

			let claimedAmount = ZERO_BN;

			subsquidChildBountyData.map((childBounty: { status: string; reward: string }) => {
				const amount = new BN(childBounty?.reward || 0);

				if ([bountyStatus.CLAIMED, bountyStatus.AWARDED].includes(childBounty.status)) {
					claimedAmount = claimedAmount.add(amount);
				}
			});

			const payload: IBounty = {
				categories: [],
				claimedAmount: claimedAmount.toString(),
				curator: subsquidBounty?.curator,
				index: subsquidBounty.index,
				payee: subsquidBounty?.payee,
				proposer: subsquidBounty?.proposer,
				reward: subsquidBounty?.reward,
				status: subsquidBounty?.status,
				title: '',
				totalChildBountiesCount: totalChildBountiesCount || 0
			};

			bountiesDocs?.docs?.map((bountyDoc) => {
				if (bountyDoc?.exists) {
					const bountyData = bountyDoc?.data();
					if (bountyData?.id == subsquidBounty.index) {
						payload.title = bountyData?.title || '';
						payload.categories = bountyData?.tags || [];
					}
				}
			});

			if (!payload?.title) {
				const res = await getSubSquareContentAndTitle(ProposalType.BOUNTIES, network, subsquidBounty?.index);
				payload.title = res?.title || '';
			}

			return payload;
		});

		const bountiesResults = await Promise.allSettled(bountiesPromises);

		const bounties: IBounty[] = [];

		bountiesResults?.map((bounty) => {
			if (bounty.status == 'fulfilled') {
				bounties.push(bounty?.value);
			}
		});

		return res.status(200).json({ bounties: bounties || [], totalBountiesCount: totalBounties });
	} catch (error) {
		return res.status(500).json({ message: error || messages.API_FETCH_ERROR });
	}
};

export default withErrorHandling(handler);
