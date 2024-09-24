// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { GetServerSideProps } from 'next';
import { getOnChainPost, IPostResponse } from 'pages/api/v1/posts/on-chain-post';
import React, { FC, memo, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Post from 'src/components/Post/Post';
import BackToListingView from 'src/ui-components/BackToListingView';
import { ErrorState } from 'src/ui-components/UIStates';
import { getNetworkFromReqHeaders } from '~src/api-utils';
import LoadingState from '~src/basic-components/Loading/LoadingState';
import { noTitle } from '~src/global/noTitle';
import { networkTrackInfo } from '~src/global/post_trackInfo';
import { ProposalType } from '~src/global/proposalType';
import SEOHead from '~src/global/SEOHead';
import { setNetwork } from '~src/redux/network';
import { useGlobalSelector } from '~src/redux/selectors';
import ConfusionModal from '~src/ui-components/ConfusionModal';
import ImageIcon from '~src/ui-components/ImageIcon';
import checkRouteNetworkWithRedirect from '~src/util/checkRouteNetworkWithRedirect';

const proposalType = ProposalType.OPEN_GOV;
export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
	const { id } = query;

	const network = getNetworkFromReqHeaders(req.headers);

	const networkRedirect = checkRouteNetworkWithRedirect(network);
	if (networkRedirect) return networkRedirect;

	const { data, error, status } = await getOnChainPost({
		network,
		postId: id,
		proposalType
	});
	return { props: { error, network, post: data, status } };
};

interface IReferendaPostProps {
	post: IPostResponse;
	error?: string;
	network: string;
	status?: number;
}

const ReferendaPost: FC<IReferendaPostProps> = (props) => {
	const { post, error, network } = props;
	const dispatch = useDispatch();
	const { is_sidebar_collapsed } = useGlobalSelector();
	useEffect(() => {
		dispatch(setNetwork(props.network));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const [isModalOpen, setModalOpen] = useState(false);

	if (error) return <ErrorState errorMessage={error} />;

	if (post) {
		let trackName = '';
		for (const key of Object.keys(networkTrackInfo[props.network])) {
			if (networkTrackInfo[props.network][key].trackId == post.track_number && !('fellowshipOrigin' in networkTrackInfo[props.network][key])) {
				trackName = key;
			}
		}
		return (
			<>
				<SEOHead
					title={post.title || `${noTitle} - Referenda V2`}
					desc={post.content}
					network={network}
				/>
				<div
					className={`bg-gradient-to-r-pink absolute left-0 top-0 flex w-full gap-2  ${
						is_sidebar_collapsed ? 'pl-28' : 'pl-[265px]'
					}  font-poppins  text-[12px] font-medium text-white`}
				>
					<p className='pt-3 '>Confused about making a decision?</p>
					<div
						onClick={() => {
							setModalOpen(true);
						}}
						className=' mt-2 flex h-6 cursor-pointer gap-2 rounded-md bg-[#0000004D] bg-opacity-[30%] px-2 pt-1'
					>
						<ImageIcon
							src='/assets/icons/transformedshare.svg'
							alt='share icon'
							className='h-4 w-4'
						/>
						<p className=''>Share proposal</p>
					</div>
					<p className='pt-3'>with a friend to get their opinion!</p>
				</div>

				<div className='mt-10'>{trackName && <BackToListingView trackName={trackName} />}</div>
				<div className='mt-6'>
					<Post
						post={post}
						trackName={trackName === 'Root' ? 'root' : trackName}
						proposalType={proposalType}
					/>
				</div>
				{
					<ConfusionModal
						modalOpen={isModalOpen}
						setModalOpen={setModalOpen}
					/>
				}
			</>
		);
	}

	return (
		<div className='mt-16'>
			<LoadingState />
		</div>
	);
};

export default memo(ReferendaPost);
