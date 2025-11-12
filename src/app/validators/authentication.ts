import vine from '@vinejs/vine'

/**
 * Validates the login request
 */
export const oauthAuthorizeValidator = vine.compile(
  vine.object({
    client_id: vine.string().trim().minLength(6),
    redirect_uri: vine.string().trim(),
    response_type: vine.string().trim().in(['code']),
    scope: vine.string().trim().optional(),
    state: vine.string().trim(),
    code_challenge: vine.string().trim(),
    code_challenge_method: vine.string().trim().in(['plain', 'S256']),
  })
)
