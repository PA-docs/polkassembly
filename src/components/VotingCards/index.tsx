// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React, { FC, useMemo, useRef, useState } from 'react';
import TinderCard from 'react-tinder-card';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { batchVotesActions } from '~src/redux/batchVoting';
import { useAppDispatch } from '~src/redux/store';
import { useBatchVotesSelector, useNetworkSelector, useUserDetailsSelector } from '~src/redux/selectors';
import SwipeActionButtons from './SwipeActionButtons';
import TinderCardsComponent from './TinderCardsComponent';
import dynamic from 'next/dynamic';
import { Skeleton } from 'antd';
import nextApiClientFetch from '~src/util/nextApiClientFetch';
import { ProposalType } from '~src/global/proposalType';
const CartOptionMenu = dynamic(() => import('./CartOptionMenu'), {
	loading: () => <Skeleton active />,
	ssr: false
});

interface IVotingCards {
	trackPosts?: any;
}

const VotingCards: FC<IVotingCards> = (props) => {
	const { trackPosts } = props;
	const { total_proposals_added_in_Cart, show_cart_menu, batch_vote_details, total_active_posts, voted_post_ids_array } = useBatchVotesSelector();
	const dispatch = useAppDispatch();
	const user = useUserDetailsSelector();
	const { network } = useNetworkSelector();
	const [activeProposal, setActiveProposals] = useState(trackPosts);
	const [currentIndex, setCurrentIndex] = useState(activeProposal?.length - 1);
	const currentIndexRef = useRef(currentIndex);

	const childRefs: any = useMemo(
		() =>
			Array(activeProposal?.length)
				.fill(0)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.map((i) => React.createRef()),
		[activeProposal?.length]
	);

	const updateCurrentIndex = (val: any) => {
		setCurrentIndex(val);
		currentIndexRef.current = val;
	};

	const canGoBack = currentIndex < activeProposal?.length - 1;

	const addVotedPostToDB = async (postId: number, direction: string) => {
		console.log('hello postid --> ', postId);
		const { data, error } = await nextApiClientFetch<any>('api/v1/votes/batch-votes-cart/addBatchVoteToCart', {
			vote: {
				balance:
					direction === 'left' ? batch_vote_details?.nyeVoteBalance : direction === 'right' ? batch_vote_details?.ayeVoteBalance : batch_vote_details?.abstainVoteBalance || '0',
				decision: direction === 'left' ? 'nay' : direction === 'right' ? 'aye' : 'Abstain',
				locked_period: batch_vote_details?.conviction || '0x',
				network: network,
				referendum_index: postId,
				user_address: user?.loginAddress
			}
		});
		if (error) {
			console.error(error);
			return;
		} else {
			console.log(data);
		}
	};

	const getActiveProposals = async () => {
		const { data, error } = await nextApiClientFetch<any>('api/v1/posts/non-voted-active-proposals', {
			isExternalApiCall: true,
			network: network,
			proposalType: ProposalType.REFERENDUM_V2,
			skippedIndexes: voted_post_ids_array,
			userAddress: user?.loginAddress,
			userId: user?.id
		});
		if (error) {
			console.error(error);
			return;
		} else {
			console.log(data);
			dispatch(batchVotesActions.setVotedPostsIdsArray([]));
			setActiveProposals(data);
		}
	};

	const swiped = async (direction: string, index: number, postId: number, postTitle: string) => {
		dispatch(batchVotesActions.setShowCartMenu(true));
		dispatch(batchVotesActions.setVotedProposalId(postId));
		dispatch(batchVotesActions.setTotalVotesAddedInCart(total_proposals_added_in_Cart + 1));
		dispatch(batchVotesActions.setTotalActivePosts(total_active_posts + 1));
		dispatch(
			batchVotesActions.setvoteCardInfo({
				abstainAyeBalance: direction === 'left' || direction === 'right' ? '0' : batch_vote_details?.abstainAyeVoteBalance,
				abstainNayBalance: direction === 'left' || direction === 'right' ? '0' : batch_vote_details?.abstainNyeVoteBalance,
				decision: direction === 'left' ? 'nay' : direction === 'right' ? 'aye' : 'Abstain',
				post_id: postId,
				post_title: postTitle,
				voteBalance:
					direction === 'left' ? batch_vote_details?.nyeVoteBalance : direction === 'right' ? batch_vote_details?.ayeVoteBalance : batch_vote_details?.abstainVoteBalance,
				voteConviction: batch_vote_details?.conviction || '0x'
			})
		);
		updateCurrentIndex(index - 1);
		addVotedPostToDB(postId, direction);
		if (total_active_posts > 5) {
			dispatch(batchVotesActions.setTotalActivePosts(0));
			getActiveProposals();
		}
	};

	const outOfFrame = (name: string, idx: number) => {
		currentIndexRef.current >= idx && childRefs[idx].current.restoreCard();
	};

	const goBack = async () => {
		if (!canGoBack) return;
		const newIndex = currentIndex + 1;
		updateCurrentIndex(newIndex);
		await childRefs[newIndex].current.restoreCard();
	};

	return (
		<div className='mb-8 flex h-screen w-full flex-col items-center'>
			<div className='mb-4 flex w-full justify-between'>
				<button
					className='mr-auto flex h-[24px] w-[24px] items-center justify-center rounded-full border-none bg-[#ffffff] drop-shadow-2xl'
					onClick={() => goBack()}
				>
					<LeftOutlined className='text-black' />
				</button>
				<p className='m-0 p-0 text-base font-semibold text-bodyBlue'>Active Proposals</p>
				<button
					className='ml-auto flex h-[24px] w-[24px] items-center justify-center rounded-full border-none bg-[#ffffff] drop-shadow-2xl'
					onClick={() => goBack()}
				>
					<RightOutlined className='text-black' />
				</button>
			</div>
			<div className={`relative ${show_cart_menu ? 'h-[640px]' : 'h-[700px]'} w-full max-w-sm`}>
				{activeProposal?.map((proposal: any, index: number) => (
					<TinderCard
						ref={childRefs[index]}
						className='absolute h-full w-full'
						key={proposal.name}
						onSwipe={(dir) => {
							swiped(dir, index, proposal?.id, proposal?.title);
						}}
						onCardLeftScreen={() => outOfFrame(proposal.title, index)}
						preventSwipe={['down']}
					>
						<div className='h-full overflow-y-auto bg-[#f4f5f7] dark:bg-black'>
							<TinderCardsComponent proposal={proposal} />
						</div>
					</TinderCard>
				))}
			</div>
			<SwipeActionButtons
				trackPosts={activeProposal}
				currentIndex={currentIndex}
				childRefs={childRefs}
			/>
			{show_cart_menu && <CartOptionMenu />}
		</div>
	);
};

export default VotingCards;
