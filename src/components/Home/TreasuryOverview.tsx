// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { CaretDownOutlined, CaretUpOutlined, LoadingOutlined } from '@ant-design/icons';
import type { Balance } from '@polkadot/types/interfaces';
import { BN_MILLION, BN_ZERO, u8aConcat, u8aToHex } from '@polkadot/util';
import { Divider } from 'antd';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { dayjs } from 'dayjs-init';
import React, { FC, useEffect, useState } from 'react';
import { subscanApiHeaders } from 'src/global/apiHeaders';
import { chainProperties } from 'src/global/networkConstants';
import HelperTooltip from 'src/ui-components/HelperTooltip';
import blockToDays from 'src/util/blockToDays';
import blockToTime from 'src/util/blockToTime';
import formatBnBalance from 'src/util/formatBnBalance';
import formatUSDWithUnits from 'src/util/formatUSDWithUnits';
import styled from 'styled-components';
import { useApiContext } from '~src/context';
import getDaysTimeObj from '~src/util/getDaysTimeObj';
import { GetCurrentTokenPrice } from '~src/util/getCurrentTokenPrice';
import { useNetworkSelector } from '~src/redux/selectors';
import { useDispatch } from 'react-redux';
import { network as AllNetworks } from '~src/global/networkConstants';
import { setCurrentTokenPrice as setCurrentTokenPriceInRedux } from '~src/redux/currentTokenPrice';
import ImageIcon from '~src/ui-components/ImageIcon';
import ProgressBar from '~src/basic-components/ProgressBar/ProgressBar';
import { poppins } from 'pages/_app';
import AssethubIcon from '~assets/icons/asset-hub-icon.svg';
import { formatNumberWithSuffix } from '../Bounties/utils/formatBalanceUsd';

const EMPTY_U8A_32 = new Uint8Array(32);

interface ITreasuryOverviewProps {
	inTreasuryProposals?: boolean;
	isUsedinPolkadot?: boolean;
	className?: string;
	theme?: string;
}

