// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useEffect, useState } from 'react';
import { useNetworkSelector, useUserDetailsSelector } from '~src/redux/selectors';
import LoginPopup from '~src/ui-components/loginPopup';
import SignupPopup from '~src/ui-components/SignupPopup';
import nextApiClientFetch from '~src/util/nextApiClientFetch';
import { fetchUserProfile, fetchVoterProfileImage } from './utils/utils';
import TabNavigation from './TabNavigation';
import PostList from './PostList';
import { IPostData } from './utils/types';
import Image from 'next/image';
import Skeleton from '~src/basic-components/Skeleton';

const LoginButton = ({ onClick }: { onClick: () => void }) => (
	<p
		onClick={onClick}
		className='w-full cursor-pointer rounded-md bg-[#E5007A] px-4 py-2 text-center text-lg text-white lg:w-[400px]'
	>
		Log In
	</p>
);

const SignupButton = ({ onClick }: { onClick: () => void }) => (
	<p
		onClick={onClick}
		className='w-full cursor-pointer rounded-md border-[1px] border-solid border-[#E5007A] px-4 py-2 text-center text-lg text-[#E5007A] lg:w-[400px] lg:border'
	>
		Sign Up
	</p>
);

interface LatestActivityFollowingProps {
	currentUserdata?: any;
}

const LatestActivityFollowing: React.FC<LatestActivityFollowingProps> = () => {
	const currentuser = useUserDetailsSelector();
	const [openLogin, setLoginOpen] = useState<boolean>(false);
	const [openSignup, setSignupOpen] = useState<boolean>(false);
	const [subscribedPosts, setSubscribedPosts] = useState<IPostData[]>([]);
	const [currentTab, setCurrentTab] = useState<string | null>('all');
	const [loading, setLoading] = useState<boolean>(false); // Loading state
	const { network } = useNetworkSelector();

	useEffect(() => {
		const fetchPostUpdates = async () => {
			try {
				setLoading(true); // Start loading
				const { data: responseData } = await nextApiClientFetch<any>('/api/v1/activity-feed/subscribed-posts');
				const posts = Array.isArray(responseData?.data) ? responseData.data : [];
				const detailedPosts = await Promise.all(
					posts.map(async (post: IPostData) => {
						try {
							let firstVoterProfileImg = null;
							if (post?.post_reactions?.['👍']?.usernames?.[0]) {
								const username = post.post_reactions['👍'].usernames[0];
								firstVoterProfileImg = await fetchVoterProfileImage(username);
							}
							const proposerProfile = await fetchUserProfile(post.proposer || '');
							return {
								...post,
								firstVoterProfileImg,
								proposerProfile
							};
						} catch (error) {
							console.error('Error processing post', error);
							return { ...post, error: true };
						}
					})
				);

				setSubscribedPosts(detailedPosts.filter((post) => !post.error));
			} catch (err) {
				console.error('Failed to fetch subscribed posts:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchPostUpdates();
	}, [currentTab, network]);

	const filteredPosts =
		currentTab === 'all'
			? subscribedPosts
			: subscribedPosts.filter((post) => {
					const formattedTrackName = post.trackName
						?.replace(/([a-z])([A-Z])/g, '$1-$2')
						.replace(/_/g, '-')
						.toLowerCase();

					return formattedTrackName === currentTab;
			  });

	return (
		<div className=''>
			{loading ? (
				<div className='flex min-h-[200px]  items-center justify-center rounded-lg bg-white px-5 dark:bg-[#0D0D0D]'>
					<Skeleton active />
				</div>
			) : currentuser && currentuser?.id && currentuser?.username ? (
				subscribedPosts.length > 0 ? (
					<div>
						<div>
							<TabNavigation
								currentTab={currentTab}
								setCurrentTab={setCurrentTab}
								gov2LatestPosts={subscribedPosts}
								network={network}
							/>
						</div>
						<div>
							{filteredPosts.length > 0 ? (
								<PostList
									postData={filteredPosts}
									currentUserdata={currentuser}
								/>
							) : (
								<p>No posts available</p>
							)}
						</div>
					</div>
				) : (
					<div className={'flex h-[900px]  flex-col items-center rounded-xl border border-solid border-[#D2D8E0] bg-white px-5 dark:border-[#4B4B4B] dark:bg-[#0D0D0D]'}>
						<Image
							src='/assets/activityfeed/gifs/noactivity.gif'
							alt='empty state'
							className='h-80 w-80 p-0'
							width={320}
							height={320}
						/>
						<p className='p-0 text-xl font-bold'>No Activity Found</p>
						<p
							className='p-0 text-center text-[#243A57] dark:text-white'
							style={{ lineHeight: '1.8' }}
						>
							Follow or Subscribe to people and posts to view personalized <br />
							content on your feed!
						</p>
					</div>
				)
			) : (
				<div className={'flex h-[900px]  flex-col items-center rounded-xl border border-solid border-[#D2D8E0] bg-white px-5 dark:border-[#4B4B4B] dark:bg-[#0D0D0D]'}>
					<Image
						src='/assets/activityfeed/gifs/nologin.gif'
						alt='empty state'
						className='h-80 w-80 p-0'
						width={320}
						height={320}
					/>
					<p className='p-0 text-xl font-bold dark:text-white'>Join Polkassembly to see your Following tab!</p>
					<p className='p-0 text-center text-[#243A57] dark:text-white'>Discuss, contribute and get regular updates from Polkassembly.</p>
					<LoginButton onClick={() => setLoginOpen(true)} />
					<SignupButton onClick={() => setSignupOpen(true)} />
				</div>
			)}
			<SignupPopup
				setLoginOpen={setLoginOpen}
				modalOpen={openSignup}
				setModalOpen={setSignupOpen}
				isModal={true}
			/>
			<LoginPopup
				setSignupOpen={setSignupOpen}
				modalOpen={openLogin}
				setModalOpen={setLoginOpen}
				isModal={true}
			/>
		</div>
	);
};

export default React.memo(LatestActivityFollowing);
