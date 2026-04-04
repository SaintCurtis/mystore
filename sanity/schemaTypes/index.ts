import { type SchemaTypeDefinition } from 'sanity'

import { customerType } from './customerType'
import { categoryType } from './categoryType'
import { orderType } from './orderType'
import { productType } from './productType'
import { modelType } from './modelType'
import { brandType } from './brandType'
import { conditionType } from './conditionType'
import { pendingCryptoOrderType } from './pendingCryptoOrderType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    customerType,
    categoryType,
    productType,
    orderType,
    conditionType,
    brandType,
    modelType,
    pendingCryptoOrderType,
  ],
}