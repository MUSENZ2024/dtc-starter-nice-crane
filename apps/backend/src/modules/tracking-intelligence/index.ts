import { Module } from "@medusajs/framework/utils";
import TrackingIntelligenceModuleService from "./service";

export const TRACKING_INTELLIGENCE_MODULE = "trackingIntelligence";

export default Module(TRACKING_INTELLIGENCE_MODULE, {
  service: TrackingIntelligenceModuleService,
});
