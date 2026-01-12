import BottomNav from '@/components/navigation/BottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <BottomNav />
    </div>
  );
};

export default MainLayout;
