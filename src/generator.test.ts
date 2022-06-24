import fs from 'fs'
import { DMMF } from '@prisma/generator-helper'
import { getDMMF } from '@prisma/sdk'
import {
  generate,
  getInputFactories,
  getInputsTypeProperty,
  getPrismaImportPath,
  shapeInputs,
} from './generator'

const datamodel = /* Prisma */ `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Model1 {
  id            Int        @id @default(autoincrement())
  string        String
  json          Json
  int           Int
  float         Float
  boolean       Boolean
  bigInt        BigInt
  dateTime      DateTime
  bytes         Bytes
  decimal       Decimal
  nullable      String?
  list          String[]
  // NOTE: Omitted because Prisma does not have the concept of a nullable List.
  // nullableList
  enum          SomeEnum
  enumList      SomeEnum2[]
  enumNullable  SomeEnum3?
  oneToOne      Model2?
  oneToMany     Model3[]
}

model Model2 {
  id            Int     @id @default(autoincrement())
  model1        Model1  @relation(fields: [model1Id], references: [id])
  model1Id      Int
}

model Model3 {
  id            Int     @id @default(autoincrement())
  model1        Model1  @relation(fields: [model1Id], references: [id])
  model1Id      Int
}

enum SomeEnum {
  AAA
  BBB
  CCC
}

enum SomeEnum2 {
  Aaa
  Bbb
  Ccc
}

enum SomeEnum3 {
  aaa
  bbb
  ccc
}
`

// NOTE:
// If we don't mock @prisma/generator-helper, the generatorHandler will hold the process
// and jest will not terminate, so I have to mock it and not let it process anything.
// It might be better to keep the files separate.
jest.mock('@prisma/generator-helper')

