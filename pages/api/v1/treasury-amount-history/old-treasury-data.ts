// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

/* eslint-disable sort-keys */
import storeApiKeyUsage from '~src/api-middlewares/storeApiKeyUsage';
import withErrorHandling from '~src/api-middlewares/withErrorHandling';
import { subscanApiHeaders } from '~src/global/apiHeaders';
import { chainProperties } from '~src/global/networkConstants';
import messages from '~src/auth/utils/messages';
import { NextApiRequest, NextApiResponse } from 'next';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import { firestore_db } from '~src/services/firebaseInit';
import { IHistoryItem } from '~src/types';

interface IResponseData {
	history: IHistoryItem[] | null;
	status: string;
}

interface IReturnResponse {
	data?: IResponseData[] | null;
	error?: null | string;
}

function getMonthRange(monthsAgo: number): { start: string; end: string } {
	const today = dayjs();
	let startDate = today.subtract(monthsAgo, 'month').startOf('month');

	if (startDate.isAfter(today)) {
		startDate = today.subtract(monthsAgo + 1, 'month').startOf('month');
	}

	const endDate = today.isBefore(startDate.add(1, 'month')) ? today : startDate.add(1, 'month').subtract(1, 'day');
	const start = startDate.format('YYYY-MM-DD');
	const end = endDate.format('YYYY-MM-DD');
	return { start, end };
}

const generateDateRange = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): string[] => {
	const dates: string[] = [];
	let currentDate = startDate.startOf('day');

	const totalDays = endDate.endOf('day').diff(currentDate, 'day') + 1;

	for (let i = 0; i < totalDays; i++) {
		dates.push(currentDate.format('YYYY-MM-DD'));
		currentDate = currentDate.add(1, 'day');
	}

	return dates;
};

const formatDate = (date: dayjs.Dayjs): string => {
	return date.format('YYYY-MM-DD');
};

const aggregateBalances = (data1: IResponseData[], data2: IResponseData[]): IResponseData[] => {
	const getLatestBalance = (history: IHistoryItem[]): number => {
		const sortedHistory = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		return parseFloat(sortedHistory[0].balance) || 0;
	};

	const combinedData: { [key: string]: number } = {};

	const filterNonZeroBalances = (data: IResponseData[]) => {
		return data.filter(({ history }) => {
			if (history) {
				const balanceValue = getLatestBalance(history);
				return balanceValue > 0;
			}
			return false;
		});
	};

	const networkTreasuryData = filterNonZeroBalances(data1);
	const assethubTreasuryData = filterNonZeroBalances(data2);

	networkTreasuryData.forEach(({ history }) => {
		if (history) {
			history.forEach(({ date }) => {
				const key = formatDate(dayjs(date));
				const balanceValue = getLatestBalance(history);

				if (combinedData[key]) {
					combinedData[key] += balanceValue;
				} else {
					combinedData[key] = balanceValue;
				}
			});
		}
	});

	assethubTreasuryData.forEach(({ history }) => {
		if (history) {
			history.forEach(({ date }) => {
				const key = formatDate(dayjs(date));
				const balanceValue = getLatestBalance(history);

				if (combinedData[key]) {
					combinedData[key] += balanceValue;
				} else {
					combinedData[key] = balanceValue;
				}
			});
		}
	});

	const today = dayjs();
	const startDate = dayjs('2024-01-01');
	const allDates = generateDateRange(startDate, today);

	const fullData: { [key: string]: number } = {};
	allDates.forEach((date) => {
		fullData[date] = 0;
	});

	Object.keys(combinedData).forEach((date) => {
		fullData[date] = combinedData[date];
	});

	return Object.keys(fullData).map((date) => ({
		history: [
			{
				date,
				balance: fullData[date].toFixed(2)
			}
		],
		status: 'Success'
	}));
};

