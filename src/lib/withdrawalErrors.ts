export const ERROR_CODES = [
  { value: 'global_default', label: 'Use global default' },
  { value: 'security_deposit', label: 'Awaiting Security Deposit Confirmation' },
  { value: 'insurance_fee', label: 'Insurance Coverage Fee Awaiting Processing' },
  { value: 'tax_clearance', label: 'Tax Clearance Pending' },
  { value: 'currency_conversion', label: 'Currency Conversion Fee Pending' },
  { value: 'clearance_fee', label: 'Awaiting Clearance Fee Confirmation' },
  { value: 'account_issues', label: 'Account Issues (default)' },
  { value: 'custom', label: 'Custom Error (Editable Message)' },
  { value: 'unexpected', label: 'Unexpected Processing Error' },
] as const;

export type ErrorCode = typeof ERROR_CODES[number]['value'];

export function getErrorMessage(code: string, customMessage?: string | null): string {
  switch (code) {
    case 'security_deposit':
      return 'Transfer Unsuccessful. Awaiting Security Deposit Confirmation, Please message our support.';
    case 'insurance_fee':
      return 'Transfer Unsuccessful. Insurance Coverage Fee Awaiting Processing, Please message our support.';
    case 'tax_clearance':
      return 'Transfer Unsuccessful. Tax Clearance Pending, Please message our support.';
    case 'currency_conversion':
      return 'Transfer Unsuccessful. Currency Conversion Fee Pending, Please message our support.';
    case 'clearance_fee':
      return 'Transfer Unsuccessful. Awaiting Clearance Fee Confirmation, Please message our support.';
    case 'account_issues':
      return 'Transfer Unsuccessful. Due to some issues with your account!! Please message our support.';
    case 'custom':
      return customMessage ? `Transfer Unsuccessful. ${customMessage}` : 'Transfer Unsuccessful. Due to some issues with your account!! Please message our support.';
    case 'unexpected':
      return 'Transfer Unsuccessful. Unexpected processing error.';
    default:
      return 'Transfer Unsuccessful. Due to some issues with your account!! Please message our support.';
  }
}
