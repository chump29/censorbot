import { describe, expect, jest, spyOn, test } from "bun:test"

import { type Optional } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
// biome-ignore lint/performance/noNamespaceImport: for testing
import * as betterProfaneWords from "better-profane-words"
import { getByIntensity, type WordEntry } from "better-profane-words"
import { type Channel, ChannelType, type GuildMember, type Message, type User, type Webhook } from "discord.js"

import { Censor } from "../../utils/censor.ts"
import { env, MAX_LEVEL } from "../../utils/env.ts"

const lengthError: RegExp = /length/v

describe("censor", (): void => {
  test("init fail", (): void => {
    const wordsSpy: jest.Mock = spyOn(betterProfaneWords, "getByIntensity").mockReturnValue([])

    expect((): void => Censor.init()).toThrow(lengthError)

    wordsSpy.mockRestore()
  })

  test("checkForWord pass", async (): Promise<void> => {
    const [mockDelete, mockWebhookDelete, mockWebhookSend] = [
      jest.fn<Message["delete"]>(),
      jest.fn<Webhook["delete"]>(),
      jest.fn<Webhook["send"]>()
    ]

    const words: WordEntry[] = getByIntensity(env.LEVEL, MAX_LEVEL)
    const word: Optional<string> = words[Math.floor(Math.random() * words.length)]?.word
    const sentence: string = fake.helpers.fake(`{{lorem.words(2)}} ${word} {{lorem.words(2)}}`)

    const mockMessage: Message = createMock<Message>({
      author: createMock<User>({
        displayAvatarURL: jest.fn<() => string>().mockReturnValue(fake.image.avatar())
      }),
      channel: createMock<Channel>({
        createWebhook: createMock<Webhook>({
          delete: mockWebhookDelete,
          send: mockWebhookSend
        }),
        type: ChannelType.GuildText
      }),
      content: sentence,
      delete: mockDelete,
      member: createMock<GuildMember>({
        displayName: fake.internet.displayName(),
        user: createMock<User>({ bot: false })
      })
    })

    await Censor.checkForWord(mockMessage)

    expect(mockDelete).toHaveBeenCalledOnce()

    expect(mockWebhookSend).toHaveBeenCalledOnce()
    expect(mockWebhookDelete).toHaveBeenCalledOnce()

    const { calls } = mockWebhookSend.mock
    const payload: unknown = calls?.[0]?.[0]
    if (!payload || typeof payload !== "object" || !("content" in payload) || typeof payload.content !== "string") {
      throw new Error("Payload or content not found")
    }

    expect(payload.content).toContain(`||${word}||`)
  })

  test("checkForWord fail", async (): Promise<void> => {
    const mockDelete: jest.Mock = jest.fn<Message["delete"]>()

    await Censor.checkForWord(
      createMock<Message>({
        delete: mockDelete,
        member: createMock<GuildMember>({
          user: createMock<User>({ bot: true })
        })
      })
    )

    expect(mockDelete).not.toHaveBeenCalled()
  })
})
