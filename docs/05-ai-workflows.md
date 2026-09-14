# AI Workflows

## Provider architecture
The UI must not call a provider directly. Use:

`UI → AI Service → Provider Adapter → Gemini/OpenAI/etc.`

Provider credentials identify the API service/account. A model is selected within a provider. Gemini credentials are not interchangeable with OpenAI/ChatGPT API credentials.

## Analyze clothing
`POST /api/clothing/analyze`
1. Authenticate user.
2. Validate image type and size.
3. Send image to vision-capable provider.
4. Normalize detection into structured items: category, description, confidence.
5. Return detected items to UI.

## Extract clothing
`POST /api/clothing/extract`
1. Authenticate.
2. Validate selected detected items.
3. Calculate configurable credit cost.
4. Reserve credits atomically.
5. Generate standalone product images.
6. Normalize provider output.
7. Finalize credits on success or refund on failure.
8. Return previews without making them permanent unless saved.

## Outfit generation
`POST /api/generations/outfit`
1. Authenticate.
2. Validate library permissions.
3. Validate category/slot compatibility.
4. Validate configurable outfit rules.
5. Calculate and reserve credits.
6. Call selected provider adapter/model.
7. Normalize result.
8. Finalize or refund credits.
9. Return result for preview/download/save.

## Normalized result
Conceptually:

`{ success: true, images: [{ temporaryUrl: "..." }], provider: "gemini", model: "..." }`

## Credential handling
User-entered AI credentials must be encrypted at rest and only accessed server-side. Never return the plaintext credential after saving. Provider connection testing should report status rather than exposing secrets.

## Temporary assets
Temporary uploads/results should be cleaned up when no longer needed. Explicit Save is the boundary that makes a generated asset permanent.
