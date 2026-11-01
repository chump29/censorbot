/** biome-ignore-all lint/nursery/useLowercaseTestTitle: using env names */

import { describe, expect, test } from "bun:test"

import { type Intensity } from "better-profane-words"
import { type HexColorString } from "discord.js"
import { expectTypeOf } from "expect-type"

import { env } from "../../utils/env.ts"

describe("env", (): void => {
  test("ACTIVITY", (): void => {
    expectTypeOf(env.ACTIVITY).toEqualTypeOf<string>()

    expect(env.ACTIVITY.length).toBeGreaterThan(0)
  })

  test("COLOR", (): void => {
    expectTypeOf(env.COLOR).toEqualTypeOf<HexColorString>()

    const LEN = 7

    expect(env.COLOR).toHaveLength(LEN)
  })

  test("DEBUG", (): void => {
    expectTypeOf(env.DEBUG).toEqualTypeOf<boolean>()

    expect(env.DEBUG).toBeTrue()
  })

  test("LEVEL", (): void => {
    expectTypeOf(env.LEVEL).toEqualTypeOf<Intensity>()

    expect(env.LEVEL).toBeGreaterThan(0)
  })

  test("LOGO_NAME", (): void => {
    expectTypeOf(env.LOGO_NAME).toEqualTypeOf<string>()

    expect(env.LOGO_NAME.length).toBeGreaterThan(0)
  })

  test("LOGO_PATH", (): void => {
    expectTypeOf(env.LOGO_PATH).toEqualTypeOf<string>()

    expect(env.LOGO_PATH.length).toBeGreaterThan(0)
  })

  test("LOGO_PORT", (): void => {
    expectTypeOf(env.LOGO_PORT).toEqualTypeOf<number | "random">()

    expect(env.LOGO_PORT).toBe("random")
  })

  test("LOGO_URL", (): void => {
    expectTypeOf(env.LOGO_URL).toEqualTypeOf<string>()

    expect(env.LOGO_URL.length).toBeGreaterThan(0)
  })

  test("NAME", (): void => {
    expectTypeOf(env.NAME).toEqualTypeOf<string>()

    expect(env.NAME.length).toBeGreaterThan(0)
  })

  test("TOKEN", (): void => {
    expectTypeOf(env.TOKEN).toEqualTypeOf<string>()

    expect(env.TOKEN.length).toBeGreaterThan(0)
  })
})
