import Footer from "@/components/molecules/Footer";
import Header from "@/components/molecules/Header";
import { ReactNode } from "react";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="">
      <Header />
      <hr />
      {children}
      <Footer />
    </div>
  )
}