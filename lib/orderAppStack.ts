import * as cdk from 'aws-cdk-lib'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamoDb from 'aws-cdk-lib/aws-dynamodb'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'

interface OrdersAppStackProps extends cdk.StackProps {
  productDb: dynamoDb.Table
}

export class OrdersAppStack extends cdk.Stack { 
  readonly ordersHandler : lambdaNodeJs.NodejsFunction
  constructor(scope: Construct, id: string, props: OrdersAppStackProps) {
      super(scope, id, props)

    const orderDb = new dynamoDb.Table(this, 'OrdersDb', {
      tableName: 'orders',
      partitionKey: {
        name: 'pk',
        type: dynamoDb.AttributeType.STRING
      },
      sortKey: {
        name: 'sk',
        type: dynamoDb.AttributeType.STRING
      },
      billingMode: dynamoDb.BillingMode.PROVISIONED,
      readCapacity:1,
      writeCapacity: 1
    })
    
    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductsLayerVersionArn")
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductsLayerVersionArn", productsLayerArn )

    const ordersLayerArn = ssm.StringParameter.valueForStringParameter(this, "OrdersLayerVersionArn")
    const ordersLayer = lambda.LayerVersion.fromLayerVersionArn(this, "OrdersLayerVersionArn", ordersLayerArn )
    
    const ordersApiLayerArn = ssm.StringParameter.valueForStringParameter(this, "OrdersApiLayerVersionArn")
    const ordersApiLayer = lambda.LayerVersion.fromLayerVersionArn(this, "OrdersApiLayerVersionArn", ordersApiLayerArn )

    this.ordersHandler = new lambdaNodeJs.NodejsFunction(this,'OrdersFunction', {
      functionName: "OrdersFunction",
        entry: "lambda/orders/ordersFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout:cdk.Duration.seconds(5),
        bundling: {
          minify: true,
          sourceMap: false
        },
        layers: [productsLayer, ordersLayer, ordersApiLayer],
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })

    orderDb.grantReadWriteData(this.ordersHandler)
    props.productDb.grantReadData(this.ordersHandler)
  }
}