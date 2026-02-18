import { redirect } from "next/navigation";

interface Props {
  params: { workspaceSlug: string };
}

export default function ModulesPage({ params }: Props) {
  redirect(`/w/${params.workspaceSlug}/admin`);
}
