// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React, { FC, useMemo, useRef, useState } from 'react';
import TinderCard from 'react-tinder-card';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { batchVotesActions } from '~src/redux/batchVoting';
import { useAppDispatch } from '~src/redux/store';
import { useBatchVotesSelector } from '~src/redux/selectors';
import SwipeActionButtons from './SwipeActionButtons';
import CartOptionMenu from './CartOptionMenu';
import TinderCardsComponent from './TinderCardsComponent';
// import PostHeading from '../Post/PostHeading';

interface IVotingCards {
	trackPosts?: any;
}

const VotingCards: FC<IVotingCards> = (props) => {
	const { trackPosts } = props;
	const { total_proposals_added_in_Cart, show_cart_menu } = useBatchVotesSelector();
	const dispatch = useAppDispatch();
	const [currentIndex, setCurrentIndex] = useState(trackPosts?.length - 1);
	const currentIndexRef = useRef(currentIndex);

	const childRefs: any = useMemo(
		() =>
			Array(trackPosts?.length)
				.fill(0)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.map((i) => React.createRef()),
		[trackPosts?.length]
	);

	const updateCurrentIndex = (val: any) => {
		setCurrentIndex(val);
		currentIndexRef.current = val;
	};

	const canGoBack = currentIndex < trackPosts?.length - 1;

	const swiped = (direction: string, index: number, postId: number, postTitle: string) => {
		dispatch(batchVotesActions.setShowCartMenu(true));
		dispatch(batchVotesActions.setTotalVotesAddedInCart(total_proposals_added_in_Cart + 1));
		dispatch(
			batchVotesActions.setvoteCardInfo({
				post_id: postId,
				post_title: postTitle,
				voted_for: direction === 'left' ? 'Nye' : direction === 'right' ? 'Aye' : 'Abstain'
			})
		);
		updateCurrentIndex(index - 1);
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
				{trackPosts?.map((proposal: any, index: number) => (
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
						<div className='h-full overflow-y-auto bg-[#f4f5f7]'>
							<TinderCardsComponent proposal={proposal} />
						</div>
					</TinderCard>
				))}
			</div>
			<SwipeActionButtons
				trackPosts={trackPosts}
				currentIndex={currentIndex}
				childRefs={childRefs}
			/>
			{show_cart_menu && <CartOptionMenu />}
		</div>
	);
};

export default VotingCards;
