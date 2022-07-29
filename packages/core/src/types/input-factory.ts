import type { PGBuilder, PGTypes } from './builder'
import type { PGFieldValue, TypeOfPGModelBase } from './common'
import type { PGInput, PGInputField } from './input'

export type PGInputFactoryField =
  | (() => PGInputFactory<any>)
  | PGInputFactory<any>
  | PGInputFactoryUnion<any>
  | PGInputField<any>

type TypeOfPGInputFactoryMapField<T extends PGInputFactoryField> = T extends () => any
  ? ReturnType<T>
  : T

export interface PGInputFactoryFieldMap {
  [name: string]: PGInputFactoryField
}

export type PGEditInputFactoryFieldMap<
  TFieldMap extends PGInputFactoryFieldMap | PGInputFactoryFieldMap[] | null | undefined,
> = {
  [P in keyof ExtractPGInputFactoryFieldMap<TFieldMap>]: TypeOfPGInputFactoryMapField<
    ExtractPGInputFactoryFieldMap<TFieldMap>[P]
  >
}

export interface PGInputFactoryUnion<
  TFactoryMap extends {
    __default: PGInputFactoryField
  } & PGInputFactoryFieldMap,
> {
  value: {
    factoryMap: TFactoryMap
  }
  select: <TName extends keyof TFactoryMap>(
    name: TName,
  ) => TypeOfPGInputFactoryMapField<TFactoryMap[TName]>
}

type ExcludeNullish<T> = Exclude<T, null | undefined>
type ExtractNullish<T> = Extract<T, null | undefined>
export type ExtractPGInputFactoryFieldMap<
  T extends PGInputFactoryFieldMap | PGInputFactoryFieldMap[] | null | undefined,
> = T extends Array<infer U> ? U : ExcludeNullish<T>

export interface PGInputFactory<
  out T extends PGInputFactoryFieldMap | PGInputFactoryFieldMap[] | null | undefined,
  Types extends PGTypes = any,
> {
  name: string
  value: PGFieldValue & {
    builder: PGBuilder<any>
    fieldMap: ExtractPGInputFactoryFieldMap<T>
    validator?: (value: any) => boolean
  }
  nullish: <IsNullish extends boolean = true>(
    isNullish?: IsNullish,
  ) => IsNullish extends false
    ? PGInputFactory<Exclude<T, null | undefined>, Types>
    : PGInputFactory<T | null | undefined, Types>
  nullable: <IsNullable extends boolean = true>(
    isNullable?: IsNullable,
  ) => IsNullable extends false
    ? PGInputFactory<Exclude<T, null>, Types>
    : PGInputFactory<T | null, Types>
  optional: <IsOptinal extends boolean = true>(
    isOptional?: IsOptinal,
  ) => IsOptinal extends false
    ? PGInputFactory<Exclude<T, undefined>, Types>
    : PGInputFactory<T | undefined, Types>
  list: () => ExcludeNullish<T> extends any[]
    ? this
    : ExcludeNullish<T> extends PGInputFactoryFieldMap
    ? PGInputFactory<Array<ExcludeNullish<T>> | ExtractNullish<T>, Types>
    : never
  default: (value: T extends any[] ? [] : T extends null ? null : never) => this
  validation: (
    builder: (
      value: Exclude<
        ConvertPGInputFactoryFieldMapField<this> extends PGInputField<infer U, any>
          ? U extends Array<infer V>
            ? V extends PGInput<any>
              ? TypeOfPGModelBase<V>
              : V
            : U extends PGInput<any>
            ? TypeOfPGModelBase<U>
            : U
          : never,
        undefined
      >,
    ) => boolean,
  ) => this
  edit: <
    TEditedFieldMap extends
      | {
          [P in keyof ExtractPGInputFactoryFieldMap<T>]?: PGInputFactoryField
        }
      | {
          [name: string]: PGInputFactoryField
        },
  >(
    callback: (f: PGEditInputFactoryFieldMap<T>) => TEditedFieldMap,
    name?: string,
  ) => {
    [P in keyof TEditedFieldMap]: Exclude<TEditedFieldMap[P], undefined>
  } extends infer U
    ? U extends PGInputFactoryFieldMap
      ? ExcludeNullish<T> extends any[]
        ? PGInputFactory<[U] | ExtractNullish<T>, Types>
        : PGInputFactory<U | ExtractNullish<T>, Types>
      : never
    : never
  build: <TInfer extends boolean, TWrap extends boolean>(config?: {
    wrap?: TWrap
    infer?: TInfer
  }) => Exclude<TWrap, undefined> extends true
    ? Exclude<TInfer, undefined> extends true
      ? ConvertPGInputFactoryFieldMapField<this>
      : any
    : {
        [P in keyof ExtractPGInputFactoryFieldMap<T>]: Exclude<
          TInfer,
          undefined
        > extends true
          ? ConvertPGInputFactoryFieldMapField<ExtractPGInputFactoryFieldMap<T>[P]>
          : any
      }
}

type Cast<T, P> = T extends P ? T : P

type ConvertPGInputFactoryFieldMapField<T extends PGInputFactoryField> = (
  T extends PGInputField<any>
    ? T
    : T extends () => any
    ? ConvertPGInputFactoryFieldMapField<ReturnType<T>>
    : T extends PGInputFactoryUnion<infer U>
    ? ConvertPGInputFactoryFieldMapField<U['__default']>
    : T extends PGInputFactory<infer U, infer V>
    ? PGInput<{
        [P in keyof ExtractPGInputFactoryFieldMap<U>]: ConvertPGInputFactoryFieldMapField<
          ExtractPGInputFactoryFieldMap<U>[P]
        >
      }> extends PGInput<infer TFieldMap>
      ? ExcludeNullish<U> extends any[]
        ? PGInputField<[PGInput<TFieldMap>] | ExtractNullish<U>, 'input', V>
        : PGInputField<PGInput<TFieldMap> | ExtractNullish<U>, 'input', V>
      : never
    : never
) extends infer R
  ? Cast<R, PGInputField<any, any, any>>
  : PGInputField<any, any, any>
