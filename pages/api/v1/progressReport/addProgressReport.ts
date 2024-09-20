// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import { NextApiHandler } from 'next';
import withErrorHandling from '~src/api-middlewares/withErrorHandling';
import { isProposalTypeValid, isValidNetwork } from '~src/api-utils';
import { postsByTypeRef } from '~src/api-utils/firestore_refs';
import authServiceInstance from '~src/auth/auth';
import { MessageType } from '~src/auth/types';
import getTokenFromReq from '~src/auth/utils/getTokenFromReq';
import messages from '~src/auth/utils/messages';
import storeApiKeyUsage from '~src/api-middlewares/storeApiKeyUsage';
import { Post } from '~src/types';

const handler: NextApiHandler<MessageType> = async (req, res) => {
	try {
		storeApiKeyUsage(req);

		if (req.method !== 'POST') {
			return res.status(405).json({ message: 'Invalid request method, POST required.' });
		}

		const network = String(req.headers['x-network']);
		if (!network || !isValidNetwork(network)) {
			return res.status(400).json({ message: messages.INVALID_NETWORK });
		}

		const token = getTokenFromReq(req);
		if (!token) {
			return res.status(400).json({ message: messages.INVALID_JWT });
		}

		const user = await authServiceInstance.GetUser(token);
		if (!user) {
			return res.status(403).json({ message: messages.UNAUTHORISED });
		}

		const { postId, proposalType, progress_report } = req.body;

		if (!postId || !proposalType || !progress_report) {
			return res.status(400).json({ message: messages.INVALID_PARAMS });
		}

		if (isNaN(postId) || !isProposalTypeValid(proposalType)) {
			return res.status(500).json({ message: messages.INVALID_PARAMS });
		}

		const postDocRef = postsByTypeRef(network, proposalType).doc(String(postId));
		const postDoc = await postDocRef.get();

		if (!postDoc.exists) {
			return res.status(404).json({ message: 'Post not found.' });
		}

		const updatedPost: Partial<Post> = {
			progress_report
		};

		await postDocRef.update(updatedPost);

		return res.status(200).json({ message: 'Progress report added and post updated successfully.' });
	} catch (error) {
		console.error('Error in updating progress report:', error);
		return res.status(500).json({ message: 'An error occurred while processing the request.' });
	}
};

export default withErrorHandling(handler);
