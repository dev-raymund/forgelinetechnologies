import {
  Window,
  Dashboard,
  Cart,
  Code,
  Plug,
  Refresh,
} from "@/components/ui/icon";
import type { Service } from "@/data/services";

const marks = {
  window: Window,
  dashboard: Dashboard,
  cart: Cart,
  code: Code,
  plug: Plug,
  refresh: Refresh,
} as const;

/**
 * Renders the mark for a service. Keeps the icon-key-to-component mapping in
 * one place so the data file never has to import a component.
 */
export function ServiceIcon({
  icon,
  className = "",
}: {
  icon: Service["icon"];
  className?: string;
}) {
  const Mark = marks[icon];
  return <Mark className={className} />;
}
