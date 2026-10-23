import { jest } from "bun:test"

function constructProxy<T>(target: object, handler: ProxyHandler<object>): Mock<T>
function constructProxy(target: object, handler: ProxyHandler<object>): unknown {
  return new Proxy(target, handler)
}

const proxyToRawMockMap = new WeakMap<object, unknown>()

const mockFactory = <T>(props?: MockProps<T>): unknown => {
  const seed: Record<PropertyKey, unknown> = props ?? {}
  const cache = new Map<PropertyKey, unknown>()

  const handler = (localSeed: Record<PropertyKey, unknown>): ProxyHandler<object> => ({
    get(target: object, prop: string | symbol): unknown {
      if (prop === "mocked") {
        return new Proxy(target, {
          get(mockTarget: object, mockProp: string | symbol): unknown {
            if (mockProp === "calls" || mockProp === "results") {
              return Reflect.get(Reflect.get(mockTarget, "mock"), mockProp)
            }

            return Reflect.get(mockTarget, mockProp)
          }
        })
      }

      if (prop === "then") {
        return undefined
      }

      if (Object.hasOwn(localSeed, prop)) {
        return Reflect.get(localSeed, prop)
      }

      if (Object.hasOwn(target, prop)) {
        return Reflect.get(target, prop)
      }

      const cached: unknown = cache.get(prop)
      if (cached !== undefined) {
        return cached
      }

      const rawValue: unknown = typeof prop === "string" ? localSeed[prop] : undefined

      let subSeed: Record<PropertyKey, unknown> = {}
      if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
        subSeed = { ...rawValue }
      }

      const childHandler: ProxyHandler<object> = handler(subSeed)

      const newMethod = jest.fn().mockResolvedValue(constructProxy({}, childHandler))

      Object.defineProperty(newMethod, "mocked", {
        get(): unknown {
          return newMethod
        }
      })

      const nestedProxy = constructProxy(newMethod, childHandler)

      proxyToRawMockMap.set(nestedProxy, newMethod)

      cache.set(prop, nestedProxy)

      return nestedProxy
    }
  })

  return constructProxy<T>({}, handler(seed))
}

Object.defineProperty(globalThis, "createMock", {
  value: mockFactory
})

Object.defineProperty(globalThis, "assertMock", {
  value: <Args extends unknown[], Return>(fn: (...args: Args) => Return): unknown => {
    if (typeof fn === "function") {
      const rawMock = proxyToRawMockMap.get(fn)
      if (rawMock !== undefined) {
        return rawMock
      }
    }

    return fn
  }
})
