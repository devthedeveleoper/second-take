import { Client, Account } from 'appwrite';

export function createBrowserClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  return {
    get account() {
      return new Account(client);
    },
  };
}
