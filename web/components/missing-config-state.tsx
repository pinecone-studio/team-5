interface MissingConfigStateProps {
  missingKeys: string[];
  description?: string;
}

export default function MissingConfigState({
  missingKeys,
  description = "Дараах env хувьсагчийг тохируулсны дараа дахин ажиллуулна уу.",
}: MissingConfigStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Тохиргоо дутуу байна</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
          {missingKeys.map((key) => (
            <li key={key}>
              <code>{key}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
