import DeviceToken from '#models/device_token'
import Notification from '#models/notification'
import User from '#models/user'
import GenericAdminNotification from '#notifications/generic_admin_notification'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { readFile } from 'node:fs/promises'

type Channel = 'database' | 'firebase' | 'mail'
/**
 * notification:admin-send — Execution summary
 *
 * What this command does:
 * - Accepts one or many user IDs via --user-id (comma-separated supported), or omits --user-id to send to all users.
 * - Accepts a payload via --payload (inline JSON) or --payload-file (with path fallbacks to /app/... in Docker).
 * - Normalizes requested channels; mail is reported as skipped in v1; supports --dry-run, --json, --strict.
 * - For each user:
 *   1) Resolve the user and collect device tokens (for firebase).
 *   2) If 'database' channel is requested, pre-insert a notifications row and capture its ID.
 *   3) Inject that ID into payload.data as notificationId; include optional imageUrl when present.
 *   4) Send remaining channels (e.g., firebase). Database is removed from send list to avoid duplicates.
 * - Aggregates per-user/per-channel results and prints a JSON summary with totals.
 *
 * Notes:
 * - Prefer absolute container paths (/app/...) for --payload-file to avoid ENOENT.
 * - Use --concurrency to control parallelism in multi-user runs (default 10).
 * - When --user-id is omitted, the command will send notifications to all users in the system.
 */
export default class NotificationAdminSend extends BaseCommand {
  static commandName = 'notification:admin-send'
  static description =
    'Send an admin notification to specific user(s) or all users via selected channels'

  @flags.string({
    flagName: 'user-id',
    description:
      'Target user ID(s), comma-separated (e.g., 16 or 16,7,8). Omit to send to all users',
    required: false,
  })
  declare userId: string

  @flags.string({
    description: 'Comma-separated channels (database,firebase,mail) or "all"',
    default: 'database,firebase',
  })
  declare channels: string

  @flags.string({
    description: 'JSON string payload with title,body,data?,analyticLabel?',
  })
  declare payload: string

  @flags.string({
    flagName: 'payload-file',
    description: 'Path to JSON file with payload',
  })
  declare payloadFile: string

  @flags.string({
    flagName: 'analytic-label',
    description: 'Analytics label for push notifications',
    default: 'admin_notification',
  })
  declare analyticLabel: string

  @flags.boolean({
    flagName: 'dry-run',
    description: 'Validate and preview without sending',
    default: false,
  })
  declare dryRun: boolean

  @flags.boolean({
    description: 'Output JSON only (no human lines)',
    default: false,
  })
  declare json: boolean

  @flags.boolean({
    description: 'Exit with code 1 if any channel fails',
    default: false,
  })
  declare strict: boolean

  @flags.number({
    flagName: 'concurrency',
    description: 'Max users to process in parallel (multi-user)',
    default: 10,
  })
  declare concurrency: number

  static options: CommandOptions = { startApp: true }

