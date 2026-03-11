"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { SetContextLink } from "@apollo/client/link/context";
import { ClerkProvider, useAuth } from "@clerk/react";

function AuthenticatedApolloProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { getToken } = useAuth();
  const clientRef = useRef<ApolloClient | null>(null);
  const getTokenRef = useRef(getToken);
  const [client, setClient] = useState<ApolloClient | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (clientRef.current == null) {
      const authLink = new SetContextLink(async (prevContext) => {
        const token = await getTokenRef.current();

        return {
          headers: {
            ...prevContext.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        };
      });

      const httpLink = new HttpLink({
        uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
      });

      clientRef.current = new ApolloClient({
        cache: new InMemoryCache(),
        link: ApolloLink.from([authLink, httpLink]),
      });
      setClient(clientRef.current);
    }
  }, []);

  return client ? <ApolloProvider client={client}>{children}</ApolloProvider> : null;
}

export default function AppApolloProvider({
  children,
}: {
  children: ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required");
  }

  return (
    <ClerkProvider publishableKey={publishableKey} signInUrl="/login">
      <AuthenticatedApolloProvider>{children}</AuthenticatedApolloProvider>
    </ClerkProvider>
  );
}
