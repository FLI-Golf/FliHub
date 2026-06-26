import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();

		// ── Step 1 — account fields ───────────────────────────────────────────
		const firstName   = (data.get('firstName')   as string ?? '').trim();
		const lastName    = (data.get('lastName')    as string ?? '').trim();
		const email       = (data.get('email')       as string ?? '').trim();
		const password    = (data.get('password')    as string ?? '');
		const confirmPwd  = (data.get('confirmPassword') as string ?? '');

		// ── Step 2 — company fields ───────────────────────────────────────────
		const companyName = (data.get('companyName') as string ?? '').trim();
		const category    = (data.get('category')    as string ?? '').trim();
		const website     = (data.get('website')     as string ?? '').trim();
		const phone       = (data.get('phone')       as string ?? '').trim();
		const about       = (data.get('about')       as string ?? '').trim();
		const location    = (data.get('location')    as string ?? '').trim();

		// ── Validation ────────────────────────────────────────────────────────
		if (!firstName || !lastName || !email || !password || !companyName || !category) {
			return fail(400, { error: 'Please complete all required fields.', firstName, lastName, email, companyName, category, website, phone, about, location });
		}
		if (password !== confirmPwd) {
			return fail(400, { error: 'Passwords do not match.', firstName, lastName, email, companyName, category, website, phone, about, location });
		}
		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.', firstName, lastName, email, companyName, category, website, phone, about, location });
		}

		try {
			// 1. Create auth user
			const user = await locals.pb.collection('users').create({
				email,
				password,
				passwordConfirm: password,
				emailVisibility: true,
			});

			// 2. Authenticate so we can create related records
			await locals.pb.collection('users').authWithPassword(email, password);

			// 3. Create vendors record (field names match actual PB schema)
			const vendor = await locals.pb.collection('vendors').create({
				name:          companyName,
				contact_email: email,
				contact_phone: phone || '',
				contact_name:  `${firstName} ${lastName}`.trim(),
				website:       website || '',
				about:         about || '',
				active:        true,
			});

			// 4. Create user_profile with role 'vendor', linked to vendor record
			await locals.pb.collection('user_profiles').create({
				userId:       user.id,
				role:         'vendor',
				firstName,
				lastName,
				email,
				phone:        phone || '',
				organization: companyName,
				status:       'active',
				vendorId:     vendor.id,
			});

		} catch (err: any) {
			// Don't swallow redirect errors
			if (err?.status === 303) throw err;

			const pbErrors = err?.data?.data ?? {};
			if (pbErrors.email) {
				return fail(400, { error: 'An account with that email already exists.', firstName, lastName, email, companyName, category, website, phone, about, location });
			}
			return fail(400, { error: err?.message ?? 'Registration failed. Please try again.', firstName, lastName, email, companyName, category, website, phone, about, location });
		}

		throw redirect(303, '/portal/vendor/dashboard');
	}
} satisfies Actions;
