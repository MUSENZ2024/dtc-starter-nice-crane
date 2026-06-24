import { model } from "@medusajs/framework/utils"

const EmailTemplate = model.define("muse_email_template", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  name: model.text(),
  subject: model.text(),
  html: model.text(),
  enabled: model.boolean().default(true),
  delay_minutes: model.number().default(0),
})

export default EmailTemplate
