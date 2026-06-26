export type DashboardPlayerProfileRole = 'pro' | 'manager' | 'broadcaster';

export type DashboardWizardStep = {
	id: string;
	label: string;
};

export type DashboardWizardHeader = {
	title: string;
	subtitle: string;
};

abstract class DashboardPlayerProfileWizard {
	abstract readonly role: DashboardPlayerProfileRole;
	abstract getHeader(): DashboardWizardHeader;
	abstract getSteps(): DashboardWizardStep[];
}

class ProDashboardPlayerProfileWizard extends DashboardPlayerProfileWizard {
	readonly role = 'pro' as const;

	getHeader(): DashboardWizardHeader {
		return {
			title: 'FLI Golf Player Profile',
			subtitle: 'Complete your long-form player profile over time.',
		};
	}

	getSteps(): DashboardWizardStep[] {
		return [
			{ id: 'personal', label: 'Personal Info' },
			{ id: 'competitive', label: 'Competitive Background' },
			{ id: 'branding', label: 'Branding & Media' },
			{ id: 'sponsorship', label: 'Sponsorship' },
			{ id: 'management', label: 'Management' },
			{ id: 'integrity', label: 'Betting & Integrity' },
			{ id: 'additional', label: 'Additional Info' },
		];
	}
}

class ManagerDashboardPlayerProfileWizard extends DashboardPlayerProfileWizard {
	readonly role = 'manager' as const;

	getHeader(): DashboardWizardHeader {
		return {
			title: 'Managed Player Profile',
			subtitle: 'Complete long-form profiles for represented pros.',
		};
	}

	getSteps(): DashboardWizardStep[] {
		return new ProDashboardPlayerProfileWizard().getSteps();
	}
}

class BroadcasterDashboardPlayerProfileWizard extends DashboardPlayerProfileWizard {
	readonly role = 'broadcaster' as const;

	getHeader(): DashboardWizardHeader {
		return {
			title: 'Broadcast Talent Profile',
			subtitle: 'Capture public-facing identity and media details.',
		};
	}

	getSteps(): DashboardWizardStep[] {
		return [
			{ id: 'personal', label: 'Personal Info' },
			{ id: 'branding', label: 'Branding & Media' },
			{ id: 'additional', label: 'Additional Info' },
		];
	}
}

export function getDashboardPlayerProfileWizard(role: string | null | undefined): DashboardPlayerProfileWizard {
	if (role === 'manager') return new ManagerDashboardPlayerProfileWizard();
	if (role === 'broadcaster') return new BroadcasterDashboardPlayerProfileWizard();
	return new ProDashboardPlayerProfileWizard();
}
