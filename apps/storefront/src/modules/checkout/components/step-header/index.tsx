import { StepHeaderProps } from "../step-base.types"

export default function StepHeader({
  stepNumber,
  isComplete,
  title,
  onEdit,
}: StepHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-[17px] font-black tracking-tight text-muse-black">
        <span
          className={`flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
            isComplete ? "bg-muse-green text-white" : "bg-muse-black text-muse-cream"
          }`}
        >
          {isComplete ? "✓" : stepNumber}
        </span>
        {title}
      </div>
      {isComplete && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-bold uppercase tracking-widest text-muse-orange hover:underline"
        >
          Edit
        </button>
      )}
    </div>
  )
}
