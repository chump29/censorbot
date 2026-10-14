import { describe, expect, jest, test } from "bun:test"

import { type Optional } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
import { getByIntensity, type Intensity, type WordEntry } from "better-profane-words"
import { type GuildMember, type Message, type TextBasedChannelFields, type TextChannel, type User } from "discord.js"

import { Censor } from "../../utils/censor.ts"
import { env, MAX_LEVEL } from "../../utils/env.ts"

describe("censor", (): void => {
  test("checkForWord", async (): Promise<void> => {
    const words: WordEntry[] = getByIntensity(env.LEVEL as Intensity, MAX_LEVEL as Intensity)

    const word: Optional<string> = words[Math.floor(Math.random() * words.length)]?.word

    expect(word).not.toBeUndefined()

    const sentence: string = fake.helpers.fake(`{{lorem.words(2)}} ${word} {{lorem.words(2)}}`)

    type Fn = ReturnType<typeof jest.fn>

    const mockDelete: Fn = jest.fn()
    const mockHookSend: Fn = jest.fn()
    const mockHookDelete: Fn = jest.fn()

    const message: Message = {
      author: {
        displayAvatarURL: jest.fn()
      } as unknown as User,
      channel: {
        createWebhook: jest.fn().mockResolvedValue({
          delete: mockHookDelete,
          send: mockHookSend
        } as unknown as TextBasedChannelFields)
      } as unknown as TextChannel,
      content: sentence,
      delete: mockDelete,
      member: {
        displayName: fake.internet.displayName(),
        user: {
          bot: false
        } as User
      } as GuildMember
    } as unknown as Message

    await Censor.checkForWord(message)

    expect(mockDelete).toHaveBeenCalled()
    expect(mockHookSend).toHaveBeenCalled()
    expect(mockHookDelete).toHaveBeenCalled()

    const firstCallArgs = mockHookSend.mock.calls
    const payload = firstCallArgs[0]?.[0]
    if (!payload) {
      throw new Error("Payload not found")
    }

    expect(payload.content).toContain(`||${word}||`)
  })
})
