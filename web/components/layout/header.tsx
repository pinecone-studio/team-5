type HeaderProps = {
  title: string;
  subtitle?: string;
  userName?: string;
};

export function Header({ title, subtitle, userName }: HeaderProps) {
  return (
    <header className="border-b border-border px-8 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {userName ? (
          <p className="rounded-md bg-muted px-3 py-1 text-sm font-medium">
            {userName}
          </p>
        ) : null}
      </div>
    </header>
  );
}