  /**
   * Main process: parses flags, validates user and payload, prepares channels,
   * sends notification or dry-runs, and prints a summary with exit code.
   */
  async run() {
    const startedAt = Date.now()
    let exitCode: 0 | 1 | 2 = 0

    // 1) Parse channels
    let channels = this.normalizeChannels(this.channels)

    // 1b) Parse user ids (comma-separated supported) or fetch all users
    let userIds: number[]
    if (this.userId) {
      userIds = this.parseUserIds(this.userId)
      if (userIds.length === 0) {
        return this.finish(
          { error: 'Invalid --user-id (must be a positive number or comma-separated list)' },
          startedAt,
          1
        )
      }
    } else {
      // Fetch all users when no userId is provided
      userIds = await this.getAllUserIds()
      if (userIds.length === 0) {
        return this.finish({ error: 'No users found in the system' }, startedAt, 1)
      }
    }

    // 2) Multi-user branch
    if (userIds.length > 1) {
      const payloadBase = await this.getPayload()
      if ('error' in payloadBase) {
        return this.finish({ error: payloadBase.error }, startedAt, 1)
      }
      if (!payloadBase.title || !payloadBase.body) {
        return this.finish({ error: 'Payload must include title and body' }, startedAt, 1)
      }
      if (!payloadBase.analyticLabel) payloadBase.analyticLabel = this.analyticLabel

      const results = [] as Array<{
        userId: number
        channelsProcessed: Channel[]
        perChannel: { name: Channel; status: 'success' | 'failed' | 'skipped'; info?: any }[]
        notificationId: number | null
        deviceTokens: number
        error?: string
      }>

      // Prefetch users and tokens to reduce N+1 queries
      const userMap = await this.fetchUsersByIds(userIds)
      const tokenMap = await this.fetchDeviceTokensByUserIds(userIds)

      // Process with limited concurrency
      const limit = Math.max(1, Number(this.concurrency) || 10)
      for (let i = 0; i < userIds.length; i += limit) {
        const chunk = userIds.slice(i, i + limit)
        const chunkResults = await Promise.all(
          chunk.map((uid) =>
            this.processUser(uid, channels, payloadBase, userMap.get(uid), tokenMap.get(uid))
          )
        )
        results.push(...chunkResults)
      }

      // aggregate totals and exit code
      const flatPerChannel = results.flatMap((r) => r.perChannel)
      const success = flatPerChannel.filter((r) => r.status === 'success').length
      const failed = flatPerChannel.filter((r) => r.status === 'failed').length
      const skipped = flatPerChannel.filter((r) => r.status === 'skipped').length
      if (failed > 0 && success > 0) exitCode = 2
      if (failed > 0 && this.strict) exitCode = 1

      return this.finish(
        {
          multiUser: true,
          usersRequested: userIds,
          channelsRequested: channels,
          results,
          totals: { success, failed, skipped },
        },
        startedAt,
        exitCode
      )
    }

    // 2b) Single-user branch (original behavior)
    const userIdNum = userIds[0]
    const payload = await this.getPayload()
    if ('error' in payload) {
      return this.finish({ error: payload.error }, startedAt, 1)
    }
    if (!payload.title || !payload.body) {
      return this.finish({ error: 'Payload must include title and body' }, startedAt, 1)
    }
    if (!payload.analyticLabel) payload.analyticLabel = this.analyticLabel

    const res = await this.processUser(userIdNum, channels, payload)

    // aggregate like before for single user
    const success = res.perChannel.filter((r) => r.status === 'success').length
    const failed = res.perChannel.filter((r) => r.status === 'failed').length
    const skipped = res.perChannel.filter((r) => r.status === 'skipped').length
    if (failed > 0 && success > 0) exitCode = 2
    if (failed > 0 && this.strict) exitCode = 1

    return this.finish(
      {
        userId: res.userId,
        channelsRequested: channels,
        channelsProcessed: res.channelsProcessed,
        perChannel: res.perChannel,
        deviceTokens: res.deviceTokens,
        payloadEcho: {
          title: (res as any).finalPayload?.title ?? payload.title,
          body: (res as any).finalPayload?.body ?? payload.body,
          data: (res as any).finalPayload?.data ?? payload.data,
          analyticLabel: (res as any).finalPayload?.analyticLabel ?? payload.analyticLabel,
          imageUrl: (res as any).finalPayload?.imageUrl ?? (payload as any).imageUrl,
          notificationId: res.notificationId,
        },
        totals: { success, failed, skipped },
      },
      startedAt,
      exitCode
    )
  }

  /**
   * Parses the payload from --payload or --payload-file, or returns a default.
   * Returns an error object if parsing fails or file is unreadable.
   */
  private async getPayload(): Promise<
    | {
        title: string
        body: string
        data?: Record<string, any>
        analyticLabel?: string
        imageUrl?: string
      }
    | { error: string }
  > {
    if (this.payload) {
      try {
        return JSON.parse(this.payload)
      } catch {
        return {
          error:
            'Invalid JSON passed to --payload. Tip: wrap JSON in single quotes on zsh, e.g. --payload \'{"title":"Test","body":"Hello"}\' or escape inner quotes when using double quotes, e.g. --payload "{\\"title\\":\\"Test\\",\\"body\\":\\"Hello\\"}". Alternatively, use --payload-file <path>.',
        }
      }
    }
    if (this.payloadFile) {
      const attemptPaths = this.resolvePayloadPaths(this.payloadFile)
      let lastErr: any
      for (const p of attemptPaths) {
        try {
          const raw = await readFile(p, 'utf8')
          return JSON.parse(raw)
        } catch (e: any) {
          lastErr = e
        }
      }
      return {
        error: `Failed to read --payload-file: ${lastErr?.message || 'unknown error'}. Tried: ${attemptPaths.join(', ')}`,
      }
    }
    // Default minimal payload
    return { title: 'Admin Notification', body: 'You have a new message from admin.' }
  }

