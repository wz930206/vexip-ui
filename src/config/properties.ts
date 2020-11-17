import { PropOptions } from 'vue'
import { getType, isDefined, toCamelCase } from '../utils/common'

export interface Config {
  defaults: { [x: string]: any },
  [x: string]: any
}

export const config: Config = new Proxy(
  { defaults: {} },
  {
    get<T>(target: T, property: keyof T) {
      return target[property] ?? (target as any).defaults ?? {}
    },
    set<T>(target: T, property: keyof T, value: any) {
      if (getType(value) === 'object') {
        const rootTarget = target as any
        const oldValue = rootTarget[property]

        if (property !== 'defaults') {
          target[property] = new Proxy(
            oldValue ? { ...oldValue, ...value } : { ...value },
            {
              get<T>(target: T, property: keyof T) {
                return target[property] ?? rootTarget.defaults[property] ?? null
              }
            }
          )
        } else {
          Object.assign(oldValue, value)
        }
      }

      return true
    }
  }
)

function getOrElse<T = any>(value: T, defaultValue: T) {
  return isDefined(value) ? value : defaultValue
}

export const size: PropOptions = {
  default() {
    return getOrElse(
      config[toCamelCase((this as any).$options.name)].size,
      'default'
    )
  },
  validator(value) {
    return ['small', 'default', 'large'].includes(value)
  }
}

export const transfer: PropOptions = {
  type: [Boolean, String],
  default() {
    return getOrElse(
      config[toCamelCase((this as any).$options.name)].transfer,
      false
    )
  }
}

export const zIndex: PropOptions = {
  type: Number,
  default() {
    return getOrElse(
      config[toCamelCase((this as any).$options.name)].zIndex,
      2000
    )
  },
  validator(value) {
    return value > 0
  }
}

export function useConfigurableProps(props: {
  [x: string]: PropOptions
}): { [x: string]: PropOptions } {
  const configurableProps: { [x: string]: PropOptions } = {}

  Object.keys(props).forEach(key => {
    configurableProps[key] = {
      ...props[key],
      default() {
        return getOrElse(
          config[toCamelCase((this as any).$options.name)][key],
          typeof props[key].default === 'function'
            ? props[key].default()
            : props[key].default
        )
      }
    }
  })

  return configurableProps
}
