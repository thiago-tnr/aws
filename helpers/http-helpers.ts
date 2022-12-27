import { Product } from 'aws-cdk-lib/aws-servicecatalog'
import { APIGatewayProxyResult } from 'aws-lambda'


export const badRequest = (message: string): APIGatewayProxyResult => {
  return {
    statusCode: 400,
    body: message
  }
}

export const success = (message: any): APIGatewayProxyResult => {
  return {
    statusCode: 200,
    body: JSON.stringify(message)
  }
}

export const ceatedWithSuccsess = (message: any): APIGatewayProxyResult => {
  return {
    statusCode: 201,
    body: JSON.stringify(message)
  }
}



export const notFoundData = (message: any): APIGatewayProxyResult => {
  return {
    statusCode: 404,
    body: JSON.stringify(message)
  }
}
