import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
