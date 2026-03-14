interface TopBarProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  statusIndicator?: React.ReactNode;
}

export default function TopBar({ title, subtitle, icon, actions, statusIndicator }: TopBarProps) {
  return (
    <div className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex items-center gap-3">
        {statusIndicator}
        {icon && (
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
