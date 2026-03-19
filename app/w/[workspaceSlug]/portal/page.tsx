import { redirect } from "next/navigation";

export default function PortalRedirect({ params }: { params: { workspaceSlug: string } }) {
  redirect(`/w/${params.workspaceSlug}/portal/home`);
}