  /**
   * Normalizes the channels string into a deduped array of valid channel names.
   * Defaults to ['database', 'firebase'] if input is empty or invalid.
   */
  private normalizeChannels(input: string): Channel[] {
    const set = new Set<string>()
    const lower = input.trim().toLowerCase()
    if (lower === 'all') return ['database', 'firebase', 'mail']
    for (const part of lower.split(',')) {
      const p = part.trim()
      if (p === 'database' || p === 'firebase' || p === 'mail') set.add(p)
    }
    if (set.size === 0) return ['database', 'firebase']
    return Array.from(set) as Channel[]
  }

  /**
   * Parses the --user-id input which may be a single id or a comma-separated list.
   */
  private parseUserIds(input: string): number[] {
    const ids = input
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)

    return Array.from(new Set(ids))
  }

  /**
   * Resolves candidate paths for a payload-file both relative and inside container.
   */
  private resolvePayloadPaths(inArg: string): string[] {
    if (inArg.startsWith('/')) return [inArg]
    const trimmed = inArg.replace(/^\.\/?/, '')
    const candidates = [inArg, `/app/${trimmed}`]
    if (trimmed.startsWith('app/')) candidates.push(`/${trimmed}`)

    return candidates
  }

  /**
   * Processes notification flow for a single user: tokens, DB pre-insert, send, and results.
   */
  private async processUser(
    uid: number,
    channels: Channel[],
    payloadBase: {
      title: string
      body: string
      data?: Record<string, any>
      analyticLabel?: string
      imageUrl?: string
    },
    preloadedUser?: any,
    preloadedTokens?: string[] | undefined
  ): Promise<{
    userId: number
    channelsProcessed: Channel[]
    perChannel: { name: Channel; status: 'success' | 'failed' | 'skipped'; info?: any }[]
    notificationId: number | null
    deviceTokens: number
    finalPayload?: typeof payloadBase
    error?: string
  }> {
    // Use preloaded user when available
    // @ts-ignore - Static BaseModel methods are available at runtime
    const user = preloadedUser ?? (await User.find(uid))
    if (!user) {
      const perChannelAll = channels.map((c) => ({
        name: c,
        status: 'failed' as const,
        info: { reason: 'user_not_found' },
      }))
      return {
        userId: uid,
        channelsProcessed: [],
        perChannel: perChannelAll as any,
        notificationId: null,
        deviceTokens: 0,
        error: 'user_not_found',
      }
    }

    const perChannel: { name: Channel; status: 'success' | 'failed' | 'skipped'; info?: any }[] = []

    // Dry-run consistency: mark all requested channels as skipped and return
    if (this.dryRun) {
      for (const ch of channels) {
        perChannel.push({ name: ch, status: 'skipped', info: { reason: 'dry_run' } })
      }
      return {
        userId: uid,
        channelsProcessed: [],
        perChannel,
        notificationId: null,
        deviceTokens: Array.isArray(preloadedTokens) ? preloadedTokens.length : 0,
        finalPayload: { ...payloadBase },
      }
    }
    let sendChannels = channels.filter((c) => c !== 'mail')
    let deviceTokens: string[] = Array.isArray(preloadedTokens) ? preloadedTokens : []
    if (sendChannels.includes('firebase')) {
      if (!deviceTokens || deviceTokens.length === 0) {
        deviceTokens = await this.getDeviceTokensForUser(uid)
      }
      if (deviceTokens.length === 0) {
        perChannel.push({ name: 'firebase', status: 'failed', info: { reason: 'no_tokens' } })
        sendChannels = sendChannels.filter((c) => c !== 'firebase')
      }
    }

    // clone payload
    const payload = { ...payloadBase, data: { ...(payloadBase.data ?? {}) } }

    // Pre-insert database notification if requested
    let notificationId: number | null = null
    if (channels.includes('database')) {
      if (this.dryRun) {
        perChannel.push({ name: 'database', status: 'skipped', info: { reason: 'dry_run' } })
        sendChannels = sendChannels.filter((c) => c !== 'database')
      } else {
        try {
          const dbPayload = this.buildDbPayload(payload)
          const created = await Notification.create({ notifiableId: uid, data: dbPayload as any })
          notificationId = created.id
          payload.data = { ...(payload.data ?? {}), notificationId: created.id }
          perChannel.push({ name: 'database', status: 'success', info: { id: created.id } })
          sendChannels = sendChannels.filter((c) => c !== 'database')
        } catch (e: any) {
          perChannel.push({
            name: 'database',
            status: 'failed',
            info: { error: e?.message || 'insert_failed' },
          })
          sendChannels = sendChannels.filter((c) => c !== 'database')
        }
      }
    }

    // Send remaining channels
    const notification = new GenericAdminNotification(
      payload as any,
      deviceTokens,
      sendChannels as any
    )
    if (!this.dryRun && sendChannels.length > 0) {
      await user.notify(notification)
    }
    for (const ch of sendChannels) {
      perChannel.push({ name: ch, status: 'success' })
    }
    if (channels.includes('mail')) {
      perChannel.push({ name: 'mail', status: 'skipped', info: { reason: 'v1_noop' } })
    }

    return {
      userId: uid,
      channelsProcessed: sendChannels,
      perChannel,
      notificationId,
      deviceTokens: (deviceTokens || []).length,
      finalPayload: payload,
    }
  }

  /**
   * Builds the database payload, appending imageUrl when present.
   */
  private buildDbPayload(payload: {
    title: string
    body: string
    data?: Record<string, any>
    imageUrl?: string
  }) {
    return {
      title: payload.title,
      body: payload.body,
      data: {
        ...(payload.data ?? {}),
        ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
      },
    }
  }

  /**
   * Fetches all device tokens for the given user ID from the database.
   * Used for sending firebase notifications to the user's devices.
   */
  private async getDeviceTokensForUser(userId: number): Promise<string[]> {
    const rows = await DeviceToken.query().where('user_id', userId).select('token')
    return rows.map((r) => r.token)
  }

  /**
   * Bulk fetch users into a Map for O(1) lookup.
   */
  private async fetchUsersByIds(userIds: number[]): Promise<Map<number, any>> {
    // @ts-ignore - Static BaseModel methods are available at runtime
    const users = await User.query().whereIn('id', userIds)
    const map = new Map<number, any>()
    for (const u of users as any[]) map.set(u.id as number, u)
    return map
  }

  /**
   * Bulk fetch device tokens grouped by user_id.
   */
  private async fetchDeviceTokensByUserIds(userIds: number[]): Promise<Map<number, string[]>> {
    const rows = await DeviceToken.query().whereIn('user_id', userIds).select('user_id', 'token')
    const map = new Map<number, string[]>()
    for (const row of rows as any[]) {
      const uid = row.user_id as number
      const token = row.token as string
      if (!map.has(uid)) map.set(uid, [])
      map.get(uid)!.push(token)
    }
    return map
  }

  /**
   * Fetches all user IDs from the database.
   * Used when no specific userId is provided to send notifications to all users.
   */
  private async getAllUserIds(): Promise<number[]> {
    // @ts-ignore - Static BaseModel methods are available at runtime
    const users = await User.query().select('id')

    return users.map((user: any) => user.id as number)
  }

  /**
   * Prints human and JSON output, sets exit code, and logs errors or info.
   * Used to finalize the command and provide a summary for the user or CI.
   */
  private finish(body: any, startedAt: number, exitCode: 0 | 1 | 2) {
    const durationMs = Date.now() - startedAt
    if (!this.json) {
      if (body.error) {
        this.logger.error(String(body.error))
      } else {
        if (body.multiUser) {
          const chs = (body.channelsRequested || []).join(', ')
          const totals = body.totals || {}
          this.logger.info(
            `Prepared notifications for ${Array.isArray(body.usersRequested) ? body.usersRequested.length : 0} users via: ${chs} — totals: success=${totals.success ?? 0}, failed=${totals.failed ?? 0}, skipped=${totals.skipped ?? 0}`
          )
        } else {
          const chs = (body.channelsProcessed || body.channelsRequested || []).join(', ')
          const tokens = typeof body.deviceTokens === 'number' ? body.deviceTokens : 0
          this.logger.info(
            `Prepared notification for user ${body.userId} via: ${chs} (deviceTokens=${tokens})`
          )
        }
      }
    }
    const summary = {
      ...(body.error ? {} : body),
      durationMs,
      exitCode,
    }
    // JSON summary (always print last); keep only JSON if --json
    if (this.json) {
      console.log(JSON.stringify(summary))
    } else {
      console.log(JSON.stringify(summary, null, 2))
    }

    if (exitCode !== 0) process.exitCode = exitCode
    return
  }
}
