import type { Campaign } from '../models/Campaign';

export interface ContractTemplate {
	title: string;
	sections: ContractSection[];
	footer: string;
}

export interface ContractSection {
	heading: string;
	content: string;
}

export interface ContractData {
	campaign: Campaign;
	parties: {
		organization: string;
		representative: string;
		address?: string;
		email?: string;
		phone?: string;
	};
	vendor?: {
		name: string;
		representative: string;
		address?: string;
		email?: string;
		phone?: string;
	};
	terms: {
		paymentTerms?: string;
		deliverables?: string[];
		timeline?: string;
		cancellationPolicy?: string;
	};
}

/**
 * ContractGenerator - Generates contracts for campaigns and vendors
 */
export class ContractGenerator {
	/**
	 * Generate campaign budget approval contract
	 */
	generateBudgetApprovalContract(data: ContractData): ContractTemplate {
		const { campaign, parties } = data;

		return {
			title: `BUDGET APPROVAL AGREEMENT - ${campaign.name}`,
			sections: [
				{
					heading: '1. PARTIES',
					content: `This Budget Approval Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString()} by and between ${parties.organization} ("Organization"), represented by ${parties.representative}, and the Campaign Manager responsible for "${campaign.name}" ("Campaign").`
				},
				{
					heading: '2. CAMPAIGN DETAILS',
					content: `
Campaign Name: ${campaign.name}
Campaign Type: ${campaign.type}
Campaign Period: ${campaign.startDate?.toLocaleDateString() || 'TBD'} to ${campaign.endDate?.toLocaleDateString() || 'TBD'}
Fiscal Year: ${campaign.fiscalYear || new Date().getFullYear()}
					`.trim()
				},
				{
					heading: '3. BUDGET ALLOCATION',
					content: `
The Organization hereby approves a total budget of $${(campaign.forecastedExpenses || 0).toLocaleString()} for the Campaign, allocated as follows:

${this.formatExpenseCategories(campaign.expenseCategories || {})}

Total Approved Budget: $${(campaign.forecastedExpenses || 0).toLocaleString()}
					`.trim()
				},
				{
					heading: '4. EXPENSE MANAGEMENT',
					content: `
4.1 All expenses must be submitted with proper documentation and receipts.
4.2 Expenses exceeding $100 require receipt documentation.
4.3 Any expense exceeding 10% of the allocated category budget requires additional approval.
4.4 Monthly expense reports must be submitted by the 5th of each month.
4.5 The Campaign Manager is responsible for tracking actual expenses against forecasted amounts.
					`.trim()
				},
				{
					heading: '5. APPROVAL PROCESS',
					content: `
5.1 All expenses must be submitted through the approved expense management system.
5.2 Expenses will be reviewed and approved within 5 business days.
5.3 Reimbursements will be processed within 10 business days of approval.
5.4 Budget modifications require written approval from the Organization.
					`.trim()
				},
				{
					heading: '6. REPORTING REQUIREMENTS',
					content: `
6.1 Monthly budget variance reports must be submitted.
6.2 Quarterly financial reviews will be conducted.
6.3 Final campaign financial report due within 30 days of campaign completion.
6.4 All reports must include actual vs. forecasted expense analysis.
					`.trim()
				},
				{
					heading: '7. BUDGET OVERRUNS',
					content: `
7.1 If actual expenses exceed forecasted expenses by more than 10%, immediate notification is required.
7.2 Budget overruns require written justification and approval for additional funds.
7.3 Unauthorized expenses exceeding the approved budget may not be reimbursed.
					`.trim()
				},
				{
					heading: '8. TERMINATION',
					content: `
This Agreement may be terminated by either party with 30 days written notice. Upon termination, all pending expenses must be submitted within 15 days, and a final financial report must be provided within 30 days.
					`.trim()
				}
			],
			footer: `
AGREED AND ACCEPTED:

${parties.organization}
By: ${parties.representative}
Date: ${new Date().toLocaleDateString()}

Campaign Manager
Date: _________________

This is a legally binding agreement. Please review carefully before signing.
			`.trim()
		};
	}

