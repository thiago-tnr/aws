import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs"
import * as cdk from "aws-cdk-lib"
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as cwlogs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

interface ECommerceApiStackProps extends cdk.StackProps {
  productsFetchHandler: lambdaNodejs.NodejsFunction
  productsAdminHandler: lambdaNodejs.NodejsFunction
  ordersHandler: lambdaNodejs.NodejsFunction
}

export class ECommerceApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ECommerceApiStackProps) {
    super(scope, id, props)

    const logGroup = new cwlogs.LogGroup(this, 'EcommerceApiLogs')
    const api = new apigateway.RestApi(this,'EcommerceApi', {
      restApiName: 'EcommerceApi',
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true
        })
      }
    })
    this.createProductsService(props, api)
    this.createOrdersService(props, api)
  }

  private createProductsService(props: ECommerceApiStackProps, api: apigateway.RestApi) {
    const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler)
    const productsAdminIntegration = new apigateway.LambdaIntegration(props.productsAdminHandler)

    const productsResource = api.root.addResource("products")
    const productIdResource = productsResource.addResource("{id}")
    // GET "/products"    
    productsResource.addMethod('GET', productsFetchIntegration)
    // GET "products/{id}"
    productIdResource.addMethod('GET', productsFetchIntegration)

    // POST / products
    productsResource.addMethod('POST', productsAdminIntegration)

    // PUt /products/{id}
    productIdResource.addMethod('PUT', productsAdminIntegration)

    // DEL /products/{id}
    productIdResource.addMethod('DELETE', productsAdminIntegration)
  }

  private createOrdersService(props: ECommerceApiStackProps, api: apigateway.RestApi) {
    const orderIntegration = new apigateway.LambdaIntegration(props.ordersHandler)

    const ordersResource = api.root.addResource('orders')

    ordersResource.addMethod("GET", orderIntegration)
    ordersResource.addMethod("POST", orderIntegration)

    const orderDeleteValidator = new apigateway.RequestValidator(this, "OrderDeletionValidator", {
      restApi: api,
      requestValidatorName: "OrderDeleteValidator",
      validateRequestParameters: true
    })

    ordersResource.addMethod("DELETE", orderIntegration, {
      requestParameters: {
        'method.request.querystring.email': true,
        'method.request.querystring.orderId': true
      }, 
      requestValidator: orderDeleteValidator
    })
  }
}