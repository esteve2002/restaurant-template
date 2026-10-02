import DemoPage from "../demo/page";

export default async function SharedProposalPage({ params }) {
  const { id } = await params;
  return <DemoPage proposalId={id} />;
}