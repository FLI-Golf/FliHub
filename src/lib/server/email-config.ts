type EnvSource = Record<string, string | undefined>;

function firstEnv(env: EnvSource, ...keys: string[]): string {
	for (const key of keys) {
		const value = env[key]?.trim();
		if (value) return value;
	}
	return '';
}

export function getEmailDeliveryStatus(env: EnvSource = process.env) {
	const host = firstEnv(env, 'SMTP_HOST', 'MAIL_HOST');
	const port = firstEnv(env, 'SMTP_PORT', 'MAIL_PORT');
	const user = firstEnv(env, 'SMTP_USER', 'MAIL_USER');
	const pass = firstEnv(env, 'SMTP_PASS', 'MAIL_PASS');
	const from = firstEnv(env, 'SMTP_FROM', 'MAIL_FROM');

	const emailDeliveryEnabled = Boolean(host && port && user && pass && from);

	return {
		emailDeliveryEnabled,
		host,
		port,
		user,
		from
	};
}
