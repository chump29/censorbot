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

    const mergeChannelOverride = <M extends object, C extends object, G extends object>(
      messageMock: M,
      channelMock: C,
      memberMock: G
    ): M & { channel: C; member: G } => Object.assign(messageMock, { channel: channelMock, member: memberMock })

    const channel: TextChannel = createMock<TextChannel>({
      type: ChannelType.GuildText
    })

    const member: GuildMember = createMock<GuildMember>({
      displayName: fake.internet.displayName(),
      user: createMock<User>({ bot: false })
    })

    const message: Message = createMock<Message>({ content: sentence })

    const msg = mergeChannelOverride(message, channel, member)

    await Censor.checkForWord(msg)

    expect(assertMock(msg.delete)).toHaveBeenCalledTimes(1)

    const hook: Webhook = await msg.channel.createWebhook({
      avatar: msg.author.displayAvatarURL(),
      name: msg.member.displayName
    })

    expect(assertMock(hook.send)).toHaveBeenCalledTimes(1)
    expect(assertMock(hook.delete)).toHaveBeenCalledTimes(1)

    const { calls } = hook.send.mocked
    const payload = calls?.[0]?.[0]
    if (!payload || typeof payload !== "object" || !("content" in payload) || typeof payload.content !== "string") {
      throw new Error("Payload or content not found")
    }

    expect(payload.content).toContain(`||${word}||`)
  })
})
