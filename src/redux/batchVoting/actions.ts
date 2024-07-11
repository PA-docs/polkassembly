// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { createAsyncThunk } from '@reduxjs/toolkit';
import { batchVotesActions } from '.';
import BN from 'bn.js';
import { EVoteDecisionType } from '~src/types';

interface IBatchVotingDefaults {
	values: {
		voteOption?: string;
		voteBalance?: BN;
		ayeVoteBalance?: BN;
		nyeVoteBalance?: BN;
		abstainVoteBalance?: BN;
		conviction?: string;
	};
}

export const editBatchValueChanged = createAsyncThunk('house/editProfileFieldValueChanged', async (params: IBatchVotingDefaults, { dispatch }) => {
	const { values } = params;
	if (values?.voteOption) {
		dispatch(
			batchVotesActions.setBatchVoting_Field({
				key: 'voteOption',
				value: values?.voteOption || EVoteDecisionType.AYE
			})
		);
	} else if (values?.voteBalance) {
		dispatch(
			batchVotesActions.setBatchVoting_Field({
				key: 'voteBalance',
				value: values?.voteBalance || 0
			})
		);
	} else if (values?.ayeVoteBalance) {
		dispatch(
			batchVotesActions.setBatchVoting_Field({
				key: 'ayeVoteBalance',
				value: values?.ayeVoteBalance || 0
			})
		);
	} else if (values?.nyeVoteBalance) {
		dispatch(
			batchVotesActions.setBatchVoting_Field({
				key: 'nyeVoteBalance',
				value: values?.nyeVoteBalance || 0
			})
		);
	} else if (values?.abstainVoteBalance) {
		dispatch(
			batchVotesActions.setBatchVoting_Field({
				key: 'abstainVoteBalance',
				value: values?.abstainVoteBalance || 0
			})
		);
	} else if (values?.conviction) {
		dispatch(
			batchVotesActions.setBatchVoting_Field({
				key: 'conviction',
				value: values?.conviction
			})
		);
	}
});
