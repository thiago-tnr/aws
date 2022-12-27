import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { APIGateway, DynamoDB } from 'aws-sdk'
import { badRequest, notFoundData, success } from 'helpers/http-helpers'
import { buildOrder } from './buildOrder'
import { converterToOrderResponse } from './converterToOrderResponse'
import { OrderRequest } from '/opt/nodejs/ordersApiLayer'
import { ORderRepository } from '/opt/nodejs/ordersLayer'
import { ProductsRepository } from '/opt/nodejs/productsLayer'

const orderDb = "orders"
const productsDb = "productsDb"

const dbClient = new DynamoDB.DocumentClient()

const orderRepository = new ORderRepository(dbClient, orderDb)
const productRepository = new ProductsRepository(dbClient, productsDb)

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod
  const apiRequestId = event.requestContext.requestId
  const lambdaRequestId = context.awsRequestId

  if (method === 'GET') {
    if (event.queryStringParameters) {
      const email = event.queryStringParameters!.email
      const orderId = event.queryStringParameters!.orderId
      if (email) {
        if (orderId) {
          try {
            const orders = await orderRepository.getOrder(email, orderId)
            return success(converterToOrderResponse(orders))
          } catch (error) {
            console.log((<Error>error).message)
            return notFoundData((<Error>error).message)
          } 
        } else {
          const ordersByEmail = await orderRepository.getOrdersByEmail(email)
          return success(ordersByEmail.map(converterToOrderResponse))
        }
      }
    } else {
      const orders = await orderRepository.getAllOrders()
      return success(orders.map(converterToOrderResponse))
    }

  } else if (method === 'POST') {
    console.log('POST /orders')
    const orderRequest = JSON.parse(event.body!) as OrderRequest
    const products = await productRepository.getProductsByIds(orderRequest.productsIds)
    if (products.length === orderRequest.productsIds.length) {
      const order = buildOrder(orderRequest, products)
      const orderCreated = await orderRepository.createOrder(order)
      const response = converterToOrderResponse(orderCreated)

      return success(response)
    } else {
      return notFoundData("Some product was not found")
    }
  } else if (method === 'DELETE') {
    console.log('DELETE /orders')
    const email = event.queryStringParameters!.email!
    const orderId = event.queryStringParameters!.orderId!
    try {
    const orderDeleted = await orderRepository.deleteOrder(email, orderId)
    return success(orderDeleted)
    } catch(error) {
      console.log((<Error>error).message)
      return notFoundData((<Error>error).message)
    }
  }

  return badRequest('Bad Request')
}


