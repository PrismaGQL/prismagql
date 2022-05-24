import { ReadonlyDeep } from 'type-fest'
import { PGCache } from '../types/builder'
import { PGField, PGModel, ResolveParams } from '../types/common'
import { PGInputField } from '../types/input'
import { PGObject, PGOutputField } from '../types/output'

export function setPGObjectProperties(object: {
  name: string
  fieldMap: { [key: string]: any }
  value?: {
    isRelayConnection?: boolean
  }
}): PGObject<any> {
  return {
    kind: 'object',
    ...object,
  }
}

export function mergeDefaultInputField(
  value: Partial<PGInputField<any>['value']>,
): PGInputField<any> {
  return {
    value: Object.assign(
      {
        kind: 'scalar',
        isOptional: false,
        isNullable: false,
        isList: false,
        type: 'id',
      },
      value,
    ),
    nullable: expect.any(Function),
    optional: expect.any(Function),
    nullish: expect.any(Function),
    list: expect.any(Function),
    default: expect.any(Function),
    validation: expect.any(Function),
    __type: undefined as any,
  }
}

export function mergeDefaultOutputField(
  value: Partial<PGOutputField<any, any>['value']>,
): PGOutputField<any, any> {
  return {
    value: Object.assign(
      {
        kind: 'scalar',
        isOptional: false,
        isNullable: false,
        isList: false,
        type: 'id',
      },
      value,
    ),
    nullable: expect.any(Function),
    list: expect.any(Function),
    args: expect.any(Function),
    resolve: expect.any(Function),
    subscribe: expect.any(Function),
    auth: expect.any(Function),
    __type: undefined as any,
  }
}

export function pgObjectToPGModel<TPrismaWhere = any>(): <T extends PGObject<any, any>>(
  object: T,
  pgCache?: ReadonlyDeep<PGCache>,
) => PGModel<
  T extends PGObject<infer U>
    ? {
        [P in keyof U]: U[P] extends PGOutputField<infer V, any, any> ? PGField<V> : never
      }
    : never,
  TPrismaWhere
> {
  return (object, pgCache) => {
    const model = {
      name: object.name,
      kind: 'model',
      fieldMap: object.fieldMap,
    } as any
    if (pgCache !== undefined) {
      const readableCache = pgCache as PGCache
      readableCache.model[model.name] = model
    }
    return model
  }
}

export function getResolveParamsRef(readonlyPGCache: ReadonlyDeep<PGCache>): {
  value: ResolveParams<any, any, any, any>
} {
  const paramsRef = { value: null as any }
  const pgCache = readonlyPGCache as PGCache
  pgCache.query = Object.entries(pgCache.query).reduce<PGCache['query']>(
    (acc, [name, pgQuery]) => {
      const originalResolve = pgQuery.field.value.resolve
      acc[name] = {
        ...pgQuery,
        field: pgQuery.field.resolve((params) => {
          paramsRef.value = params
          return originalResolve?.(
            params.source,
            params.args,
            params.context,
            params.info,
          ) as any
        }),
      }
      return acc
    },
    {},
  )
  return paramsRef
}
