interface Props {
  params: Promise<{ organizationId: string }>;
}
const EditOrganization = async ({ params }: Props) => {
  const { organizationId } = await params;
  return <div>EditOrganization</div>;
};

export default EditOrganization;