const TreasuryOverview: FC<ITreasuryOverviewProps> = (props) => {
	const { className, inTreasuryProposals, isUsedinPolkadot, theme } = props;
	const { network } = useNetworkSelector();
	const { api, apiReady } = useApiContext();
	const trailColor = theme === 'dark' ? '#1E262D' : '#E5E5E5';
	const unit = chainProperties?.[network]?.tokenSymbol;
	const dispatch = useDispatch();
	const blockTime: number = chainProperties?.[network]?.blockTime;
	const [available, setAvailable] = useState({
		isLoading: true,
		value: '',
		valueUSD: ''
	});
	const [nextBurn, setNextBurn] = useState({
		isLoading: true,
		value: '',
		valueUSD: ''
	});
	const [currentTokenPrice, setCurrentTokenPrice] = useState({
		isLoading: true,
		value: ''
	});
	const [priceWeeklyChange, setPriceWeeklyChange] = useState({
		isLoading: true,
		value: ''
	});
	const [spendPeriod, setSpendPeriod] = useState({
		isLoading: true,
		percentage: 0,
		value: {
			days: 0,
			hours: 0,
			minutes: 0,
			total: 0
		}
	});
	const [assethubApi, setAssethubApi] = useState<ApiPromise | null>(null);
	const [assethubApiReady, setAssethubApiReady] = useState<boolean>(false);
	const [assethubValues, setAssethubValues] = useState<{
		dotValue: string;
		usdcValue: string;
		usdtValue: string;
	}>({
		dotValue: '',
		usdcValue: '',
		usdtValue: ''
	});

	const fetchAssetsAmount = async () => {
		if (!assethubApi || !assethubApiReady) return;

		if (assethubApiReady) {
			// Fetching balance in DOT
			assethubApi?.query?.system
				?.account(chainProperties?.[AllNetworks.POLKADOT]?.assetHubAddress)
				.then((result: any) => {
					const free = result.data?.free?.toBigInt() || result.data?.frozen?.toBigInt() || BigInt(0);
					setAssethubValues((values) => ({ ...values, dotValue: free }));
				})
				.catch((e) => console.error(e));

			// Fetch balance in USDC
			assethubApi?.query.assets
				.account(chainProperties?.[AllNetworks.POLKADOT]?.assetHubUSDCId, chainProperties?.[AllNetworks.POLKADOT]?.assetHubAddress)
				.then((result: any) => {
					if (result.isNone) {
						console.log('No data found for the specified asset and address');
						return;
					}
					const data = result.unwrap();
					const freeBalanceBigInt = data.balance.toBigInt();
					// TODO
					const free = freeBalanceBigInt.toString();
					setAssethubValues((values) => ({ ...values, usdcValue: free }));
				})
				.catch((e) => {
					console.error('Error fetching asset balance:', e);
				});

			// Fetch balance in USDT
			assethubApi?.query.assets
				.account(chainProperties?.[AllNetworks.POLKADOT]?.assetHubUSDTId, chainProperties?.[AllNetworks.POLKADOT]?.assetHubAddress)
				.then((result: any) => {
					if (result.isNone) {
						console.log('No data found for the specified asset and address');
						return;
					}
					const data = result.unwrap();
					const freeBalanceBigInt = data.balance.toBigInt();
					// TODO
					const free = freeBalanceBigInt.toString();
					setAssethubValues((values) => ({ ...values, usdtValue: free }));
				})
				.catch((e) => {
					console.error('Error fetching asset balance:', e);
				});
		}

		return;
	};

	useEffect(() => {
		fetchAssetsAmount();
	}, [assethubApi, assethubApiReady]);

	useEffect(() => {
		(async () => {
			const wsProvider = new WsProvider(chainProperties?.[AllNetworks.POLKADOT]?.assetHubRpcEndpoint);
			const apiPromise = await ApiPromise.create({ provider: wsProvider });
			setAssethubApi(apiPromise);
			const timer = setTimeout(async () => {
				await apiPromise.disconnect();
			}, 60000);

			apiPromise?.isReady
				.then(() => {
					clearTimeout(timer);

					setAssethubApiReady(true);
					console.log('Asset Hub Chain API ready');
				})
				.catch(async (error) => {
					clearTimeout(timer);
					await apiPromise.disconnect();
					console.error(error);
				});
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!assethubApi || !assethubApiReady) return;
		fetchAssetsAmount();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [assethubApi, assethubApiReady]);

	useEffect(() => {
		if (!api || !apiReady) {
			return;
		}

		setSpendPeriod({
			isLoading: true,
			percentage: 0,
			value: {
				days: 0,
				hours: 0,
				minutes: 0,
				total: 0
			}
		});
		api.derive.chain
			.bestNumber((currentBlock) => {
				const spendPeriodConst = api.consts.treasury ? api.consts.treasury.spendPeriod : BN_ZERO;
				if (spendPeriodConst) {
					const spendPeriod = spendPeriodConst.toNumber();
					const totalSpendPeriod: number = blockToDays(spendPeriod, network, blockTime);
					const goneBlocks = currentBlock.toNumber() % spendPeriod;
					// const spendPeriodElapsed: number = blockToDays(goneBlocks, network, blockTime);
					// const spendPeriodRemaining: number = totalSpendPeriod - spendPeriodElapsed;
					const { time } = blockToTime(spendPeriod - goneBlocks, network, blockTime);
					const { d, h, m } = getDaysTimeObj(time);

					const percentage = ((goneBlocks / spendPeriod) * 100).toFixed(0);

					setSpendPeriod({
						isLoading: false,
						// spendPeriodElapsed/totalSpendPeriod for opposite
						percentage: parseFloat(percentage),
						value: {
							days: d,
							hours: h,
							minutes: m,
							total: totalSpendPeriod
						}
					});
				}
			})
			.catch(() => {
				setSpendPeriod({
					isLoading: false,
					percentage: 0,
					value: {
						days: 0,
						hours: 0,
						minutes: 0,
						total: 0
					}
				});
			});
	}, [api, apiReady, blockTime, network]);

	useEffect(() => {
		if (!api || !apiReady) {
			return;
		}

		setAvailable({
			isLoading: true,
			value: '',
			valueUSD: ''
		});

		setNextBurn({
			isLoading: true,
			value: '',
			valueUSD: ''
		});

		const treasuryAccount = u8aConcat(
			'modl',
			api.consts.treasury && api.consts.treasury.palletId ? api.consts.treasury.palletId.toU8a(true) : `${['polymesh', 'polymesh-test'].includes(network) ? 'pm' : 'pr'}/trsry`,
			EMPTY_U8A_32
		);
		api.derive.balances?.account(u8aToHex(treasuryAccount)).then((treasuryBalance) => {
			api.query.system
				.account(treasuryAccount)
				.then((res) => {
					const freeBalance = new BN(res?.data?.free) || BN_ZERO;
					treasuryBalance.freeBalance = freeBalance as Balance;
				})
				.catch((e) => {
					console.error(e);
					setAvailable({
						isLoading: false,
						value: '',
						valueUSD: ''
					});
				})
				.finally(() => {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars

					let valueUSD = '';
					let value = '';
					{
						try {
							const burn =
								treasuryBalance.freeBalance.gt(BN_ZERO) && !api.consts.treasury.burn.isZero() ? api.consts.treasury.burn.mul(treasuryBalance.freeBalance).div(BN_MILLION) : BN_ZERO;

							if (burn) {
								// replace spaces returned in string by format function
								const nextBurnValueUSD = parseFloat(
									formatBnBalance(
										burn.toString(),
										{
											numberAfterComma: 2,
											withThousandDelimitor: false,
											withUnit: false
										},
										network
									)
								);
								if (nextBurnValueUSD && currentTokenPrice && currentTokenPrice.value) {
									valueUSD = formatUSDWithUnits((nextBurnValueUSD * Number(currentTokenPrice.value)).toString());
								}
								value = formatUSDWithUnits(
									formatBnBalance(
										burn.toString(),
										{
											numberAfterComma: 0,
											withThousandDelimitor: false,
											withUnit: false
										},
										network
									)
								);
							}
						} catch (error) {
							console.log(error);
						}
						setNextBurn({
							isLoading: false,
							value,
							valueUSD
						});
					}
					{
						const freeBalance = treasuryBalance.freeBalance.gt(BN_ZERO) ? treasuryBalance.freeBalance : undefined;

						let valueUSD = '';
						let value = '';

						if (freeBalance) {
							const availableValueUSD = parseFloat(
								formatBnBalance(
									freeBalance.toString(),
									{
										numberAfterComma: 2,
										withThousandDelimitor: false,
										withUnit: false
									},
									network
								)
							);
							if (availableValueUSD && currentTokenPrice && currentTokenPrice.value !== 'N/A') {
								valueUSD = formatUSDWithUnits((availableValueUSD * Number(currentTokenPrice.value)).toString());
							}
							value = formatUSDWithUnits(
								formatBnBalance(
									freeBalance.toString(),
									{
										numberAfterComma: 0,
										withThousandDelimitor: false,
										withUnit: false
									},
									network
								)
							);
						}

						setAvailable({
							isLoading: false,
							value,
							valueUSD
						});
					}
				});
		});
		if (currentTokenPrice.value !== 'N/A') {
			dispatch(setCurrentTokenPriceInRedux(currentTokenPrice.value.toString()));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [api, apiReady, currentTokenPrice, network]);

	// set availableUSD and nextBurnUSD whenever they or current price of the token changes

	// fetch current price of the token
	useEffect(() => {
		if (!network) return;
		GetCurrentTokenPrice(network, setCurrentTokenPrice);
	}, [network]);

	// fetch a week ago price of the token and calc priceWeeklyChange
	useEffect(() => {
		let cancel = false;
		if (cancel || !currentTokenPrice.value || currentTokenPrice.isLoading || !network) return;

		setPriceWeeklyChange({
			isLoading: true,
			value: ''
		});
		async function fetchWeekAgoTokenPrice() {
			if (cancel) return;
			const weekAgoDate = dayjs().subtract(7, 'd').format('YYYY-MM-DD');
			try {
				const response = await fetch(`${chainProperties[network].externalLinks}/api/scan/price/history`, {
					body: JSON.stringify({
						end: weekAgoDate,
						start: weekAgoDate
					}),
					headers: subscanApiHeaders,
					method: 'POST'
				});
				const responseJSON = await response.json();
				if (responseJSON['message'] == 'Success') {
					const weekAgoPrice = responseJSON['data']['ema7_average'];
					const currentTokenPriceNum: number = parseFloat(currentTokenPrice.value);
					const weekAgoPriceNum: number = parseFloat(weekAgoPrice);
					if (weekAgoPriceNum == 0) {
						setPriceWeeklyChange({
							isLoading: false,
							value: 'N/A'
						});
						return;
					}
					const percentChange = ((currentTokenPriceNum - weekAgoPriceNum) / weekAgoPriceNum) * 100;
					setPriceWeeklyChange({
						isLoading: false,
						value: percentChange.toFixed(2)
					});
					return;
				}
				setPriceWeeklyChange({
					isLoading: false,
					value: 'N/A'
				});
			} catch (err) {
				setPriceWeeklyChange({
					isLoading: false,
					value: 'N/A'
				});
			}
		}

		fetchWeekAgoTokenPrice();
		return () => {
			cancel = true;
		};
	}, [currentTokenPrice, network]);

	const assetValue = formatBnBalance(assethubValues.dotValue, { numberAfterComma: 0, withThousandDelimitor: false, withUnit: false }, network);
	const assetValueUSDC = formatBnBalance(assethubValues.usdcValue, { numberAfterComma: 0, withUnit: false }, network);
	const assetValueUSDT = formatBnBalance(assethubValues.usdtValue, { numberAfterComma: 0, withUnit: false }, network);

	return (
		<section>
			{isUsedinPolkadot ? (
				<div className={`${poppins.className} ${poppins.variable} grid grid-cols-2 gap-x-8`}>
					<div className='flex w-full flex-1 flex-col gap-5 rounded-xxl bg-white p-3 drop-shadow-md dark:bg-section-dark-overlay sm:my-0 lg:px-6 lg:py-4'>
						<div className='flex items-start justify-between'>
							<div>
								{!available.isLoading ? (
									<>
										<div className='mb-4 '>
											<div className='my-1 flex items-center gap-x-[6px]'>
												<span className=' p-0 text-xs font-normal leading-5 text-lightBlue dark:text-blue-dark-medium'>Treasury</span>
												<HelperTooltip
													text='Funds collected through a portion of block production rewards, transaction fees, slashing, staking inefficiencies, etc.'
													className='text-xs font-medium leading-5 text-lightBlue dark:text-blue-dark-medium'
												/>
												<span className='rounded-lg bg-[#F4F5F6] px-[6px] py-[2px] text-[10px] font-medium text-[#485F7DCC] dark:bg-[#333843] dark:text-[#F4F5F6]'>Monthly</span>
											</div>
											<div className='flex items-baseline justify-between font-medium'>
												{available.value ? (
													<span className='text-lg font-medium text-bodyBlue dark:text-blue-dark-high'>
														{available.value}{' '}
														<span className='text-base font-medium text-blue-light-medium dark:text-blue-dark-medium'>{chainProperties[network]?.tokenSymbol}</span>
													</span>
												) : (
													<span>N/A</span>
												)}
												{!['polymesh', 'polymesh-test'].includes(network) && (
													<span className='ml-2 text-xs font-normal text-blue-light-medium dark:text-blue-dark-medium'>
														{available.valueUSD ? `~ $${available.valueUSD}` : 'N/A'}
													</span>
												)}
											</div>
										</div>
									</>
								) : (
									<div className='flex min-h-[89px] w-full items-center justify-center'>
										<LoadingOutlined />
									</div>
								)}
							</div>
							<div>
								{!(currentTokenPrice.isLoading || priceWeeklyChange.isLoading) ? (
									<div className='flex flex-col gap-2'>
										<div className={`${poppins.className} ${poppins.variable} flex items-baseline gap-x-1 self-end`}>
											<span className={' hidden text-xs font-normal leading-5 text-lightBlue dark:text-blue-dark-medium md:flex'}>
												{chainProperties[network]?.tokenSymbol} Price
											</span>
											<div className='flex items-center gap-x-1 text-lg font-semibold'>
												{currentTokenPrice.value === 'N/A' ? (
													<span className=' text-bodyBlue dark:text-blue-dark-high'>N/A</span>
												) : currentTokenPrice.value && !isNaN(Number(currentTokenPrice.value)) ? (
													<span className='ml-[2px] text-bodyBlue dark:text-blue-dark-high'>${currentTokenPrice.value}</span>
												) : null}
												<div className='ml-2 flex items-baseline'>
													<span className={`text-xs font-medium ${Number(priceWeeklyChange.value) < 0 ? 'text-[#F53C3C]' : 'text-[#52C41A]'} `}>
														{Math.abs(Number(priceWeeklyChange.value))}%
													</span>
													<span>
														{Number(priceWeeklyChange.value) < 0 ? (
															<CaretDownOutlined style={{ color: 'red', marginLeft: '1.5px' }} />
														) : (
															<CaretUpOutlined style={{ color: '#52C41A', marginLeft: '1.5px' }} />
														)}
													</span>
												</div>
											</div>
										</div>
										<div className={`${poppins.className} ${poppins.variable} flex items-center gap-2`}>
											<span className='flex items-center gap-1 text-xs font-medium text-blue-light-medium dark:text-blue-dark-medium'>
												<AssethubIcon />
												Asset Hub
											</span>
											<div className='flex gap-1 text-[11px] font-medium text-blue-light-high dark:text-blue-dark-high'>
												<div className=''>
													{formatNumberWithSuffix(Number(assetValue))} <span className='ml-[2px] font-normal'>{unit}</span>
												</div>
												<Divider
													className='mx-[1px] bg-section-light-container p-0 dark:bg-separatorDark'
													type='vertical'
												/>
												<div className=''>
													{Number(assetValueUSDC) / 100}m<span className='ml-[3px] font-normal'>USDC</span>
												</div>
												<Divider
													className='mx-[1px] bg-section-light-container p-0 dark:bg-separatorDark'
													type='vertical'
												/>
												<div className=''>
													{Number(assetValueUSDT) / 100}m<span className='ml-[3px] font-normal'>USDT</span>
												</div>
											</div>
										</div>
									</div>
								) : (
									<div className='flex min-h-[89px] w-full items-center justify-center'>
										<LoadingOutlined />
									</div>
								)}
							</div>
						</div>
						{/* graph */}
						<div></div>
					</div>

					<div className='flex w-full flex-1 flex-col gap-5 rounded-xxl bg-white p-3 drop-shadow-md dark:bg-section-dark-overlay sm:my-0 lg:px-6 lg:py-4'>
						<div className='w-full flex-col gap-x-0 lg:flex'>
							{!spendPeriod.isLoading ? (
								<>
									<div className='mb-4 sm:mb-0'>
										<div className='flex items-center'>
											<span className={`${poppins.className} ${poppins.variable} mr-2 mt-1 text-xs font-normal leading-5 text-lightBlue dark:text-blue-dark-medium lg:mt-0`}>
												Spend Period Remaining
											</span>

											<HelperTooltip
												text='Funds requested from the treasury are periodically distributed at the end of the spend period.'
												className='text-xs font-medium leading-5 text-lightBlue dark:text-blue-dark-medium'
											/>
										</div>

										<div className={`${poppins.className} ${poppins.variable} mt-1 flex items-baseline whitespace-pre font-medium text-bodyBlue dark:text-blue-dark-high sm:mt-0`}>
											{spendPeriod.value?.total ? (
												<>
													{spendPeriod.value?.days ? (
														<>
															<span className='text-base sm:text-lg'>{spendPeriod.value.days}&nbsp;</span>
															<span className='text-xs text-lightBlue dark:text-blue-dark-medium'>days&nbsp;</span>
														</>
													) : null}
													<>
														<span className='text-base sm:text-lg'>{spendPeriod.value.hours}&nbsp;</span>
														<span className='text-xs text-lightBlue dark:text-blue-dark-medium'>hrs&nbsp;</span>
													</>
													{!spendPeriod.value?.days ? (
														<>
															<span className='text-base sm:text-lg'>{spendPeriod.value.minutes}&nbsp;</span>
															<span className='text-xs text-lightBlue dark:text-blue-dark-medium'>mins&nbsp;</span>
														</>
													) : null}
													<span className='text-[10px] text-lightBlue dark:text-blue-dark-medium sm:text-xs'>/ {spendPeriod.value.total} days </span>
												</>
											) : (
												'N/A'
											)}
										</div>
									</div>
									<span className='flex items-center'>
										<ProgressBar
											className='m-0 flex items-center p-0'
											percent={!isNaN(Number(spendPeriod.percentage)) ? spendPeriod.percentage : 0}
											trailColor={trailColor}
											strokeColor='#E5007A'
											size='small'
										/>
									</span>
								</>
							) : (
								<div className='flex min-h-[89px] w-full items-center justify-center'>
									<LoadingOutlined />
								</div>
							)}
						</div>
						<Divider className='m-0 bg-section-light-container p-0 dark:bg-separatorDark' />
						<div>
							<div className='w-full gap-x-0 lg:flex'>
								{!nextBurn.isLoading ? (
									<>
										<div className='mb-2 h-12 w-[28%]'>
											<div className={`${poppins.className} ${poppins.variable} flex w-full flex-col text-xs`}>
												<span className='mr-2 text-xs font-normal leading-5 text-lightBlue dark:text-blue-dark-medium'>Next Burn</span>
												<div className='flex items-baseline gap-x-[6px]'>
													{nextBurn.value ? (
														<div className='flex items-baseline gap-x-[3px]'>
															<span className='text-lg font-medium'>{nextBurn.value}</span>
															<span className='text-base font-medium text-lightBlue dark:text-blue-dark-high'>{chainProperties[network]?.tokenSymbol}</span>
														</div>
													) : null}
													<span className=' text-xs font-normal text-lightBlue dark:text-blue-dark-high'>{nextBurn.valueUSD ? `~ $${nextBurn.valueUSD}` : 'N/A'}</span>
												</div>
											</div>
										</div>
										<div
											className={`${poppins.className} ${poppins.variable} ml-2 h-12 w-[72%] rounded-lg bg-[#F4F5F6] px-3 py-2 text-xs font-normal text-[#333843] dark:bg-[#333843] dark:text-[#F4F5F6]`}
										>
											If the Treasury ends a spend period without spending all of its funds, it suffers a burn of a percentage of its funds.
										</div>
									</>
								) : (
									<div className='flex min-h-[89px] w-full items-center justify-center'>
										<LoadingOutlined />
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			) : (
				<div
					className={`${className} grid ${
						!['polymesh', 'polymesh-test', 'polimec', 'rolimec'].includes(network) && 'grid-rows-2'
					} grid-flow-col grid-cols-2 xs:gap-6 sm:gap-8 xl:flex xl:gap-4`}
				>
					{/* Available */}
					<div className='flex w-full flex-1 rounded-xxl bg-white p-3 drop-shadow-md dark:bg-section-dark-overlay sm:my-0 lg:px-6 lg:py-3'>
						<div className='w-full flex-col gap-x-0 lg:flex'>
							<div className='mb-1.5 flex w-full items-center justify-center lg:hidden'>
								{theme === 'dark' ? (
									<ImageIcon
										src='/assets/icons/AvailableDark.svg'
										alt='available dark icon'
										imgClassName='lg:hidden'
									/>
								) : (
									<ImageIcon
										src='/assets/icons/available.svg'
										alt='available icon'
										imgClassName='lg:hidden'
									/>
								)}
							</div>
							{!available.isLoading ? (
								<>
									<div className='mb-4'>
										<div className='my-1 flex items-center'>
											<span className='mr-2 p-0 text-xs font-medium leading-5 text-lightBlue dark:text-blue-dark-medium'>Available</span>
											<HelperTooltip
												text='Funds collected through a portion of block production rewards, transaction fees, slashing, staking inefficiencies, etc.'
												className='text-xs font-medium leading-5 text-lightBlue dark:text-blue-dark-medium'
											/>
										</div>
										<div className='flex justify-between font-medium'>
											{available.value ? (
												<span className='text-lg font-medium text-bodyBlue dark:text-blue-dark-high'>
													{available.value} <span className='text-sm text-lightBlue dark:text-blue-dark-high'>{chainProperties[network]?.tokenSymbol}</span>
												</span>
											) : (
												<span>N/A</span>
											)}
										</div>
									</div>
									{!['polymesh', 'polymesh-test'].includes(network) && (
										<>
											<div className='flex flex-col justify-center gap-y-3 font-medium text-bodyBlue dark:text-blue-dark-high'>
												<Divider className='m-0 bg-section-light-container p-0 dark:bg-separatorDark' />
												<span className='flex flex-col justify-center text-xs font-medium text-lightBlue dark:text-blue-dark-high'>
													{available.valueUSD ? `~ $${available.valueUSD}` : 'N/A'}
												</span>
											</div>
										</>
									)}
								</>
							) : (
								<div className='flex min-h-[89px] w-full items-center justify-center'>
									<LoadingOutlined />
								</div>
							)}
						</div>
						<div>
							{theme === 'dark' ? (
								<ImageIcon
									src='/assets/icons/AvailableDark.svg'
									alt='available dark icon'
									imgClassName='xs:hidden lg:block w-full'
								/>
							) : (
								// <Available className='xs:hidden lg:block' />
								<ImageIcon
									src='/assets/icons/available.svg'
									alt='available icon'
									imgClassName='xs:hidden lg:block w-full'
								/>
							)}
						</div>
					</div>

					{/* CurrentPrice */}
					{!['moonbase', 'polimec', 'rolimec', 'westend'].includes(network) && (
						<div className='flex w-full flex-1 rounded-xxl bg-white p-3 drop-shadow-md dark:bg-section-dark-overlay sm:my-0 lg:px-6 lg:py-3'>
							<div className='w-full flex-col gap-x-0 lg:flex'>
								<div className='mb-1.5 flex w-full items-center justify-center lg:hidden'>
									{theme === 'dark' ? (
										<ImageIcon
											src='/assets/icons/CurrentPriceDark.svg'
											alt='current price dark icon'
											imgClassName='lg:hidden'
										/>
									) : (
										<ImageIcon
											src='/assets/icons/currentprice.svg'
											alt='current price icon'
											imgClassName='lg:hidden'
										/>
									)}
								</div>
								{!(currentTokenPrice.isLoading || priceWeeklyChange.isLoading) ? (
									<>
										<div className='mb-4'>
											<div className='my-1 flex items-center'>
												<span className='mr-2 hidden text-xs font-medium leading-5 text-lightBlue dark:text-blue-dark-medium md:flex'>
													Current Price of {chainProperties[network]?.tokenSymbol}
												</span>
												<span className='flex text-xs font-medium text-lightBlue dark:text-blue-dark-medium md:hidden'>Price {chainProperties[network]?.tokenSymbol}</span>
											</div>
											<div className='text-lg font-medium'>
												{currentTokenPrice.value === 'N/A' ? (
													<span>N/A</span>
												) : currentTokenPrice.value && !isNaN(Number(currentTokenPrice.value)) ? (
													<>
														<span className='text-lightBlue dark:text-blue-dark-high'>$ </span>
														<span className='text-bodyBlue dark:text-blue-dark-high'>{currentTokenPrice.value}</span>
													</>
												) : null}
											</div>
										</div>
										<div className='flex flex-col justify-center gap-y-3 overflow-hidden font-medium text-bodyBlue dark:text-blue-dark-high'>
											<Divider className='m-0 bg-section-light-container p-0 dark:bg-separatorDark' />
											<div className='flex items-center text-xs text-lightBlue dark:text-blue-dark-high md:whitespace-pre'>
												{priceWeeklyChange.value === 'N/A' ? (
													'N/A'
												) : priceWeeklyChange.value ? (
													<>
														<span className='mr-1 sm:mr-2'>Weekly Change</span>
														<div className='flex items-center'>
															<span className='font-semibold'>{Math.abs(Number(priceWeeklyChange.value))}%</span>
															{Number(priceWeeklyChange.value) < 0 ? (
																<CaretDownOutlined style={{ color: 'red', marginLeft: '1.5px' }} />
															) : (
																<CaretUpOutlined style={{ color: '#52C41A', marginLeft: '1.5px' }} />
															)}
														</div>
													</>
												) : null}
											</div>
										</div>
									</>
								) : (
									<div className='flex min-h-[89px] w-full items-center justify-center'>
										<LoadingOutlined />
									</div>
								)}
							</div>
							<div>
								{theme === 'dark' ? (
									<ImageIcon
										src='/assets/icons/CurrentPriceDark.svg'
										alt='current price dark icon'
										imgClassName='xs:hidden lg:block w-full'
									/>
								) : (
									<ImageIcon
										src='/assets/icons/currentprice.svg'
										alt='current price icon'
										imgClassName='xs:hidden lg:block w-full'
									/>
								)}
							</div>
						</div>
					)}

					{/* Next Burn */}
					{!['moonbeam', 'kilt', 'moonbase', 'moonriver', 'polymesh', 'polimec', 'rolimec'].includes(network) && (
						<div className='flex w-full flex-1 rounded-xxl bg-white p-3 drop-shadow-md dark:bg-section-dark-overlay sm:my-0 lg:px-6 lg:py-3'>
							<div className='w-full flex-col gap-x-0 lg:flex'>
								<div className='mb-1.5 flex w-full items-center justify-center lg:hidden'>
									{theme === 'dark' ? (
										<ImageIcon
											src='/assets/icons/NextBurnDark.svg'
											alt='next burn dark icon'
											imgClassName='lg:hidden'
										/>
									) : (
										<ImageIcon
											src='/assets/icons/nextburn.svg'
											alt='next burn icon'
											imgClassName='lg:hidden'
										/>
									)}
								</div>
								{!nextBurn.isLoading ? (
									<>
										<div className='mb-4'>
											<div className='my-1 flex items-center text-xs text-lightBlue dark:text-blue-dark-medium'>
												<span className='mr-2 text-xs font-medium leading-5 text-lightBlue dark:text-blue-dark-medium'>Next Burn</span>

												<HelperTooltip text='If the Treasury ends a spend period without spending all of its funds, it suffers a burn of a percentage of its funds.' />
											</div>

											<div className='flex justify-between text-lg font-medium text-bodyBlue dark:text-blue-dark-high'>
												{nextBurn.value ? (
													<span>
														{nextBurn.value} <span className='text-sm text-lightBlue dark:text-blue-dark-high'>{chainProperties[network]?.tokenSymbol}</span>
													</span>
												) : null}
											</div>
										</div>
										<div className='flex flex-col justify-center gap-y-3 font-medium text-sidebarBlue'>
											<Divider className='m-0 bg-section-light-container p-0 dark:bg-separatorDark' />
											<span className='mr-2 w-full text-xs font-medium text-lightBlue dark:text-blue-dark-high'>{nextBurn.valueUSD ? `~ $${nextBurn.valueUSD}` : 'N/A'}</span>
										</div>
									</>
								) : (
									<div className='flex min-h-[89px] w-full items-center justify-center'>
										<LoadingOutlined />
									</div>
								)}
							</div>
							<div>
								{theme === 'dark' ? (
									<ImageIcon
										src='/assets/icons/NextBurnDark.svg'
										alt='next burn dark icon'
										imgClassName='xs:hidden lg:block w-full'
									/>
								) : (
									<ImageIcon
										src='/assets/icons/nextburn.svg'
										alt='next burn icon'
										imgClassName='xs:hidden lg:block w-full'
									/>
								)}
							</div>
						</div>
					)}

					{/* Spend Period */}
					{!['polymesh', 'polymesh-test'].includes(network) && (
						<>
							{!inTreasuryProposals && (
								<div className='flex w-full flex-1 rounded-xxl bg-white p-3 drop-shadow-md dark:bg-section-dark-overlay sm:my-0 lg:px-6 lg:py-3'>
									<div className='w-full flex-col gap-x-0 lg:flex'>
										<div className='mb-1.5 flex w-full items-center justify-center lg:hidden'>
											{theme === 'dark' ? (
												<ImageIcon
													src='/assets/icons/SpendPeriodDark.svg'
													alt='spend period dark icon'
													imgClassName='lg:hidden'
												/>
											) : (
												<ImageIcon
													src='/assets/icons/spendperiod.svg'
													alt='spend period icon'
													imgClassName='lg:hidden'
												/>
											)}
										</div>
										{!spendPeriod.isLoading ? (
											<>
												<div className='mb-5 sm:mb-4'>
													<div className='my-1 flex items-center'>
														<span className='mr-2 mt-1 text-xs font-medium leading-5 text-lightBlue dark:text-blue-dark-medium lg:mt-0'>Spend Period</span>

														<HelperTooltip
															text='Funds requested from the treasury are periodically distributed at the end of the spend period.'
															className='text-xs font-medium leading-5 text-lightBlue dark:text-blue-dark-medium'
														/>
													</div>

													<div className='mt-1 flex items-baseline whitespace-pre font-medium text-bodyBlue dark:text-blue-dark-high sm:mt-0'>
														{spendPeriod.value?.total ? (
															<>
																{spendPeriod.value?.days ? (
																	<>
																		<span className='text-base sm:text-lg'>{spendPeriod.value.days}&nbsp;</span>
																		<span className='text-xs text-lightBlue dark:text-blue-dark-medium'>days&nbsp;</span>
																	</>
																) : null}
																<>
																	<span className='text-base sm:text-lg'>{spendPeriod.value.hours}&nbsp;</span>
																	<span className='text-xs text-lightBlue dark:text-blue-dark-medium'>hrs&nbsp;</span>
																</>
																{!spendPeriod.value?.days ? (
																	<>
																		<span className='text-base sm:text-lg'>{spendPeriod.value.minutes}&nbsp;</span>
																		<span className='text-xs text-lightBlue dark:text-blue-dark-medium'>mins&nbsp;</span>
																	</>
																) : null}
																<span className='text-[10px] text-lightBlue dark:text-blue-dark-medium sm:text-xs'>/ {spendPeriod.value.total} days </span>
															</>
														) : (
															'N/A'
														)}
													</div>
												</div>
												{
													<div className='flex flex-col justify-center gap-y-3 font-medium'>
														<Divider className='m-0 bg-section-light-container p-0 dark:bg-separatorDark' />
														<span className='flex items-center'>
															<ProgressBar
																className='m-0 flex items-center p-0'
																percent={!isNaN(Number(spendPeriod.percentage)) ? spendPeriod.percentage : 0}
																trailColor={trailColor}
																strokeColor='#E5007A'
																size='small'
															/>
														</span>
													</div>
												}
											</>
										) : (
											<div className='flex min-h-[89px] w-full items-center justify-center'>
												<LoadingOutlined />
											</div>
										)}
									</div>
									<div>
										{theme === 'dark' ? (
											<ImageIcon
												src='/assets/icons/SpendPeriodDark.svg'
												alt='spend period dark icon'
												imgClassName='mt-2 xs:hidden lg:block w-full'
											/>
										) : (
											<ImageIcon
												src='/assets/icons/spendperiod.svg'
												alt='spend period icon'
												imgClassName='mt-2 xs:hidden lg:block w-full'
											/>
										)}
									</div>
								</div>
							)}
						</>
					)}
				</div>
			)}
		</section>
	);
};

export default styled(TreasuryOverview)`
	.ant-progress-text {
		color: ${(props: any) => (props.theme === 'dark' ? '#fff' : '#1E262D')} !important;
		font-size: 12px !important;
	}
	.ant-progress-outer {
		display: flex !important;
		align-items: center !important;
	}
`;
