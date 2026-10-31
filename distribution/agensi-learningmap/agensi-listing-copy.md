# Agensi submission kit — LearningMap Roadmap Guide

## Name
LearningMap Roadmap Guide

## Summary (under 300 characters)
Explore structured backend, frontend, full-stack, AI/ML, data science, and DevOps curricula with your AI assistant. Search curated learning resources, or optionally review and update your own roadmap progress through an authenticated, owner-scoped MCP connection.

## Description
LearningMap Roadmap Guide helps an AI assistant explore LearningMap’s authored technology curricula and curated learning-resource catalog. With explicit per-key permission, it can also read the signed-in owner’s saved roadmaps and stage completion status, and update stage status when asked.

Connect the LearningMap remote MCP server, then ask your agent to compare a field and experience level, outline stages in order, or find references for a topic. The skill teaches the agent to use the catalog tools, preserve resource links, distinguish authored data from its own suggestions, and explain what the data can and cannot verify.

**Requires a separate connection:** configure LearningMap MCP at https://learning-map-provider-bice.vercel.app/mcp with a user-created bearer key in your client’s private credential settings. The owner creates a key after signing in with a verified email at LearningMap → Settings → Agent access. The skill never asks for that key in chat.

**Owner-controlled access:** catalog access is required. Reading personal roadmaps and writing stage status are separate optional permissions, off by default and limited to the verified owner of the key. The agent never reads or changes notes, budgets, purchases, account details, or calendars. It cannot create a new path. Ask the owner before updating progress and never infer completion.

**No live pricing claims:** access labels, regional offers, discounts, certificates, taxes, and billing terms must be confirmed with the provider. A listed-as-free catalog label is not a live price guarantee.

The skill works only in an agent that supports the SKILL.md format and required remote MCP transport/authentication. Installation does not automatically connect every product or register LearningMap with an agent marketplace.

## See it in action — run this live after configuring MCP
Use a real request in a connected client: “I’m new to backend development. Show me the beginner LearningMap curriculum, then find curated resources for REST APIs and databases.” The assistant should call list_learning_fields to confirm Backend Development and the beginner level are supported. It should call get_curriculum_preview with field backend-development and level beginner, and search_learning_resources for the requested topics. Show the real results from those calls, including stage order, effort estimates, project prompts, resource names, and URLs. The assistant should state that the curriculum is an authored preview and is not saved to the user’s account. It should disclose that catalog access labels are not live availability or regional prices and that provider pages must be checked before purchase. Do not use fabricated output or expose the bearer key in the recording or listing.

## Compatibility
Requires an AI agent that supports SKILL.md and remote MCP over Streamable HTTP with a custom Authorization header. Server: https://learning-map-provider-bice.vercel.app/mcp. Keep the user-created bearer key in private client settings. A verified LearningMap account is required to create a key. OAuth-only clients are not supported.

## Suggested price
Free for the first listing. The portable guide explains authenticated catalog use and optional, owner-scoped roadmap permissions.

## Categories (maximum 3)
1. Education & Learning
2. Agents & Orchestration

## Tags (choose up to 10)
learning roadmap, study plan, backend development, frontend development, full stack, AI machine learning, data science, DevOps, curated courses, MCP

## Keywords (choose up to 10)
LearningMap, learning path, technology curriculum, backend roadmap, frontend roadmap, full-stack roadmap, beginner programming, curated learning resources, AI learning, DevOps learning path

## Use cases
- Explore a technology curriculum by experience level
- Compare beginner, intermediate, and advanced study outlines
- Find curated resources for a technology topic
- Turn an authored curriculum preview into an actionable study sequence

## Permissions
- Network: LearningMap host learning-map-provider-bice.vercel.app over HTTPS via configured MCP server.
- Services: authenticated LearningMap catalog; optional owner-scoped roadmap and progress access per key.
- Files: reads the skill and its reference text only; no local user files are needed.
- Tools: invokes the MCP tools described in this package when available.
- Credentials: user-created agent key is entered in private client MCP settings. Never request or expose it in chat.
- No shell commands, local writes, purchases, messaging, calendar mutation, broad account access, or note access.

## Known limitations
- Catalog and roadmap-reading tools are read-only. An owner can separately allow explicit stage-status updates. The MCP interface does not generate or save a new personalized path.
- It does not expose personal account data, progress, notes, calendar, or purchases.
- It does not fetch live provider prices, discounts, link availability, certificates, or regional terms.
- Each client must separately support/install the skill and configure remote MCP with a bearer header. Installing the skill alone does not configure the server.
- OAuth-only MCP clients cannot authenticate to this endpoint.

## FAQ
**Can I invoke it with @?** If the agent platform exposes Agensi skills through its connector, use that platform’s displayed invocation syntax, for example @LearningMap Roadmap Guide. Syntax varies by platform.

**Does it automatically connect ChatGPT, Claude, Grok, Dots, and other agents?** No. Each agent must support the skill format and separately configure LearningMap remote MCP. Compatibility should be checked in each product.

**Can I use this skill to track my personal learning progress or save my history?** Yes, after signing in with a verified email and creating an agent key with personal-roadmap access. The assistant can list your saved roadmaps and read stage status. If you separately enable progress updates, it can change a stage status when you explicitly ask. It cannot read notes or generate a new path through the skill.

**Are prices and free labels live?** No. Check the provider page for current availability, price, currency, discounts, tax, and billing interval.

**What if my key is lost or exposed?** Revoke it immediately under LearningMap → Settings → Agent access, then create a replacement. Do not post the key in chat or reports.

## Demo recording checklist
The submission form recommends a real request and full result. Configure a test agent and key first; record live catalog tools and, if demonstrating personal tools, enable only the test account's required scopes and show the owner-scoped roadmap/status response. Keep the bearer key out of view. Clearly show that personal access is opt-in, stage updates require explicit user instruction, and prices are not live. The demo must use actual MCP results, not this script as a claimed completed run.
