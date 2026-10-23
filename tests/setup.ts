import { jest } from "bun:test"

function wrapper<T>(target: object, handler: ProxyHandler<object>): Mock<T>
function wrapper(target: object, handler: ProxyHandler<object>): unknown {
  return new Proxy(target, handler)
}

const spyMapper = new WeakMap<object, unknown>()

const mockFactory = <T>(props?: MockProps<T>): unknown => {
  const mapper: Record<PropertyKey, unknown> = props ?? {}
  const cache = new Map<PropertyKey, unknown>()

  const handler = (scope: Record<PropertyKey, unknown>): ProxyHandler<object> => ({
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

      if (Object.hasOwn(scope, prop)) {
        return Reflect.get(scope, prop)
      }

      if (Object.hasOwn(target, prop)) {
        return Reflect.get(target, prop)
      }

      const cached: unknown = cache.get(prop)
      if (cached !== undefined) {
        return cached
      }

      const value: unknown = typeof prop === "string" ? scope[prop] : undefined

      let nestedScope: Record<PropertyKey, unknown> = {}
      if (value && typeof value === "object" && !Array.isArray(value)) {
        nestedScope = { ...value }
      }

      const spyHandler: ProxyHandler<object> = handler(nestedScope)

      const spy = jest.fn().mockResolvedValue(wrapper({}, spyHandler))

      Object.defineProperty(spy, "mocked", {
        get(): unknown {
          return spy
        }
      })

      const nestedProxy = wrapper(spy, spyHandler)

      spyMapper.set(nestedProxy, spy)

      cache.set(prop, nestedProxy)

      return nestedProxy
    }
  })

  return wrapper<T>({}, handler(mapper))
}

Object.defineProperty(globalThis, "createMock", {
  value: mockFactory
})

Object.defineProperty(globalThis, "getMock", {
  value: <Args extends unknown[], Return>(f: (...args: Args) => Return): unknown => {
    if (typeof f === "function") {
      const spy: unknown = spyMapper.get(f)
      if (spy !== undefined) {
        return spy
      }
    }

    return f
  }
})
