import { printVars } from "@postfmly/logger"
import { type Optional } from "@postfmly/types"

import { type Intensity } from "better-profane-words"
import { type HexColorString } from "discord.js"
import { bool, cleanEnv, type ExactValidator, makeExactValidator, str, url } from "envalid"
import { anyOf, caseInsensitive, charIn, createRegExp, exactly, wordChar } from "magic-regexp"
import {
  guard,
  integer,
  literal,
  maxValue,
  minValue,
  nonEmpty,
  parse,
  pipe,
  regex,
  string,
  toNumber,
  trim,
  union
} from "valibot"

const COLOR_LEN: number = 6

// ! NOTE: Comes from https://github.com/awdev1/better-profane-words/blob/main/index.d.ts#L18
const MIN_LEVEL: number = 1
const MAX_LEVEL: Intensity = 5

const MIN_PORT: number = 1024
const MAX_PORT: number = 65_535

const UID_MIN_LEN: number = 23
const UID_MAX_LEN: number = 28
const TS_MIN_LEN: number = 6
const TS_MAX_LEN: number = 7
const HMAC_MIN_LEN: number = 27
const HMAC_MAX_LEN: number = 38

const StringSchema = pipe(string(), trim(), nonEmpty())
const ColorSchema = pipe(
  StringSchema,
  regex(
    createRegExp(
      exactly("#").at.lineStart(),
      charIn.from("0", "9").orChar.from("a", "f").times(COLOR_LEN).at.lineEnd(),
      [caseInsensitive]
    )
  ),
  guard((_: string): _ is HexColorString => true)
)
const LevelSchema = pipe(
  StringSchema,
  toNumber(),
  integer(),
  minValue(MIN_LEVEL),
  maxValue(MAX_LEVEL),
  guard((_: number): _ is Intensity => true)
)
const PortSchema = union([
  literal("random"),
  pipe(StringSchema, toNumber(), integer(), minValue(MIN_PORT), maxValue(MAX_PORT))
])
const TokenSchema = pipe(
  StringSchema,
  regex(
    createRegExp(
      anyOf(wordChar, "-").times.between(UID_MIN_LEN, UID_MAX_LEN).at.lineStart(),
      exactly("."),
      anyOf(wordChar, "-").times.between(TS_MIN_LEN, TS_MAX_LEN),
      exactly("."),
      anyOf(wordChar, "-").times.between(HMAC_MIN_LEN, HMAC_MAX_LEN).at.lineEnd(),
      [caseInsensitive]
    )
  )
)

const colorValidator: ExactValidator<HexColorString> = makeExactValidator<HexColorString>(
  (s: string): HexColorString => parse(ColorSchema, s)
)
const levelValidator: ExactValidator<Intensity> = makeExactValidator<Intensity>(
  (s: string): Intensity => parse(LevelSchema, s)
)
const portValidator: ExactValidator<"random" | number> = makeExactValidator<"random" | number>(
  (s: string): "random" | number => parse(PortSchema, s)
)
const tokenValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(TokenSchema, s))

let fakeURL: Optional<string>
let fakeToken: Optional<string>

if (Bun.env.NODE_ENV === "test") {
  const { fakerEN_US: fake } = await import("@faker-js/faker")

  fakeURL = fake.image.url({ height: 64, width: 64 })

  const chars: string = "[a-zA-Z0-9]"
  fakeToken = fake.helpers.fromRegExp(
    `${chars}{${UID_MIN_LEN},${UID_MAX_LEN}}[.]${chars}{${TS_MIN_LEN},${TS_MAX_LEN}}[.]${chars}{${HMAC_MIN_LEN},${HMAC_MAX_LEN}}`
  )
}

const env = cleanEnv(Bun.env, {
  ACTIVITY: str({ default: "Censoring" }),
  COLOR: colorValidator({ default: "#78866b" }),
  DEBUG: bool({ default: false, testDefault: true }),
  LEVEL: levelValidator({ default: 3 }),
  LOGO_NAME: str({ default: "censorbot.webp" }),
  LOGO_PATH: str({ default: "./utils/images" }),
  LOGO_PORT: portValidator({ default: "random" }),
  LOGO_URL: url({ testDefault: fakeURL }),
  NAME: str({ default: "CensorBot" }),
  TOKEN: tokenValidator({ testDefault: fakeToken })
})

if (import.meta.main) {
  printVars(env, ["TOKEN"])
}

export { env, MAX_LEVEL }
