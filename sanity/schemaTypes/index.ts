import { type SchemaTypeDefinition } from 'sanity'

import { customerType } from './customerType'
import { categoryType } from './categoryType'
import { orderType } from './orderType'
import { productType } from './productType'
import { modelType } from './modelType'
import { brandType } from './brandType'
import { conditionType } from './conditionType'
import { pendingCryptoOrderType } from './pendingCryptoOrderType'
import { notifyMeType } from './notifyMeType'
import { referralType, referralClickType } from './referralType'
import { negotiationSessionType } from './negotiationSessionType'

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
    notifyMeType,
    referralType,
    referralClickType,
    negotiationSessionType,
  ],
}