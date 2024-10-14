// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { NextApiHandler } from 'next';
import storeApiKeyUsage from '~src/api-middlewares/storeApiKeyUsage';
import withErrorHandling from '~src/api-middlewares/withErrorHandling';
import { isValidNetwork } from '~src/api-utils';
import { postsByTypeRef } from '~src/api-utils/firestore_refs';
import authServiceInstance from '~src/auth/auth';
import { CreatePostResponseType } from '~src/auth/types';
import getTokenFromReq from '~src/auth/utils/getTokenFromReq';
import messages from '~src/auth/utils/messages';
import { ProposalType } from '~src/global/proposalType';
import { EAllowedCommentor, Post } from '~src/types';
import getSubstrateAddress from '~src/util/getSubstrateAddress';

const handler: NextApiHandler<CreatePostResponseType> = async (req, res) => {
	storeApiKeyUsage(req);

	if (req.method !== 'POST') return res.status(405).json({ message: 'Invalid request method, POST required.' });

	const network = String(req.headers['x-network']);
	if (!network || !isValidNetwork(network)) return res.status(400).json({ message: messages.INVALID_NETWORK });

	const { content, title, postId, proposerAddress, allowedCommentors, link, tags } = req.body;
	if (!content || !title || !postId || !proposerAddress) return res.status(400).json({ message: messages.INVALID_PARAMS });

	if (allowedCommentors && !Array.isArray(allowedCommentors)) {
		return res.status(400).json({ message: messages?.INVALID_PARAMS });
	}

	const token = getTokenFromReq(req);
	if (!token) return res.status(400).json({ message: 'Invalid token' });

	const user = await authServiceInstance.GetUser(token);
	if (!user) return res.status(403).json({ message: messages.UNAUTHORISED });

	const substrateProposerAddr = getSubstrateAddress(proposerAddress);

	if (!substrateProposerAddr) {
		return res.status(400).json({
			message: 'Invalid proposerAddress in req body'
		});
	}

	const postDocRef = postsByTypeRef(network, ProposalType.CHILD_BOUNTIES).doc(String(postId));

	const postDoc = await postDocRef.get();

	if (postDoc.exists) {
		if (postDoc?.data()?.id && !isNaN(postDoc?.data()?.id)) return res.status(403).json({ message: `Post with id ${postId} already exists.` });
	}

	const last_comment_at = new Date();
	const newPost: Post = {
		allowedCommentors: allowedCommentors || [EAllowedCommentor.ALL],
		content,
		createdOnPolkassembly: true,
		created_at: new Date(),
		id: postId,
		isDeleted: false,
		last_comment_at,
		last_edited_at: last_comment_at,
		link: link || '',
		post_link: null,
		proposer_address: proposerAddress,
		tags: tags || [],
		title,
		topic_id: 4,
		user_id: user.id
	};

	await postDocRef
		.set(newPost)
		.then(() => {
			return res.status(200).json({ message: 'Child Bounty successfully created, it will appear on polkassembly as soon as it is synced on chain.', post_id: postId });
		})
		.catch((error) => {
			console.error('Error saving post: ', error);
			return res.status(500).json({ message: 'Error saving post' });
		});
};

export default withErrorHandling(handler);