export const getAssetHubAndNetworkBalance = async (network: string, address: string, apiUrl: string): Promise<IReturnResponse> => {
	const returnResponse: IReturnResponse = {
		data: null,
		error: null
	};

	if (!network) {
		returnResponse.error = messages.INVALID_NETWORK;
		return returnResponse;
	}

	try {
		const results: IResponseData[] = [];
		for (let i = 0; i < 7; i++) {
			const { start, end } = getMonthRange(i);

			const requestBody = {
				address,
				end,
				start
			};

			const response = await fetch(apiUrl, {
				body: JSON.stringify(requestBody),
				headers: subscanApiHeaders,
				method: 'POST'
			});

			if (!response.ok) {
				throw new Error(messages.API_FETCH_ERROR);
			}

			const data = await response.json();

			if (data?.message === 'Success') {
				const responseData: IResponseData = data?.data as IResponseData;
				if (responseData.history === null) {
					responseData.history = [{ date: start, balance: '0' }];
				}
				results.push(responseData);
			} else {
				returnResponse.error = messages.API_FETCH_ERROR;
				break;
			}
		}

		returnResponse.data = results.length > 0 ? results : null;
		return returnResponse;
	} catch (error) {
		returnResponse.error = error instanceof Error ? error.message : 'Data Not Available';
		return returnResponse;
	}
};

const documentExists = async (network: string, date: string): Promise<boolean> => {
	const networkRef = firestore_db.collection('networks').doc(network);
	const treasuryRef = networkRef.collection('treasury_amount_history').doc(date);

	const doc = await treasuryRef.get();
	return doc.exists;
};

const saveToFirestore = async (network: string, data: IResponseData[]) => {
	try {
		const batch = firestore_db.batch();

		const networkRef = firestore_db.collection('networks').doc(network);
		const treasuryRef = networkRef.collection('treasury_amount_history');

		const promises = data.map(async (item) => {
			if (item.history) {
				return item.history.map(async ({ date, balance }) => {
					if (dayjs(date).date() === 1) {
						return null;
					}

					const docRef = treasuryRef.doc(date);
					const exists = await documentExists(network, date);

					if (!exists) {
						batch.set(docRef, { date, balance });
					} else {
						batch.update(docRef, { balance });
					}
				});
			}
			return null;
		});

		await Promise.all(promises.flat());
		await batch.commit();
	} catch (error) {
		console.error('Error writing data to Firestore:', error);
	}
};

export const getCombinedBalances = async (network: string): Promise<IReturnResponse> => {
	try {
		const address1 = chainProperties[network]?.assetHubTreasuryAddress;
		const apiUrl1 = `${chainProperties[network]?.assethubExternalLinks}/api/scan/account/balance_history`;

		const address2 = chainProperties[network]?.treasuryAddress;
		const apiUrl2 = `${chainProperties[network]?.externalLinks}/api/scan/account/balance_history`;

		if (!address1 || !apiUrl1 || !address2 || !apiUrl2) {
			return {
				data: null,
				error: 'Missing address or API URL for the given network'
			};
		}

		const response1 = await getAssetHubAndNetworkBalance(network, address1, apiUrl1);
		const response2 = await getAssetHubAndNetworkBalance(network, address2, apiUrl2);

		const combinedData = aggregateBalances(response1.data || [], response2.data || []);
		const combinedError = response1.error || response2.error;

		await saveToFirestore(network, combinedData);

		return {
			data: combinedData.length > 0 ? combinedData : null,
			error: combinedError
		};
	} catch (error) {
		return {
			data: null,
			error: error.message || 'An unexpected error occurred while getting combined balances'
		};
	}
};

const handler = async (req: NextApiRequest, res: NextApiResponse<IReturnResponse>): Promise<void> => {
	storeApiKeyUsage(req);

	const { network } = req.body;

	if (typeof network !== 'string') {
		res.status(400).json({
			data: null,
			error: 'Invalid network'
		});
		return;
	}

	const response = await getCombinedBalances(network);
	if (response.error) {
		res.status(500).json(response);
	} else {
		res.status(200).json(response);
	}
};

export default withErrorHandling(handler);
