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
import { LoadingOutlined } from '@ant-design/icons';
import PostList from './PostList';
import { IPostData } from './utils/types';
import Image from 'next/image';

// Login button component
const LoginButton = ({ onClick }: { onClick: () => void }) => (
	<p
		onClick={onClick}
		className='w-[400px] cursor-pointer rounded-md bg-[#E5007A] px-4 py-2 text-center text-lg text-white'
	>
		Log In
	</p>
);

// Signup button component
const SignupButton = ({ onClick }: { onClick: () => void }) => (
	<p
		onClick={onClick}
		className='w-[400px] cursor-pointer rounded-md border-solid border-[#E5007A] px-4 py-2 text-center text-lg text-[#E5007A]'
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
	const [loading, setLoading] = useState<boolean>(false);
	const { network } = useNetworkSelector();

	useEffect(() => {
		const fetchPostUpdates = async () => {
			try {
				setLoading(true);
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

	console.log('subscribedPosts', subscribedPosts);
	return (
		<div className=''>
			{currentuser && currentuser?.id && currentuser?.username && filteredPosts.length > 0 ? (
				// Condition 1: User is logged in and there are filtered posts
				<div className='flex h-[900px] w-[900px] flex-col items-center rounded-xl '>
					<TabNavigation
						currentTab={currentTab}
						setCurrentTab={setCurrentTab}
						gov2LatestPosts={subscribedPosts}
						network={network}
					/>

					{loading ? (
						<div className='flex min-h-[50px] w-full items-center justify-center'>
							<LoadingOutlined />
						</div>
					) : (
						<div className='px-2'>
							<PostList
								postData={filteredPosts}
								currentUserdata={currentuser}
							/>
						</div>
					)}
				</div>
			) : currentuser && currentuser?.id && currentuser?.username ? (
				// Condition 2: User is logged in but no filtered posts
				<div className='flex h-[900px] w-[900px] flex-col items-center rounded-xl border border-solid border-[#D2D8E0] bg-white'>
					<Image
						src='/assets/icons/noactivity.svg'
						alt='empty state'
						className='h-80 w-80 p-0'
						width={320}
						height={320}
					/>
					<p className='p-0 text-xl font-bold'>No Activity Found</p>
					<p className='p-0 text-center text-[#243A57]'>
						Follow or Subscribe, to people and posts to view personalised <br />
						content on your feed!
					</p>
				</div>
			) : (
				// Condition 3: User is not logged in
				<div className='flex h-[900px] w-[900px] flex-col items-center rounded-xl border border-solid border-[#D2D8E0] bg-white text-[#243A57]'>
					<Image
						src='/assets/icons/nologin.svg'
						alt='empty state'
						className='h-80 w-80 p-0'
						width={320}
						height={320}
					/>
					<p className='p-0 text-xl font-bold'>Join Polkassembly to see your Following tab!</p>
					<p className='p-0 text-center text-[#243A57]'>Discuss, contribute and get regular updates from Polkassembly.</p>
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
