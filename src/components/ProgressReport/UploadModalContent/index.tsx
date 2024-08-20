// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import { Button } from 'antd';
import React from 'react';
import { useDispatch } from 'react-redux';
import ImageIcon from '~src/ui-components/ImageIcon';
import type { UploadProps } from 'antd';
import { message, Upload } from 'antd';
import { PlusCircleOutlined, ExportOutlined } from '@ant-design/icons';
import { progressReportActions } from '~src/redux/progressReport';
import Alert from '~src/basic-components/Alert';
import { useProgressReportSelector } from '~src/redux/selectors';
import ContentForm from '~src/components/ContentForm';

const { Dragger } = Upload;

const UploadModalContent = () => {
	const dispatch = useDispatch();
	const { post_report_added, report_uploaded, add_summary_cta_clicked } = useProgressReportSelector();

	const props: UploadProps = {
		action: window.location.href,
		multiple: true,
		name: 'file',
		onChange(info) {
			const { status } = info.file;
			if (status !== 'uploading') {
				console.log(info.file, info.fileList);
			}
			if (status === 'done') {
				dispatch(progressReportActions.setReportUploaded(true));
				message.success(`${info.file.name} file uploaded successfully.`);
			} else if (status === 'error') {
				dispatch(progressReportActions.setReportUploaded(false));
				message.error(`${info.file.name} file upload failed.`);
			}
		},
		onDrop(e) {
			console.log('Dropped files', e.dataTransfer.files);
		}
	};
	return (
		<article className='mt-2 flex flex-col gap-y-1'>
			{/* NOTE: Push this progress report field in backend and use that field check in place of post_report_added */}
			{!post_report_added && (
				<Alert
					className='mb-4 mt-4 dark:border-infoAlertBorderDark dark:bg-infoAlertBgDark'
					showIcon
					type='info'
					message={<span className='dark:text-blue-dark-high'>Progress Report Pending!</span>}
				/>
			)}
			<div className='flex items-center justify-start gap-x-2'>
				<p className='m-0 p-0 text-sm text-bodyBlue dark:text-modalOverlayDark'>Please update your progress report for users to rate it.</p>
				{report_uploaded && (
					<Button
						className='m-0 border-none bg-transparent p-0 text-sm text-pink_primary'
						onClick={() => {
							dispatch(progressReportActions.setAddSummaryCTAClicked(true));
						}}
					>
						<PlusCircleOutlined className='m-0 p-0' /> Add summary
					</Button>
				)}
			</div>
			{!report_uploaded && (
				<div className='-mt-2 flex items-center justify-start gap-x-2'>
					<p className='m-0 p-0 text-sm text-pink_primary'>View Template for making a Progress Report</p>
					<Button className='m-0 border-none bg-transparent p-0 text-sm text-pink_primary'>
						<ExportOutlined className='m-0 p-0' />
					</Button>
				</div>
			)}
			{add_summary_cta_clicked && (
				<ContentForm
					onChange={(content: any) => {
						console.log(content);
						dispatch(progressReportActions.setSummaryContent(content));
					}}
					height={200}
				/>
			)}
			<Dragger {...props}>
				<div className='flex flex-row items-center justify-center gap-x-3'>
					<p className='ant-upload-drag-icon'>
						<ImageIcon
							src='/assets/icons/upload-icon.svg'
							alt='upload-icon'
						/>
					</p>
					<div className='flex flex-col items-start justify-start gap-y-2'>
						<p className='ant-upload-text m-0 p-0 text-base text-bodyBlue dark:text-section-dark-overlay'>Upload</p>
						<p className='ant-upload-hint m-0 p-0 text-sm text-bodyBlue dark:text-section-dark-overlay'>Drag and drop your files here.</p>
					</div>
				</div>
			</Dragger>
		</article>
	);
};

export default UploadModalContent;
