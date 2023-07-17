import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });


  it("should update a order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("853", "Jorge");
    const address = new Address("Rua Santa", 1, "91172321", "Engenopolis");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("777", "Sushi", 30);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      3
    );

    const orderRepository = new OrderRepository();
    const order = new Order("1", customer.id, [orderItem]);
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "1",
      customer_id: "853",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "1",
          product_id: "777",
        },
      ],
    });

    // order2 update
    const product2 = new Product("111", "Soup", 20);
    await productRepository.create(product2);

    const orderItem2 = new OrderItem(
      "2",
      product2.name,
      product2.price,
      product2.id,
      2
    );

    order.changeItems([orderItem2]);

    await orderRepository.update(order);

    const orderModel2 = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel2.toJSON()).toStrictEqual({
      id: "1",
      customer_id: "853",
      total: order.total(),
      items: [
        {
          id: orderItem2.id,
          name: orderItem2.name,
          price: orderItem2.price,
          quantity: orderItem2.quantity,
          order_id: "1",
          product_id: "111",
        },
      ],
    });
  });

  it("should find a order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("152", "Pedro");
    const address = new Address("Aranha 1", 1, "911231", "Porto Seguro");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("1", "Sushi", 10);
    await productRepository.create(product);

    const ordemItem = new OrderItem(
      "3",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("5", customer.id, [ordemItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);   

    const orderResult = await orderRepository.find(order.id);

    expect(order).toStrictEqual(orderResult);
  });

  it("should find all orders", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Pedro Sampaio");
    const address = new Address("Novo 1", 1, "213123", "Aratinga");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("5", "Massa", 1);
    await productRepository.create(product);

    const ordemItem = new OrderItem(
      "8",
      product.name,
      product.price,
      product.id,
      1
    );

    const order = new Order("6", customer.id, [ordemItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);   

    // order2
    const customer2 = new Customer("3122", "Mara");
    const address2 = new Address("Aranguera", 1, "1232312", "Capitu");
    customer2.changeAddress(address2);
    await customerRepository.create(customer2);

    const product2 = new Product("3", "LongNeck", 1);
    await productRepository.create(product2);

    const ordemItem2 = new OrderItem(
      "7",
      product.name,
      product.price,
      product.id,
      3
    );

    const order2 = new Order("7", customer2.id, [ordemItem2]);
    await orderRepository.create(order2);     

    const orderResult = await orderRepository.findAll();

    expect(orderResult).toHaveLength(2);
    expect(orderResult).toContainEqual(order);
    expect(orderResult).toContainEqual(order2);
  });

});
