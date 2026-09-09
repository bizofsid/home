import { FIT_CLASS_LABEL } from "@/lib/fit";
import { FitClass } from "@/lib/types";

export const FIT_CLASS_TONE: Record<FitClass, string> = {
  "too-tight": "bg-fit-bad/10 text-fit-bad border-fit-bad/30",
  snug: "bg-fit-warn/10 text-fit-warn border-fit-warn/30",
  "true-to-size": "bg-fit-good/10 text-fit-good border-fit-good/30",
  "relaxed-fit": "bg-fit-warn/10 text-fit-warn border-fit-warn/30",
  "too-loose": "bg-fit-bad/10 text-fit-bad border-fit-bad/30",
};

export default function FitPill({ fitClass, label }: { fitClass: FitClass; label?: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${FIT_CLASS_TONE[fitClass]}`}
    >
      {label ?? FIT_CLASS_LABEL[fitClass]}
    </span>
  );
}
