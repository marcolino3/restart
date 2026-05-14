interface Props {
  title: string;
  description: string;
}

export const FormsTitle = ({ title, description }: Props) => {
  return (
    <div className="px-4 sm:px-0">
      <h2 className="text-base/7 font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm/6 text-gray-600">{description}</p>
    </div>
  );
};
