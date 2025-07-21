import { GoogleCustomSearchFormProvider } from "@/components/providers/google-custom-search-form";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <GoogleCustomSearchFormProvider>{children}</GoogleCustomSearchFormProvider>;
}