// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { ProfileDetailsResponse } from '~src/auth/types';
import { Tabs } from '~src/ui-components/Tabs';
import ProfileOverview from './ProfileOverview';
import { votesHistoryUnavailableNetworks } from 'pages/user/[username]';
import { useNetworkSelector, useUserDetailsSelector } from '~src/redux/selectors';
import VotesHistory from '~src/ui-components/VotesHistory';
import styled from 'styled-components';
import ProfilePosts from './ProfilePosts';
import { IUserPostsListingResponse } from 'pages/api/v1/listing/user-posts';
import { IStats } from '.';
import { ClipboardIcon, MyActivityIcon, ProfileMentionsIcon, ProfileOverviewIcon, ProfileReactionsIcon, VotesIcon } from '~src/ui-components/CustomIcons';
import { DeriveAccountRegistration } from '@polkadot/api-derive/types';
import ProfileUserActivity from './ProfileUserActivity';
import ProfileMentions from './ProfileMentions';
import ProfileReactions from './ProfileReactions';

interface Props {
	className?: string;
	theme?: string;
	addressWithIdentity?: string;
	userProfile: ProfileDetailsResponse;
	selectedAddresses: string[];
	setSelectedAddresses: (pre: string[]) => void;
	userPosts: IUserPostsListingResponse;
	profileDetails: ProfileDetailsResponse;
	setProfileDetails: React.Dispatch<React.SetStateAction<ProfileDetailsResponse>>;
	statsArr: IStats[];
	setStatsArr: (pre: IStats[]) => void;
	onchainIdentity?: DeriveAccountRegistration | null;
}

const ProfileTabs = ({
	className,
	theme,
	userProfile,
	addressWithIdentity,
	selectedAddresses,
	setSelectedAddresses,
	userPosts,
	profileDetails,
	setProfileDetails,
	statsArr,
	setStatsArr,
	onchainIdentity
}: Props) => {
	const { network } = useNetworkSelector();
	const [totals, setTotals] = useState<{ posts: number; votes: number }>({
		posts: 0,
		votes: 0
	});
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [totalMentions, setTotalMentions] = useState(0);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [totalReactions, setTotalReactions] = useState(0);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [totalActivities, setTotalActivities] = useState(0);
	const { id: userId } = useUserDetailsSelector();

	useEffect(() => {
		let totalPosts = 0;
		let totalVotes = 0;

		statsArr.map((item) => {
			if (item?.label === 'Proposals Voted') {
				totalVotes = item?.value || 0;
			} else {
				totalPosts += item?.value;
			}
		});
		setTotals({
			posts: totalPosts,
			votes: totalVotes
		});
	}, [statsArr, userProfile]);
	const tabItems = [
		{
			children: (
				<ProfileOverview
					userProfile={userProfile}
					addressWithIdentity={addressWithIdentity}
					theme={theme}
					selectedAddresses={selectedAddresses}
					setSelectedAddresses={setSelectedAddresses}
					profileDetails={profileDetails}
					setProfileDetails={setProfileDetails}
					onchainIdentity={onchainIdentity}
				/>
			),
			key: 'Overview',
			label: (
				<div className='flex items-center'>
					<ProfileOverviewIcon className='active-icon text-xl text-lightBlue dark:text-[#9E9E9E]' />
					Overview
				</div>
			)
		},
		{
			children: (
				<ProfilePosts
					userProfile={userProfile}
					addressWithIdentity={addressWithIdentity}
					theme={theme}
					userPosts={userPosts}
					totalPosts={totals?.posts}
				/>
			),
			key: 'Posts',
			label: (
				<div className='flex items-center'>
					<ClipboardIcon className='active-icon text-2xl text-lightBlue dark:text-[#9E9E9E]' />
					Posts<span className='ml-[2px]'>({totals?.posts})</span>
				</div>
			)
		},
		{
			children: (
				<ProfileReactions
					setTotalReactions={setTotalReactions}
					userProfile={userProfile}
					addressWithIdentity={addressWithIdentity}
				/>
			),
			key: 'Reactions',
			label: (
				<div className='flex items-center'>
					<ProfileReactionsIcon className='active-icon text-2xl text-lightBlue dark:text-[#9E9E9E]' />
					Reactions
					{/* <span className='ml-[2px]'>({totalReactions})</span> */}
				</div>
			)
		},
		{
			children: (
				<ProfileMentions
					setTotalMentions={setTotalMentions}
					userProfile={userProfile}
					addressWithIdentity={addressWithIdentity}
				/>
			),
			key: 'Mentions',
			label: (
				<div className='flex items-center'>
					<ProfileMentionsIcon className='active-icon text-2xl text-lightBlue dark:text-[#9E9E9E]' />
					Mentions
					{/* <span className='ml-[2px]'>({totalMentions})</span> */}
				</div>
			)
		}
	];
	if (!votesHistoryUnavailableNetworks.includes(network)) {
		tabItems.splice(1, 0, {
			children: (
				<VotesHistory
					userProfile={userProfile}
					theme={theme}
					setStatsArr={setStatsArr}
					statsArr={statsArr}
					totalVotes={totals?.votes}
				/>
			),
			key: 'Votes',
			label: (
				<div className='flex items-center'>
					<VotesIcon className='active-icon text-[23px] text-lightBlue dark:text-[#9E9E9E]' />
					Votes<span className='ml-[2px]'>({totals?.votes})</span>
				</div>
			)
		});
	}
	if (userId === userProfile.user_id) {
		tabItems.splice(3, 0, {
			children: (
				<ProfileUserActivity
					setTotalActivities={setTotalActivities}
					userProfile={userProfile}
					addressWithIdentity={addressWithIdentity}
				/>
			),
			key: 'My Activity',
			label: (
				<div className='flex items-center'>
					<MyActivityIcon className='active-icon text-xl text-lightBlue dark:text-[#9E9E9E]' />
					My Activity
					{/* <span className='ml-[2px]'>({totalActivities})</span> */}
				</div>
			)
		});
	}
	return (
		<div className={classNames(className, 'rounded-[18px]')}>
			<Tabs
				theme={theme}
				type='card'
				className='ant-tabs-tab-bg-white font-medium text-bodyBlue dark:bg-transparent dark:text-blue-dark-high'
				items={tabItems}
			/>
		</div>
	);
};

export default styled(ProfileTabs)`
	.ant-tabs-tab-active .active-icon {
		filter: brightness(0) saturate(100%) invert(13%) sepia(94%) saturate(7151%) hue-rotate(321deg) brightness(90%) contrast(101%);
	}
	//dark mode icon color change
	// .dark .darkmode-icons {
	// filter: brightness(100%) saturate(0%) contrast(4) invert(100%) !important;
	// }
`;
