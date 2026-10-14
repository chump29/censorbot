import { info } from "@postfmly/logger"

import { default as pluralize } from "@jarrodek/pluralize"
import { containsProfanity, filterText, getByIntensity, type Intensity } from "better-profane-words"
import { type Message, type TextChannel, type Webhook } from "discord.js"

import { env, MAX_LEVEL } from "./env.ts"

interface ICensorBot {
  readonly COUNT: number
  checkForWord: (message: Message) => Promise<void>
  init: () => void
}

class CensorBot implements ICensorBot {
  COUNT: number = 0

  init(): void {
    this.COUNT = getByIntensity(env.LEVEL as Intensity, MAX_LEVEL as Intensity).length
    if (this.COUNT === 0) {
      throw new Error("Could not find words matching length")
    }

    if (env.DEBUG) {
      info(`ℹ️  Found ${pluralize("word", this.COUNT, true)}`)
    }
  }

  // biome-ignore lint/nursery/useThisInClassMethods: not making static
  async checkForWord(message: Message): Promise<void> {
    if (!message.member || message.member.user.bot) {
      return
    }

    if (containsProfanity(message.content, { minIntensity: env.LEVEL as Intensity })) {
      await message.delete()

      const hook: Webhook = await (message.channel as TextChannel).createWebhook({
        avatar: message.author.displayAvatarURL({ forceStatic: false }),
        name: message.member.displayName
      })

      await hook.send({
        content: filterText(message.content, { minIntensity: env.LEVEL as Intensity, replacement: "||" }).clean
      })

      await hook.delete()
    }
  }
}

const Censor: ICensorBot = new CensorBot()

export { Censor }