	/**
	 * Generate vendor service agreement
	 */
	generateVendorServiceAgreement(data: ContractData): ContractTemplate {
		const { campaign, parties, vendor, terms } = data;

		if (!vendor) {
			throw new Error('Vendor information required for service agreement');
		}

		return {
			title: `VENDOR SERVICE AGREEMENT - ${campaign.name}`,
			sections: [
				{
					heading: '1. PARTIES',
					content: `This Vendor Service Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString()} between ${parties.organization} ("Client"), and ${vendor.name} ("Vendor").`
				},
				{
					heading: '2. SCOPE OF SERVICES',
					content: `
Vendor agrees to provide services for the campaign "${campaign.name}" as follows:

${terms.deliverables?.map((d, i) => `${i + 1}. ${d}`).join('\n') || 'Services to be defined'}

Campaign Period: ${campaign.startDate?.toLocaleDateString() || 'TBD'} to ${campaign.endDate?.toLocaleDateString() || 'TBD'}
					`.trim()
				},
				{
					heading: '3. COMPENSATION',
					content: `
Total Contract Value: $${(campaign.budget || 0).toLocaleString()}

Payment Terms: ${terms.paymentTerms || 'Net 30 days from invoice date'}

All invoices must include:
- Detailed description of services provided
- Date of service
- Campaign reference: ${campaign.name}
- Vendor tax identification number
					`.trim()
				},
				{
					heading: '4. TIMELINE AND DELIVERABLES',
					content: terms.timeline || `
Services shall commence on ${campaign.startDate?.toLocaleDateString() || 'TBD'} and be completed by ${campaign.endDate?.toLocaleDateString() || 'TBD'}.

Deliverables must be submitted according to the agreed schedule and meet the quality standards specified in the campaign requirements.
					`.trim()
				},
				{
					heading: '5. INVOICING AND PAYMENT',
					content: `
5.1 Vendor shall submit invoices through the approved expense management system.
5.2 All invoices must be accompanied by supporting documentation.
5.3 Payment will be processed within ${terms.paymentTerms || '30 days'} of invoice approval.
5.4 Disputed charges must be raised within 10 business days of invoice receipt.
					`.trim()
				},
				{
					heading: '6. CANCELLATION POLICY',
					content: terms.cancellationPolicy || `
Either party may terminate this Agreement with 30 days written notice. In the event of termination:
- Vendor will be compensated for all services rendered up to the termination date
- All work product must be delivered within 15 days
- Final invoice must be submitted within 30 days
					`.trim()
				},
				{
					heading: '7. CONFIDENTIALITY',
					content: `
Vendor agrees to maintain confidentiality of all Client information, campaign strategies, and financial data. This obligation survives termination of this Agreement.
					`.trim()
				},
				{
					heading: '8. INDEMNIFICATION',
					content: `
Vendor agrees to indemnify and hold harmless Client from any claims, damages, or expenses arising from Vendor's performance of services under this Agreement.
					`.trim()
				}
			],
			footer: `
AGREED AND ACCEPTED:

${parties.organization}
By: ${parties.representative}
Date: ${new Date().toLocaleDateString()}

${vendor.name}
By: ${vendor.representative}
Date: _________________

This is a legally binding agreement. Please review carefully before signing.
			`.trim()
		};
	}

	/**
	 * Generate expense reimbursement agreement
	 */
	generateReimbursementAgreement(data: ContractData): ContractTemplate {
		const { campaign, parties } = data;

		return {
			title: `EXPENSE REIMBURSEMENT AGREEMENT - ${campaign.name}`,
			sections: [
				{
					heading: '1. PURPOSE',
					content: `This Expense Reimbursement Agreement establishes the terms and conditions for reimbursement of approved expenses incurred in connection with "${campaign.name}".`
				},
				{
					heading: '2. ELIGIBLE EXPENSES',
					content: `
The following expense categories are eligible for reimbursement under this campaign:

${this.formatExpenseCategories(campaign.expenseCategories || {})}

All expenses must be reasonable, necessary, and directly related to campaign activities.
					`.trim()
				},
				{
					heading: '3. SUBMISSION REQUIREMENTS',
					content: `
3.1 All expense claims must be submitted within 30 days of incurrence.
3.2 Original receipts must be provided for all expenses over $25.
3.3 Expense reports must include: date, vendor, amount, category, and business purpose.
3.4 Mileage reimbursement requires documentation of origin, destination, and business purpose.
					`.trim()
				},
				{
					heading: '4. APPROVAL PROCESS',
					content: `
4.1 Expense reports will be reviewed within 5 business days of submission.
4.2 Approved expenses will be reimbursed within 10 business days.
4.3 Rejected expenses will be returned with explanation.
4.4 Appeals of rejected expenses must be submitted within 10 business days.
					`.trim()
				},
				{
					heading: '5. REIMBURSEMENT LIMITS',
					content: `
5.1 Individual expenses over $500 require pre-approval.
5.2 Total reimbursements cannot exceed allocated category budgets without approval.
5.3 Luxury or excessive expenses will not be reimbursed.
5.4 Personal expenses are not eligible for reimbursement.
					`.trim()
				}
			],
			footer: `
ACKNOWLEDGED AND AGREED:

Employee/Contractor: _________________
Date: _________________

${parties.organization}
By: ${parties.representative}
Date: ${new Date().toLocaleDateString()}
			`.trim()
		};
	}

	/**
	 * Format expense categories for contract
	 */
	private formatExpenseCategories(categories: Record<string, number>): string {
		return Object.entries(categories)
			.map(([category, amount]) => `- ${this.formatCategoryName(category)}: $${amount.toLocaleString()}`)
			.join('\n');
	}

	/**
	 * Format category name for display
	 */
	private formatCategoryName(category: string): string {
		return category
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	/**
	 * Export contract to plain text
	 */
	exportToText(contract: ContractTemplate): string {
		let output = `${contract.title}\n${'='.repeat(contract.title.length)}\n\n`;

		contract.sections.forEach(section => {
			output += `${section.heading}\n${'-'.repeat(section.heading.length)}\n`;
			output += `${section.content}\n\n`;
		});

		output += `\n${contract.footer}`;

		return output;
	}

	/**
	 * Export contract to HTML
	 */
	exportToHTML(contract: ContractTemplate): string {
		let html = `
<!DOCTYPE html>
<html>
<head>
	<title>${contract.title}</title>
	<style>
		body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
		h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
		h2 { margin-top: 30px; color: #333; }
		p { line-height: 1.6; }
		.footer { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; white-space: pre-line; }
	</style>
</head>
<body>
	<h1>${contract.title}</h1>
`;

		contract.sections.forEach(section => {
			html += `	<h2>${section.heading}</h2>\n`;
			html += `	<p>${section.content.replace(/\n/g, '<br>')}</p>\n`;
		});

		html += `	<div class="footer">${contract.footer.replace(/\n/g, '<br>')}</div>\n`;
		html += `</body>\n</html>`;

		return html;
	}
}
