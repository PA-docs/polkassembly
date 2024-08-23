// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import { NextApiHandler } from 'next';
import withErrorHandling from '~src/api-middlewares/withErrorHandling';
import { isValidNetwork } from '~src/api-utils';
import { postsByTypeRef } from '~src/api-utils/firestore_refs';
import authServiceInstance from '~src/auth/auth';
import { MessageType } from '~src/auth/types';
import getTokenFromReq from '~src/auth/utils/getTokenFromReq';
import messages from '~src/auth/utils/messages';
import storeApiKeyUsage from '~src/api-middlewares/storeApiKeyUsage';
import { Post } from '~src/types';
import fetchSubsquid from '~src/util/fetchSubsquid';
import { CHECK_IF_OPENGOV_PROPOSAL_EXISTS } from '~src/queries';

const handler: NextApiHandler<MessageType> = async (req, res) => {
	storeApiKeyUsage(req);

	if (req.method !== 'POST') return res.status(405).json({ message: 'Invalid request method, POST required.' });

	const network = String(req.headers['x-network']);
	if (!network || !isValidNetwork(network)) return res.status(400).json({ message: 'Invalid network in request header' });

	const { postId, proposalType, progress_report } = req.body;

	if (!progress_report) {
		return res.status(400).json({ message: 'Missing progress_report in request body' });
	}

	if (!postId || !proposalType) return res.status(400).json({ message: 'Missing parameters in request body' });

	// const token = getTokenFromReq(req);
	// if (!token) return res.status(400).json({ message: 'Invalid token' });

	// const user = await authServiceInstance.GetUser(token);
	// if (!user) return res.status(403).json({ message: messages.UNAUTHORISED });

	const postDocRef = postsByTypeRef(network, proposalType).doc(String(postId));
	const postDoc = await postDocRef.get();

	const TreasuryRes = await fetchSubsquid({
		network: network,
		query: CHECK_IF_OPENGOV_PROPOSAL_EXISTS,
		variables: {
			proposalIndex: Number(postId),
			type_eq: proposalType
		}
	});

	console.log('inside api call ', TreasuryRes)

	if (!postDoc.exists) return res.status(404).json({ message: 'Post not found.' });

	//uncomment above part
	// const isAuthor = TreasuryRes?.proposer === user.id;

	// const isAuthor = post?.user_id === user.id;
	// if (!isAuthor) return res.status(403).json({ message: messages.UNAUTHORISED });

	// Update the post object with the progress_report field
	const updatedPost: Partial<Post> = {
		id: Number(postId), // Add the progress_report field
		progress_report
	};

	// Update the Firestore document with the new progress_report
	await postDocRef.update(updatedPost);

	return res.status(200).json({ message: 'Progress report added and post updated successfully.' });
};

export default withErrorHandling(handler);
