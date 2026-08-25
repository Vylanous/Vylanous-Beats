# Production Monitoring and Quota Procedure

The application exposes three non-sensitive endpoints for monitoring:

| Endpoint            | Purpose                | Expected result                                                                                                                 |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/api/health/live`  | Process liveness only  | HTTP 200 when the API process can respond.                                                                                      |
| `/api/health`       | Configuration overview | HTTP 200 with boolean configuration checks only.                                                                                |
| `/api/health/ready` | Revenue-path readiness | HTTP 200 only when database connectivity and critical app, email, payment, Stripe webhook, and storage configuration are ready. |

Configure an external uptime monitor to request `/api/health/ready` every five minutes and alert after two consecutive failures. Configure the monitoring service to retain only status code, latency, and endpoint path; it must not send customer, order, email, authorization, or request-body data to telemetry.

## Provider budget review

Once each week, record the current usage and alert state in the provider dashboards below. Configure native provider alerts at **50%**, **80%**, and **95%** of the selected plan limit wherever the provider supports thresholds.

| Provider      | Review                                                                                     | Alert condition                                                                                |
| ------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Cloudflare R2 | Stored bytes, object count, class A/B operations, and egress                               | Uploads or downloads approach the plan limit, or storage errors increase.                      |
| Turso         | Database size, row/storage usage, read/write operations, and latency                       | Database operations or latency approach plan limits.                                           |
| Resend        | Sends, bounces, suppressions, and delivery failures                                        | Verification or order-delivery failure count is nonzero, or send volume approaches plan limit. |
| Stripe        | Failed payments, webhook delivery attempts, and endpoint health                            | Webhook failures are nonzero or a signing secret is rotated.                                   |
| Render        | Instance health, response latency, 5xx rate, deploy outcome, and sleep/cold-start behavior | Readiness failure, elevated 5xx rate, or unacceptable startup latency.                         |
| Expo          | OTA update quota and release usage                                                         | Usage reaches 50%, 80%, or 95%, or a native change requires a store binary.                    |

After every Stripe secret rotation, send a Stripe **test-mode** event to the configured endpoint and confirm `/api/health/ready` reports `stripeWebhookConfigured: true`. Do not send production customer data to monitoring services.
