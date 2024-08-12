// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import { NextApiHandler } from 'next';
import storeApiKeyUsage from '~src/api-middlewares/storeApiKeyUsage';
import withErrorHandling from '~src/api-middlewares/withErrorHandling';
import { isValidNetwork } from '~src/api-utils';
import { firestore_db } from '~src/services/firebaseInit';
import { IApiResponse } from '~src/types';
import messages from '~src/util/messages';

interface IGetTreasuryHistoryParams {
	network: string;
}

interface IHistoryItem {
	date: string;
	balance: string;
}

export async function getTreasuryAmountHistory(params: IGetTreasuryHistoryParams): Promise<IApiResponse<IHistoryItem[]>> {
	try {
		const { network } = params;

		const treasuryAmountHistoryRef = firestore_db.collection('networks').doc(network).collection('treasury_amount_history');
		const snapshot = await treasuryAmountHistoryRef.get();

		if (snapshot.empty) {
			return {
				data: null,
				error: 'No treasury history found for this network',
				status: 404
			};
		}

		const treasuryAmountHistory: IHistoryItem[] = snapshot.docs
			.map((doc) => {
				const data = doc.data() as IHistoryItem | null;
				return data ? data : null;
			})
			.filter((item) => item !== null) as IHistoryItem[];

		return {
			data: treasuryAmountHistory,
			error: null,
			status: 200
		};
	} catch (error) {
		return {
			data: null,
			error: error.message || messages.API_FETCH_ERROR,
			status: Number(error.name) || 500
		};
	}
}

const handler: NextApiHandler<IHistoryItem[] | { error: string }> = async (req, res) => {
	storeApiKeyUsage(req);

	const network = req.headers['x-network'] as string;
	if (!network || !isValidNetwork(network)) {
		return res.status(400).json({ error: 'Missing network in request headers' });
	}
	try {
		const { data, error, status } = await getTreasuryAmountHistory({ network });

		if (error || !data) {
			return res.status(status).json({ error: error || messages.API_FETCH_ERROR });
		} else {
			return res.status(status).json(data);
		}
	} catch (error) {
		console.error('Error occurred in API handler:', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};

export default withErrorHandling(handler);
