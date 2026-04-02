const sections = [
  {
    title: 'Wallet & Balance',
    tasks: [
      {
        name: 'Check balance',
        description: 'View confirmed and unconfirmed balance in sats.',
        prompts: [
          "What's my balance?",
          'How many sats do I have?',
          'Show me my confirmed and unconfirmed balance.',
        ],
      },
      {
        name: 'Get a receive address',
        description:
          'Derive a fresh BIP84 bech32 address. Never reuses a previous address.',
        prompts: [
          'Give me a receive address.',
          'I want to receive bitcoin from Strike — what address do I give them?',
          'Generate a new address for me.',
        ],
      },
      {
        name: 'Label a UTXO',
        description:
          'Attach a human-readable label and privacy tag to a specific UTXO.',
        prompts: [
          "Label the UTXO from txid abc123 as 'Strike withdrawal'.",
          'Mark that last incoming transaction as a DCA purchase.',
          'Tag the UTXO I just received as non-KYC.',
        ],
      },
    ],
  },
  {
    title: 'Sending & PSBT Workflow',
    tasks: [
      {
        name: 'Build a send transaction (PSBT)',
        description:
          'Select UTXOs, build an unsigned PSBT for hardware signing. Agent cannot sign.',
        prompts: [
          'Send 50,000 sats to bc1q...xyz.',
          'Prepare a transaction to send 0.001 BTC to [address].',
          'Build a PSBT to send the full balance minus fees to [address].',
        ],
      },
      {
        name: 'Export PSBT for signing',
        description:
          'Save PSBT as .psbt file or encode as QR for Coldcard/Jade.',
        prompts: [
          'Export the PSBT as a file.',
          'Show me the PSBT as a QR code for my Coldcard.',
          'I want to sign this on my Jade — how do I export it?',
        ],
      },
      {
        name: 'Broadcast a signed PSBT',
        description:
          'Validate signature and broadcast via mempool.space. Returns txid.',
        prompts: [
          "I've signed the PSBT — broadcast it.",
          'The transaction is signed, send it.',
          'Submit the transaction to the network.',
        ],
      },
      {
        name: 'Unstick a transaction (RBF / CPFP)',
        description:
          'Check stuck transactions. Suggest RBF bump or CPFP and prepare the PSBT.',
        prompts: [
          'My transaction has been pending for 3 hours — what do I do?',
          'Can I speed up the stuck transaction?',
          'Apply an RBF fee bump to the pending send.',
        ],
      },
    ],
  },
  {
    title: 'Fee Management',
    tasks: [
      {
        name: 'Check current fees',
        description:
          'Live mempool.space fee estimates: fast, standard, economy sat/vB.',
        prompts: [
          'What are the current fees?',
          'Is now a good time to send?',
          'How long will a 3 sat/vB transaction take to confirm?',
        ],
      },
      {
        name: 'Fee timing for consolidation',
        description:
          'Check if mempool is quiet enough for consolidation or sweeps.',
        prompts: [
          'Is now a good time to consolidate?',
          'Are fees low enough to consolidate my UTXOs?',
          'Tell me when fees drop below 5 sat/vB.',
        ],
      },
    ],
  },
  {
    title: 'UTXO Management & Privacy',
    tasks: [
      {
        name: 'View UTXOs',
        description: 'List all UTXOs with labels, privacy tags, amounts, ages.',
        prompts: [
          'Show me all my UTXOs.',
          'List my KYC-origin UTXOs.',
          'Show me my dust UTXOs.',
        ],
      },
      {
        name: 'Privacy score',
        description:
          'Fragmentation score, UTXO breakdown by privacy category, recommendations.',
        prompts: [
          "What's my privacy score?",
          'Give me a privacy assessment.',
          'What should I do to improve my wallet privacy?',
        ],
      },
      {
        name: 'UTXO consolidation',
        description:
          'Privacy-partitioned consolidation. KYC and non-KYC batches are always separate.',
        prompts: [
          'Should I consolidate my UTXOs?',
          'Consolidate my exchange-origin UTXOs.',
          'Are my UTXOs fragmented?',
        ],
      },
    ],
  },
  {
    title: 'Transaction History',
    tasks: [
      {
        name: 'View transaction history',
        description:
          'Transaction list with status, amounts, labels, and block data.',
        prompts: [
          'Show me my recent transactions.',
          'What transactions came in this week?',
          "List transactions labeled 'Strike withdrawal'.",
        ],
      },
      {
        name: 'Monitor a transaction',
        description:
          'Subscribe to live status updates for a txid. Polls every 15 seconds.',
        prompts: [
          'What\'s the status of txid abc123?',
          'Is my transaction confirmed yet?',
          'Watch txid abc123 and tell me when it confirms.',
        ],
      },
    ],
  },
  {
    title: 'Earning & Tasks (Phase 2-3)',
    tasks: [
      {
        name: 'L402 paid API server',
        description:
          'Start a local HTTP server that charges Lightning invoices per request.',
        prompts: [
          'Start earning sats from API calls.',
          'Turn on the L402 server.',
          'Set my answer price to 500 sats.',
        ],
      },
      {
        name: 'Nostr content posting',
        description:
          'Post notes to Nostr. Incoming zaps logged to task ledger.',
        prompts: [
          'Post a Bitcoin price update to Nostr.',
          'How many sats have I earned from Nostr zaps?',
        ],
      },
      {
        name: 'Autonomous task scanning',
        description:
          'Scan whitelisted platforms for sat-paying tasks. Always requires approval.',
        prompts: [
          'Scan for tasks I can earn sats from.',
          'Are there any bounties I can complete right now?',
          "What's my daily task budget?",
        ],
      },
      {
        name: 'Earnings summary',
        description: 'Total sats earned broken down by source.',
        prompts: [
          'How much have I earned total?',
          "What's my earnings breakdown?",
          "What's my best earning source?",
        ],
      },
    ],
  },
  {
    title: 'Data Export',
    tasks: [
      {
        name: 'Export full history',
        description:
          'Generate Markdown, JSON, or PDF with transactions, tasks, conversations.',
        prompts: [
          'Export my full history as Markdown.',
          'Generate a JSON export of all my transactions.',
          'Create an export for my tax records.',
        ],
      },
    ],
  },
];

