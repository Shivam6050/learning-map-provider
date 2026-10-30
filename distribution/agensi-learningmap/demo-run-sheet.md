# Live demo run sheet

This is a script for recording a real connected request. It is not a claim that a call has already run.

1. In an MCP client that supports the required features, add https://learning-map-provider-bice.vercel.app/mcp using Streamable HTTP.
2. Put the LearningMap agent key only into the client's private Authorization header field as Bearer <key>. Keep it out of recording, prompts, terminal history, and public configuration.
3. Invoke the installed LearningMap Roadmap Guide skill.
4. Ask: “I’m new to backend development. Show me the beginner LearningMap curriculum, then find curated resources for REST APIs and databases.”
5. Show live results from list_learning_fields, get_curriculum_preview (backend-development, beginner), and search_learning_resources.
6. Let the assistant summarize stage order, estimated hours, project prompts, and returned links. Confirm it says this is an authored preview, does not save a personal path, and does not provide verified current prices.
7. End before exposing any credential. Redact the Authorization header if visible.

Only after a real run should the resulting video or transcript be described as a completed demo in the listing.