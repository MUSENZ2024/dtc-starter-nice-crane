import { Module } from "@medusajs/framework/utils";
import AbandonedCartModuleService from "./service";

export const ABANDONED_CART_MODULE = "abandonedCart";

export default Module(ABANDONED_CART_MODULE, {
  service: AbandonedCartModuleService,
});
