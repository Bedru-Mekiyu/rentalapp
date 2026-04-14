import DashboardCard from "./DashboardCard";

export default function ResponsiveSection({
  title,
  description,
  actions,
  className = "",
  children,
}) {
  return (
    <DashboardCard
      title={title}
      description={description}
      actions={actions}
      className={className}
    >
      {children}
    </DashboardCard>
  );
}
