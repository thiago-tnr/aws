
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { DynamoDB, Lambda } from 'aws-sdk'
import { badRequest, ceatedWithSuccsess, notFoundData, success } from '../../helpers/http-helpers'
import { Product, ProductsRepository } from '/opt/nodejs/productsLayer'
import * as AWSXRay from "aws-xray-sdk";
import { ProductEvent, ProductEventType } from '/opt/nodejs/productsEventsLayer';

AWSXRay.captureAWS(require("aws-sdk"))

const productDb = "products"
const productEventsFunctionName = "ProductEventsFunctions"
const lambdaClient = new Lambda()
const ddbCliente = new DynamoDB.DocumentClient()
const productRepository = new ProductsRepository(ddbCliente, productDb)

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

  const lambdaRequestId = context.awsRequestId
  const apiRequestId = event.requestContext.requestId

  console.log(`API Gateway RequestId: ${apiRequestId}`)
  console.log(`Lambda RequestId: ${lambdaRequestId}`)

  const method = event.httpMethod
  const endpoint = event.resource

  if (endpoint === '/products') {
    if (method === 'POST') {
      console.log('POST /products');

      const product = JSON.parse(event.body!) as Product
      const productCreated = await productRepository.create(product)
      const response = await sendProductEvent(productCreated, ProductEventType.CREATED, 'tnr.rocha@gmail.com', lambdaRequestId)
      console.log(response);

      return ceatedWithSuccsess(productCreated)
    }
  } else if (endpoint === '/products/{id}') {
    const productId = event.pathParameters!.id as string
    if (method === 'PUT') {
      console.log(`PUT /products/${productId}`);
      try {
        const product = JSON.parse(event.body!) as Product
        const productUpdated = await productRepository.updateProduct(productId, product)

        const response = await sendProductEvent(productUpdated, ProductEventType.UPDATED, 'tnr.rocha@gmail.com', lambdaRequestId)
        console.log(response);

        return success(productUpdated)
      } catch (error) {
        return notFoundData('Product not found')
      }

    }

    if (method === 'DELETE') {
      console.log(`DELETE /products/${productId}`);
      try {
        const deletedProduct = await productRepository.deleteProduct(productId)
        const response = await sendProductEvent(deletedProduct, ProductEventType.DELETED, 'tnr.rocha@gmail.com', lambdaRequestId)
        console.log(response);
        return success(deletedProduct)
      } catch (error) {
        console.error((<Error>error).message)
        return notFoundData(((<Error>error).message).toString())
      }
    }
  }
  return badRequest('Bad request')
}

function sendProductEvent(product: Product, eventType: ProductEventType, email: string, lambdaRequestId: string) {
  const event: ProductEvent = {
    email: email,
    eventType: eventType,
    productCode: product.code,
    productId: product.id,
    productPrice: product.price.toString(),
    requestId: lambdaRequestId
  }

  return lambdaClient.invoke({
    FunctionName: productEventsFunctionName,
    Payload: JSON.stringify(event),
    InvocationType: "Event"
  }).promise()
} 