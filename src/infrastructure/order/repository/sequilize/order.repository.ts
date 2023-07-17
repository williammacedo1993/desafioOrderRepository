import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    const sequelize = OrderModel.sequelize;
    await sequelize.transaction(async (t) => {
      await OrderItemModel.destroy({
        where: { order_id: entity.id },
        transaction: t,
      });
      const items = entity.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity,
        order_id: entity.id,
      }));
      await OrderItemModel.bulkCreate(items, { transaction: t });
      await OrderModel.update(
        { total: entity.total() },
        { where: { id: entity.id }, transaction: t }
      );
    });
  }

  async find(id: string): Promise<Order> {
    let orderModel;
    try {
      orderModel = await OrderModel.findOne({
        where: {
          id,
        },
        rejectOnEmpty: true,
        include: [OrderItemModel]
      });
    } catch (error) {
      throw new Error("Order not found");
    }

    const orderItems = orderModel.items.map((orderItems) => {
      return new OrderItem(orderItems.id, orderItems.name, orderItems.price, orderItems.product_id, orderItems.quantity);
    });

    const order = new Order(id, orderModel.customer_id, orderItems);
   
    return order;
  }

  async findAll(): Promise<Order[]> {
    try {
      const orderModels = await OrderModel.findAll({
          include: [OrderItemModel],
      });
      const orders = orderModels.map((orderModels) => {
      const orderItems = orderModels.items.map((orderItems) => {
        return new OrderItem(orderItems.id, orderItems.name, orderItems.price, orderItems.product_id, orderItems.quantity);
      });
      
      return new Order(orderModels.id, orderModels.customer_id, orderItems);
    });

    return orders;

    } catch (error) {
      throw new Error("Error retrieving all orders");
    }
  }
  
}
