import { getFilteredUsers } from './_lib/funcs';
import { UsersMaster } from './_ui/users-master';

const Page = async () => {
  const usersList = await getFilteredUsers();
  return <UsersMaster users={usersList} />;
};

export default Page;
