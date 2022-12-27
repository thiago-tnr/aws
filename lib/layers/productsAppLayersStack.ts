import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as ssm from 'aws-cdk-lib/aws-ssm'

export class ProductsAppLayersStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps){
    super(scope, id, props)
//local onde meu layer será armazenado - code
    const productsLayers = new lambda.LayerVersion(this, "ProductsLayer", {
      code: lambda.Code.fromAsset('lambda/products/layers/productsLayer'),
      layerVersionName: 'ProductsLayer',
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })
    //
    new ssm.StringParameter(this, "ProductsLayerVersionArn", {
      parameterName: 'ProductsLayerVersionArn',
      stringValue: productsLayers.layerVersionArn
    })

    const productsEventsLayers = new lambda.LayerVersion(this, "ProductsEventsLayer", {
      code: lambda.Code.fromAsset('lambda/products/layers/productsEventsLayer'),
      layerVersionName: 'ProductsEventsLayer',
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })
    //
    new ssm.StringParameter(this, "ProductsEventsLayerVersionArn", {
      parameterName: 'ProductsEventsLayerVersionArn',
      stringValue: productsEventsLayers.layerVersionArn
    })
  }
}