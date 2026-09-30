# Brevo free email setup

Brevo Free currently includes 300 sends/day shared across email types. It is not unlimited and account activation is subject to Brevo approval. Stay on Free; do not enable a paid plan or buy credits.

## Without a domain

Create a free account and verify your account email. In Senders, add LearningMap with an email address you own and complete sender verification. Brevo documents temporary rewriting for free-domain senders: transactional messages may appear from a t-sender-sib.com address. Do not invent that replacement address yourself. This is a temporary start-up option, not a long-term authenticated-domain substitute. Test inbox delivery before allowing public signups.

## Supabase authentication emails

In Brevo SMTP & API, copy the SMTP login and create an SMTP key. The SMTP key is not the API key or your Brevo login password.

In Supabase Authentication > Email > SMTP settings, enable custom SMTP:

| Setting | Value |
|---|---|
| Sender email | Your verified Brevo sender email |
| Sender name | LearningMap |
| Host | smtp-relay.brevo.com |
| Port | 587 |
| Username | SMTP login shown by Brevo |
| Password | Brevo SMTP key |

Keep email confirmation enabled. Apply `supabase/templates/magic-link.html` to the Magic Link template so deletion verification contains the code. Preserve the production Site URL and callback allowlist. Test signup, reset and deletion codes with your own test account after configuration. Do not disable confirmation to bypass failed delivery.

## Application reminders

Create a separate Brevo API key. Set these server-side environment variables in Vercel and local .env:

```dotenv
EMAIL_PROVIDER=brevo
BREVO_API_KEY=<Brevo API key, not SMTP key>
EMAIL_FROM_ADDRESS=LearningMap <your-verified-email>
```

Redeploy after changing Vercel variables. Never prefix either key with NEXT_PUBLIC_. Never commit or paste keys into chat. The application does not automatically fail over after an uncertain send; its database claim suppresses reminder retries.

The code supports Brevo, but preparing it does not configure Supabase SMTP, verify a sender, activate the provider account, or deploy Vercel variables. These require access to your provider account.

## Other release requirements

Remove Supabase Phone provider test OTP entries before enabling public phone verification. SMS is separate from Brevo's free email allowance; preserve the current phone-verification feature setting until real Twilio delivery is tested.

## Official references

- https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan
- https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders
- https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP
- https://supabase.com/docs/guides/auth/auth-smtp
