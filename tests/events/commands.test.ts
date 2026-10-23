import { readdir } from "node:fs/promises"
import { default as path } from "node:path"

import { beforeAll, describe, expect, spyOn, test } from "bun:test"

import { type Optional } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
import {
  type APIEmbed,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type User
} from "discord.js"
import { match } from "ts-pattern"

import { author, version } from "../../package.json" with { type: "json" }
import { Censor } from "../../utils/censor.ts"
import { env } from "../../utils/env.ts"

interface ICommandFile {
  create: () => RESTPostAPIChatInputApplicationCommandsJSONBody
  invoke: (interaction: ChatInputCommandInteraction) => Promise<void>
}

const HEX_BASE: number = 16
const COLOR_LEN: number = 6
const decimalToHex = (c: Optional<number>): string => (c ? `#${c.toString(HEX_BASE).padStart(COLOR_LEN, "0")}` : "N/A")

const dir: string = "events/commands"

const commands: string[] = (await readdir(dir)).filter((file: string): boolean => file.endsWith(".ts"))

// * NOTE: suppress console output
spyOn(console, "info").mockImplementation((): void => undefined)

beforeAll((): void => {
  Censor.init()
})

await Promise.all(
  commands.map(async (command: string): Promise<void> => {
    const { create, invoke } = (await import(`${path.join("../..", dir)}/${command}`)) satisfies ICommandFile

    const name: string = path.basename(command, ".ts")

    describe(`/${name}`, (): void => {
      test("create", (): void => {
        const c: RESTPostAPIChatInputApplicationCommandsJSONBody = create()

        expect(c.name).toBe(name)
        expect(c.description).not.toBeEmpty()
        expect(c.contexts ?? []).not.toBeEmpty()
      })

      test("invoke", async (): Promise<void> => {
        const interaction = createMock<ChatInputCommandInteraction>({
          createdTimestamp: fake.date.past().getTime(),
          user: createMock<User>({
            displayName: fake.internet.displayName(),
            username: fake.internet.username()
          })
        })

        expect(await invoke(interaction)).toBeUndefined()

        expect(getMock(interaction.deferReply)).toHaveBeenCalledTimes(1)
        expect(getMock(interaction.editReply)).toHaveBeenCalledTimes(1)

        const { calls } = interaction.editReply.mocked
        const payload: unknown = calls[0]?.[0]
        if (!payload || typeof payload !== "object") {
          throw new Error("Payload not found")
        }

        match<string, void>(name)
          .with("info", (): void => {
            if (!("embeds" in payload && Array.isArray(payload.embeds))) {
              throw new Error("Embeds not found")
            }

            const embed: unknown = payload.embeds[0]
            if (!embed || typeof embed !== "object" || Array.isArray(embed)) {
              throw new Error("Embed not found")
            }

            const { data }: { data: APIEmbed } = EmbedBuilder.from(embed)

            expect(decimalToHex(data.color)).toBe(env.COLOR)
            expect(data.author?.icon_url).toBe(env.LOGO_URL)
            expect(data.author?.name).toBe(`${env.NAME} v${version}`)
            expect(data.thumbnail?.url).toBe(env.LOGO_URL)
            expect(data.description).not.toBeEmpty()
            expect(data.footer?.text).toEndWith(author.name)
          })
          .with("ping", (): void => {
            if (!("content" in payload) || typeof payload.content !== "string") {
              throw new Error("Content not found")
            }

            expect(payload.content).toInclude("Pong")
          })
          .otherwise((): never => {
            throw new Error(`Payload tests not found for /${name}`)
          })
      })
    })
  })
)
