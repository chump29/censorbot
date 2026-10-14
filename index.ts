import { error, info } from "@postfmly/logger"

import { Censor } from "./utils/censor.ts"
import { Client } from "./utils/client.ts"
import { env } from "./utils/env.ts"

try {
  await Client.init()

  Censor.init()

  info(`🟢 ${env.ACTIVITY}....`)
} catch (e: unknown) {
  const msg: string = (e as Error).message

  error(`❌ ${msg}`)

  await Client.shutdown(msg)
}
