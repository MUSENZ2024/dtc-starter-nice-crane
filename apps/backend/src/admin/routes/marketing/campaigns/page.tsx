import { Badge, Button, Container, Heading, Switch, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { sdk } from "../../../lib/sdk"

const CampaignsPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<any>({ queryKey: ["marketing-campaigns"], queryFn: () => sdk.client.fetch("/admin/marketing/campaigns") })
  const { data: control } = useQuery<any>({ queryKey: ["marketing-control"], queryFn: () => sdk.client.fetch("/admin/marketing/control") })
  const pause = useMutation({ mutationFn: (global_pause: boolean) => sdk.client.fetch("/admin/marketing/control", { method: "POST", body: { global_pause } }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["marketing-control"] }); toast.success("Marketing send control updated") } })
  return <Container><div className="flex flex-col gap-4 px-6 py-4">
    <div className="flex items-start justify-between"><div><Heading>Campaigns</Heading><Text size="small" className="text-ui-fg-subtle">Structured campaigns with materialised audiences and send safeguards.</Text></div><div className="flex gap-2"><Link to="/marketing/segments"><Button size="small" variant="secondary">Segments</Button></Link><Link to="/marketing/campaigns/new"><Button size="small">Create campaign</Button></Link></div></div>
    <div className="flex items-center justify-between rounded-lg border p-4"><div><Text weight="plus">Global marketing pause</Text><Text size="small" className="text-ui-fg-subtle">Stops the campaign dispatcher without affecting transactional mail.</Text></div><Switch checked={Boolean(control?.control?.global_pause)} onCheckedChange={(value) => pause.mutate(value)} /></div>
    {isLoading ? <Text>Loading campaigns…</Text> : <Table><Table.Header><Table.Row><Table.HeaderCell>Campaign</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell><Table.HeaderCell>Audience</Table.HeaderCell><Table.HeaderCell>Sent</Table.HeaderCell><Table.HeaderCell>Clicks</Table.HeaderCell><Table.HeaderCell>Scheduled (Auckland)</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{(data?.campaigns || []).map((campaign:any) => <Table.Row key={campaign.id}><Table.Cell><Link className="text-ui-fg-interactive hover:underline" to={`/marketing/campaigns/${campaign.id}`}>{campaign.name}</Link><Text size="xsmall" className="text-ui-fg-subtle">{campaign.subject}</Text></Table.Cell><Table.Cell><Badge color={campaign.status === "sent" ? "green" : campaign.status === "failed" ? "red" : campaign.status === "scheduled" ? "blue" : "grey"}>{campaign.status}</Badge></Table.Cell><Table.Cell>{campaign.audience_snapshot_count}</Table.Cell><Table.Cell>{campaign.reporting.sent}</Table.Cell><Table.Cell>{campaign.reporting.clicked}</Table.Cell><Table.Cell>{campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString("en-NZ", { timeZone: "Pacific/Auckland" }) : "—"}</Table.Cell></Table.Row>)}</Table.Body></Table>}
  </div></Container>
}
export default CampaignsPage
