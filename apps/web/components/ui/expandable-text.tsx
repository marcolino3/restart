'use client'

import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface ExpandableTextProps {
  intro: string
  textKey: string
  className?: string
}

export const ExpandableText = ({ intro, textKey, className }: ExpandableTextProps) => {
  const t = useTranslations('Common')
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpanded = () => setIsExpanded((prev) => !prev)

  return (
    <div className={`${className} text-periparto-black text-base mb-2`}>
      <p >
        {intro}
      </p>
      {isExpanded && t.rich(textKey, { p: (chunks) => <p>{chunks}</p> })}
      <button
        onClick={toggleExpanded}
        className="text-periparto-green-900 font-semibold hover:underline cursor-pointer flex items-center text"
      >
        {isExpanded ? 'Weniger lesen' : 'Mehr lesen'}
        <ChevronDown
          size={20}
          className={`ml-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  )
}
