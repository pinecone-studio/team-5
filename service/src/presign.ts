import { AwsClient } from 'aws4fetch';

const R2_ACCOUNT_ID = '630398f7cca5a714a459a22c46cd6b52';

export async function createPresignedPutUrl(options: {
	accessKeyId: string;
	secretAccessKey: string;
	bucket: string;
	key: string;
	contentType: string;
	expiresInSeconds?: number;
}): Promise<string> {
	const {
		accessKeyId,
		secretAccessKey,
		bucket,
		key,
		contentType,
		expiresInSeconds = 300,
	} = options;

	const client = new AwsClient({
		accessKeyId,
		secretAccessKey,
		region: 'auto',
		service: 's3',
	});

	const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/${key}`;
	const url = new URL(endpoint);
	url.searchParams.set('X-Amz-Expires', String(expiresInSeconds));

	const signed = await client.sign(
		new Request(url.toString(), {
			method: 'PUT',
			headers: { 'Content-Type': contentType },
		}),
		{ aws: { signQuery: true } },
	);

	return signed.url;
}
