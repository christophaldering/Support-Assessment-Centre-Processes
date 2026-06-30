import { redirect } from "next/navigation";

export default function DrShortcutPage({ params }: { params: { workspaceSlug: string } }) {
  redirect(`/w/${params.workspaceSlug}/admin/document-sharing`);
}
