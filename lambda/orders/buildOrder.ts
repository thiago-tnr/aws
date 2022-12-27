import { OrderProductResponse, OrderRequest } from '/opt/nodejs/ordersApiLayer';
import { Order } from '/opt/nodejs/ordersLayer';
import { Product } from '/opt/nodejs/productsLayer';

export function buildOrder(orderRequest: OrderRequest, products: Product[]): Order {
  const orderProducts: OrderProductResponse[] = [];
  let totalPrice = 0;
  console.log(products)
  products.forEach((product) => {
    totalPrice += product.price;
    orderProducts.push({
      code: product.code,
      price: product.price
    });
  });

  const order: Order = {
    pk: orderRequest.email,
    shipping: {
      type: orderRequest.shipping.type,
      carrier: orderRequest.shipping.carrier
    },
    billing: {
      payment: orderRequest.payment,
      totalPrice: totalPrice
    },
    products: orderProducts
  };

  return order;
}