const refusals = [
  {
    attempt: 'Sign this transaction for me',
    response:
      "I don't have access to your private keys. Please sign this PSBT on your Coldcard or Jade.",
  },
  {
    attempt: 'Show me my seed phrase',
    response:
      "I don't have access to your seed phrase. View it in the Keys & Backup section.",
  },
  {
    attempt: 'Mix my Strike UTXOs with my other coins',
    response:
      'Mixing KYC-origin and non-KYC UTXOs links your exchange identity to your other coins. I can build two separate transactions instead.',
  },
  {
    attempt: 'Consolidate now — fees don\'t matter',
    response:
      'Consolidating at high fees costs more than it saves. I recommend waiting for below 5 sat/vB.',
  },
  {
    attempt: 'Create an account on [platform]',
    response:
      "I can't create accounts or submit personal information. I can only attempt tasks on platforms where you already have an account.",
  },
];

export function ReferenceView() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-white mb-2">Agent Reference</h2>
      <p className="text-sm text-gray-400 mb-8">
        Every task the agent can perform, with example prompts you can use in
        the chat window.
      </p>

      {sections.map((section) => (
        <div key={section.title} className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-800 pb-2">
            {section.title}
          </h3>
          <div className="space-y-4">
            {section.tasks.map((task) => (
              <div
                key={task.name}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4"
              >
                <h4 className="text-sm font-medium text-white mb-1">
                  {task.name}
                </h4>
                <p className="text-xs text-gray-400 mb-3">
                  {task.description}
                </p>
                <div className="space-y-1">
                  {task.prompts.map((prompt, i) => (
                    <p
                      key={i}
                      className="text-xs font-mono text-gray-500 bg-gray-800/50 rounded px-2 py-1"
                    >
                      &quot;{prompt}&quot;
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          Tasks the Agent Will Refuse
        </h3>
        <div className="space-y-3">
          {refusals.map((r, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4"
            >
              <p className="text-xs font-mono text-red-400 mb-2">
                &quot;{r.attempt}&quot;
              </p>
              <p className="text-xs text-gray-400">{r.response}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
