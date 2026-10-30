# Connection and capabilities

## Current endpoint

- Transport: remote MCP over Streamable HTTP
- URL: https://learning-map-provider-bice.vercel.app/mcp
- Authentication: Authorization: Bearer <LearningMap agent key>
- Key creation: sign in with verified email, visit https://learning-map-provider-bice.vercel.app/settings/agents, confirm the account password, then create a named key for this client.
- Key policy: displayed once, expires after 30 days, revocable from Settings → Agent access. Website sign-out does not revoke it.
- Required client feature: remote Streamable HTTP MCP with a custom Authorization header. OAuth-only clients are not supported.

Never store or share the key in chat, prompts, URLs, public configuration, or source control. Enter it only in the AI client's private MCP credential settings. If a client lacks this transport/header support, it cannot connect to this endpoint.

## Available tools

- list_learning_fields: returns six supported technology fields and three levels.
- get_curriculum_preview: accepts a supported field slug and level; returns an authored outline with stages, topics, estimated hours, practice projects, and curated references. It does not save anything.
- search_learning_resources: accepts a 2–100 character query and optional limit from 1 to 20; searches curated resources by title and topic.
- Resource URI: learningmap://catalog

## Supported fields

- backend-development — Backend Development
- frontend-development — Frontend Development
- full-stack-development — Full-Stack Development
- ai-machine-learning — AI & Machine Learning
- data-science — Data Science
- devops-cloud — DevOps & Cloud

Levels: beginner, intermediate, advanced.

## Errors

- HTTP 401: key is missing, invalid, expired, or revoked. Have the owner check or recreate it on LearningMap. Do not ask them to disclose it.
- HTTP 503: authentication or service is temporarily unavailable. Retry once later; do not claim success.
- HTTP 403: browser-origin policy rejected the request. Native clients should omit browser Origin; browser-hosted clients may need explicit origin configuration by the LearningMap operator. Do not advise disabling origin protection.