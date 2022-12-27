import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { v4 as uuid } from 'uuid';

export interface Product {
  id: string;
  productName: string;
  code: string;
  price: number;
  model: string;
  productUrl: string;
}

// cada instancia do dynamo deve ter seu proprio cliente
export class ProductsRepository {
  // esse é o clinete que da acesso ai dynamo
  // private ddbClient: DocumentClient
  // nome da tablea que vou acessar, vou recebre como parametro na execução da função
  // private productsDb: string

  constructor(private ddbClient: DocumentClient, private productsDb: string) { }

  async getAllProducts(): Promise<Product[]> {
    const data = await this.ddbClient.scan({
      TableName: this.productsDb
    }).promise()
    return data.Items as Product[]
  }

  async getProductById(productId: string): Promise<Product> {
    const data = await this.ddbClient.get({
      TableName: this.productsDb,
      Key: { id: productId }
    }).promise()

    if (!data.Item) {
      throw new Error('Product not found')
    }
    return data.Item as Product
  }

  async getProductsByIds(productIds: string[]): Promise<Product[]> {
    const keys: { id: string }[] = []

    productIds.forEach((productId) => {
      keys.push ({
        id: productId
      })
    })
    const data = await this.ddbClient.batchGet({
      RequestItems: {
        [this.productsDb]: {
          Keys: keys
        }
      }
    }).promise()
    return data.Responses![this.productsDb] as Product[]
  }

  async create(product: Product): Promise<Product> {
    product.id = uuid()
    await this.ddbClient.put({
      TableName: this.productsDb,
      Item: product
    }).promise()
    return product
  }

  async deleteProduct(productId: string): Promise<Product> {
    const data = await this.ddbClient.delete({
      TableName: this.productsDb,
      Key: {
        id: productId
      },
      ReturnValues: "ALL_OLD"
    }).promise()

    if (!data.Attributes) {
      throw new Error('Product not found')
    }

    return data.Attributes as Product
  }

  async updateProduct(productId: string, product: Product): Promise<Product> {
    const data = await this.ddbClient.update({
      TableName: this.productsDb,
      Key: { 
        id: productId
      },
      UpdateExpression: "set productName = :n, code = :c, price = :p, model = :m, productUrl = :u",
      ConditionExpression: "attribute_exists(id)",
      ReturnValues: "UPDATED_NEW",
      ExpressionAttributeValues: {
        ":n": product.productName,
        ":c": product.code,
        ":p": product.price,
        ":m": product.model,
        ":u": product.productUrl
      }
    }).promise()
    data.Attributes!.id = productId
    return data.Attributes as Product
  }
}
