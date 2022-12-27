#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib'
import { ProductsAppStack } from '../lib/productsAppStack';
import { ECommerceApiStack } from '../lib/ecommerceApiStack';
import { ProductsAppLayersStack } from '../lib/layers/productsAppLayersStack';
import { EventsDbStack } from '../lib/eventsDdbStack';
import { OrdersAppLayerStack } from '../lib/layers/ordersAppLayersStack';
import { OrdersAppStack } from '../lib/orderAppStack';



const app = new cdk.App();

// conta para deplopy dos recursos
const env: cdk.Environment = {
  account: '890908582945',
  region: 'us-east-1'
}

// tags de identificação que são opicionais
const tags = {
  cost: 'Ecommerce',
  team: 'Study'
}
 
const productsAppLayerStack =  new ProductsAppLayersStack(app, 'ProductsAppLayerStack', {
  tags: tags,
  env: env
})

const eventsDbStack = new EventsDbStack(app, "EventsDdb", {
  tags: tags,
  env: env
})

const productsAppStack = new ProductsAppStack(app, 'ProductsApp', {
  eventsDb: eventsDbStack.table,
  tags: tags,
  env: env
})

productsAppStack.addDependency(productsAppLayerStack)
productsAppStack.addDependency(eventsDbStack)


const ordersAppLayerStack = new OrdersAppLayerStack(app, "OrderLayerStack", {
  tags: tags,
  env: env
})

const orderStack = new OrdersAppStack(app, 'OrdersStack', {
  tags: tags,
  env: env,
  productDb: productsAppStack.productsDb
})

orderStack.addDependency(productsAppStack)
orderStack.addDependency(ordersAppLayerStack)

const ecommerceApiStack = new ECommerceApiStack(app, 'EcommerceApi', {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  ordersHandler: orderStack.ordersHandler,
  tags: tags,
  env: env
})

ecommerceApiStack.addDependency(productsAppStack)
ecommerceApiStack.addDependency(orderStack)