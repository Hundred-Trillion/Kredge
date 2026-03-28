export default function KredgeLogo({ size = 'default', showTagline = false }) {
  const sizes = {
    small: { text: 'text-lg', tracking: 'tracking-[0.15em]' },
    default: { text: 'text-2xl', tracking: 'tracking-[0.2em]' },
    large: { text: 'text-4xl', tracking: 'tracking-[0.25em]' },
  }

  const s = sizes[size] || sizes.default

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        {/* Logo mark — angular K */}
        <svg
          viewBox="0 0 32 32"
          className={`${size === 'large' ? 'w-10 h-10' : size === 'small' ? 'w-5 h-5' : 'w-7 h-7'}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="32" height="32" rx="6" fill="#2D6FF7" />
          <path
            d="M10 8V24M10 16L18 8H22L14 16L22 24H18L10 16Z"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={`font-bold ${s.text} ${s.tracking} text-white uppercase`}>
          Kredge
        </span>
      </div>
      {showTagline && (
        <span className="text-xs text-navy-200 tracking-widest uppercase mt-1">
          Recover what's yours
        </span>
      )}
    </div>
  )
}
