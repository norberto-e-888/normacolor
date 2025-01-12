import { v4 as uuid } from "uuid";

export enum ToastType {
  OrderNotFound = "orderNotFound",
  Unauthorized = "unauthorized",
  InvalidOrderStatus = "invalidOrderStatus",
}

export const getToastUrlConfig = (
  type: ToastType,
  data: {
    orderStatus?: string;
  } = {}
) => {
  let config = `toast=${type}&toastId=${uuid()}`;

  if (data.orderStatus) {
    config += `&toastData_orderStatus=${data.orderStatus}`;
  }

  return config;
};
