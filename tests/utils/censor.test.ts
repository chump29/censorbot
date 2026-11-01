import { describe, expect, mock, spyOn, test } from "bun:test"

import { fakerEN_US as fake } from "@faker-js/faker"
// biome-ignore lint/performance/noNamespaceImport: for testing
import * as betterProfaneWords from "better-profane-words"
import { getByIntensity } from "better-profane-words"
import { ChannelType, type GuildMember, type Message, type Webhook } from "discord.js"

import { Censor } from "../../utils/censor.ts"
import { env, MAX_LEVEL } from "../../utils/env.ts"

const lengthError = /length/v

describe("censor", (): void => {
  test("init fail", (): void => {
    const wordsSpy = spyOn(betterProfaneWords, "getByIntensity").mockReturnValue([])

    expect((): void => Censor.init()).toThrow(lengthError)

    wordsSpy.mockRestore()
  })

  test("checkForWord pass", async (): Promise<void> => {
    const [mockDelete, mockWebhookDelete, mockWebhookSend] = [
      mock<Message["delete"]>(),
      mock<Webhook["delete"]>(),
      mock<Webhook["send"]>()
    ]

    const words = getByIntensity(env.LEVEL, MAX_LEVEL)
    const word = words[Math.floor(Math.random() * words.length)]?.word

    const mockMessage = createMock<Message>({
      content: fake.helpers.fake(`{{lorem.words(2)}} ${word} {{lorem.words(2)}}`),
      delete: mockDelete,
      member: createMock<GuildMember>({
        displayName: fake.internet.displayName(),
        user: {
          bot: false
        }
      }),
      author: {
        displayAvatarURL: mock<() => string>().mockReturnValue(fake.image.avatar())
      },
      channel: {
        createWebhook: createMock<Webhook>({
          delete: mockWebhookDelete,
          send: mockWebhookSend
        }),
        type: ChannelType.GuildText
      }
    })

    await Censor.checkForWord(mockMessage)

    expect(mockDelete).toHaveBeenCalledOnce()

    expect(mockWebhookSend).toHaveBeenCalledOnce()
    expect(mockWebhookDelete).toHaveBeenCalledOnce()

    const { calls } = mockWebhookSend.mock
    const payload = calls?.[0]?.[0]
    if (!payload || typeof payload !== "object" || !("content" in payload) || typeof payload.content !== "string") {
      throw new Error("Payload or content not found")
    }

    expect(payload.content).toContain(`||${word}||`)
  })

  test("checkForWord fail", async (): Promise<void> => {
    const mockDelete = mock<Message["delete"]>()

    await Censor.checkForWord(
      createMock<Message>({
        delete: mockDelete,
        member: createMock<GuildMember>({
          user: {
            bot: true
          }
        })
      })
    )

    expect(mockDelete).not.toHaveBeenCalled()
  })
})
