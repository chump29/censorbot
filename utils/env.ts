import { printVars } from "@postfmly/logger"
import { type Optional } from "@postfmly/types"

import { bool, cleanEnv, type ExactValidator, makeExactValidator, str, url } from "envalid"
import { anyOf, caseInsensitive, charIn, createRegExp, exactly, wordChar } from "magic-regexp"
import {
  digits,
  integer,
  literal,
  maxLength,
  maxValue,
  minLength,
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

const MIN_ID_LEN: number = 17
const MAX_ID_LEN: number = 19

const COLOR_LEN: number = 6

const MIN_LEVEL: number = 1
const MAX_LEVEL: number = 5

const MIN_PORT: number = 1024
const MAX_PORT: number = 65_535

const UID_MIN_LEN: number = 23
const UID_MAX_LEN: number = 28
const TS_MIN_LEN: number = 6
const TS_MAX_LEN: number = 7
const HMAC_MIN_LEN: number = 27
const HMAC_MAX_LEN: number = 38

const StringSchema = pipe(string(), trim(), nonEmpty())
const IdSchema = pipe(StringSchema, digits(), minLength(MIN_ID_LEN), maxLength(MAX_ID_LEN))
const ColorSchema = pipe(
  StringSchema,
  regex(
    // ! Desired: /^(?:#[\da-f]{6})$/i
    createRegExp(exactly("#").at.lineStart(), charIn("0123456789abcdef").times(COLOR_LEN).at.lineEnd(), [
      caseInsensitive
    ])
  )
)
const LevelSchema = pipe(StringSchema, toNumber(), integer(), minValue(MIN_LEVEL), maxValue(MAX_LEVEL))
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

const idValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(IdSchema, s))
const colorValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(ColorSchema, s))
const levelValidator: ExactValidator<number> = makeExactValidator<number>((s: string): number => parse(LevelSchema, s))
const portValidator: ExactValidator<"random" | number> = makeExactValidator<"random" | number>(
  (s: string): "random" | number => parse(PortSchema, s)
)
const tokenValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(TokenSchema, s))

let fakeId: Optional<string>
let fakeURL: Optional<string>
let fakeToken: Optional<string>

if (Bun.env.NODE_ENV === "test") {
  const { fakerEN_US: fake } = await import("@faker-js/faker")

  let chars: string = "[0-9]"
  fakeId = fake.helpers.fromRegExp(`${chars}{${MIN_ID_LEN},${MAX_ID_LEN}}`)

  fakeURL = fake.image.url({ height: 64, width: 64 })

  chars = "[a-zA-Z0-9]"
  fakeToken = fake.helpers.fromRegExp(
    `${chars}{${UID_MIN_LEN},${UID_MAX_LEN}}[.]${chars}{${TS_MIN_LEN},${TS_MAX_LEN}}[.]${chars}{${HMAC_MIN_LEN},${HMAC_MAX_LEN}}`
  )
}

const env = cleanEnv(Bun.env, {
  ACTIVITY: str({ default: "Censoring" }),
  CHANNEL_ID: idValidator({ testDefault: fakeId }),
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
  printVars(env, ["CHANNEL_ID", "TOKEN"])
}

export { env, MAX_LEVEL }
