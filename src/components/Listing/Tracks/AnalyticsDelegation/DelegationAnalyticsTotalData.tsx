// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React, { useState } from 'react';
import { Radio } from 'antd';
import TotalDelegateeData from './TotalDelegateeData';
import TotalDelegatorData from './TotalDelegatorData';

const DelegationAnalyticsTotalData = () => {
	const [selectedOption, setSelectedOption] = useState('delegatee');

	const onRadioChange = (e: any) => {
		setSelectedOption(e.target.value);
	};

	const displayData = () => {
		switch (selectedOption) {
			case 'delegatee':
				return <TotalDelegateeData />;
			case 'delegator':
				return <TotalDelegatorData />;
			default:
				return null;
		}
	};
	return (
		<div>
			<Radio.Group
				onChange={onRadioChange}
				value={selectedOption}
				className='my-3'
			>
				<Radio
					className={`text-base font-medium ${selectedOption === 'delegatee' ? '' : 'text-[#243A57B2]'} dark:text-blue-dark-high`}
					value='delegatee'
				>
					Delegatee
				</Radio>
				<Radio
					className={`text-base font-medium ${selectedOption === 'delegator' ? '' : 'text-[#243A57B2]'} dark:text-blue-dark-high`}
					value='delegator'
				>
					Delegator
				</Radio>
			</Radio.Group>
			{displayData()}
		</div>
	);
};

export default DelegationAnalyticsTotalData;
