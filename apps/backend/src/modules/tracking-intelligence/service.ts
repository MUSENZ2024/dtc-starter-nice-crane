import { MedusaService } from "@medusajs/framework/utils";
import TrackingSample from "./models/tracking-sample";
import ActiveTracking from "./models/active-tracking";

class TrackingIntelligenceModuleService extends MedusaService({
  TrackingSample,
  ActiveTracking,
}) {}

export default TrackingIntelligenceModuleService;
