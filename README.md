# S02E04 remote incident worker

A manually dispatched agent for MEGA.dev job 1. It runs on a GitHub-hosted runner, reads the course's incident-lookup skill, connects to that job's MCP server, and uses an OpenRouter model to complete and submit the job. Job 2 runs separately on the student's machine. The main agent combines both accepted results.

No runtime package dependencies or automatic triggers. The workflow has read-only repository access. Only the agent step receives secrets. Actions are pinned to commits.

Repository secrets: `OPENROUTER_API_KEY` and `JOB_MCP_URL`. Never commit either value. Use a dedicated model key with a hard credit limit. Workflow code can access its assigned secrets; review code before running it.

Default model: `google/gemini-2.5-flash`. Maximum 30 model turns, 4096 output tokens per turn, 240000 characters of conversation, and 15 minutes per run. A $0.50 stop-after-response cost guard is not a hard spending cap: a dedicated OpenRouter key's credit limit supplies that control.

This repository is public. Worker output is encrypted with AES-256-GCM and an RSA-OAEP-SHA256 wrapped random key before artifact upload. Only the RSA public key is in this repository; the private key stays on the student's machine. The one-day artifact contains encrypted course results, receipts, and transcripts. Raw output is never uploaded and nothing from the transcript is printed to workflow logs. Treat the artifact as public ciphertext. OpenRouter and the selected model provider receive task data for inference. Delete the artifact and repository and revoke the model key when no longer needed.

Local verification: `node --test` and `node --check worker.mjs`.
