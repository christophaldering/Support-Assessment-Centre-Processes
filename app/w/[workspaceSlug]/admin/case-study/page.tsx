import { redirect } from "next/navigation";

export default function CaseStudyRedirect({ params }: { params: { workspaceSlug: string } }) {
  redirect(`/w/${params.workspaceSlug}/admin/data-room`);
}