describe('generate', () => {
  describe('the whole dmmf is passed', () => {
    const outputPath = '.output.ts'

    afterEach(() => {
      if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath)
      }
    })

    it("Type definitions (Snapshot) of pgfy return values are generated according to Prisma's Schema", async () => {
      const dmmf = await getDMMF({ datamodel })
      await generate(dmmf, outputPath, '@prisma/client')
      const result = fs.readFileSync(outputPath, 'utf8')

      expect(result).toMatchSnapshot()
    })

    it('File is overwritten even if it exists and no exception is raised', async () => {
      const dmmf: DMMF.Document = {
        datamodel: { models: [], enums: [], types: [] },
        schema: {
          outputObjectTypes: { model: [], prisma: [] },
          inputObjectTypes: { prisma: [] },
          enumTypes: { prisma: [] },
        },
        mappings: { modelOperations: [], otherOperations: { read: [], write: [] } },
      }
      await generate(dmmf, outputPath, '@prisma/client')
      await generate(dmmf, outputPath, '@prisma/client')
    })
  })

  describe('only datamodel is passed', () => {
    const outputPath = '.output-datamodel.ts'

    afterEach(() => {
      if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath)
      }
    })
    it('generator returns the correct value', async () => {
      const dmmf = await getDMMF({ datamodel })
      await generate(
        {
          ...dmmf,
          schema: {
            inputObjectTypes: { prisma: [] },
            outputObjectTypes: { model: [], prisma: [] },
            enumTypes: { prisma: [] },
          },
        },
        outputPath,
        '@prisma/client',
      )
      const result = fs.readFileSync(outputPath, 'utf8')

      expect(result).toBe(`import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime";
import { PGTypes, PGBuilder } from "@prismagql/prismagql/lib/types/builder";
import { PGEnum, RequiredNonNullable } from "@prismagql/prismagql/lib/types/common";
import { PGObject, PGOutputField, PGOutputFieldOptionsDefault } from "@prismagql/prismagql/lib/types/output";
import { PGInputFactory, PGInputFactoryUnion } from "@prismagql/prismagql/lib/types/input-factory";
import { PGInputField } from "@prismagql/prismagql/lib/types/input";

type SomeEnumValuesType = ["AAA", "BBB", "CCC"];
type SomeEnum2ValuesType = ["Aaa", "Bbb", "Ccc"];
type SomeEnum3ValuesType = ["aaa", "bbb", "ccc"];
type Model1FieldMapType<Types extends PGTypes> = {
    id: PGOutputField<number, any, PGOutputFieldOptionsDefault, Types>;
    string: PGOutputField<string, any, PGOutputFieldOptionsDefault, Types>;
    json: PGOutputField<string, any, PGOutputFieldOptionsDefault, Types>;
    int: PGOutputField<number, any, PGOutputFieldOptionsDefault, Types>;
    float: PGOutputField<number, any, PGOutputFieldOptionsDefault, Types>;
    boolean: PGOutputField<boolean, any, PGOutputFieldOptionsDefault, Types>;
    bigInt: PGOutputField<bigint, any, PGOutputFieldOptionsDefault, Types>;
    dateTime: PGOutputField<Date, any, PGOutputFieldOptionsDefault, Types>;
    bytes: PGOutputField<Buffer, any, PGOutputFieldOptionsDefault, Types>;
    decimal: PGOutputField<Decimal, any, PGOutputFieldOptionsDefault, Types>;
    nullable: PGOutputField<string | null, any, PGOutputFieldOptionsDefault, Types>;
    list: PGOutputField<string[], any, PGOutputFieldOptionsDefault, Types>;
    enum: PGOutputField<PGEnum<SomeEnumValuesType>, any, PGOutputFieldOptionsDefault, Types>;
    enumList: PGOutputField<Array<PGEnum<SomeEnum2ValuesType>>, any, PGOutputFieldOptionsDefault, Types>;
    enumNullable: PGOutputField<PGEnum<SomeEnum3ValuesType> | null, any, PGOutputFieldOptionsDefault, Types>;
    oneToOne: PGOutputField<PGObject<Model2FieldMapType<Types>, { PrismaModelName: 'Model2' }, Types> | null, any, PGOutputFieldOptionsDefault, Types>;
    oneToMany: PGOutputField<Array<PGObject<Model3FieldMapType<Types>, { PrismaModelName: 'Model3' }, Types>>, any, PGOutputFieldOptionsDefault, Types>;
};
type Model2FieldMapType<Types extends PGTypes> = {
    id: PGOutputField<number, any, PGOutputFieldOptionsDefault, Types>;
    model1: PGOutputField<PGObject<Model1FieldMapType<Types>, { PrismaModelName: 'Model1' }, Types>, any, PGOutputFieldOptionsDefault, Types>;
    model1Id: PGOutputField<number, any, PGOutputFieldOptionsDefault, Types>;
};
type Model3FieldMapType<Types extends PGTypes> = {
    id: PGOutputField<number, any, PGOutputFieldOptionsDefault, Types>;
    model1: PGOutputField<PGObject<Model1FieldMapType<Types>, { PrismaModelName: 'Model1' }, Types>, any, PGOutputFieldOptionsDefault, Types>;
    model1Id: PGOutputField<number, any, PGOutputFieldOptionsDefault, Types>;
};
type PGfyResponseEnums = {
    SomeEnum: PGEnum<SomeEnumValuesType>;
    SomeEnum2: PGEnum<SomeEnum2ValuesType>;
    SomeEnum3: PGEnum<SomeEnum3ValuesType>;
};
type PGfyResponseObjects<Types extends PGTypes> = {
    Model1: PGObject<Model1FieldMapType<Types>, { PrismaModelName: 'Model1' }, Types>;
    Model2: PGObject<Model2FieldMapType<Types>, { PrismaModelName: 'Model2' }, Types>;
    Model3: PGObject<Model3FieldMapType<Types>, { PrismaModelName: 'Model3' }, Types>;
};
type PGfyResponseModels = {
    Model1: RequiredNonNullable<Prisma.Model1FindManyArgs>;
    Model2: RequiredNonNullable<Prisma.Model2FindManyArgs>;
    Model3: RequiredNonNullable<Prisma.Model3FindManyArgs>;
};

interface Inputs<Types extends PGTypes> {
}

type PGfyResponse<T extends PGBuilder> = T extends PGBuilder<infer U>
    ? {
        enums: PGfyResponseEnums
        objects: PGfyResponseObjects<U>
        inputs: Inputs<U>
    }
    : any;

export interface PrismaGeneratedType {
    Args: PGfyResponseModels;
    PGfy: <T extends PGBuilder<any>>(
        builder: T,
        dmmf: DMMF.Document,
    ) => PGfyResponse<T>;
}
`)
    })
  })
  describe('only schema is passed', () => {
    let schema: DMMF.Schema
    const outputPath = '.output-factory.ts'
    beforeEach(() => {
      schema = {
        inputObjectTypes: {
          prisma: [
            {
              name: 'Input1',
              constraints: {
                maxNumFields: 1,
                minNumFields: 0,
              },
              fields: [
                {
                  name: 'field1',
                  isRequired: true,
                  isNullable: false,
                  inputTypes: [
                    {
                      type: 'Enum2',
                      namespace: 'prisma',
                      location: 'enumTypes',
                      isList: false,
                    },
                  ],
                },
                {
                  name: 'field2',
                  isRequired: false,
                  isNullable: false,
                  inputTypes: [
                    {
                      type: 'Enum3',
                      namespace: 'prisma',
                      location: 'enumTypes',
                      isList: false,
                    },
                  ],
                },
                {
                  name: 'recursiveField',
                  isRequired: false,
                  isNullable: false,
                  inputTypes: [
                    {
                      type: 'Input1',
                      namespace: 'prisma',
                      location: 'inputObjectTypes',
                      isList: false,
                    },
                  ],
                },
              ],
            },
            {
              name: 'Input2',
              constraints: {
                maxNumFields: 1,
                minNumFields: 1,
              },
              fields: [
                {
                  name: 'field1',
                  isRequired: false,
                  isNullable: true,
                  inputTypes: [
                    {
                      type: 'BigInt',
                      location: 'scalar',
                      isList: false,
                    },
                  ],
                },
                {
                  name: 'circularField',
                  isRequired: false,
                  isNullable: false,
                  inputTypes: [
                    {
                      type: 'Input3',
                      namespace: 'prisma',
                      location: 'inputObjectTypes',
                      isList: false,
                    },
                  ],
                },
              ],
            },
            {
              name: 'Input3',
              constraints: {
                maxNumFields: 1,
                minNumFields: 0,
              },
              fields: [
                {
                  name: 'field1',
                  isRequired: false,
                  isNullable: false,
                  inputTypes: [
                    {
                      type: 'Enum2',
                      namespace: 'prisma',
                      location: 'enumTypes',
                      isList: false,
                    },
                  ],
                },
                {
                  name: 'circularField',
                  isRequired: true,
                  isNullable: false,
                  inputTypes: [
                    {
                      type: 'Input2',
                      namespace: 'prisma',
                      location: 'inputObjectTypes',
                      isList: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
        outputObjectTypes: {
          prisma: [
            {
              name: 'Query',
              fields: [
                {
                  name: 'findFirstSomeModel',
                  args: [
                    {
                      name: 'args1',
                      isRequired: false,
                      isNullable: false,
                      inputTypes: [
                        {
                          type: 'Input1',
                          namespace: 'prisma',
                          location: 'inputObjectTypes',
                          isList: true,
                        },
                        {
                          type: 'Input1',
                          namespace: 'prisma',
                          location: 'inputObjectTypes',
                          isList: false,
                        },
                      ],
                    },
                    {
                      name: 'args2',
                      isRequired: false,
                      isNullable: true,
                      inputTypes: [
                        {
                          type: 'Input2',
                          namespace: 'prisma',
                          location: 'inputObjectTypes',
                          isList: false,
                        },
                      ],
                    },
                    {
                      name: 'args3',
                      isRequired: true,
                      isNullable: false,
                      inputTypes: [
                        {
                          type: 'Int',
                          location: 'scalar',
                          isList: false,
                        },
                      ],
                    },
                    {
                      name: 'args4',
                      isRequired: false,
                      isNullable: false,
                      inputTypes: [
                        {
                          type: 'Enum1',
                          namespace: 'prisma',
                          location: 'enumTypes',
                          isList: true,
                        },
                      ],
                    },
                  ],
                  isNullable: true,
                  outputType: {
                    type: 'SomeModel',
                    namespace: 'model',
                    location: 'outputObjectTypes',
                    isList: false,
                  },
                },
              ],
            },
          ],
          model: [],
        },
        enumTypes: {
          prisma: [
            {
              name: 'Enum1',
              values: ['id', 'name', 'income', 'role'],
            },
            {
              name: 'Enum2',
              values: ['asc', 'desc'],
            },
          ],
          model: [
            {
              name: 'Enum3',
              values: ['AAA', 'BBB'],
            },
          ],
        },
      }
    })
    afterEach(() => {
      if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath)
      }
    })
    it('generator returns the correct value', async () => {
      const dmmf: DMMF.Document = {
        schema,
        datamodel: {
          models: [],
          enums: [],
          types: [],
        },
        mappings: {
          modelOperations: [],
          otherOperations: {
            read: [],
            write: [],
          },
        },
      }
      await generate(dmmf, outputPath, '@prisma/client')
      const result = fs.readFileSync(outputPath, 'utf8')
      expect(result).toEqual(`import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime";
import { PGTypes, PGBuilder } from "@prismagql/prismagql/lib/types/builder";
import { PGEnum, RequiredNonNullable } from "@prismagql/prismagql/lib/types/common";
import { PGObject, PGOutputField, PGOutputFieldOptionsDefault } from "@prismagql/prismagql/lib/types/output";
import { PGInputFactory, PGInputFactoryUnion } from "@prismagql/prismagql/lib/types/input-factory";
import { PGInputField } from "@prismagql/prismagql/lib/types/input";

type PGfyResponseEnums = {};
type PGfyResponseObjects<Types extends PGTypes> = {};
type PGfyResponseModels = {};
type Enum1Factory = PGEnum<['id', 'name', 'income', 'role']>;
type Enum2Factory = PGEnum<['asc', 'desc']>;
type Enum3Factory = PGEnum<['AAA', 'BBB']>;
type FindFirstSomeModelFactory<Types extends PGTypes> = {
    args1: PGInputFactoryUnion<{
        __default: () => PGInputFactory<Array<Input1Factory<Types>> | undefined, Types>,
        Input1List: () => PGInputFactory<Array<Input1Factory<Types>> | undefined, Types>,
        Input1: () => PGInputFactory<Input1Factory<Types> | undefined, Types>
    }>;
    args2: () => PGInputFactory<Input2Factory<Types> | null | undefined, Types>;
    args3: PGInputField<number, 'int', Types>;
    args4: PGInputField<Enum1Factory[] | undefined, 'enum', Types>;
};
type Input1Factory<Types extends PGTypes> = {
    field1: PGInputField<Enum2Factory, 'enum', Types>;
    field2: PGInputField<Enum3Factory | undefined, 'enum', Types>;
    recursiveField: () => PGInputFactory<Input1Factory<Types> | undefined, Types>;
};
type Input2Factory<Types extends PGTypes> = {
    field1: PGInputField<bigint | null | undefined, 'bigInt', Types>;
    circularField: () => PGInputFactory<Input3Factory<Types> | undefined, Types>;
};
type Input3Factory<Types extends PGTypes> = {
    field1: PGInputField<Enum2Factory | undefined, 'enum', Types>;
    circularField: () => PGInputFactory<Input2Factory<Types>, Types>;
};

interface Inputs<Types extends PGTypes> {
    findFirstSomeModel: PGInputFactory<FindFirstSomeModelFactory<Types>, Types>;
}

type PGfyResponse<T extends PGBuilder> = T extends PGBuilder<infer U>
    ? {
        enums: PGfyResponseEnums
        objects: PGfyResponseObjects<U>
        inputs: Inputs<U>
    }
    : any;

export interface PrismaGeneratedType {
    Args: PGfyResponseModels;
    PGfy: <T extends PGBuilder<any>>(
        builder: T,
        dmmf: DMMF.Document,
    ) => PGfyResponse<T>;
}
`)
    })
  })
})

describe('getInputsTypeProperty', () => {
  describe('inputObjectTypes', () => {
    it('returns PGInputFactory of type inputTypes', () => {
      const args: DMMF.SchemaArg = {
        name: 'arg',
        isRequired: false,
        isNullable: true,
        inputTypes: [
          {
            type: 'Input',
            namespace: 'prisma',
            location: 'inputObjectTypes',
            isList: false,
          },
        ],
      }
      const result = getInputsTypeProperty(args)
      expect(result).toEqual(
        '() => PGInputFactory<InputFactory<Types> | null | undefined, Types>',
      )
    })
  })
  describe('Array of inputObjectTypes', () => {
    it('returns PGInputFactoryUnion & PGInputFactory of type inputTypes', () => {
      const args: DMMF.SchemaArg = {
        name: 'arg',
        isRequired: true,
        isNullable: false,
        inputTypes: [
          {
            type: 'Input',
            namespace: 'prisma',
            location: 'inputObjectTypes',
            isList: true,
          },
          {
            type: 'Input',
            namespace: 'prisma',
            location: 'inputObjectTypes',
            isList: false,
          },
        ],
      }
      const result = getInputsTypeProperty(args)
      expect(result).toEqual(`PGInputFactoryUnion<{
__default: () => PGInputFactory<Array<InputFactory<Types>>, Types>,
InputList: () => PGInputFactory<Array<InputFactory<Types>>, Types>,
Input: () => PGInputFactory<InputFactory<Types>, Types>
}>`)
    })
  })
  describe('scalar', () => {
    it('returns PGInputFactory of type scalar', () => {
      const args: DMMF.SchemaArg = {
        name: 'arg',
        isRequired: true,
        isNullable: true,
        inputTypes: [
          {
            type: 'Int',
            location: 'scalar',
            isList: false,
          },
        ],
      }
      const result = getInputsTypeProperty(args)
      expect(result).toEqual(`PGInputField<number | null, 'int', Types>`)
    })
  })
  describe('enumTypes', () => {
    it('returns PGInputFactory of type enum', () => {
      const args: DMMF.SchemaArg = {
        name: 'arg',
        isRequired: false,
        isNullable: false,
        inputTypes: [
          {
            type: 'Enum',
            namespace: 'prisma',
            location: 'enumTypes',
            isList: true,
          },
        ],
      }
      const result = getInputsTypeProperty(args)
      expect(result).toEqual(`PGInputField<EnumFactory[] | undefined, 'enum', Types>`)
    })
  })
})
describe('shapeInputs', () => {
  it('returns the factories in the form used by generator method', () => {
    const args: DMMF.SchemaArg[] = [
      {
        name: 'arg1',
        isRequired: false,
        isNullable: false,
        inputTypes: [
          {
            type: 'Input1',
            namespace: 'prisma',
            location: 'inputObjectTypes',
            isList: false,
          },
        ],
      },
      {
        name: 'arg2',
        isRequired: false,
        isNullable: false,
        inputTypes: [
          {
            type: 'Input2',
            namespace: 'prisma',
            location: 'inputObjectTypes',
            isList: true,
          },
          {
            type: 'Input2',
            namespace: 'prisma',
            location: 'inputObjectTypes',
            isList: false,
          },
        ],
      },
      {
        name: 'arg3',
        isRequired: false,
        isNullable: false,
        inputTypes: [
          {
            type: 'Int',
            location: 'scalar',
            isList: false,
          },
        ],
      },
    ]

    const result = shapeInputs('findFirstSomeModel', args)
    expect(result).toEqual({
      name: 'FindFirstSomeModelFactory',
      type: [
        {
          name: 'arg1',
          type: '() => PGInputFactory<Input1Factory<Types> | undefined, Types>',
        },
        {
          name: 'arg2',
          type: `PGInputFactoryUnion<{
__default: () => PGInputFactory<Array<Input2Factory<Types>> | undefined, Types>,
Input2List: () => PGInputFactory<Array<Input2Factory<Types>> | undefined, Types>,
Input2: () => PGInputFactory<Input2Factory<Types> | undefined, Types>
}>`,
        },
        {
          name: 'arg3',
          type: "PGInputField<number | undefined, 'int', Types>",
        },
      ],
      inputTypes: ['Input1Factory', 'Input2Factory'],
    })
  })
})
describe('getFactories', () => {
  it('returns all factories, including recursion, in the form used by generator method', async () => {
    const schema: DMMF.Schema = {
      inputObjectTypes: {
        prisma: [
          {
            name: 'Input1',
            constraints: {
              maxNumFields: 1,
              minNumFields: 0,
            },
            fields: [
              {
                name: 'field1',
                isRequired: true,
                isNullable: false,
                inputTypes: [
                  {
                    type: 'Enum1',
                    namespace: 'prisma',
                    location: 'enumTypes',
                    isList: false,
                  },
                ],
              },
            ],
          },
        ],
      },
      outputObjectTypes: {
        prisma: [
          {
            name: 'Query',
            fields: [
              {
                name: 'findFirstSomeModel',
                args: [
                  {
                    name: 'args1',
                    isRequired: false,
                    isNullable: true,
                    inputTypes: [
                      {
                        type: 'Input1',
                        namespace: 'prisma',
                        location: 'inputObjectTypes',
                        isList: false,
                      },
                    ],
                  },
                  {
                    name: 'args2',
                    isRequired: true,
                    isNullable: false,
                    inputTypes: [
                      {
                        type: 'Enum2',
                        namespace: 'prisma',
                        location: 'enumTypes',
                        isList: false,
                      },
                    ],
                  },
                ],
                isNullable: true,
                outputType: {
                  type: 'SomeModel',
                  namespace: 'model',
                  location: 'outputObjectTypes',
                  isList: false,
                },
              },
            ],
          },
        ],
        model: [],
      },
      enumTypes: {
        prisma: [
          {
            name: 'Enum1',
            values: ['asc', 'desc'],
          },
        ],
        model: [
          {
            name: 'Enum2',
            values: ['AAA', 'BBB'],
          },
        ],
      },
    }
    const result = getInputFactories(schema)
    expect(result).toEqual([
      {
        name: 'FindFirstSomeModelFactory',
        type: [
          {
            name: 'args1',
            type: '() => PGInputFactory<Input1Factory<Types> | null | undefined, Types>',
          },
          {
            name: 'args2',
            type: "PGInputField<Enum2Factory, 'enum', Types>",
          },
        ],
        inputTypes: ['Input1Factory'],
      },
      {
        name: 'Input1Factory',
        type: [
          {
            name: 'field1',
            type: "PGInputField<Enum1Factory, 'enum', Types>",
          },
        ],
        inputTypes: [],
      },
    ])
  })
})

describe('getPrismaImportPath', () => {
  it('PrismaClientのoutput設定に従って適切なimportのpathが返る', () => {
    expect(getPrismaImportPath('/root/output.ts')).toEqual('@prisma/client')
    expect(
      getPrismaImportPath('/root/output.ts', '/root/node_modules/@prisma/client'),
    ).toEqual('@prisma/client')
    expect(getPrismaImportPath('/root/output.ts', '/root/prisma/client')).toEqual(
      '../prisma/client',
    )
  })
})
