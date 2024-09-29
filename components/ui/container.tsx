export const Container = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => <div className="flex flex-col min-h-screen">{children}</div>;
