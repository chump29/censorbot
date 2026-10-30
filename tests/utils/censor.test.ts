import { describe, expect, jest, test } from "bun:test"

import { type Optional } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
import { getByIntensity, type WordEntry } from "better-profane-words"
import { type Channel, ChannelType, type GuildMember, type Message, type User, type Webhook } from "discord.js"

import { Censor } from "../../utils/censor.ts"
import { env, MAX_LEVEL } from "../../utils/env.ts"

describe("censor", (): void => {
  test("checkForWord", async (): Promise<void> => {
    const words: WordEntry[] = getByIntensity(env.LEVEL, MAX_LEVEL)

    const word: Optional<string> = words[Math.floor(Math.random() * words.length)]?.word

    expect(word).not.toBeUndefined()

    const mockDelete: jest.Mock = jest.fn()
    const mockWebhookDelete: jest.Mock = jest.fn()
    const mockWebhookSend: jest.Mock = jest.fn()

    const mockMessage: Message = createMock<Message>({
      author: createMock<User>({
        displayAvatarURL: jest.fn().mockReturnValue(fake.image.avatar())
      }),
      channel: createMock<Channel>({
        createWebhook: createMock<Webhook>({
          delete: mockWebhookDelete,
          send: mockWebhookSend
        }),
        type: ChannelType.GuildText
      }),
      content: fake.helpers.fake(`{{lorem.words(2)}} ${word} {{lorem.words(2)}}`),
      delete: mockDelete,
      member: createMock<GuildMember>({
        displayName: fake.internet.displayName(),
        user: createMock<User>({ bot: false })
      })
    })

    await Censor.checkForWord(mockMessage)

    expect(mockDelete).toHaveBeenCalledTimes(1)

    expect(mockWebhookSend).toHaveBeenCalledTimes(1)
    expect(mockWebhookDelete).toHaveBeenCalledTimes(1)

    const { calls } = mockWebhookSend.mock
    const payload: unknown = calls?.[0]?.[0]
    if (!payload || typeof payload !== "object" || !("content" in payload) || typeof payload.content !== "string") {
      throw new Error("Payload or content not found")
    }

    expect(payload.content).toContain(`||${word}||`)
  })
})
