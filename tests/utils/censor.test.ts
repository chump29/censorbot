import { describe, expect, test } from "bun:test"

import { type Optional } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
import { getByIntensity, type WordEntry } from "better-profane-words"
import { ChannelType, type GuildMember, type Message, type TextChannel, type User, type Webhook } from "discord.js"

import { Censor } from "../../utils/censor.ts"
import { env, MAX_LEVEL } from "../../utils/env.ts"

describe("censor", (): void => {
  test("checkForWord", async (): Promise<void> => {
    const words: WordEntry[] = getByIntensity(env.LEVEL, MAX_LEVEL)

    const word: Optional<string> = words[Math.floor(Math.random() * words.length)]?.word

    expect(word).not.toBeUndefined()

    const sentence: string = fake.helpers.fake(`{{lorem.words(2)}} ${word} {{lorem.words(2)}}`)

    // * NOTE: gets around If
    const merge = <M extends object, C extends object>(m: M, c: C): M & { channel: C } =>
      Object.assign(m, { channel: c })

    const channel: TextChannel = createMock<TextChannel>({ type: ChannelType.GuildText })

    const message: Message = createMock<Message>({
      content: sentence,
      member: createMock<GuildMember>({
        displayName: fake.internet.displayName(),
        user: createMock<User>({ bot: false })
      })
    })

    const msg = merge(message, channel)

    await Censor.checkForWord(msg)

    expect(getMock(msg.delete)).toHaveBeenCalledTimes(1)

    const hook: Webhook = await msg.channel.createWebhook({
      avatar: msg.author.displayAvatarURL(),
      // biome-ignore lint/style/noNonNullAssertion: exists
      name: msg.member!.displayName
    })

    expect(getMock(hook.send)).toHaveBeenCalledTimes(1)
    expect(getMock(hook.delete)).toHaveBeenCalledTimes(1)

    const { calls } = hook.send.mocked
    const payload: unknown = calls?.[0]?.[0]
    if (!payload || typeof payload !== "object" || !("content" in payload) || typeof payload.content !== "string") {
      throw new Error("Payload or content not found")
    }

    expect(payload.content).toContain(`||${word}||`)
  })
})
