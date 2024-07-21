// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import { Button } from 'antd';
import { useRouter } from 'next/router';
import React from 'react';
import CustomButton from '~src/basic-components/buttons/CustomButton';
import { batchVotesActions } from '~src/redux/batchVoting';
import { useBatchVotesSelector } from '~src/redux/selectors';
import { useAppDispatch } from '~src/redux/store';
import ImageIcon from '~src/ui-components/ImageIcon';
import nextApiClientFetch from '~src/util/nextApiClientFetch';

const CartOptionMenu = () => {
	const { total_proposals_added_in_Cart, post_ids_array } = useBatchVotesSelector();
	const router = useRouter();
	const dispatch = useAppDispatch();

	const deletePostDetails = async (post_ids: number[]) => {
		const post_ids_strings = post_ids.map((id) => id?.toString());
		console.log(post_ids_strings);
		const { data, error } = await nextApiClientFetch<any>('api/v1/votes/batch-votes-cart/deleteBatchVotesCart', {
			ids: post_ids_strings
		});
		if (error) {
			console.error(error);
			return;
		} else {
			console.log(data);
		}
	};

	const emptyCart = async () => {
		console.log('heelo lets delete');
		dispatch(batchVotesActions.setShowCartMenu(false));
		dispatch(batchVotesActions.setTotalVotesAddedInCart(0));
		dispatch(batchVotesActions.setVotesCardInfoArray([0]));
		deletePostDetails(post_ids_array);
	};

	return (
		<article className='flex h-[56px] w-full items-center justify-center gap-x-6 bg-white p-4 drop-shadow-2xl'>
			<p className='m-0 mr-auto p-0 text-xs text-bodyBlue'>{total_proposals_added_in_Cart} proposal added</p>
			<div className='ml-auto flex gap-x-1'>
				<CustomButton
					variant='primary'
					text='View cart'
					height={36}
					width={91}
					fontSize='xs'
					onClick={() => {
						router.push('/batch-voting/cart');
					}}
				/>
				<Button
					className='flex h-[36px] w-[36px] items-center justify-center rounded-lg border border-solid border-pink_primary bg-transparent'
					onClick={() => {
						emptyCart();
					}}
				>
					<ImageIcon
						src='/assets/icons/bin-icon.svg'
						alt='bin-icon'
					/>
				</Button>
			</div>
		</article>
	);
};

export default CartOptionMenu;
