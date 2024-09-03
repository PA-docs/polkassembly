// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Card, MenuProps, Space, Spin } from 'antd';
import { ResponsivePie } from '@nivo/pie';
import nextApiClientFetch from '~src/util/nextApiClientFetch';
import { Dropdown } from '~src/ui-components/Dropdown';
import { DownOutlined } from '@ant-design/icons';
import { networkTrackInfo } from '~src/global/post_trackInfo';
import { useNetworkSelector } from '~src/redux/selectors';
import { getTrackNameFromId } from '~src/util/trackNameFromId';
import { useTheme } from 'next-themes';
import { IGetStatusWiseRefOutcome } from './types';

const StyledCard = styled(Card)`
	g[transform='translate(0,0)'] g:nth-child(even) {
		display: none !important;
	}
	div[style*='pointer-events: none;'] {
		visibility: hidden;
		animation: fadeIn 0.5s forwards;
	}

	@keyframes fadeIn {
		0% {
			visibility: hidden;
			opacity: 0;
		}
		100% {
			visibility: visible;
			opacity: 1;
		}
	}
	@media (max-width: 640px) {
		.ant-card-body {
			padding: 12px !important;
		}
	}
`;

const AnalyticsReferendumOutcome = () => {
	const [loading, setLoading] = useState<boolean>(false);
	const { resolvedTheme: theme } = useTheme();

	const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
	const { network } = useNetworkSelector();
	const [statusInfo, setStatusInfo] = useState<Record<string, number>>({
		approved: 0,
		cancelled: 0,
		ongoing: 0,
		rejected: 0,
		timeout: 0
	});
	const trackIds = [
		...Object.values(networkTrackInfo[network]).map((info) => {
			return info.trackId;
		})
	];

	const getData = async () => {
		setLoading(true);
		const { data, error } = await nextApiClientFetch<IGetStatusWiseRefOutcome>('/api/v1/govAnalytics/statuswiseRefOutcome', {
			trackId: selectedTrack === null ? null : trackIds[selectedTrack]
		});
		if (!data) {
			console.log('something went wrong, ', error);
		}
		if (data) {
			setStatusInfo(data.statusCounts);
			setLoading(false);
		}
	};

	useEffect(() => {
		getData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedTrack]);

	const handleMenuClick = (e: any) => {
		const selectedTrackKey = e.key;
		if (selectedTrackKey === '0') {
			setSelectedTrack(null);
		} else {
			setSelectedTrack(parseInt(selectedTrackKey) - 1);
		}
	};

	const items: MenuProps['items'] = [
		{
			key: '0',
			label: (
				<p
					className='m-0 p-0 text-sm capitalize'
					style={{ color: theme === 'dark' ? '#fff' : '#000' }}
				>
					All Tracks
				</p>
			),
			onClick: handleMenuClick
		},
		...trackIds.map((trackId, index) => ({
			key: `${index + 1}`,
			label: (
				<p
					className='m-0 p-0 text-sm capitalize'
					style={{ color: theme === 'dark' ? '#fff' : '#243a57' }}
				>
					{getTrackNameFromId(network, trackId)?.split('_').join(' ')}
				</p>
			),
			onClick: handleMenuClick
		}))
	];

	const data = [
		{
			color: '#ff0000',
			id: 'timeout',
			label: 'Timeout',
			value: statusInfo?.timeout
		},
		{
			color: '#ff6000',
			id: 'ongoing',
			label: 'Ongoing',
			value: statusInfo?.ongoing
		},
		{
			color: '#27d941',
			id: 'approved',
			label: 'Approved',
			value: statusInfo?.approved
		},
		{
			color: '#6800ff',
			id: 'rejected',
			label: 'Rejected',
			value: statusInfo?.rejected
		},
		{
			color: '#fdcc4a',
			id: 'cancelled',
			label: 'Cancelled',
			value: statusInfo?.cancelled
		}
	];
	return (
		<StyledCard className='mx-auto max-h-[500px] w-full flex-1 rounded-xxl border-section-light-container bg-white p-0 text-blue-light-high dark:border-[#3B444F] dark:bg-section-dark-overlay dark:text-white '>
			<div className='flex items-center justify-between'>
				<h2 className='text-base font-semibold sm:text-xl'>Referendum Count by Status</h2>
				<div className='flex h-[30px] w-[109px] items-center justify-center rounded-md border border-solid border-[#D2D8E0] bg-transparent p-2'>
					<Dropdown
						menu={{ items }}
						theme={theme}
					>
						<a onClick={(e) => e.preventDefault()}>
							<Space>
								{selectedTrack
									? getTrackNameFromId(network, trackIds[selectedTrack])
											.split('_')
											.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
											.join(' ')
									: 'All Tracks'}
								<DownOutlined />
							</Space>
						</a>
					</Dropdown>
				</div>
			</div>
			<Spin spinning={loading}>
				<div
					className='flex justify-start'
					style={{ height: '300px', width: '100%' }}
				>
					<ResponsivePie
						data={data}
						margin={{
							bottom: 8,
							left: 10,
							right: 260,
							top: 20
						}}
						sortByValue={true}
						colors={{ datum: 'data.color' }}
						innerRadius={0.8}
						padAngle={0.7}
						cornerRadius={15}
						activeOuterRadiusOffset={8}
						borderWidth={1}
						borderColor={{
							from: 'color',
							modifiers: [['darker', 0.2]]
						}}
						enableArcLinkLabels={false}
						arcLinkLabelsSkipAngle={10}
						arcLinkLabelsTextColor='#333333'
						arcLinkLabelsThickness={2}
						arcLinkLabelsColor='#c93b3b'
						enableArcLabels={false}
						arcLabelsRadiusOffset={0.55}
						arcLabelsSkipAngle={10}
						arcLabelsTextColor={{
							from: 'color',
							modifiers: [['darker', 2]]
						}}
						defs={[
							{
								background: 'inherit',
								color: 'rgba(255, 255, 255, 0.3)',
								id: 'dots',
								padding: 1,
								size: 4,
								stagger: true,
								type: 'patternDots'
							},
							{
								background: 'inherit',
								color: 'rgba(255, 255, 255, 0.3)',
								id: 'lines',
								lineWidth: 6,
								rotation: -45,
								spacing: 10,
								type: 'patternLines'
							}
						]}
						theme={{
							axis: {
								ticks: {
									text: {
										fill: theme === 'dark' ? '#fff' : '#333'
									}
								}
							},
							legends: {
								text: {
									fill: theme === 'dark' ? '#fff' : '#333',
									fontSize: 14
								}
							},
							tooltip: {
								container: {
									background: theme === 'dark' ? '#1E2126' : '#fff',
									color: theme === 'dark' ? '#fff' : '#333'
								}
							}
						}}
						legends={[
							{
								anchor: 'right',
								data: data.map((item) => ({
									color: item.color,
									id: item.id,
									label: `${item.label} - ${item.value}`
								})),
								direction: 'column',
								itemDirection: 'left-to-right',
								itemHeight: 32,
								itemWidth: -60,
								itemsSpacing: 1,
								justify: false,
								symbolShape: 'circle',
								symbolSize: 8,
								translateX: 40,
								translateY: 0
							}
						]}
					/>
				</div>
			</Spin>
		</StyledCard>
	);
};

export default AnalyticsReferendumOutcome;
