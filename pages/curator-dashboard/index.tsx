// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getNetworkFromReqHeaders } from '~src/api-utils';
import { setNetwork } from '~src/redux/network';
import checkRouteNetworkWithRedirect from '~src/util/checkRouteNetworkWithRedirect';
import { LeftOutlined } from '@ant-design/icons';
import { spaceGrotesk } from 'pages/_app';
import ImageIcon from '~src/ui-components/ImageIcon';
import { useUserDetailsSelector } from '~src/redux/selectors';
import BountyActionModal from '~src/components/Bounties/bountyProposal/BountyActionModal';
import { useTheme } from 'next-themes';
import CuratorDashboardTabItems from '~src/components/CuratorDashboard';

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
	const network = getNetworkFromReqHeaders(req.headers);

	const networkRedirect = checkRouteNetworkWithRedirect(network);
	if (networkRedirect) return networkRedirect;

	return { props: { network } };
};

const CuratorDashboard = (props: { network: string }) => {
	const dispatch = useDispatch();
	const { resolvedTheme: theme } = useTheme();
	const currentUser = useUserDetailsSelector();
	const { id } = currentUser;
	const [openLoginPrompt, setOpenLoginPrompt] = useState<boolean>(false);
	const [openAddressLinkedModal, setOpenAddressLinkedModal] = useState<boolean>(false);
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [referendaModal, setReferendaModal] = useState<number>(0);
	const [proposerAddress, setProposerAddress] = useState<string>('');

	const handleClick = (num: number) => {
		if (id) {
			if (proposerAddress.length > 0) {
				setReferendaModal(num);
				setOpenModal(!openModal);
			} else if (setOpenAddressLinkedModal) {
				setReferendaModal(num);
				setOpenAddressLinkedModal(true);
			}
		} else {
			setOpenLoginPrompt(true);
		}
	};

	useEffect(() => {
		dispatch(setNetwork(props.network));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return (
		<div>
			<Link
				className='inline-flex items-center pt-3 text-sidebarBlue hover:text-pink_primary dark:text-white'
				href='#'
			>
				<div className='flex items-center'>
					<LeftOutlined className='mr-2 text-xs' />
					<span className='text-sm font-medium'>
						Back to <span className='capitalize'> Back to Proposal #123 Standard Guidelines...</span>
					</span>
				</div>
			</Link>
			<main className='mx-3 mt-3'>
				<div className='flex items-center justify-between'>
					<span className={` text-[32px] ${spaceGrotesk.className} ${spaceGrotesk.variable} font-bold text-blue-light-high dark:text-blue-dark-high`}>Curator Dashboard</span>
					<button
						onClick={() => handleClick(1)}
						className='bounty-button flex w-full cursor-pointer items-center justify-center gap-[6px] rounded-[20px] border-none px-[22px] py-[11px] md:w-auto md:justify-normal '
					>
						<ImageIcon
							src='/assets/bounty-icons/proposal-icon.svg'
							alt='bounty icon'
							imgClassName=''
						/>
						<span className={`${spaceGrotesk.className} ${spaceGrotesk.variable} font-bold text-white`}>Create Bounty Proposal</span>
					</button>
				</div>
				<div>
					<CuratorDashboardTabItems />
				</div>
			</main>
			<BountyActionModal
				theme={theme}
				referendaModal={referendaModal}
				openAddressLinkedModal={openAddressLinkedModal}
				setOpenAddressLinkedModal={setOpenAddressLinkedModal}
				openModal={openModal}
				setOpenModal={setOpenModal}
				openLoginPrompt={openLoginPrompt}
				setOpenLoginPrompt={setOpenLoginPrompt}
				setProposerAddress={setProposerAddress}
				proposerAddress={proposerAddress}
			/>
		</div>
	);
};

export default CuratorDashboard;
