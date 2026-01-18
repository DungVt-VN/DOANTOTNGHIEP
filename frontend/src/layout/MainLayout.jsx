import GuestHeader from "@/components/Header/GuestHeader";

function MainLayout({ children }) {
  return (
    <>
      <GuestHeader />
      {children}
    </>
  );
}

export default MainLayout;
