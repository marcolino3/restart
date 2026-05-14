
interface IconTextBlockProps {
  icon: React.ReactNode
  text: string
  className?: string
}

export const IconTextBlock = ({
  icon,
  text,
  className,
}: IconTextBlockProps) => {
  return (
    <div className={`flex flex-row md:flex-col items-center gap-5 ${className}`}>
      <div>{icon}</div>
      <p className="text-lg font-semibold text-periparto-black m-0">{text}</p>
    </div>
  )
}
