import NewOrder from '@/app/(main)/new-order/_ui/new-order';

const Page = async (props: { searchParams?: { name: string } }) => {
  const searchParams = await props.searchParams;
  const query = searchParams?.name || '';
  return <NewOrder query={query} />;
};
export default Page;
