interface Props {
  params: Promise<{ employeeId: string }>;
}
const EditEmployeePage = async ({ params }: Props) => {
  const { employeeId } = await params;

  return <div>EditEmployeePage {employeeId}</div>;
};

export default EditEmployeePage;
