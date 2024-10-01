export interface PageProps {
  children: React.ReactNode;
  searchParams: { [key: string]: string | string[] | undefined };
}
