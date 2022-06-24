import { DMMF } from '@prisma/generator-helper'
import { getDMMF } from '@prisma/sdk'
import { graphql } from 'graphql'
import { getPGBuilder } from '..'
import {
  mergeDefaultInputFactory,
  mergeDefaultInputFactoryUnion,
  mergeDefaultInputField,
  mergeDefaultOutputField,
  mergeDefaultPGObject,
} from '../test-utils'
import { PGInputFactory, PGInputFactoryUnion } from '../types/input-factory'
import { getInternalPGPrismaConverter } from '.'

async function getSampleDMMF(): Promise<DMMF.Document> {
  const datamodel = /* Prisma */ `
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    model SomeModel {
      id        Int             @id
      scalar    String?
      enum      SomeEnum  
      relations RelationModel[]
    }
    model RelationModel {
      id        Int             @id
      model     SomeModel       @relation(fields: [modelId], references: [id])
      modelId   Int
    }
    enum SomeEnum {
      A
      B
    }
  `
  return await getDMMF({ datamodel })
}

describe('PGPrismaConverter', () => {
  it('Generates PGObjects from the DMMF under the updated definitions & Sets them into the Build Cache', async () => {
    const dmmf = await getSampleDMMF()
    const pg = getPGBuilder()()
    const pgpc = getInternalPGPrismaConverter(pg, dmmf)

    const { objects, enums, relations } = pgpc.convert({
      SomeModel: () => someModel,
    })
    const someModel = pgpc.update({
      name: 'SomeModel',
      fields: (f, b) => ({
        ...f,
        scalar2: b.boolean(),
      }),
      relations: relations('SomeModel'),
    })
    const relationModelModelFieldType =
      objects('RelationModel').value.fieldMap.model.value.type()

    const expectSomeModel = mergeDefaultPGObject({
      name: 'SomeModel',
      value: {
        fieldMap: {
          id: mergeDefaultOutputField({ kind: 'scalar', type: 'id' }),
          scalar: mergeDefaultOutputField({
            kind: 'scalar',
            type: 'string',
            isNullable: true,
            isOptional: true,
          }),
          scalar2: mergeDefaultOutputField({
            kind: 'scalar',
            type: 'boolean',
          }),
          enum: mergeDefaultOutputField({ kind: 'enum', type: enums('SomeEnum') }),
          relations: mergeDefaultOutputField({
            kind: 'object',
            type: expect.any(Function),
            isList: true,
            isPrismaRelation: true,
          }),
        },
        prismaModelName: 'SomeModel',
      },
    })
    const expectRelationModel = mergeDefaultPGObject({
      name: 'RelationModel',
      value: {
        fieldMap: {
          id: mergeDefaultOutputField({ kind: 'scalar', type: 'id' }),
          model: mergeDefaultOutputField({
            kind: 'object',
            type: expect.any(Function),
            isPrismaRelation: true,
          }),
          modelId: mergeDefaultOutputField({
            kind: 'scalar',
            type: 'int',
          }),
        },
        prismaModelName: 'RelationModel',
      },
    })
    expect(objects('SomeModel')).toEqual(expectSomeModel)
    expect(objects('RelationModel')).toEqual(expectRelationModel)
    expect(objects('SomeModel')).toEqual(someModel)
    expect(relationModelModelFieldType).toEqual(someModel)
    expect(pg.cache().objectRef).toEqual({
      SomeModel: {
        name: 'SomeModel',
        kind: 'objectRef',
        ref: expect.any(Function),
      },
    })
    expect(pg.cache().objectRef.SomeModel.ref()).toEqual(expectSomeModel)
    expect(pg.cache().object).toEqual({
      RelationModel: expectRelationModel,
    })
  })

  it('Generates PGEnums from the DMMF & Sets them into the Build Cache', async () => {
    const dmmf = await getSampleDMMF()
    const pg = getPGBuilder()()
    const pgpc = getInternalPGPrismaConverter(pg, dmmf)

    const { enums } = pgpc.convert()

    const expectSomeEnum = {
      name: 'SomeEnum',
      kind: 'enum',
      values: ['A', 'B'],
    }
    const expectQueryMode = {
      name: 'QueryMode',
      kind: 'enum',
      values: ['default', 'insensitive'],
    }
    const expectRelationModelScalarFieldEnum = {
      name: 'RelationModelScalarFieldEnum',
      kind: 'enum',
      values: ['id', 'modelId'],
    }
    const expectSomeModelScalarFieldEnum = {
      name: 'SomeModelScalarFieldEnum',
      kind: 'enum',
      values: ['id', 'scalar', 'enum'],
    }
    const expectSortOrder = {
      name: 'SortOrder',
      kind: 'enum',
      values: ['asc', 'desc'],
    }
    expect(enums('SomeEnum')).toEqual(expectSomeEnum)
    expect(enums('QueryMode')).toEqual(expectQueryMode)
    expect(enums('RelationModelScalarFieldEnum')).toEqual(
      expectRelationModelScalarFieldEnum,
    )
    expect(enums('SomeModelScalarFieldEnum')).toEqual(expectSomeModelScalarFieldEnum)
    expect(enums('SortOrder')).toEqual(expectSortOrder)
    expect(pg.cache().enum).toEqual({
      SomeEnum: expectSomeEnum,
      QueryMode: expectQueryMode,
      RelationModelScalarFieldEnum: expectRelationModelScalarFieldEnum,
      SomeModelScalarFieldEnum: expectSomeModelScalarFieldEnum,
      SortOrder: expectSortOrder,
    })
  })

  it('Generates PGInputFactories from the DMMF', async () => {
    const dmmf = await getSampleDMMF()
    const pg = getPGBuilder()()
    const pgpc = getInternalPGPrismaConverter(pg, dmmf)

    const { inputs, enums } = pgpc.convert()
    const findFirstSomeModel = inputs('findFirstSomeModel')
    const findFirstSomeModelOrderByDefault = (
      findFirstSomeModel.value.fieldMap.orderBy as PGInputFactoryUnion<any>
    ).select('SomeModelOrderByWithRelationInput')
    const findFirstSomeModelWhere: PGInputFactory<any> =
      findFirstSomeModel.value.fieldMap.where()
    const findFirstSomeModelWhereAND: PGInputFactory<any> = (
      findFirstSomeModelWhere.value.fieldMap.AND as PGInputFactoryUnion<any>
    ).select('SomeModelWhereInput')

    const expectFindFirstSomeModel = mergeDefaultInputFactory({
      fieldMap: {
        cursor: expect.any(Function),
        distinct: mergeDefaultInputField({
          kind: 'enum',
          type: enums('SomeModelScalarFieldEnum'),
          isList: true,
          isOptional: true,
        }),
        orderBy: mergeDefaultInputFactoryUnion({
          factoryMap: {
            __default: expect.any(Function),
            SomeModelOrderByWithRelationInput: expect.any(Function),
            SomeModelOrderByWithRelationInputList: expect.any(Function),
          },
        }),
        skip: mergeDefaultInputField({
          kind: 'scalar',
          type: 'int',
          isOptional: true,
        }),
        take: mergeDefaultInputField({
          kind: 'scalar',
          type: 'int',
          isOptional: true,
        }),
        where: expect.any(Function),
      },
    })
    const expectFindFirstSomeModelOrderByDefault = mergeDefaultInputFactory({
      fieldMap: {
        enum: mergeDefaultInputField({
          kind: 'enum',
          type: enums('SortOrder'),
          isOptional: true,
        }),
        id: mergeDefaultInputField({
          kind: 'enum',
          type: enums('SortOrder'),
          isOptional: true,
        }),
        relations: expect.any(Function),
        scalar: mergeDefaultInputField({
          kind: 'enum',
          type: enums('SortOrder'),
          isOptional: true,
        }),
      },
      isOptional: true,
    })
    const expectFindFirstSomeModelWhere = mergeDefaultInputFactory({
      fieldMap: {
        AND: mergeDefaultInputFactoryUnion({
          factoryMap: {
            __default: expect.any(Function),
            SomeModelWhereInput: expect.any(Function),
            SomeModelWhereInputList: expect.any(Function),
          },
        }),
        NOT: mergeDefaultInputFactoryUnion({
          factoryMap: {
            __default: expect.any(Function),
            SomeModelWhereInput: expect.any(Function),
            SomeModelWhereInputList: expect.any(Function),
          },
        }),
        OR: expect.any(Function),
        enum: mergeDefaultInputFactoryUnion({
          factoryMap: {
            __default: expect.any(Function),
            EnumSomeEnumFilter: expect.any(Function),
            SomeEnum: mergeDefaultInputField({
              kind: 'enum',
              type: enums('SomeEnum'),
              isOptional: true,
            }),
          },
        }),
        id: mergeDefaultInputFactoryUnion({
          factoryMap: {
            __default: expect.any(Function),
            IntFilter: expect.any(Function),
            Int: mergeDefaultInputField({
              kind: 'scalar',
              type: 'int',
              isOptional: true,
            }),
          },
        }),
        relations: expect.any(Function),
        scalar: mergeDefaultInputFactoryUnion({
          factoryMap: {
            __default: expect.any(Function),
            StringNullableFilter: expect.any(Function),
            String: mergeDefaultInputField({
              kind: 'scalar',
              type: 'string',
              isOptional: true,
              isNullable: true,
            }),
          },
        }),
      },
      isOptional: true,
    })
    expect(findFirstSomeModel).toEqual(expectFindFirstSomeModel)
    expect(findFirstSomeModelOrderByDefault).toEqual(
      expectFindFirstSomeModelOrderByDefault,
    )
    expect(findFirstSomeModelWhere).toEqual(expectFindFirstSomeModelWhere)
    expect(findFirstSomeModelWhereAND).toEqual(expectFindFirstSomeModelWhere)
  })

  it('Generates instances that can be converted to a GraphQL schema', async () => {
    const dmmf = await getSampleDMMF()
    const pg = getPGBuilder()()
    const pgpc = getInternalPGPrismaConverter(pg, dmmf)

    const { objects, inputs } = pgpc.convert()
    const args = inputs('findManySomeModel')
      .edit((f) => ({
        skip: f.skip,
        orderBy: f.orderBy,
        // TODO: Fix Maximum call stack size exceeded
        // where: f.where,
      }))
      .build('FindManySomeModel', pg)

    pg.query({
      name: 'someModels',
      field: (b) =>
        b
          .object(() => objects('SomeModel'))
          .list()
          .prismaArgs(() => args as any)
          .resolve(() => []),
    })
    const query = `
      query {
        someModels(skip: 1) {
          id
        }
      }
    `

    const response = await graphql({
      schema: pg.build(),
      source: query,
      contextValue: {},
    })

    expect(response).toEqual({
      data: {
        someModels: [],
      },
    })
  })
})
