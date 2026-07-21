import { useParams } from "react-router-dom"
import { CampaignForm } from "../campaign-form"
export default function CampaignDetailPage(){ const {id}=useParams(); return <CampaignForm id={id} /> }
