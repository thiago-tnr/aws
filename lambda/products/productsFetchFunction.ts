import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { badRequest, notFoundData, success } from '../../helpers/http-helpers';
import { ProductsRepository } from '/opt/nodejs/productsLayer';
import * as AWSXRay from "aws-xray-sdk";

AWSXRay.captureAWS(require("aws-sdk"))

const productDb = "products"
const ddbCliente = new DynamoDB.DocumentClient()

const productRepository = new ProductsRepository(ddbCliente, productDb)
////aqui o nome é handler por que na stack de consiguração eu coloquei o meu handler como handler, mais pode ser qualquer nome
//quando ao apigateway invoca a funcao ele passa alguns parametros, que são o proxyevent e o contexto
//o contexto é da propria lambda que mostra quando e de que forma a minha função lambda é invocada
//
export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

  //numero de indentificacao unico da requisao da funcao lambda
  const lambdaRequestId = context.awsRequestId

  //numero de indentificacao unico da requisao do evento que dispara a função, que vem pelo apigateway
  const apiRequestId = event.requestContext.requestId

  //esses logs vão aparecer no cloudwatch da AWS
  console.log(`API Gateway RequestId: ${apiRequestId}`)
  console.log(`Lambda RequestId: ${lambdaRequestId}`)

  const method = event.httpMethod
  const endpoint = event.resource

  if (endpoint === '/products') {
    if (method === 'GET') {
      console.log('GET - /products');
      const products = await productRepository.getAllProducts()
      return success(products)
    }
  } else if (endpoint === '/products/{id}') {
    if (method === 'GET') {
      const productId = event.pathParameters!.id as string

      try {
        const products = await productRepository.getProductById(productId)
        console.log(`GET products/${productId}`);

        return success(products)
      } catch (error) {
        console.error((<Error>error).message)
        return notFoundData(((<Error>error).message).toString())
      }
    }
  }
  return badRequest('Bad Request')
}
