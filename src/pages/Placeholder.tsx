interface PlaceholderProps {
  title: string;
}

export function Placeholder({ title }: PlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-mordobo-card border border-mordobo-border rounded-[14px]">
      <div className="text-center">
        <div className="text-5xl mb-4 opacity-30">🚧</div>
        <h3 className="m-0 mb-2 text-lg font-semibold text-mordobo-text">{title}</h3>
        <p className="m-0 text-sm text-mordobo-textSecondary">This module will be developed in upcoming sprints</p>
      </div>
    </div>
  );
}
