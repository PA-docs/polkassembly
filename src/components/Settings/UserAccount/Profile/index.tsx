// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React, { useState } from 'react';
import ExpandIcon from '~assets/icons/expand.svg';
import CollapseIcon from '~assets/icons/collapse.svg';
import ProfileIcon from '~assets/icons/profile-icon.svg';
import EditPencilIcon from '~assets/icons/edit-pencil.svg';
import PasswordDotIcon from '~assets/icons/password-dot.svg';
import { Collapse } from '../../Notifications/common-ui/Collapse';
import { Divider } from 'antd';
import ChangeUsername from '../Modals/ChangeUsername';
import ChangeEmail from '../Modals/ChangeEmail';
import ChangePassword from '../Modals/ChangePassword';
import TwoFactorAuth from '../../TwoFactorAuth';
import { useUserDetailsSelector } from '~src/redux/selectors';
import { useTheme } from 'next-themes';

const { Panel } = Collapse;

const Row = ({ label, data, handleEdit }: { label: string; data: string; handleEdit: any }) => (
	<div className='flex items-baseline justify-between'>
		<div>
			<label
				className='dark:text-blue-dark-medium text-[14px] text-[#485F7D]'
				htmlFor={label}
			>
				{label}
			</label>
			<p className='text-blue-light-high dark:text-blue-dark-high font-medium'>
				{label === 'Password' ? (
					<div className='mt-2 flex gap-1'>
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => (
							<PasswordDotIcon key={id} />
						))}
					</div>
				) : data ? (
					data
				) : (
					`${label} not linked. Please Add ${label}`
				)}
			</p>
		</div>
		<span
			className='dark:text-blue-dark-medium flex cursor-pointer items-center gap-1 text-[14px] font-medium text-[#485F7D] text-pink_primary'
			onClick={handleEdit}
		>
			<EditPencilIcon /> Edit
		</span>
	</div>
);

export enum ModalType {
	USERNAME = 'username',
	EMAIL = 'email',
	PASSWORD = 'password'
}

export default function ProfileSettings() {
	const { username, email, web3signup, id } = useUserDetailsSelector();
	const [showModal, setShowModal] = useState<ModalType | null>(null);
	const { resolvedTheme: theme } = useTheme();
	return (
		<Collapse
			size='large'
			className={'dark:bg-section-dark-overlay dark:border-separatorDark bg-white'}
			expandIconPosition='end'
			theme={theme}
			expandIcon={({ isActive }) => {
				return isActive ? <CollapseIcon /> : <ExpandIcon />;
			}}
		>
			<Panel
				header={
					<div className='channel-header dark:bg-section-dark-overlay flex items-center gap-[6px]'>
						<ProfileIcon />
						<h3 className='text-blue-light-high dark:text-blue-dark-high mb-0 mt-[2px] text-[16px] font-semibold leading-[21px] tracking-wide md:text-[18px]'>Profile Settings</h3>
					</div>
				}
				key='1'
			>
				<div className='flex flex-col gap-6'>
					<Row
						label='Username'
						data={username || ''}
						handleEdit={() => setShowModal(ModalType.USERNAME)}
					/>
					<Divider className='m-0 text-[#D2D8E0]' />
					<Row
						label='Email'
						data={email || ''}
						handleEdit={() => setShowModal(ModalType.EMAIL)}
					/>
					<Divider className='m-0 text-[#D2D8E0]' />
					{!web3signup && (
						<Row
							label='Password'
							data={username || ''}
							handleEdit={() => setShowModal(ModalType.PASSWORD)}
						/>
					)}
				</div>
				<ChangeUsername
					onCancel={() => setShowModal(null)}
					username={username || ''}
					open={showModal === ModalType.USERNAME}
				/>
				<ChangePassword
					onCancel={() => setShowModal(null)}
					open={showModal === ModalType.PASSWORD}
				/>
				<ChangeEmail
					onCancel={() => setShowModal(null)}
					email={email || ''}
					open={showModal === ModalType.EMAIL}
				/>
				{id && <TwoFactorAuth className='mt-2' />}
			</Panel>
		</Collapse>
	);
}
