// Maps known FHE / wagmi / CoFHE error strings to human-readable messages.
// Add new patterns as they are discovered during testing.

const ERROR_PATTERNS: Array<{ pattern: RegExp | string; message: string }> = [
  // CoFHE ACL errors
  { pattern: '0x4d13139e', message: 'FHE permission denied — the contract lacks ACL access to this ciphertext.' },
  { pattern: /acl/i, message: 'FHE ACL error — ciphertext permission was not granted correctly.' },

  // CoFHE permit errors
  { pattern: /permit.*expired/i, message: 'Your CoFHE permit has expired. Please generate a new one.' },
  { pattern: /missing.*permit/i, message: 'No CoFHE permit found. Sign a permit to decrypt your balance.' },
  { pattern: /permit.*invalid/i, message: 'CoFHE permit is invalid. Please re-sign to generate a fresh permit.' },

  // Network / wallet errors
  { pattern: /user rejected/i, message: 'Transaction rejected by wallet.' },
  { pattern: /user denied/i, message: 'Transaction denied by wallet.' },
  { pattern: /chain.*mismatch/i, message: 'Wrong network — please switch to Ethereum Sepolia.' },
  { pattern: /insufficient funds/i, message: 'Insufficient ETH for gas. Top up your wallet on Sepolia.' },
  { pattern: /nonce.*too low/i, message: 'Nonce too low — try resetting your account nonce in MetaMask.' },

  // Contract reverts
  { pattern: /no balance to claim/i, message: 'No encrypted balance to claim yet.' },
  { pattern: /no balance to withdraw/i, message: 'No encrypted balance to withdraw yet.' },
  { pattern: /trustScore out of range/i, message: 'Trust score must be between 40 and 100. Generate a ZK proof first.' },
  { pattern: /caller is not distributor/i, message: 'Only the reward distributor contract can deposit rewards.' },
  { pattern: /not authorized/i, message: 'You are not authorized to view this encrypted balance.' },

  // Network errors
  { pattern: /timeout/i, message: 'Request timed out. Check your connection and try again.' },
  { pattern: /network.*changed/i, message: 'Network changed during the request. Please try again.' },
  { pattern: /could not coalesce error/i, message: 'RPC error — the Sepolia node returned an unexpected response.' },
];

/**
 * Converts a raw error (from viem / wagmi / CoFHE) into a user-readable string.
 * Falls back to the original message if no pattern matches.
 */
export function humanizeFheError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  for (const { pattern, message } of ERROR_PATTERNS) {
    if (typeof pattern === 'string' ? raw.includes(pattern) : pattern.test(raw)) {
      return message;
    }
  }

  // Truncate very long error strings (e.g. raw ABI-encoded reverts)
  if (raw.length > 200) {
    return raw.slice(0, 197) + '…';
  }

  return raw;
}
