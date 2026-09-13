# Small launch configuration

Defaults: 3 generation attempts per user per UTC day; 20 across the whole site per UTC day. Failed attempts count, since they may have consumed provider resources. These are conservative application limits, not a guarantee that provider allowances suffice. Grounded Google Search is disabled by default; curated courses and other discovery remain enabled.

Apply migrations 008 and 009 before running generation. The app fails closed if the quota RPC is missing, including development. These migrations have not been applied or verified against your hosted database in this session.

Environment controls:
- MAX_GENERATIONS_PER_DAY=3
- MAX_GLOBAL_GENERATIONS_PER_DAY=20
- ENABLE_GROUNDED_SEARCH=false
- GENERATION_PAUSED=false (set true to stop new generation without disabling saved paths)

Keep Gemini on its free billing tier and verify every provider account separately. App quotas cannot stop billing elsewhere or guarantee zero charges on a paid API account. No hosting, billing, or deployed environment settings were changed.

Vercel Hobby is for non-commercial personal use. Obtain eligibility confirmation or use a suitable host/plan before launching the affiliate business: https://vercel.com/docs/limits/fair-use-guidelines

Release remains blocked on database verification, production build and journey tests, provider allowance checks, and deployment monitoring. Generation is still synchronous; this is a small pilot, not a large-scale service.
