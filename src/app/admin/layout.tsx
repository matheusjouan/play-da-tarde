import { AdminGuard } from "@/components/AdminGuard";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminGuard>{children}</AdminGuard>;
}
