import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as cdk from "aws-cdk-lib"
import * as dynamo from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import * as ssm from 'aws-cdk-lib/aws-ssm'

interface ProductsAppStackProps extends cdk.StackProps{
  eventsDb: dynamo.Table
}

export class ProductsAppStack extends cdk.Stack {

  //criação da stack da função lambda de pesquisa de produtos, aqui é feita a configuração do lambda
  
  //scope - é onde a minha stack está inserida
  //id- é o nome da stack em si
  //props - são as propriedades que eu posso colocar, que posso definir para stack

  //atributo de classe que vai representar a primeira função lambda
  //handler é usado por padrão, pois o metodo em si que é chamado para invocar a função se chama handle
  readonly productsFetchHandler: lambdaNodejs.NodejsFunction
  readonly productsAdminHandler: lambdaNodejs.NodejsFunction
  readonly productsDb: dynamo.Table

  constructor(scope:Construct, id:string, props: ProductsAppStackProps) {
    super(scope, id, props) //aqui eu chamo o construtor pai com os dados que eu vou receber no construtor ao invocar a minha classe

    this.productsDb = new dynamo.Table(this, "ProductDdb", {
      tableName: 'products',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'id',
        type: dynamo.AttributeType.STRING
      },
      billingMode: dynamo.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1
    })

    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductsLayerVersionArn")
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductsLayerVersionArn", productsLayerArn )

    const productsEventsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductsEventsLayerVersionArn")
    const productsEventsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductsEventsLayerVersionArn", productsEventsLayerArn )

    this.productsFetchHandler = new lambdaNodejs.NodejsFunction(this, "ProductsFetchFunction", {
        functionName: "ProductsFetchFunction",
        entry: "lambda/products/productsFetchFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout:cdk.Duration.seconds(5),
        bundling: {
          minify: true,
          sourceMap: false
        },
        layers: [productsLayer],
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })

    this.productsDb.grantReadData(this.productsFetchHandler)

    const productEventsHandler = new lambdaNodejs.NodejsFunction(this, 'ProductEventsFunctions', {
      functionName: 'ProductEventsFunctions',
      entry: 'lambda/products/productEventsFunctions.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(2),
      bundling: {
        minify: true,
        sourceMap: false
      },
      environment: {
        EVENTS_DDB: props.eventsDb.tableName
      },
      layers: [productsEventsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })

    props.eventsDb.grantWriteData(productEventsHandler)

    this.productsAdminHandler = new lambdaNodejs.NodejsFunction(this, 'ProductsAdminFunction', {
      functionName: 'ProductsAdminFunction',
      entry: 'lambda/products/productsAdminFunction.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: false
      },
      environment: {
        PRODUCTS_DDB: this.productsDb.tableName,
        PRODUCT_EVENTS_FUNCTION_NAME: productEventsHandler.functionName
      },
      layers: [productsLayer, productsEventsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })

    this.productsDb.grantWriteData(this.productsAdminHandler)
    productEventsHandler.grantInvoke(this.productsAdminHandler)
  }
}


